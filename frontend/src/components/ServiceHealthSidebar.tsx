import { useState } from 'react';
import {
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wrench,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type {
  ConnectedAsset,
  ServiceEvent,
} from '@voltguard/shared/diagnostics';
import {
  formatDisplayDate,
  getWeekDays,
  shiftIsoDateByDays,
} from '@voltguard/shared/diagnosticsLogic';

interface ServiceHealthSidebarProps {
  assets: ConnectedAsset[];
  selectedDate: string;
  onSelectDate: (isoDate: string) => void;
  eventsByDate: Record<string, ServiceEvent[]>;
  onAddQuickCheck: (isoDate: string, timeSlot: ServiceEvent['timeSlot']) => void;
  onCancelEvent: (eventId: string) => void;
}

const TIME_SLOTS: ServiceEvent['timeSlot'][] = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
];

export function ServiceHealthSidebar({
  assets,
  selectedDate,
  onSelectDate,
  eventsByDate,
  onAddQuickCheck,
  onCancelEvent,
}: ServiceHealthSidebarProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const weekDays = getWeekDays(selectedDate);
  const dayEvents = eventsByDate[selectedDate] ?? [];

  const activeAsset = assets.find((a) => a.id === selectedAssetId) ?? null;

  const renderAssetVisual = (asset: ConnectedAsset) => {
    if (asset.kind === 'vehicle') {
      return <CarFront className="w-4 h-4" />;
    }
    if (asset.kind === 'tool') {
      return <Wrench className="w-4 h-4" />;
    }
    return <span className="text-xs font-bold">{asset.shortCode}</span>;
  };

  const getAssetColors = (tone: ConnectedAsset['tone'], isSelected: boolean) => {
    const ring = isSelected ? 'ring-2 ring-offset-2 ring-[#0B5D44]' : '';
    switch (tone) {
      case 'mint':
        return `bg-[#DFF2E8] text-[#0B5D44] ${ring}`;
      case 'blue':
        return `bg-[#E3ECFA] text-[#1E3A8A] ${ring}`;
      case 'peach':
        return `bg-[#FCEAD9] text-[#9A3412] ${ring}`;
      case 'lavender':
        return `bg-[#EAE7FA] text-[#5B21B6] ${ring}`;
      case 'dark-green':
        return `bg-[#0B5D44] text-white ${ring}`;
    }
  };

  return (
    <aside
      aria-label="EV Service Health Center"
      className="bg-white rounded-[26px] p-6 shadow-[0_2px_12px_rgba(15,23,42,0.03)] border border-slate-900/[0.04] flex flex-col h-full"
    >
      {/* Title */}
      <h2 className="text-[24px] font-bold tracking-tight text-[#0F172A] leading-[1.18]">
        EV Service
        <br />
        Health Center
      </h2>

      {/* Connected Assets */}
      <div className="mt-6">
        <div className="text-[13px] font-semibold text-slate-800">
          Connected assets
        </div>
        <div className="flex items-center gap-2.5 mt-3">
          {assets.map((asset) => {
            const isSelected = asset.id === selectedAssetId;
            return (
              <motion.button
                key={asset.id}
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() =>
                  setSelectedAssetId((prev) =>
                    prev === asset.id ? null : asset.id
                  )
                }
                aria-label={`${asset.label} — ${asset.role}`}
                aria-pressed={isSelected}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-shadow cursor-pointer shrink-0 ${getAssetColors(
                  asset.tone,
                  isSelected
                )}`}
              >
                {renderAssetVisual(asset)}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {activeAsset && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="mt-3 px-3 py-2 rounded-xl bg-[#F4F7F6] text-xs flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900">
                    {activeAsset.label}
                  </span>
                  <span className="text-slate-500"> · {activeAsset.role}</span>
                </div>
                <span className="text-[11px] font-semibold text-[#0B5D44] shrink-0">
                  {activeAsset.status}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Service Timeline Header + Week Navigation */}
      <div className="mt-7">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">
              Service timeline
            </h3>
            <div className="text-xs font-medium text-slate-500 mt-0.5 tabular-nums">
              {formatDisplayDate(selectedDate)}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onSelectDate(shiftIsoDateByDays(selectedDate, -7))}
              aria-label="Previous week"
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onSelectDate(shiftIsoDateByDays(selectedDate, 7))}
              aria-label="Next week"
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* 7-Day Calendar Strip */}
        <div
          role="listbox"
          aria-label="Service week days"
          className="grid grid-cols-7 gap-1 mt-4"
        >
          {weekDays.map((day) => {
            const isSelected = day.isoDate === selectedDate;
            return (
              <button
                key={day.isoDate}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={`${day.weekdayShort} ${day.dayNumber}`}
                onClick={() => onSelectDate(day.isoDate)}
                className={`relative py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-white'
                    : 'text-slate-900 hover:bg-[#F4F7F6]'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="calendarDayPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 bg-[#0B5D44] rounded-2xl shadow-sm"
                  />
                )}
                <span className="relative z-10 text-[13px] font-bold tabular-nums leading-none">
                  {day.dayNumber}
                </span>
                <span
                  className={`relative z-10 text-[11px] font-medium leading-none ${
                    isSelected ? 'text-white/85' : 'text-slate-500'
                  }`}
                >
                  {day.weekdayShort}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hourly Service Timeline Slots */}
      <div className="mt-6 space-y-3.5 flex-1">
        {TIME_SLOTS.map((slot) => {
          const event = dayEvents.find((ev) => ev.timeSlot === slot);

          return (
            <div key={slot} className="flex items-start gap-3">
              <span className="w-10 pt-2.5 text-xs font-medium text-slate-400 tabular-nums shrink-0">
                {slot}
              </span>

              <div className="flex-1 min-w-0">
                {event ? (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-[18px] p-3.5 flex items-start gap-3 ${
                      event.tone === 'mint'
                        ? 'bg-[#E3F3EA]'
                        : 'bg-[#ECE9FB]'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 ${
                        event.tone === 'mint'
                          ? 'bg-[#0B5D44]'
                          : 'bg-[#6D5BD0]'
                      }`}
                    >
                      {event.iconType === 'check' ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <Wrench className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-slate-900 leading-snug">
                        {event.title}
                      </div>
                      <div className="text-xs font-medium text-slate-600 mt-1 tabular-nums">
                        {event.subtitle}
                      </div>
                    </div>
                    <button type="button" onClick={() => onCancelEvent(event.id)} aria-label={`Cancel ${event.title} at ${slot}`} className="shrink-0 rounded-full p-1 text-slate-500 hover:bg-white hover:text-red-700"><X className="h-4 w-4" /></button>
                  </motion.div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAddQuickCheck(selectedDate, slot)}
                    aria-label={`Schedule diagnostic check at ${slot}`}
                    className="group w-full h-9 flex items-center justify-end border-b border-slate-100 hover:border-[#0B5D44]/30 transition-colors cursor-pointer"
                  >
                    <span className="opacity-100 text-[11px] font-medium text-[#0B5D44] flex items-center gap-1 transition-opacity pr-1">
                      <Plus className="w-3 h-3" />
                      Schedule check
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
