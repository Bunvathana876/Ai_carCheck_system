import { useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import type { DiagnosticTab } from '@voltguard/shared/diagnostics';
import { getTabCallout } from '@voltguard/shared/diagnosticsLogic';
import { useDashboard } from './hooks/useDashboard';
import { api } from './lib/api';
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
  const [modulesExpanded, setModulesExpanded] = useState(false);
  const [filterIndex, setFilterIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scanPending, setScanPending] = useState(false);
  const { data, vehicles, busy, error, load, run } = useDashboard();

  if (!data) {
    return <main className="min-h-screen flex items-center justify-center p-6">
      <div className="rounded-3xl bg-white p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold">Voltguard</h1>
        {error ? <>
          <p role="alert" className="mt-4 text-red-700">{error}</p>
          <button type="button" disabled={busy} onClick={() => void load()} className="mt-4 rounded-xl bg-[#0B5D44] px-5 py-2 text-white disabled:opacity-50">Retry connection</button>
        </> : <p role="status" className="mt-4">Loading vehicle diagnostics…</p>}
      </div>
    </main>;
  }

  const { modules, notifications, eventsByDate, packSummary, systems, profile } = data;
  const filterMode = FILTER_CYCLE[filterIndex];
  const callout = getTabCallout(activeTab, packSummary,
    systems.find(system => system.id === 'front-drive')?.percentage ?? 0,
    systems.find(system => system.id === 'coolant-circuit')?.percentage ?? 0);
  const handleScan = async () => {
    setScanPending(true);
    await run(signal => api.scan(profile.id, signal));
    setScanPending(false);
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <p role="status">{busy ? (scanPending ? 'Saving sample scan…' : 'Syncing…') : error ? 'Sync failed · Last loaded data shown' : 'Connected · Changes saved to database'}</p>
            <button type="button" disabled={busy} onClick={() => void load(profile.id)} className="font-semibold text-[#0B5D44] disabled:opacity-50">Refresh data</button>
          </div>
          {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error} Your last loaded data is shown; refresh before retrying.</p>}
          {data.lastScan && <p className="mb-3 text-sm text-slate-600">Last sample scan: {new Date(data.lastScan.completedAt).toLocaleString()} · {data.lastScan.summary.activeModules}/{data.lastScan.summary.totalModules} modules · {data.lastScan.summary.effectiveChargePercent}% charge</p>}
          <fieldset disabled={busy} aria-busy={busy} className="m-0 min-w-0 border-0 p-0 disabled:opacity-75">
          <TopNavBar
            liveScanActive={scanPending}
            onToggleLiveScan={() => void handleScan()}
            onToggleExpandModules={() => setModulesExpanded((prev) => !prev)}
            modulesExpanded={modulesExpanded}
            notifications={notifications}
            onMarkAllRead={() => void run(signal => api.readNotifications(profile.id, signal))}
            profile={profile}
            vehicles={vehicles}
            onSelectVehicle={(id) => { setSelectedDate(null); void load(id); }}
          />

          <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
            {/* Left Main Diagnostic Area */}
            <div className="lg:col-span-8 flex flex-col gap-4 lg:gap-5">
              <VehicleHealthCard
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                packSummary={packSummary}
                callout={callout}
                liveScanActive={scanPending}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                <BatteryModulesCard
                  modules={modules}
                  onToggleModule={(id) => {
                    const module = modules.find(item => item.id === id);
                    if (module) void run(signal => api.setModule(profile.id, id, !module.enabled, signal));
                  }}
                  expanded={modulesExpanded}
                  onToggleExpanded={() => setModulesExpanded((prev) => !prev)}
                  filterMode={filterMode}
                  onCycleFilter={() => setFilterIndex(index => (index + 1) % FILTER_CYCLE.length)}
                />

                <SystemsHealthCard
                  systems={systems}
                  liveScanActive={scanPending}
                />
              </div>
            </div>

            {/* Right Service Sidebar */}
            <div className="lg:col-span-4">
              <ServiceHealthSidebar
                assets={data.assets}
                selectedDate={selectedDate ?? data.initialDate}
                onSelectDate={setSelectedDate}
                eventsByDate={eventsByDate}
                onAddQuickCheck={(date, slot) => void run(signal => api.schedule(profile.id, date, slot, signal))}
                onCancelEvent={(eventId) => void run(signal => api.cancelEvent(profile.id, eventId, signal))}
              />
            </div>
          </main>
          </fieldset>
        </motion.div>
      </div>
    </MotionConfig>
  );
}
