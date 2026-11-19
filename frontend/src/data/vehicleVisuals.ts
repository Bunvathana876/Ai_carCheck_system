import type { VehicleHotspot } from '@voltguard/shared/diagnostics';
export { ASSET_IMAGES } from '@voltguard/shared/assets';

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

