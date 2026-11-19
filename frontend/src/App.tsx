import { useEffect, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import {
  Activity,
  BookOpen,
  History,
  Stethoscope,
  Wrench,
} from 'lucide-react';
import type { DiagnosticTab } from '@voltguard/shared/diagnostics';
import { getTabCallout } from '@voltguard/shared/diagnosticsLogic';
import type { VehicleEntity } from '@voltguard/shared/expert';
import { useDashboard } from './hooks/useDashboard';
import { api } from './lib/api';
import { TopNavBar } from './components/TopNavBar';
import { VehicleHealthCard } from './components/VehicleHealthCard';
import { BatteryModulesCard } from './components/BatteryModulesCard';
import { SystemsHealthCard } from './components/SystemsHealthCard';
import { ServiceHealthSidebar } from './components/ServiceHealthSidebar';
import { ExpertDiagnosisView } from './components/ExpertDiagnosisView';
import { DiagnosisHistoryView } from './components/DiagnosisHistoryView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { VehicleModal } from './components/VehicleModal';

type AppMode = 'ev_telemetry' | 'expert' | 'history' | 'knowledge';

const FILTER_CYCLE: ('all' | 'active' | 'warmest')[] = [
  'all',
  'active',
  'warmest',
];

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('ev_telemetry');
  const [activeTab, setActiveTab] = useState<DiagnosticTab>('battery');
  const [modulesExpanded, setModulesExpanded] = useState(false);
  const [filterIndex, setFilterIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scanPending, setScanPending] = useState(false);

  // Expert system vehicles state
  const [expertVehicles, setExpertVehicles] = useState<VehicleEntity[]>([]);
  const [activeExpertVehicle, setActiveExpertVehicle] = useState<VehicleEntity | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  const { data, vehicles, busy, error, load, run } = useDashboard();

  useEffect(() => {
    api.expertVehicles
      .list()
      .then((list) => {
        setExpertVehicles(list);
        if (list.length > 0 && !activeExpertVehicle) {
          setActiveExpertVehicle(list[0]);
        }
      })
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[#083326]">
        <div className="rounded-3xl bg-white p-8 max-w-lg w-full shadow-2xl border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">Ai CarCheck & Voltguard</h1>
          <p className="text-xs text-slate-500 mt-1">Automotive Rule-Based Diagnostic Expert System</p>
          {error ? (
            <>
              <p role="alert" className="mt-4 text-xs font-semibold text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
                {error}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void load()}
                className="mt-4 rounded-xl bg-[#0B5D44] px-5 py-2 text-xs font-bold text-white hover:bg-[#084533] disabled:opacity-50 transition-colors"
              >
                Retry connection
              </button>
            </>
          ) : (
            <p role="status" className="mt-4 text-xs font-semibold text-slate-600">
              Connecting to diagnostic engine and SQLite store…
            </p>
          )}
        </div>
      </main>
    );
  }

  const { modules, notifications, eventsByDate, packSummary, systems, profile } = data;
  const filterMode = FILTER_CYCLE[filterIndex];
  const callout = getTabCallout(
    activeTab,
    packSummary,
    systems.find((system) => system.id === 'front-drive')?.percentage ?? 0,
    systems.find((system) => system.id === 'coolant-circuit')?.percentage ?? 0
  );

  const handleScan = async () => {
    setScanPending(true);
    await run((signal) => api.scan(profile.id, signal));
    setScanPending(false);
  };

  const handleAddVehicle = async (vehData: Omit<VehicleEntity, 'id' | 'createdAt'>) => {
    const created = await api.expertVehicles.create(vehData);
    setExpertVehicles((prev) => [created, ...prev]);
    setActiveExpertVehicle(created);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen w-full bg-[#083326] p-2.5 sm:p-4 lg:p-5 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[1380px] bg-[#F7F9F8] rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 lg:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.28)] border border-white/60"
        >
          {/* Top Status Bar */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <p role="status">
              {busy
                ? scanPending
                  ? 'Saving sample scan…'
                  : 'Syncing…'
                : error
                ? 'Sync failed · Last loaded data shown'
                : 'Connected · SQLite WAL storage active'}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void load(profile.id)}
              className="font-bold text-[#0B5D44] hover:underline disabled:opacity-50"
            >
              Refresh data
            </button>
          </div>

          {error && (
            <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800 border border-red-200">
              {error} Your last loaded data is shown; refresh before retrying.
            </p>
          )}

          {data.lastScan && (
            <p className="mb-3 text-xs text-slate-500">
              Last sample scan: {new Date(data.lastScan.completedAt).toLocaleString()} ·{' '}
              {data.lastScan.summary.activeModules}/{data.lastScan.summary.totalModules} modules ·{' '}
              {data.lastScan.summary.effectiveChargePercent}% charge
            </p>
          )}

          {/* Master Application Navigation Tabs */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-900 tracking-tight mr-1">Ai CarCheck</span>
              <div className="flex flex-wrap gap-1 bg-slate-200/60 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAppMode('ev_telemetry')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    appMode === 'ev_telemetry'
                      ? 'bg-white text-[#0B5D44] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  EV Telemetry Lab
                </button>

                <button
                  type="button"
                  onClick={() => setAppMode('expert')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    appMode === 'expert'
                      ? 'bg-[#0B5D44] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  Expert Diagnosis
                </button>

                <button
                  type="button"
                  onClick={() => setAppMode('history')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    appMode === 'history'
                      ? 'bg-white text-[#0B5D44] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  Diagnosis History
                </button>

                <button
                  type="button"
                  onClick={() => setAppMode('knowledge')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    appMode === 'knowledge'
                      ? 'bg-white text-[#0B5D44] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Knowledge Base (50 Rules)
                </button>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-500">
              Rule-Based Expert System v2.0
            </div>
          </div>

          {/* TAB 1: EV TELEMETRY LAB (PRESERVED 100%) */}
          {appMode === 'ev_telemetry' && (
            <fieldset disabled={busy} aria-busy={busy} className="m-0 min-w-0 border-0 p-0 disabled:opacity-75">
              <TopNavBar
                liveScanActive={scanPending}
                onToggleLiveScan={() => void handleScan()}
                onToggleExpandModules={() => setModulesExpanded((prev) => !prev)}
                modulesExpanded={modulesExpanded}
                notifications={notifications}
                onMarkAllRead={() => void run((signal) => api.readNotifications(profile.id, signal))}
                profile={profile}
                vehicles={vehicles}
                onSelectVehicle={(id) => {
                  setSelectedDate(null);
                  void load(id);
                }}
              />

              <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
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
                        const module = modules.find((item) => item.id === id);
                        if (module) void run((signal) => api.setModule(profile.id, id, !module.enabled, signal));
                      }}
                      expanded={modulesExpanded}
                      onToggleExpanded={() => setModulesExpanded((prev) => !prev)}
                      filterMode={filterMode}
                      onCycleFilter={() => setFilterIndex((index) => (index + 1) % FILTER_CYCLE.length)}
                    />

                    <SystemsHealthCard systems={systems} liveScanActive={scanPending} />
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <ServiceHealthSidebar
                    assets={data.assets}
                    selectedDate={selectedDate ?? data.initialDate}
                    onSelectDate={setSelectedDate}
                    eventsByDate={eventsByDate}
                    onAddQuickCheck={(date, slot) => void run((signal) => api.schedule(profile.id, date, slot, signal))}
                    onCancelEvent={(eventId) => void run((signal) => api.cancelEvent(profile.id, eventId, signal))}
                  />
                </div>
              </main>
            </fieldset>
          )}

          {/* TAB 2: EXPERT SYSTEM DIAGNOSIS */}
          {appMode === 'expert' && (
            <ExpertDiagnosisView
              vehicles={expertVehicles}
              activeVehicle={activeExpertVehicle}
              onSelectVehicle={setActiveExpertVehicle}
              onOpenAddVehicleModal={() => setShowVehicleModal(true)}
            />
          )}

          {/* TAB 3: DIAGNOSIS HISTORY */}
          {appMode === 'history' && <DiagnosisHistoryView />}

          {/* TAB 4: KNOWLEDGE BASE (50 RULES) */}
          {appMode === 'knowledge' && <KnowledgeBaseView />}

          {/* Vehicle Registration Modal */}
          <VehicleModal
            isOpen={showVehicleModal}
            onClose={() => setShowVehicleModal(false)}
            onSubmit={handleAddVehicle}
          />
        </motion.div>
      </div>
    </MotionConfig>
  );
}
