import { SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { BatteryModule } from '../types/diagnostics';
import { sortOrFilterModules } from '../utils/diagnosticsLogic';

interface BatteryModulesCardProps {
  modules: BatteryModule[];
  onToggleModule: (moduleId: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  filterMode: 'all' | 'active' | 'warmest';
  onCycleFilter: () => void;
}

const FILTER_LABELS: Record<'all' | 'active' | 'warmest', string> = {
  all: 'All',
  active: 'Active only',
  warmest: 'Warmest first',
};

export function BatteryModulesCard({
  modules,
  onToggleModule,
  expanded,
  onToggleExpanded,
  filterMode,
  onCycleFilter,
}: BatteryModulesCardProps) {
  const filteredModules = sortOrFilterModules(modules, filterMode);
  const visibleModules = expanded ? filteredModules : filteredModules.slice(0, 2);

  return (
    <section
      aria-label="Battery modules"
      className="bg-white rounded-[26px] p-5 sm:p-6 shadow-[0_2px_12px_rgba(15,23,42,0.03)] border border-slate-900/[0.04] flex flex-col justify-between"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[15px] font-semibold text-slate-900">
            Battery modules
          </h3>
          <span className="text-[15px] font-medium text-slate-400 tabular-nums">
            {modules.length}
          </span>
          {filterMode !== 'all' && (
            <span className="text-[11px] font-medium text-[#0B5D44] ml-1">
              · {FILTER_LABELS[filterMode]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleExpanded}
            className="text-[13px] font-semibold text-[#0B5D44] hover:text-[#084431] transition-colors cursor-pointer whitespace-nowrap"
          >
            {expanded ? 'Show less' : 'View all'}
          </button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={onCycleFilter}
            aria-label={`Filter battery modules (current: ${FILTER_LABELS[filterMode]})`}
            title={`Sort/Filter: ${FILTER_LABELS[filterMode]}`}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              filterMode !== 'all'
                ? 'bg-[#E3F3EA] text-[#0B5D44]'
                : 'bg-[#F4F7F6] text-slate-700 hover:bg-[#E8EEEC]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Module List */}
      {visibleModules.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No active battery modules match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {visibleModules.map((mod) => (
              <motion.div
                key={mod.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: mod.enabled ? 1 : 0.62, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="bg-[#F4F7F6] rounded-[18px] px-3.5 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-16 h-11 flex items-center justify-center shrink-0">
                    <img
                      src={mod.image}
                      alt={mod.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-slate-900 truncate">
                      {mod.name}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[13px] tabular-nums">
                      <span>
                        <strong className="font-bold text-slate-900">
                          {mod.temperatureC.toFixed(1)}
                        </strong>{' '}
                        <span className="text-slate-400 font-medium">°C</span>
                      </span>
                      <span>
                        <strong className="font-bold text-slate-900">
                          {mod.sohPercent}%
                        </strong>{' '}
                        <span className="text-slate-400 font-medium">SoH</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Working Battery Module Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={mod.enabled}
                  aria-label={`Toggle ${mod.name}`}
                  onClick={() => onToggleModule(mod.id)}
                  className={`relative w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B5D44] ${
                    mod.enabled ? 'bg-[#0B5D44]' : 'bg-slate-300'
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`block w-5 h-5 rounded-full bg-white shadow-sm ${
                      mod.enabled ? 'ml-auto' : 'mr-auto'
                    }`}
                  />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
