import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  CONNECTED_ASSETS, INITIAL_BATTERY_MODULES, INITIAL_NOTIFICATIONS,
  INITIAL_SERVICE_EVENTS_BY_DATE, INITIAL_SYSTEMS, VEHICLE_PROFILE,
} from './data/seed.js';
import { calculatePackSummary, shiftIsoDateByDays } from '@voltguard/shared/diagnosticsLogic';
import type { DashboardData, ServiceEvent, VehicleProfile } from '@voltguard/shared/diagnostics';
import { HttpError } from './errors.js';

type StoredVehicle = Omit<DashboardData, 'packSummary'>;

function seedVehicles(): StoredVehicle[] {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const profiles: VehicleProfile[] = [
    { ...VEHICLE_PROFILE, id: 'bay-03' },
    { ...VEHICLE_PROFILE, id: 'bay-01', bay: 'Workshop Bay 01', vin: 'VG24-EV-714082', baseChargePercent: 64, rangeKm: 338 },
    { ...VEHICLE_PROFILE, id: 'dyno-02', bay: 'Dyno Cell 02', vin: 'VG24-EV-902511', baseChargePercent: 91, rangeKm: 481 },
  ];
  return profiles.map((profile, index) => {
    const eventsByDate: Record<string, ServiceEvent[]> = {};
    if (index === 0) {
      for (const [date, events] of Object.entries(INITIAL_SERVICE_EVENTS_BY_DATE)) {
        const offset = Math.round((Date.parse(date) - Date.parse('2026-05-16')) / 86400000);
        eventsByDate[shiftIsoDateByDays(today, offset)] = structuredClone(events);
      }
    }
    return {
      profile, source: 'sample', initialDate: today, lastScan: null,
      modules: structuredClone(INITIAL_BATTERY_MODULES),
      systems: structuredClone(INITIAL_SYSTEMS),
      assets: structuredClone(CONNECTED_ASSETS).map(asset => asset.kind === 'vehicle'
        ? { ...asset, label: profile.model, status: `${profile.bay} · Sample vehicle` }
        : asset),
      notifications: index === 0 ? structuredClone(INITIAL_NOTIFICATIONS) : [],
      eventsByDate,
    };
  });
}

export class DiagnosticStore {
  private db: DatabaseSync;

  constructor(filename: string) {
    if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
    this.db = new DatabaseSync(filename);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
    const version = this.db.prepare('PRAGMA user_version').get()?.user_version;
    if (version !== 0 && version !== 1) {
      this.db.close();
      throw new Error('Unsupported database version. Use a compatible application version.');
    }
    this.db.exec('CREATE TABLE IF NOT EXISTS vehicles (id TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)));');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const insert = this.db.prepare('INSERT OR IGNORE INTO vehicles (id, data) VALUES (?, ?)');
      for (const vehicle of seedVehicles()) insert.run(vehicle.profile.id, JSON.stringify(vehicle));
      this.db.exec('PRAGMA user_version = 1; COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      this.db.close();
      throw error;
    }
  }

  close() { this.db.close(); }
  health() { this.db.prepare('SELECT 1').get(); }

  private read(id: string): StoredVehicle {
    const row = this.db.prepare('SELECT data FROM vehicles WHERE id = ?').get(id);
    if (!row) throw new HttpError(404, 'Vehicle not found.');
    return JSON.parse(row.data as string) as StoredVehicle;
  }

  listVehicles(): VehicleProfile[] {
    return this.db.prepare('SELECT data FROM vehicles ORDER BY rowid').all()
      .map(row => (JSON.parse(row.data as string) as StoredVehicle).profile);
  }

  dashboard(id: string): DashboardData {
    const vehicle = this.read(id);
    const packSummary = calculatePackSummary(vehicle.modules, vehicle.profile.baseChargePercent, vehicle.profile.rangeKm);
    return {
      ...vehicle, packSummary,
      systems: vehicle.systems.map(system => system.id === 'front-drive'
        ? { ...system, percentage: Math.max(0, system.percentage - (packSummary.totalModules - packSummary.activeModules) * 4) }
        : system),
    };
  }

  private mutate(id: string, update: (vehicle: StoredVehicle) => void): DashboardData {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const vehicle = this.read(id);
      update(vehicle);
      this.db.prepare('UPDATE vehicles SET data = ? WHERE id = ?').run(JSON.stringify(vehicle), id);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
    return this.dashboard(id);
  }

  setModule(id: string, moduleId: string, enabled: boolean) {
    return this.mutate(id, vehicle => {
      const module = vehicle.modules.find(item => item.id === moduleId);
      if (!module) throw new HttpError(404, 'Battery module not found.');
      module.enabled = enabled;
    });
  }

  markNotificationsRead(id: string) {
    return this.mutate(id, vehicle => {
      vehicle.notifications.forEach(item => { item.read = true; });
    });
  }

  schedule(id: string, date: string, timeSlot: ServiceEvent['timeSlot']) {
    return this.mutate(id, vehicle => {
      const events = vehicle.eventsByDate[date] ?? [];
      if (events.some(event => event.timeSlot === timeSlot)) throw new HttpError(409, 'This time slot is already booked. Refresh to see the latest schedule.');
      events.push({
        id: randomUUID(), timeSlot, title: 'Thermal & HV isolation check',
        subtitle: `Scheduled by ${vehicle.profile.technicianName} · ${vehicle.profile.bay}`,
        tone: timeSlot === '09:00' || timeSlot === '11:00' ? 'mint' : 'lavender',
        iconType: timeSlot === '10:00' ? 'coolant' : 'check',
      });
      vehicle.eventsByDate[date] = events;
    });
  }

  cancelEvent(id: string, eventId: string) {
    return this.mutate(id, vehicle => {
      for (const [date, events] of Object.entries(vehicle.eventsByDate)) {
        if (events.some(event => event.id === eventId)) {
          vehicle.eventsByDate[date] = events.filter(event => event.id !== eventId);
          return;
        }
      }
      throw new HttpError(404, 'Service event not found.');
    });
  }

  scan(id: string) {
    return this.mutate(id, vehicle => {
      const report = {
        id: randomUUID(), completedAt: new Date().toISOString(), source: 'sample' as const,
        summary: calculatePackSummary(vehicle.modules, vehicle.profile.baseChargePercent, vehicle.profile.rangeKm),
      };
      vehicle.lastScan = report;
      vehicle.notifications.unshift({
        id: report.id, title: 'Sample battery scan saved',
        detail: `${report.summary.activeModules}/${report.summary.totalModules} modules active · ${report.summary.effectiveChargePercent}% simulated charge. No vehicle hardware was contacted.`,
        timeAgo: new Date(report.completedAt).toLocaleString('en-GB'), read: false,
      });
      vehicle.notifications = vehicle.notifications.slice(0, 50);
    });
  }
}
