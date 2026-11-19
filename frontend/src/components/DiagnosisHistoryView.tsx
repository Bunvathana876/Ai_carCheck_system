import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, ChevronRight, History, ShieldAlert, Wrench } from 'lucide-react';
import type { DiagnosisSession } from '@voltguard/shared/expert';
import { api } from '../lib/api';

interface DiagnosisHistoryViewProps {
  onSelectSession?: (session: DiagnosisSession) => void;
}

export function DiagnosisHistoryView({ onSelectSession }: DiagnosisHistoryViewProps) {
  const [sessions, setSessions] = useState<DiagnosisSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.diagnoses
      .history()
      .then((data) => setSessions(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
        <p className="text-xs font-semibold text-slate-500">Loading diagnosis history…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-[#0B5D44]" />
            <h2 className="text-lg font-bold text-slate-900">Diagnosis Session History</h2>
          </div>
          <p className="text-xs text-slate-500">
            Review past forward-chaining diagnostic evaluations, recorded symptoms, and hypotheses.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 mb-1">No diagnosis sessions recorded yet.</p>
          <p className="text-xs text-slate-400">
            Start a new diagnosis from the Expert Diagnosis tab to see saved session history here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((sess) => {
            const topHypothesis = sess.latestResult?.hypotheses[0];
            const hasCriticalSafety = sess.latestResult?.safetyAlerts.some((a) => a.severity === 'CRITICAL');

            return (
              <div
                key={sess.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 transition-all hover:border-slate-300"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {sess.vehicleSummary.year} {sess.vehicleSummary.manufacturer} {sess.vehicleSummary.model}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 capitalize">
                      {sess.vehicleSummary.powertrain} · {sess.vehicleSummary.transmission.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        sess.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sess.status}
                    </span>
                    {hasCriticalSafety && (
                      <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> CRITICAL SAFETY
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(sess.startedAt).toLocaleString()}
                    </span>
                    <span>·</span>
                    <span>{sess.reportedSymptomCodes.length} symptoms evaluated</span>
                    <span>·</span>
                    <span>{Object.keys(sess.facts).length} facts in memory</span>
                  </div>

                  {topHypothesis && (
                    <div className="text-xs font-medium text-slate-700 flex items-center gap-2 pt-1">
                      <span className="text-slate-400">Top Finding:</span>
                      <strong className="text-slate-900">{topHypothesis.primaryFault.name}</strong>
                      <span className="text-[11px] font-bold text-[#0B5D44] bg-[#E8F5EE] px-1.5 py-0.2 rounded">
                        {topHypothesis.ruleMatchScore}% Match
                      </span>
                    </div>
                  )}
                </div>

                {onSelectSession && (
                  <button
                    type="button"
                    onClick={() => onSelectSession(sess)}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-colors"
                  >
                    View Details <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
