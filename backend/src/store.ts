import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  CONNECTED_ASSETS,
  INITIAL_BATTERY_MODULES,
  INITIAL_NOTIFICATIONS,
  INITIAL_SERVICE_EVENTS_BY_DATE,
  INITIAL_SYSTEMS,
  VEHICLE_PROFILE,
} from './data/seed.js';
import { calculatePackSummary, shiftIsoDateByDays } from '@voltguard/shared/diagnosticsLogic';
import type { DashboardData, ServiceEvent, VehicleProfile } from '@voltguard/shared/diagnostics';
import {
  DIAGNOSTIC_RULES_CATALOG,
  SYMPTOMS_CATALOG,
  runInference,
  type DiagnosticRule,
  type DiagnosisSession,
  type Fact,
  type RuleCategory,
  type RuleValidationReview,
  type Symptom,
  type ValidationStatus,
  type VehicleEntity,
} from '@voltguard/shared/expert';
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
      profile,
      source: 'sample',
      initialDate: today,
      lastScan: null,
      modules: structuredClone(INITIAL_BATTERY_MODULES),
      systems: structuredClone(INITIAL_SYSTEMS),
      assets: structuredClone(CONNECTED_ASSETS).map((asset) =>
        asset.kind === 'vehicle'
          ? { ...asset, label: profile.model, status: `${profile.bay} · Sample vehicle` }
          : asset
      ),
      notifications: index === 0 ? structuredClone(INITIAL_NOTIFICATIONS) : [],
      eventsByDate,
    };
  });
}

function seedExpertVehicles(): VehicleEntity[] {
  return [
    {
      id: 'bay-03',
      manufacturer: 'Voltguard',
      model: 'GT-4 Long Range',
      year: 2024,
      powertrain: 'electric',
      engineType: 'Dual Permanent Magnet Synchronous Motors (284 kW)',
      transmission: 'direct_drive',
      mileageKm: 28450,
      vin: 'VG24-EV-839214',
      createdAt: '2026-11-19T00:00:00.000Z',
    },
    {
      id: 'bay-01',
      manufacturer: 'Toyota',
      model: 'Camry 2.5L SE',
      year: 2021,
      powertrain: 'gasoline',
      engineType: '2.5L Dynamic Force I4 (A25A-FKS)',
      transmission: 'automatic',
      mileageKm: 52400,
      vin: '4T1B11HK5MU140821',
      createdAt: '2026-11-19T00:00:00.000Z',
    },
    {
      id: 'dyno-02',
      manufacturer: 'Ford',
      model: 'F-250 Super Duty',
      year: 2022,
      powertrain: 'diesel',
      engineType: '6.7L PowerStroke V8 Turbo Diesel',
      transmission: 'automatic',
      mileageKm: 78900,
      vin: '1FT8W2BT5NED25110',
      createdAt: '2026-11-19T00:00:00.000Z',
    },
    {
      id: 'veh-04',
      manufacturer: 'Honda',
      model: 'Civic Si',
      year: 2020,
      powertrain: 'gasoline',
      engineType: '1.5L VTEC Turbo I4',
      transmission: 'manual',
      mileageKm: 64200,
      vin: '2HGFC1E53LH512903',
      createdAt: '2026-11-19T00:00:00.000Z',
    },
    {
      id: 'veh-05',
      manufacturer: 'Toyota',
      model: 'Prius Hybrid',
      year: 2023,
      powertrain: 'hybrid',
      engineType: '2.0L Hybrid Synergy Drive',
      transmission: 'cvt',
      mileageKm: 31200,
      vin: 'JTDKARFU5P3049182',
      createdAt: '2026-11-19T00:00:00.000Z',
    },
  ];
}

export class DiagnosticStore {
  private db: DatabaseSync;

  constructor(filename: string) {
    if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
    this.db = new DatabaseSync(filename);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');

    const userVersionRaw = this.db.prepare('PRAGMA user_version').get()?.user_version;
    const version = typeof userVersionRaw === 'number' ? userVersionRaw : Number(userVersionRaw ?? 0);
    if (version > 2) {
      this.db.close();
      throw new Error('Unsupported database version. Use a compatible application version.');
    }

    // 1. Voltguard EV Dashboard table
    this.db.exec('CREATE TABLE IF NOT EXISTS vehicles (id TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)));');

    // 2. Expert System Tables
    this.db.exec('CREATE TABLE IF NOT EXISTS expert_vehicles (id TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)));');
    this.db.exec('CREATE TABLE IF NOT EXISTS diagnostic_rules (rule_id TEXT PRIMARY KEY, category TEXT NOT NULL, title TEXT NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)));');
    this.db.exec('CREATE TABLE IF NOT EXISTS diagnosis_sessions (id TEXT PRIMARY KEY, vehicle_id TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT, data TEXT NOT NULL CHECK(json_valid(data)));');

    this.db.exec('BEGIN IMMEDIATE');
    try {
      // Seed Voltguard vehicles
      const insertVoltguard = this.db.prepare('INSERT OR IGNORE INTO vehicles (id, data) VALUES (?, ?)');
      for (const vehicle of seedVehicles()) {
        insertVoltguard.run(vehicle.profile.id, JSON.stringify(vehicle));
      }

      // Seed Expert System Vehicles
      const insertExpertVehicle = this.db.prepare('INSERT OR IGNORE INTO expert_vehicles (id, data) VALUES (?, ?)');
      for (const v of seedExpertVehicles()) {
        insertExpertVehicle.run(v.id, JSON.stringify(v));
      }

      // Seed 50 Diagnostic Rules
      const insertRule = this.db.prepare('INSERT OR IGNORE INTO diagnostic_rules (rule_id, category, title, data) VALUES (?, ?, ?, ?)');
      for (const r of DIAGNOSTIC_RULES_CATALOG) {
        insertRule.run(r.ruleId, r.category, r.title, JSON.stringify(r));
      }

      this.db.exec('PRAGMA user_version = 2; COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      this.db.close();
      throw error;
    }
  }

  close() {
    this.db.close();
  }

  health() {
    this.db.prepare('SELECT 1').get();
  }

  // =========================================================================
  // EXISTING VOLTGUARD EV DASHBOARD METHODS (PRESERVED)
  // =========================================================================

  private read(id: string): StoredVehicle {
    const row = this.db.prepare('SELECT data FROM vehicles WHERE id = ?').get(id);
    if (!row) throw new HttpError(404, 'Vehicle not found.');
    return JSON.parse(row.data as string) as StoredVehicle;
  }

  listVehicles(): VehicleProfile[] {
    return this.db
      .prepare('SELECT data FROM vehicles ORDER BY rowid')
      .all()
      .map((row) => (JSON.parse(row.data as string) as StoredVehicle).profile);
  }

  dashboard(id: string): DashboardData {
    const vehicle = this.read(id);
    const packSummary = calculatePackSummary(vehicle.modules, vehicle.profile.baseChargePercent, vehicle.profile.rangeKm);
    return {
      ...vehicle,
      packSummary,
      systems: vehicle.systems.map((system) =>
        system.id === 'front-drive'
          ? {
              ...system,
              percentage: Math.max(
                0,
                system.percentage - (packSummary.totalModules - packSummary.activeModules) * 4
              ),
            }
          : system
      ),
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
    return this.mutate(id, (vehicle) => {
      const module = vehicle.modules.find((item) => item.id === moduleId);
      if (!module) throw new HttpError(404, 'Battery module not found.');
      module.enabled = enabled;
    });
  }

  markNotificationsRead(id: string) {
    return this.mutate(id, (vehicle) => {
      vehicle.notifications.forEach((item) => {
        item.read = true;
      });
    });
  }

  schedule(id: string, date: string, timeSlot: ServiceEvent['timeSlot']) {
    return this.mutate(id, (vehicle) => {
      const events = vehicle.eventsByDate[date] ?? [];
      if (events.some((event) => event.timeSlot === timeSlot)) {
        throw new HttpError(409, 'This time slot is already booked. Refresh to see the latest schedule.');
      }
      events.push({
        id: randomUUID(),
        timeSlot,
        title: 'Thermal & HV isolation check',
        subtitle: `Scheduled by ${vehicle.profile.technicianName} · ${vehicle.profile.bay}`,
        tone: timeSlot === '09:00' || timeSlot === '11:00' ? 'mint' : 'lavender',
        iconType: timeSlot === '10:00' ? 'coolant' : 'check',
      });
      vehicle.eventsByDate[date] = events;
    });
  }

  cancelEvent(id: string, eventId: string) {
    return this.mutate(id, (vehicle) => {
      for (const [date, events] of Object.entries(vehicle.eventsByDate)) {
        if (events.some((event) => event.id === eventId)) {
          vehicle.eventsByDate[date] = events.filter((event) => event.id !== eventId);
          return;
        }
      }
      throw new HttpError(404, 'Service event not found.');
    });
  }

  scan(id: string) {
    return this.mutate(id, (vehicle) => {
      const report = {
        id: randomUUID(),
        completedAt: new Date().toISOString(),
        source: 'sample' as const,
        summary: calculatePackSummary(vehicle.modules, vehicle.profile.baseChargePercent, vehicle.profile.rangeKm),
      };
      vehicle.lastScan = report;
      vehicle.notifications.unshift({
        id: report.id,
        title: 'Sample battery scan saved',
        detail: `${report.summary.activeModules}/${report.summary.totalModules} modules active · ${report.summary.effectiveChargePercent}% simulated charge. No vehicle hardware was contacted.`,
        timeAgo: new Date(report.completedAt).toLocaleString('en-GB'),
        read: false,
      });
      vehicle.notifications = vehicle.notifications.slice(0, 50);
    });
  }

  // =========================================================================
  // EXPERT SYSTEM: VEHICLES
  // =========================================================================

  listExpertVehicles(): VehicleEntity[] {
    return this.db
      .prepare('SELECT data FROM expert_vehicles ORDER BY rowid')
      .all()
      .map((row) => JSON.parse(row.data as string) as VehicleEntity);
  }

  getExpertVehicle(id: string): VehicleEntity {
    const row = this.db.prepare('SELECT data FROM expert_vehicles WHERE id = ?').get(id);
    if (!row) throw new HttpError(404, 'Vehicle not found.');
    return JSON.parse(row.data as string) as VehicleEntity;
  }

  createExpertVehicle(payload: Omit<VehicleEntity, 'id' | 'createdAt'>): VehicleEntity {
    const newVehicle: VehicleEntity = {
      ...payload,
      id: `veh-${randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    this.db
      .prepare('INSERT INTO expert_vehicles (id, data) VALUES (?, ?)')
      .run(newVehicle.id, JSON.stringify(newVehicle));
    return newVehicle;
  }

  // =========================================================================
  // EXPERT SYSTEM: SYMPTOMS
  // =========================================================================

  listSymptoms(category?: RuleCategory): Symptom[] {
    if (category) {
      return SYMPTOMS_CATALOG.filter((s) => s.category === category);
    }
    return SYMPTOMS_CATALOG;
  }

  // =========================================================================
  // EXPERT SYSTEM: DIAGNOSTIC RULES & ADMIN KNOWLEDGE MANAGEMENT
  // =========================================================================

  listRules(options?: { category?: RuleCategory; status?: ValidationStatus }): DiagnosticRule[] {
    let query = 'SELECT data FROM diagnostic_rules';
    const params: string[] = [];

    if (options?.category) {
      query += ' WHERE category = ?';
      params.push(options.category);
    }
    const rows = this.db.prepare(query).all(...params);
    let rules = rows.map((r) => JSON.parse(r.data as string) as DiagnosticRule);

    if (options?.status) {
      rules = rules.filter((r) => r.validationStatus === options.status);
    }
    return rules;
  }

  getRule(ruleId: string): DiagnosticRule {
    const row = this.db.prepare('SELECT data FROM diagnostic_rules WHERE rule_id = ?').get(ruleId);
    if (!row) throw new HttpError(404, `Diagnostic rule ${ruleId} not found.`);
    return JSON.parse(row.data as string) as DiagnosticRule;
  }

  updateRule(ruleId: string, updates: Partial<DiagnosticRule>): DiagnosticRule {
    const existing = this.getRule(ruleId);
    const updated: DiagnosticRule = {
      ...existing,
      ...updates,
      ruleId: existing.ruleId, // ID remains immutable
      version: updates.version ?? `${existing.version.split('.')[0]}.${Number(existing.version.split('.')[1] ?? 0) + 1}.0`,
    };

    this.db
      .prepare('UPDATE diagnostic_rules SET title = ?, category = ?, data = ? WHERE rule_id = ?')
      .run(updated.title, updated.category, JSON.stringify(updated), ruleId);

    return updated;
  }

  addRuleReview(
    ruleId: string,
    review: {
      reviewer: string;
      reviewerRole: string;
      status: ValidationStatus;
      comments: string;
    }
  ): DiagnosticRule {
    const rule = this.getRule(ruleId);
    const newReview: RuleValidationReview = {
      id: randomUUID(),
      ruleId,
      reviewer: review.reviewer,
      reviewerRole: review.reviewerRole,
      status: review.status,
      reviewDate: new Date().toISOString(),
      comments: review.comments,
    };

    rule.validationStatus = review.status;
    rule.reviewedBy = review.reviewer;
    rule.reviewedAt = newReview.reviewDate;

    this.updateRule(ruleId, rule);
    return rule;
  }

  // =========================================================================
  // EXPERT SYSTEM: DIAGNOSIS SESSIONS & INFERENCE WORKFLOW
  // =========================================================================

  startDiagnosisSession(vehicleId: string, symptomCodes: string[]): DiagnosisSession {
    const vehicle = this.getExpertVehicle(vehicleId);

    const initialFacts: Record<string, Fact> = {
      powertrain: {
        code: 'powertrain',
        value: vehicle.powertrain,
        source: 'vehicle_profile',
        timestamp: new Date().toISOString(),
      },
      transmission: {
        code: 'transmission',
        value: vehicle.transmission,
        source: 'vehicle_profile',
        timestamp: new Date().toISOString(),
      },
    };

    for (const code of symptomCodes) {
      const symptom = SYMPTOMS_CATALOG.find((s) => s.code === code);
      if (symptom) {
        initialFacts[symptom.commonFactCode] = {
          code: symptom.commonFactCode,
          value: symptom.initialFactValue ?? true,
          source: 'symptom_selection',
          timestamp: new Date().toISOString(),
        };
      }
    }

    const sessionId = `diag-${randomUUID().slice(0, 10)}`;
    const rules = this.listRules();
    const result = runInference(vehicle, initialFacts, rules, sessionId);

    const session: DiagnosisSession = {
      id: sessionId,
      vehicleId,
      vehicleSummary: {
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        year: vehicle.year,
        powertrain: vehicle.powertrain,
        transmission: vehicle.transmission,
        mileageKm: vehicle.mileageKm,
      },
      status: result.status === 'SAFETY_HALTED' ? 'COMPLETED' : 'ACTIVE',
      startedAt: new Date().toISOString(),
      completedAt: result.status === 'SAFETY_HALTED' ? new Date().toISOString() : undefined,
      reportedSymptomCodes: symptomCodes,
      answeredQuestionIds: [],
      facts: initialFacts,
      latestResult: result,
    };

    this.db
      .prepare('INSERT INTO diagnosis_sessions (id, vehicle_id, status, started_at, completed_at, data) VALUES (?, ?, ?, ?, ?, ?)')
      .run(session.id, session.vehicleId, session.status, session.startedAt, session.completedAt ?? null, JSON.stringify(session));

    return session;
  }

  getDiagnosisSession(sessionId: string): DiagnosisSession {
    const row = this.db.prepare('SELECT data FROM diagnosis_sessions WHERE id = ?').get(sessionId);
    if (!row) throw new HttpError(404, 'Diagnosis session not found.');
    return JSON.parse(row.data as string) as DiagnosisSession;
  }

  submitAnswer(
    sessionId: string,
    factCode: string,
    value: boolean | string | number,
    unit?: string
  ): DiagnosisSession {
    const session = this.getDiagnosisSession(sessionId);
    if (session.status !== 'ACTIVE') {
      throw new HttpError(400, 'Cannot add answers to a completed or closed diagnosis session.');
    }

    session.facts[factCode] = {
      code: factCode,
      value,
      unit,
      source: 'question_answer',
      timestamp: new Date().toISOString(),
    };

    const vehicle = this.getExpertVehicle(session.vehicleId);
    const rules = this.listRules();
    const result = runInference(vehicle, session.facts, rules, sessionId);

    session.latestResult = result;
    if (result.status === 'DIAGNOSIS_REACHED' || result.status === 'SAFETY_HALTED' || result.suggestedQuestions.length === 0) {
      session.status = 'COMPLETED';
      session.completedAt = new Date().toISOString();
    }

    this.db
      .prepare('UPDATE diagnosis_sessions SET status = ?, completed_at = ?, data = ? WHERE id = ?')
      .run(session.status, session.completedAt ?? null, JSON.stringify(session), sessionId);

    return session;
  }

  evaluateDiagnosis(sessionId: string): DiagnosisSession {
    const session = this.getDiagnosisSession(sessionId);
    const vehicle = this.getExpertVehicle(session.vehicleId);
    const rules = this.listRules();
    const result = runInference(vehicle, session.facts, rules, sessionId);

    session.latestResult = result;
    if (result.status === 'DIAGNOSIS_REACHED' || result.status === 'SAFETY_HALTED') {
      session.status = 'COMPLETED';
      session.completedAt = new Date().toISOString();
    }

    this.db
      .prepare('UPDATE diagnosis_sessions SET status = ?, completed_at = ?, data = ? WHERE id = ?')
      .run(session.status, session.completedAt ?? null, JSON.stringify(session), sessionId);

    return session;
  }

  listDiagnosisHistory(vehicleId?: string): DiagnosisSession[] {
    let query = 'SELECT data FROM diagnosis_sessions';
    const params: string[] = [];
    if (vehicleId) {
      query += ' WHERE vehicle_id = ?';
      params.push(vehicleId);
    }
    query += ' ORDER BY started_at DESC LIMIT 50';

    return this.db
      .prepare(query)
      .all(...params)
      .map((row) => JSON.parse(row.data as string) as DiagnosisSession);
  }
}
