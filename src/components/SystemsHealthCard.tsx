import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import type { SystemMetric } from '../types/diagnostics';

interface SystemsHealthCardProps {
  systems: SystemMetric[];
  liveScanActive: boolean;
}

function useAnimatedCounter(target: number, triggerKey: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - start);
      const t = Math.min(1, elapsed / duration);
      // Cubic ease-out for crisp instrument settling
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, triggerKey]);

  return value;
}

function RadialTicksGauge({
  percentage,
  image,
  alt,
}: {
  percentage: number;
  image: string;
  alt: string;
}) {
  const totalTicks = 32;
  const activeTicks = Math.round((percentage / 100) * totalTicks);

  return (
    <div className="relative w-[92px] h-[92px] flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full -rotate-90"
        aria-hidden="true"
      >
        {Array.from({ length: totalTicks }).map((_, i) => {
          const angle = (i / totalTicks) * 360;
          const isFilled = i < activeTicks;
          return (
            <rect
              key={i}
              x="48.5"
              y="4"
              width="3"
              height="10.5"
              rx="1.5"
              fill={isFilled ? '#0B5D44' : '#E6ECE9'}
              transform={`rotate(${angle} 50 50)`}
              className="transition-colors duration-200"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={image}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-12 h-12 object-contain mix-blend-multiply"
        />
      </div>
    </div>
  );
}

function SwirlBladesGauge({
  percentage,
  image,
  alt,
}: {
  percentage: number;
  image: string;
  alt: string;
}) {
  const totalBlades = 18;
  const activeBlades = Math.round((percentage / 100) * totalBlades);

  return (
    <div className="relative w-[92px] h-[92px] flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full -rotate-90"
        aria-hidden="true"
      >
        {Array.from({ length: totalBlades }).map((_, i) => {
          const angle = (i / totalBlades) * 360;
          const isFilled = i < activeBlades;
          return (
            <path
              key={i}
              d="M49 5 C53 10, 56 15, 52 21"
              fill="none"
              stroke={isFilled ? '#8B7EF8' : '#ECEAF8'}
              strokeWidth="3.2"
              strokeLinecap="round"
              transform={`rotate(${angle} 50 50)`}
              className="transition-colors duration-200"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={image}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-12 h-12 object-contain mix-blend-multiply"
        />
      </div>
    </div>
  );
}

function SystemItem({
  system,
  triggerKey,
  showDetail,
}: {
  system: SystemMetric;
  triggerKey: number;
  showDetail: boolean;
}) {
  const animatedPct = useAnimatedCounter(system.percentage, triggerKey);

  return (
    <div className="flex flex-col justify-between">
      <div>
        <h4 className="text-[14px] font-semibold text-slate-900">
          {system.name}
        </h4>
        <p
          className={`text-xs font-medium mt-0.5 ${
            system.statusTone === 'green'
              ? 'text-[#0D7A5F]'
              : 'text-[#6D5BD0]'
          }`}
        >
          {system.statusLabel}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3.5">
        {system.gaugeVariant === 'radial-ticks' ? (
          <RadialTicksGauge
            percentage={animatedPct}
            image={system.image}
            alt={system.name}
          />
        ) : (
          <SwirlBladesGauge
            percentage={animatedPct}
            image={system.image}
            alt={system.name}
          />
        )}

        <div>
          <div className="text-[22px] font-bold tracking-tight text-slate-900 leading-none tabular-nums">
            {animatedPct}%
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1.5">
            {system.metricLabel}
          </div>
        </div>
      </div>

      {showDetail && (
        <p className="mt-3 text-[11px] font-medium text-slate-500 tabular-nums">
          {system.detailText}
        </p>
      )}
    </div>
  );
}

export function SystemsHealthCard({
  systems,
  liveScanActive,
}: SystemsHealthCardProps) {
  const [replayCount, setReplayCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const handleRecalibrate = () => {
    setReplayCount((c) => c + 1);
    setShowDetails((prev) => !prev);
  };

  return (
    <section
      aria-label="Systems"
      className="bg-white rounded-[26px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(15,23,42,0.03)] border border-slate-900/[0.04] flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[15px] font-semibold text-slate-900">Systems</h3>
          <span className="text-[15px] font-medium text-slate-400 tabular-nums">
            {systems.length}
          </span>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleRecalibrate}
          aria-label="Run system gauge check and toggle telemetry details"
          aria-pressed={showDetails}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            showDetails
              ? 'bg-[#E3F3EA] text-[#0B5D44]'
              : 'bg-[#F4F7F6] text-slate-700 hover:bg-[#E8EEEC]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Two-column Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-0 sm:divide-x divide-slate-100">
        {systems.map((sys, idx) => (
          <div
            key={sys.id}
            className={idx === 0 ? 'sm:pr-5' : 'sm:pl-5'}
          >
            <SystemItem
              system={sys}
              triggerKey={replayCount + (liveScanActive ? 100 : 0)}
              showDetail={showDetails}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
