import { useState } from 'react';
import {
  BatteryCharging,
  Cpu,
  RotateCw,
  Waves,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type {
  DiagnosticTab,
  VehicleHotspot,
  VehicleViewAngle,
} from '@voltguard/shared/diagnostics';
import { ASSET_IMAGES, VEHICLE_HOTSPOTS } from '../data/vehicleVisuals';
import type { PackSummary, TabCallout } from '@voltguard/shared/diagnosticsLogic';

interface VehicleHealthCardProps {
  activeTab: DiagnosticTab;
  onSelectTab: (tab: DiagnosticTab) => void;
  packSummary: PackSummary;
  callout: TabCallout;
  liveScanActive: boolean;
}

const TABS: { id: DiagnosticTab; label: string }[] = [
  { id: 'battery', label: 'Battery' },
  { id: 'drivetrain', label: 'Drivetrain' },
  { id: 'thermal', label: 'Thermal' },
];

const VIEW_ANGLES: { id: VehicleViewAngle; label: string }[] = [
  { id: 'cutaway', label: '3/4 Cutaway' },
  { id: 'top-iso', label: 'Chassis Zoom' },
  { id: 'rear-quarter', label: 'Flipped Profile' },
];

export function VehicleHealthCard({
  activeTab,
  onSelectTab,
  packSummary,
  callout,
  liveScanActive,
}: VehicleHealthCardProps) {
  const [angleIndex, setAngleIndex] = useState(0);
  const [selectedHotspot, setSelectedHotspot] = useState<VehicleHotspot | null>(
    null
  );

  const currentAngle = VIEW_ANGLES[angleIndex].id;

  const handleRotate = () => {
    setAngleIndex((prev) => (prev + 1) % VIEW_ANGLES.length);
  };

  const handleHotspotClick = (hotspot: VehicleHotspot) => {
    onSelectTab(hotspot.tab);
    setSelectedHotspot((prev) => (prev?.id === hotspot.id ? null : hotspot));
  };

  const getVehicleTransform = () => {
    if (currentAngle === 'top-iso') {
      return { scale: 1.09, x: 10, y: -6, scaleX: 1 };
    }
    if (currentAngle === 'rear-quarter') {
      return { scale: 1.01, x: 0, y: 0, scaleX: -1 };
    }
    return { scale: 1.02, x: 0, y: 0, scaleX: 1 };
  };

  const renderHotspotIcon = (variant: VehicleHotspot['variant']) => {
    if (variant === 'thermal') {
      return <Waves className="w-4 h-4" />;
    }
    if (variant === 'drivetrain') {
      return <Cpu className="w-4 h-4" />;
    }
    return <BatteryCharging className="w-4 h-4" />;
  };

  // Position the floating metric card alongside the currently active tab's focal hotspot
  const getCalloutPosition = () => {
    if (activeTab === 'drivetrain') {
      return { left: '31%', top: '49%' };
    }
    if (activeTab === 'thermal') {
      return { left: '25%', top: '66%' };
    }
    return { left: '53%', top: '53%' };
  };

  const calloutPos = getCalloutPosition();

  return (
    <section
      aria-label="Vehicle Health"
      className="relative overflow-hidden rounded-[26px] p-5 sm:p-6 min-h-[340px] lg:min-h-[395px] flex flex-col justify-between bg-[radial-gradient(ellipse_at_60%_52%,#EAF7F0_0%,#D6EFE2_52%,#C5E6D5_100%)] shadow-[0_2px_14px_rgba(11,93,68,0.05)]"
    >
      {/* Top Header + Segmented Tabs */}
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#0F172A] leading-[1.12]">
            Vehicle Health
          </h2>
          <p className="text-[13px] font-medium text-slate-600 mt-1">
            Demo EV diagnostic profile · Sample data
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Diagnostic subsystems"
          className="bg-white/95 backdrop-blur-sm p-1.5 rounded-[16px] shadow-[0_4px_16px_rgba(11,93,68,0.06)] inline-flex items-center gap-1"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => {
                  onSelectTab(tab.id);
                  setSelectedHotspot(null);
                }}
                className={`relative px-4 py-1.5 text-[13px] font-semibold rounded-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="vehicleTabPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 bg-[#0B5D44] rounded-[11px] shadow-xs"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Central EV Cutaway Visualization + Interactive Hotspots */}
      <div className="relative flex-1 flex items-center justify-center -my-3 sm:-my-5">
        <div className="relative w-full max-w-[680px] aspect-[16/9] flex items-center justify-center select-none">
          <motion.img
            src={ASSET_IMAGES.evCutaway}
            alt="Transparent electric vehicle diagnostic cutaway"
            referrerPolicy="no-referrer"
            animate={getVehicleTransform()}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            className="w-full h-full object-contain mix-blend-multiply pointer-events-none"
          />

          {/* Subtle scan sweep overlay when Live Battery Scan is active */}
          <AnimatePresence>
            {liveScanActive && (
              <motion.div
                initial={{ opacity: 0, x: '-35%' }}
                animate={{ opacity: [0, 0.55, 0], x: ['-35%', '45%'] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                aria-hidden="true"
                className="absolute inset-y-6 w-28 bg-gradient-to-r from-transparent via-[#22C58B]/25 to-transparent skew-x-[-18deg] pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Interactive Subsystem Hotspots */}
          {VEHICLE_HOTSPOTS.map((hotspot) => {
            const isHighlighted = activeTab === hotspot.tab;
            const isBatterySpot = hotspot.variant === 'battery';
            const leftPos =
              currentAngle === 'rear-quarter'
                ? `${100 - hotspot.xPercent}%`
                : `${hotspot.xPercent}%`;

            return (
              <motion.button
                key={hotspot.id}
                type="button"
                aria-label={hotspot.label}
                onClick={() => handleHotspotClick(hotspot)}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.94 }}
                style={{ left: leftPos, top: `${hotspot.yPercent}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-[0_6px_16px_rgba(15,23,42,0.14)] transition-all cursor-pointer z-20 ${
                  isHighlighted
                    ? isBatterySpot
                      ? 'bg-[#0B5D44] text-white ring-4 ring-white/75'
                      : hotspot.variant === 'thermal'
                        ? 'bg-[#6D5BD0] text-white ring-4 ring-white/75'
                        : 'bg-[#0B5D44] text-white ring-4 ring-white/75'
                    : isBatterySpot
                      ? 'bg-[#0B5D44] text-white ring-2 ring-white/80'
                      : hotspot.variant === 'thermal'
                        ? 'bg-white text-[#6D5BD0] ring-2 ring-white/80'
                        : 'bg-white text-[#0B5D44] ring-2 ring-white/80'
                }`}
              >
                {renderHotspotIcon(hotspot.variant)}
              </motion.button>
            );
          })}

          {/* Floating Telemetry Callout Badge (Default: 78% charge) */}
          <motion.div
            key={`${activeTab}-${callout.primaryValue}`}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              left:
                currentAngle === 'rear-quarter'
                  ? activeTab === 'battery'
                    ? '40%'
                    : '58%'
                  : calloutPos.left,
              top: calloutPos.top,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="absolute -translate-y-1/2 z-30 pointer-events-auto"
          >
            <div className="bg-white/98 backdrop-blur-sm rounded-[14px] px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-[0_10px_28px_rgba(15,23,42,0.11)] border border-white flex items-baseline gap-1.5">
              <span className="text-[15px] sm:text-[17px] font-bold tracking-tight text-slate-900 tabular-nums">
                {callout.primaryValue}
              </span>
              <span className="text-xs sm:text-[13px] font-medium text-slate-500">
                {callout.primaryLabel}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar: Rotate Button + Contextual Subsystem Summary */}
      <div className="relative z-20 flex items-center justify-between gap-4">
        <motion.button
          type="button"
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.93 }}
          onClick={handleRotate}
          aria-label={`Rotate vehicle view (${VIEW_ANGLES[angleIndex].label})`}
          title={`View: ${VIEW_ANGLES[angleIndex].label}`}
          className="w-10 h-10 rounded-full bg-white shadow-[0_4px_12px_rgba(15,23,42,0.08)] flex items-center justify-center text-slate-700 hover:text-[#0B5D44] transition-colors cursor-pointer shrink-0"
        >
          <RotateCw className="w-4 h-4" />
        </motion.button>

        {/* Quiet contextual readout when non-default tab, hotspot, or reduced modules active */}
        <AnimatePresence mode="wait">
          {(activeTab !== 'battery' ||
            selectedHotspot ||
            packSummary.activeModules < packSummary.totalModules ||
            angleIndex !== 0) && (
            <motion.div
              key={`${activeTab}-${selectedHotspot?.id ?? 'none'}-${angleIndex}-${packSummary.activeModules}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className="bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-xs text-xs font-medium text-slate-700 tabular-nums flex items-center gap-2"
            >
              <span className="font-semibold text-[#0B5D44]">
                {selectedHotspot ? selectedHotspot.label : VIEW_ANGLES[angleIndex].label}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>
                {callout.secondaryDetail}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
