import type {
  BatteryModule,
  ConnectedAsset,
  NotificationItem,
  ServiceEvent,
  SystemMetric,
  VehicleHotspot,
} from '../types/diagnostics';

export const ASSET_IMAGES = {
  evCutaway: '/src/assets/images/ev_cutaway_hero_1795015322495.jpg',
  batteryModule: '/src/assets/images/battery_module_pack_1795015325232.jpg',
  frontDriveMotor: '/src/assets/images/front_drive_motor_1795015350388.jpg',
  coolantRadiator: '/src/assets/images/coolant_radiator_unit_1795015326856.jpg',
} as const;

export const VEHICLE_PROFILE = {
  brand: 'Voltguard',
  bay: 'Workshop Bay 03',
  vin: 'VG24-EV-839214',
  model: 'Voltguard GT-4 Long Range',
  technicianName: 'Daniel Reed',
  technicianInitials: 'DR',
  technicianRole: 'Lead HV Diagnostics Engineer',
  baseChargePercent: 78,
  rangeKm: 412,
};

export const INITIAL_BATTERY_MODULES: BatteryModule[] = [
  {
    id: 'mod-a3',
    name: 'Module A3',
    temperatureC: 32.1,
    sohPercent: 98,
    voltageV: 396.4,
    cellDeltaMv: 3,
    enabled: true,
    image: ASSET_IMAGES.batteryModule,
  },
  {
    id: 'mod-b1',
    name: 'Module B1',
    temperatureC: 31.4,
    sohPercent: 97,
    voltageV: 395.9,
    cellDeltaMv: 4,
    enabled: true,
    image: ASSET_IMAGES.batteryModule,
  },
  {
    id: 'mod-c2',
    name: 'Module C2',
    temperatureC: 30.8,
    sohPercent: 99,
    voltageV: 396.8,
    cellDeltaMv: 2,
    enabled: true,
    image: ASSET_IMAGES.batteryModule,
  },
  {
    id: 'mod-d4',
    name: 'Module D4',
    temperatureC: 33.0,
    sohPercent: 96,
    voltageV: 395.2,
    cellDeltaMv: 5,
    enabled: true,
    image: ASSET_IMAGES.batteryModule,
  },
];

export const INITIAL_SYSTEMS: SystemMetric[] = [
  {
    id: 'front-drive',
    name: 'Front drive',
    statusLabel: 'Operating normally',
    statusTone: 'green',
    percentage: 72,
    metricLabel: 'Health',
    gaugeVariant: 'radial-ticks',
    image: ASSET_IMAGES.frontDriveMotor,
    detailText: 'Inverter phase impedance nominal · 284 kW peak',
  },
  {
    id: 'coolant-circuit',
    name: 'Coolant circuit',
    statusLabel: 'Within range',
    statusTone: 'lavender',
    percentage: 45,
    metricLabel: 'Efficiency',
    gaugeVariant: 'swirl-blades',
    image: ASSET_IMAGES.coolantRadiator,
    detailText: 'Dual-loop pump at 2,400 RPM · 12.4 L/min flow',
  },
];

export const CONNECTED_ASSETS: ConnectedAsset[] = [
  {
    id: 'asset-ev',
    label: 'Voltguard GT-4',
    role: 'Primary HV Test Vehicle',
    status: 'Bay 03 Connected',
    tone: 'mint',
    kind: 'vehicle',
  },
  {
    id: 'asset-ml',
    label: 'Marcus Lin',
    shortCode: 'ML',
    role: 'Battery Systems Specialist',
    status: 'Active on CAN Bus',
    tone: 'blue',
    kind: 'technician',
  },
  {
    id: 'asset-sk',
    label: 'Sara Lindqvist',
    shortCode: 'SK',
    role: 'Thermal Loop Engineer',
    status: 'Reviewing Glycol Telemetry',
    tone: 'peach',
    kind: 'technician',
  },
  {
    id: 'asset-probe',
    label: 'HV Telemetry Rig',
    role: 'OBD-II / CAN Analyzer',
    status: 'Sampling at 100 Hz',
    tone: 'lavender',
    kind: 'tool',
  },
  {
    id: 'asset-more',
    label: '3 Additional Assets',
    shortCode: '3+',
    role: 'Pack Balancer, Chiller Unit, Load Bank',
    status: 'Ready on Standby',
    tone: 'dark-green',
    kind: 'overflow',
  },
];

export const VEHICLE_HOTSPOTS: VehicleHotspot[] = [
  {
    id: 'hotspot-thermal',
    tab: 'thermal',
    label: 'Front Radiator & Heat Pump',
    summary: 'Coolant loop inlet 31.2 °C · Valve open 64%',
    metricValue: '31.2 °C',
    xPercent: 21,
    yPercent: 72,
    variant: 'thermal',
  },
  {
    id: 'hotspot-drivetrain',
    tab: 'drivetrain',
    label: 'Front e-Axle & Inverter',
    summary: 'Dual PMSM torque split 45/55 · 72% Drive Health',
    metricValue: '72% Health',
    xPercent: 27,
    yPercent: 57,
    variant: 'drivetrain',
  },
  {
    id: 'hotspot-battery',
    tab: 'battery',
    label: 'Floorpan HV Battery Pack',
    summary: '4 modules active · 3 mV variance · 396.1 V bus',
    metricValue: '78% charge',
    xPercent: 48.5,
    yPercent: 57,
    variant: 'battery',
  },
];

export const INITIAL_SERVICE_EVENTS_BY_DATE: Record<string, ServiceEvent[]> = {
  '2026-05-11': [
    {
      id: 'ev-0511-1',
      timeSlot: '07:00',
      title: 'Initial HV intake scan',
      subtitle: 'Isolation resistance 540 MΩ',
      tone: 'mint',
      iconType: 'check',
    },
    {
      id: 'ev-0511-2',
      timeSlot: '09:00',
      title: 'Glycol pressure calibration',
      subtitle: 'Loop pressure held at 1.4 bar',
      tone: 'lavender',
      iconType: 'coolant',
    },
  ],
  '2026-05-12': [
    {
      id: 'ev-0512-1',
      timeSlot: '08:00',
      title: 'Front inverter firmware check',
      subtitle: 'Controller v4.12 verified',
      tone: 'mint',
      iconType: 'check',
    },
  ],
  '2026-05-13': [
    {
      id: 'ev-0513-1',
      timeSlot: '07:00',
      title: 'Thermal valve sweep test',
      subtitle: '4-way actuator response 140 ms',
      tone: 'lavender',
      iconType: 'coolant',
    },
    {
      id: 'ev-0513-2',
      timeSlot: '10:00',
      title: 'Module B1 impedance check',
      subtitle: 'Internal resistance 1.12 mΩ',
      tone: 'mint',
      iconType: 'check',
    },
  ],
  '2026-05-14': [
    {
      id: 'ev-0514-1',
      timeSlot: '07:00',
      title: 'DC fast-charge soak test',
      subtitle: 'Peak 210 kW sustained 12 min',
      tone: 'mint',
      iconType: 'check',
    },
    {
      id: 'ev-0514-2',
      timeSlot: '08:00',
      title: 'Chiller plate delta check',
      subtitle: 'Outlet delta 2.4 °C nominal',
      tone: 'lavender',
      iconType: 'coolant',
    },
  ],
  '2026-05-15': [
    {
      id: 'ev-0515-1',
      timeSlot: '08:00',
      title: 'Pre-balance pack equalization',
      subtitle: 'Cell spread narrowed from 11 mV',
      tone: 'mint',
      iconType: 'check',
    },
    {
      id: 'ev-0515-2',
      timeSlot: '10:00',
      title: 'Rear e-axle bearing acoustic test',
      subtitle: 'Harmonics within -42 dB limit',
      tone: 'lavender',
      iconType: 'coolant',
    },
  ],
  '2026-05-16': [
    {
      id: 'ev-0516-1',
      timeSlot: '07:00',
      title: 'Cell balancing completed',
      subtitle: 'Pack variance reduced to 3 mV',
      tone: 'mint',
      iconType: 'check',
    },
    {
      id: 'ev-0516-2',
      timeSlot: '08:00',
      title: 'Coolant flow check started',
      subtitle: 'Flow rate normal · 31.2 °C',
      tone: 'lavender',
      iconType: 'coolant',
    },
  ],
  '2026-05-17': [
    {
      id: 'ev-0517-1',
      timeSlot: '09:00',
      title: 'Final road-load dyno signoff',
      subtitle: 'Scheduled release inspection',
      tone: 'mint',
      iconType: 'check',
    },
  ],
  '2026-05-18': [
    {
      id: 'ev-0518-1',
      timeSlot: '07:00',
      title: 'Customer delivery prep',
      subtitle: 'Charge target set to 80%',
      tone: 'mint',
      iconType: 'check',
    },
  ],
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Cell balancing completed',
    detail: 'All 4 HV battery modules converged within 3 mV variance.',
    timeAgo: '12m ago',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Coolant circuit pressure verified',
    detail: 'Loop flow stabilized at 12.4 L/min and 31.2 °C.',
    timeAgo: '34m ago',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Bay 03 telemetry synced',
    detail: 'VIN VG24-EV-839214 diagnostic snapshot archived.',
    timeAgo: '1h ago',
    read: true,
  },
];
