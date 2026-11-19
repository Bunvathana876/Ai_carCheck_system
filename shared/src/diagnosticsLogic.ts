import type {
  BatteryModule,
  CalendarDay,
  DiagnosticTab,
} from './diagnostics.js';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface PackSummary {
  totalModules: number;
  activeModules: number;
  averageSoh: number;
  averageTempC: number;
  effectiveChargePercent: number;
  estimatedRangeKm: number;
  busVoltageV: number;
}

export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function toIsoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(isoDate: string): string {
  const d = parseIsoDate(isoDate);
  const month = MONTH_NAMES[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Generates the 7-day Monday-to-Sunday week strip containing `anchorIsoDate`.
 */
export function getWeekDays(anchorIsoDate: string): CalendarDay[] {
  const anchor = parseIsoDate(anchorIsoDate);
  const dayOfWeek = anchor.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() + diffToMonday);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setUTCDate(monday.getUTCDate() + i);
    days.push({
      isoDate: toIsoDate(current),
      dayNumber: current.getUTCDate(),
      weekdayShort: WEEKDAY_SHORT[current.getUTCDay()],
    });
  }
  return days;
}

export function shiftIsoDateByDays(isoDate: string, deltaDays: number): string {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return toIsoDate(date);
}

export function calculatePackSummary(
  modules: BatteryModule[],
  baseChargePercent: number,
  baseRangeKm = 412
): PackSummary {
  const totalModules = modules.length;
  const active = modules.filter((m) => m.enabled);
  const activeModules = active.length;

  if (totalModules === 0 || activeModules === 0) {
    return {
      totalModules,
      activeModules: 0,
      averageSoh: 0,
      averageTempC: 0,
      effectiveChargePercent: 0,
      estimatedRangeKm: 0,
      busVoltageV: 0,
    };
  }

  const avgSoh =
    active.reduce((sum, m) => sum + m.sohPercent, 0) / activeModules;
  const avgTemp =
    active.reduce((sum, m) => sum + m.temperatureC, 0) / activeModules;
  const avgVoltage =
    active.reduce((sum, m) => sum + m.voltageV, 0) / activeModules;

  const activeRatio = activeModules / totalModules;
  const effectiveChargePercent = Math.round(baseChargePercent * activeRatio);
  const estimatedRangeKm = Math.round(baseRangeKm * activeRatio);

  return {
    totalModules,
    activeModules,
    averageSoh: Math.round(avgSoh * 10) / 10,
    averageTempC: Math.round(avgTemp * 10) / 10,
    effectiveChargePercent,
    estimatedRangeKm,
    busVoltageV: Math.round(avgVoltage * 10) / 10,
  };
}

export interface TabCallout {
  primaryValue: string;
  primaryLabel: string;
  secondaryDetail: string;
  accentTone: 'mint' | 'dark-green' | 'lavender';
}

export function getTabCallout(
  tab: DiagnosticTab,
  packSummary: PackSummary,
  frontDriveHealth: number,
  coolantEfficiency: number
): TabCallout {
  if (tab === 'battery') {
    return {
      primaryValue: `${packSummary.effectiveChargePercent}%`,
      primaryLabel: 'charge',
      secondaryDetail: `${packSummary.activeModules}/${packSummary.totalModules} modules active · ${packSummary.busVoltageV} V`,
      accentTone: 'mint',
    };
  }

  if (tab === 'drivetrain') {
    return {
      primaryValue: `${frontDriveHealth}%`,
      primaryLabel: 'health',
      secondaryDetail: 'Dual e-Axle · 284 kW Peak Output',
      accentTone: 'dark-green',
    };
  }

  return {
    primaryValue: `${packSummary.averageTempC > 0 ? packSummary.averageTempC.toFixed(1) : '31.2'}°C`,
    primaryLabel: 'coolant',
    secondaryDetail: `${coolantEfficiency}% loop efficiency · 12.4 L/min`,
    accentTone: 'lavender',
  };
}

export function sortOrFilterModules(
  modules: BatteryModule[],
  mode: 'all' | 'active' | 'warmest'
): BatteryModule[] {
  if (mode === 'active') {
    return modules.filter((m) => m.enabled);
  }
  if (mode === 'warmest') {
    return [...modules].sort((a, b) => b.temperatureC - a.temperatureC);
  }
  return modules;
}
