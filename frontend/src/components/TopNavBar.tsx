import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  LayoutGrid,
  Mic,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { NotificationItem, VehicleProfile } from '@voltguard/shared/diagnostics';
import { ASSET_IMAGES } from '../data/vehicleVisuals';

interface TopNavBarProps {
  liveScanActive: boolean;
  onToggleLiveScan: () => void;
  onToggleExpandModules: () => void;
  modulesExpanded: boolean;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  profile: VehicleProfile;
  vehicles: VehicleProfile[];
  onSelectVehicle: (id: string) => void;
}

const WAVE_BAR_HEIGHTS = [8, 14, 18, 11, 20, 15, 9, 17, 13, 19, 10];
export function TopNavBar({
  liveScanActive,
  onToggleLiveScan,
  onToggleExpandModules,
  modulesExpanded,
  notifications,
  onMarkAllRead,
  profile,
  vehicles,
  onSelectVehicle,
}: TopNavBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bayMenuOpen, setBayMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const bayRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (bayRef.current && !bayRef.current.contains(e.target as Node)) {
        setBayMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pb-4">
      {/* Left: Back button + Vehicle thumbnail + Brand & VIN */}
      <div className="relative flex items-center gap-2.5 sm:gap-3.5 min-w-0 max-w-full" ref={bayRef}>
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setBayMenuOpen((prev) => !prev)}
          aria-label="Switch workshop bay"
          aria-expanded={bayMenuOpen}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200/70 shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex items-center justify-center text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[13px] bg-gradient-to-br from-[#EAF7F0] to-[#CFEAD9] border border-[#0B5D44]/10 p-1 flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={ASSET_IMAGES.evCutaway}
            alt="Voltguard electric sedan cutaway"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain mix-blend-multiply scale-110"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-[16px] sm:text-[17px] font-bold tracking-tight text-slate-900 leading-tight whitespace-nowrap">
            {profile.brand}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] sm:text-xs text-slate-500 font-medium tabular-nums min-w-0">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                liveScanActive ? 'bg-[#0B5D44]' : 'bg-[#22C58B]'
              }`}
              aria-hidden="true"
            />
            <span className="truncate">{`${profile.bay} · VIN ${profile.vin}`}</span>
          </div>
        </div>

        <AnimatePresence>
          {bayMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute left-0 top-13 z-50 w-76 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2"
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                Active Service Bays
              </div>
              {vehicles.map((vehicle) => {
                const active = vehicle.id === profile.id;
                return (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => {
                      onSelectVehicle(vehicle.id);
                      setBayMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#E3F3EA] text-[#0B5D44]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate tabular-nums">{vehicle.bay} · VIN {vehicle.vin}</span>
                    {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Demo Battery Scan + Utility Actions + Technician Profile */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-3 w-full sm:w-auto sm:ml-auto">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onToggleLiveScan}
          aria-pressed={liveScanActive}
          className={`rounded-full pl-3 sm:pl-4 pr-1.5 py-1.5 flex items-center gap-2 sm:gap-3 shadow-[0_6px_18px_rgba(11,93,68,0.18)] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            liveScanActive
              ? 'bg-[#084734] text-white ring-2 ring-[#79E2BF]/60'
              : 'bg-[#0B5D44] hover:bg-[#094F3A] text-white'
          }`}
        >
          {/* Animated Waveform Bars */}
          <span
            className="flex items-center gap-[2px] sm:gap-[2.5px] h-5"
            aria-hidden="true"
          >
            {WAVE_BAR_HEIGHTS.map((height, idx) => (
              <motion.span
                key={idx}
                className={`w-[2px] rounded-full bg-[#7DE5C2] ${
                  idx >= 7 ? 'hidden sm:inline-block' : ''
                }`}
                animate={
                  liveScanActive
                    ? {
                        height: [
                          `${Math.max(5, height * 0.45)}px`,
                          `${height}px`,
                          `${Math.max(6, height * 0.55)}px`,
                        ],
                      }
                    : { height: `${height}px` }
                }
                transition={
                  liveScanActive
                    ? {
                        duration: 0.75,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: idx * 0.06,
                        ease: 'easeInOut',
                      }
                    : { duration: 0.2 }
                }
                style={{ height: `${height}px` }}
              />
            ))}
          </span>

          <span className="text-xs sm:text-[13px] font-medium tracking-tight">
            {liveScanActive ? 'Scanning Pack…' : 'Demo Battery Scan'}
          </span>

          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            {liveScanActive ? (
              <Radio className="w-3.5 h-3.5 text-[#7DE5C2]" />
            ) : (
              <Mic className="w-3.5 h-3.5 text-white" />
            )}
          </span>
        </motion.button>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Grid view toggle */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={onToggleExpandModules}
            aria-label={modulesExpanded ? 'Compact module view' : 'Expand all modules'}
            aria-pressed={modulesExpanded}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              modulesExpanded
                ? 'bg-[#E3F3EA] border-[#0B5D44]/20 text-[#0B5D44]'
                : 'bg-white border-slate-200/70 text-slate-700 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </motion.button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label={`Notifications (${unreadCount} unread)`}
              aria-expanded={notifOpen}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200/70 shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer relative shrink-0"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  className="w-2 h-2 rounded-full bg-[#6D5BD0] ring-2 ring-white absolute top-2 right-2 sm:top-2.5 sm:right-2.5"
                  aria-hidden="true"
                />
              )}
            </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 top-12 z-50 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3"
              >
                <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-900">
                    Diagnostic Alerts
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="text-[11px] font-semibold text-[#0B5D44] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-1.5">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl text-xs transition-colors ${
                        item.read ? 'bg-slate-50/70' : 'bg-[#EAF6EF]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                          {item.timeAgo}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-label="Technician profile menu"
            aria-expanded={profileOpen}
            className="flex items-center gap-2.5 sm:pl-1 sm:pr-2 py-0.5 rounded-full hover:bg-white/80 transition-colors cursor-pointer shrink-0"
          >
            <span className="w-9 h-9 rounded-full bg-[#0D4A38] text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {profile.technicianInitials}
            </span>
            <span className="text-[13px] font-semibold text-slate-800 whitespace-nowrap hidden md:inline">
              {profile.technicianName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden md:inline" />
          </motion.button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 top-12 z-50 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3"
              >
                <div className="pb-2.5 border-b border-slate-100">
                  <div className="text-sm font-semibold text-slate-900">
                    {profile.technicianName}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {profile.technicianRole}
                  </div>
                </div>
                <div className="pt-2.5 space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between py-1">
                    <span>Vehicle</span>
                    <span className="font-semibold text-slate-900">
                      {profile.model}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Certification</span>
                    <span className="font-semibold text-[#0B5D44]">
                      HV Level 4 Active
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </header>
  );
}
