export type DiagnosticTab = 'battery' | 'drivetrain' | 'thermal';

export interface VehicleProfile {
  id: string;
  brand: string;
  bay: string;
  vin: string;
  model: string;
  technicianName: string;
  technicianInitials: string;
  technicianRole: string;
  baseChargePercent: number;
  rangeKm: number;
}

export interface ScanReport {
  id: string;
  completedAt: string;
  source: 'sample';
  summary: import('./diagnosticsLogic.js').PackSummary;
}

export interface DashboardData {
  profile: VehicleProfile;
  source: 'sample';
  modules: BatteryModule[];
  systems: SystemMetric[];
  assets: ConnectedAsset[];
  notifications: NotificationItem[];
  eventsByDate: Record<string, ServiceEvent[]>;
  initialDate: string;
  lastScan: ScanReport | null;
  packSummary: import('./diagnosticsLogic.js').PackSummary;
}

export type VehicleViewAngle = 'cutaway' | 'top-iso' | 'rear-quarter';

export interface BatteryModule {
  id: string;
  name: string;
  temperatureC: number;
  sohPercent: number;
  voltageV: number;
  cellDeltaMv: number;
  enabled: boolean;
  image: string;
}

export interface SystemMetric {
  id: 'front-drive' | 'coolant-circuit';
  name: string;
  statusLabel: string;
  statusTone: 'green' | 'lavender';
  percentage: number;
  metricLabel: string;
  gaugeVariant: 'radial-ticks' | 'swirl-blades';
  image: string;
  detailText: string;
}

export interface ConnectedAsset {
  id: string;
  label: string;
  shortCode?: string;
  role: string;
  status: string;
  tone: 'mint' | 'blue' | 'peach' | 'lavender' | 'dark-green';
  kind: 'vehicle' | 'technician' | 'tool' | 'overflow';
}

export interface ServiceEvent {
  id: string;
  timeSlot: '07:00' | '08:00' | '09:00' | '10:00' | '11:00';
  title: string;
  subtitle: string;
  tone: 'mint' | 'lavender';
  iconType: 'check' | 'coolant' | 'diagnostic';
}

export interface CalendarDay {
  isoDate: string;
  dayNumber: number;
  weekdayShort: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  timeAgo: string;
  read: boolean;
}

export interface VehicleHotspot {
  id: string;
  tab: DiagnosticTab;
  label: string;
  summary: string;
  metricValue: string;
  xPercent: number;
  yPercent: number;
  variant: 'thermal' | 'drivetrain' | 'battery';
}
