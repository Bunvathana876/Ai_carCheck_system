import { useState, useMemo } from 'react';
import { MotionConfig, motion } from 'motion/react';
import {
  CONNECTED_ASSETS,
  INITIAL_BATTERY_MODULES,
  INITIAL_NOTIFICATIONS,
  INITIAL_SERVICE_EVENTS_BY_DATE,
  INITIAL_SYSTEMS,
  VEHICLE_PROFILE,
} from './data/mockDiagnostics';
import type {
  BatteryModule,
  DiagnosticTab,
  NotificationItem,
  ServiceEvent,
} from './types/diagnostics';
import {
  calculatePackSummary,
  getTabCallout,
} from './utils/diagnosticsLogic';
import { TopNavBar } from './components/TopNavBar';
import { VehicleHealthCard } from './components/VehicleHealthCard';
import { BatteryModulesCard } from './components/BatteryModulesCard';
import { SystemsHealthCard } from './components/SystemsHealthCard';
import { ServiceHealthSidebar } from './components/ServiceHealthSidebar';

const FILTER_CYCLE: ('all' | 'active' | 'warmest')[] = [
  'all',
  'active',
  'warmest',
];

export default function App() {
  const [activeTab, setActiveTab] = useState<DiagnosticTab>('battery');
  const [modules, setModules] = useState<BatteryModule[]>(
    INITIAL_BATTERY_MODULES
  );
  const [modulesExpanded, setModulesExpanded] = useState(false);
  const [filterIndex, setFilterIndex] = useState(0);
  const [liveScanActive, setLiveScanActive] = useState(false);
  const [selectedBay, setSelectedBay] = useState(
    `${VEHICLE_PROFILE.bay} · VIN ${VEHICLE_PROFILE.vin}`
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );
  const [selectedDate, setSelectedDate] = useState('2026-05-16');
  const [eventsByDate, setEventsByDate] = useState<
    Record<string, ServiceEvent[]>
  >(INITIAL_SERVICE_EVENTS_BY_DATE);

  const filterMode = FILTER_CYCLE[filterIndex];

  const packSummary = useMemo(
    () =>
      calculatePackSummary(
        modules,
        VEHICLE_PROFILE.baseChargePercent,
        VEHICLE_PROFILE.rangeKm
      ),
    [modules]
  );

  // Subtle dynamic adjustment when Live Battery Scan is toggled or modules change
  const systems = useMemo(() => {
    return INITIAL_SYSTEMS.map((sys) => {
      if (sys.id === 'front-drive') {
        const penalty =
          packSummary.activeModules < packSummary.totalModules
            ? (packSummary.totalModules - packSummary.activeModules) * 4
            : 0;
        return {
          ...sys,
          percentage: Math.max(0, sys.percentage - penalty),
        };
      }
      return sys;
    });
  }, [packSummary]);

  const frontDriveHealth =
    systems.find((s) => s.id === 'front-drive')?.percentage ?? 72;
  const coolantEfficiency =
    systems.find((s) => s.id === 'coolant-circuit')?.percentage ?? 45;

  const callout = useMemo(
    () =>
      getTabCallout(
        activeTab,
        packSummary,
        frontDriveHealth,
        coolantEfficiency
      ),
    [activeTab, packSummary, frontDriveHealth, coolantEfficiency]
  );

  const handleToggleModule = (moduleId: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleCycleFilter = () => {
    setFilterIndex((prev) => (prev + 1) % FILTER_CYCLE.length);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleAddQuickCheck = (
    isoDate: string,
    timeSlot: ServiceEvent['timeSlot']
  ) => {
    const newEvent: ServiceEvent = {
      id: `ev-${isoDate}-${timeSlot}-${Date.now()}`,
      timeSlot,
      title: 'Thermal & HV isolation check',
      subtitle: 'Scheduled by Daniel Reed · Bay 03',
      tone: timeSlot === '09:00' || timeSlot === '11:00' ? 'mint' : 'lavender',
      iconType: timeSlot === '10:00' ? 'coolant' : 'check',
    };
    setEventsByDate((prev) => ({
      ...prev,
      [isoDate]: [...(prev[isoDate] ?? []), newEvent],
    }));
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen w-full bg-[#083326] p-2.5 sm:p-4 lg:p-5 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[1360px] bg-[#F7F9F8] rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 lg:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.28)] border border-white/60"
        >
          <TopNavBar
            liveScanActive={liveScanActive}
            onToggleLiveScan={() => setLiveScanActive((prev) => !prev)}
            onToggleExpandModules={() => setModulesExpanded((prev) => !prev)}
            modulesExpanded={modulesExpanded}
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            selectedBay={selectedBay}
            onSelectBay={setSelectedBay}
          />

          <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
            {/* Left Main Diagnostic Area */}
            <div className="lg:col-span-8 flex flex-col gap-4 lg:gap-5">
              <VehicleHealthCard
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                packSummary={packSummary}
                callout={callout}
                liveScanActive={liveScanActive}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                <BatteryModulesCard
                  modules={modules}
                  onToggleModule={handleToggleModule}
                  expanded={modulesExpanded}
                  onToggleExpanded={() => setModulesExpanded((prev) => !prev)}
                  filterMode={filterMode}
                  onCycleFilter={handleCycleFilter}
                />

                <SystemsHealthCard
                  systems={systems}
                  liveScanActive={liveScanActive}
                />
              </div>
            </div>

            {/* Right Service Sidebar */}
            <div className="lg:col-span-4">
              <ServiceHealthSidebar
                assets={CONNECTED_ASSETS}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                eventsByDate={eventsByDate}
                onAddQuickCheck={handleAddQuickCheck}
              />
            </div>
          </main>
        </motion.div>
      </div>
    </MotionConfig>
  );
}
