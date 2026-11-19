import { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Search,
  ShieldCheck,
  Unlock,
  Wrench,
  X,
} from 'lucide-react';
import type { DiagnosticRule, RuleCategory, ValidationStatus } from '@voltguard/shared/expert';
import { api } from '../lib/api';

const CATEGORIES: { id: RuleCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All 50 Rules' },
  { id: 'ELECTRICAL', label: 'Electrical (8)' },
  { id: 'GASOLINE_ENGINE', label: 'Gas Engine (10)' },
  { id: 'COOLING_LUBRICATION', label: 'Cooling & Oil (7)' },
  { id: 'BRAKING', label: 'Brakes (5)' },
  { id: 'STEERING_SUSPENSION', label: 'Steering & Tires (6)' },
  { id: 'TRANSMISSION', label: 'Transmission (5)' },
  { id: 'DIESEL_ENGINE', label: 'Diesel (3)' },
  { id: 'EV_HYBRID', label: 'EV & Hybrid (6)' },
];

export function KnowledgeBaseView() {
  const [rules, setRules] = useState<DiagnosticRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<RuleCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ValidationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin authentication state
  const [adminKey, setAdminKey] = useState<string>('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');

  // Review modal state
  const [reviewingRule, setReviewingRule] = useState<DiagnosticRule | null>(null);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRole, setReviewerRole] = useState('ASE Certified Master Technician');
  const [reviewStatus, setReviewStatus] = useState<ValidationStatus>('VALIDATED');
  const [reviewComments, setReviewComments] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = () => {
    setLoading(true);
    api.diagnosticRules
      .list()
      .then((data) => setRules(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKeyInput.trim() === 'carcheck-admin-2026') {
      setAdminKey(adminKeyInput.trim());
      setIsAdminUnlocked(true);
      setShowAdminModal(false);
      setAdminKeyInput('');
      setError(null);
    } else {
      setError('Invalid Administrative Key. (Hint: carcheck-admin-2026)');
    }
  };

  const handleToggleRuleEnabled = async (rule: DiagnosticRule) => {
    if (!isAdminUnlocked) return;
    try {
      const updated = await api.admin.updateRule(rule.ruleId, { enabled: !rule.enabled }, adminKey);
      setRules((prev) => prev.map((r) => (r.ruleId === updated.ruleId ? updated : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rule.');
    }
  };

  const handleOpenReviewModal = (rule: DiagnosticRule) => {
    setReviewingRule(rule);
    setReviewerName(rule.reviewedBy ?? 'Dr. Automotive Examiner');
    setReviewerRole('Automotive Diagnostic Specialist & Peer Reviewer');
    setReviewStatus(rule.validationStatus);
    setReviewComments('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRule || !isAdminUnlocked) return;
    setSavingReview(true);
    setError(null);
    try {
      const updated = await api.admin.addReview(
        reviewingRule.ruleId,
        {
          reviewer: reviewerName.trim(),
          reviewerRole: reviewerRole.trim(),
          status: reviewStatus,
          comments: reviewComments.trim() || 'Rule validated against workshop manual technical procedures.',
        },
        adminKey
      );
      setRules((prev) => prev.map((r) => (r.ruleId === updated.ruleId ? updated : r)));
      setReviewingRule(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review.');
    } finally {
      setSavingReview(false);
    }
  };

  // Metrics
  const totalCount = rules.length;
  const validatedCount = rules.filter((r) => r.validationStatus === 'VALIDATED').length;
  const researchedCount = rules.filter((r) => r.validationStatus === 'RESEARCHED').length;
  const pendingCount = rules.filter((r) => r.validationStatus === 'EXPERT_REVIEW_PENDING').length;

  const filteredRules = rules.filter((r) => {
    if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && r.validationStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.ruleId.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.possibleFaults.some((f) => f.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Knowledge Base Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-[#0B5D44]" />
            <h2 className="text-lg font-bold text-slate-900">Knowledge Base: 50 Diagnostic Rules</h2>
          </div>
          <p className="text-xs text-slate-500">
            Authoritative IF–THEN diagnostic rules catalog with technical citations, OEM criteria, and validation history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdminUnlocked ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              Admin Authorized
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Admin Passkey
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Validation Status Statistics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm text-center">
          <span className="text-2xl font-black text-slate-900 block tabular-nums">{totalCount}</span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Rules</span>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 shadow-sm text-center">
          <span className="text-2xl font-black text-emerald-800 block tabular-nums">{validatedCount}</span>
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Validated Rules</span>
        </div>
        <div className="rounded-2xl bg-purple-50 p-4 border border-purple-200 shadow-sm text-center">
          <span className="text-2xl font-black text-purple-800 block tabular-nums">{researchedCount}</span>
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Researched</span>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 shadow-sm text-center">
          <span className="text-2xl font-black text-amber-800 block tabular-nums">{pendingCount}</span>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Review Pending</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by rule ID (e.g. EL01, TH06), title, fault, or symptom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-[#0B5D44] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ValidationStatus | 'ALL')}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white focus:border-[#0B5D44] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="VALIDATED">VALIDATED Only</option>
              <option value="RESEARCHED">RESEARCHED Only</option>
              <option value="EXPERT_REVIEW_PENDING">EXPERT_REVIEW_PENDING Only</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-[#0B5D44] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Catalog Listing */}
      {loading ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
          <p className="text-xs font-semibold text-slate-500">Loading diagnostic rules…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRules.map((rule) => {
            return (
              <div
                key={rule.ruleId}
                className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
                  rule.enabled ? 'border-slate-200/80 hover:border-slate-300' : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-[#0B5D44] bg-[#E8F5EE] px-2 py-0.5 rounded">
                        {rule.ruleId}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {rule.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          rule.validationStatus === 'VALIDATED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rule.validationStatus === 'RESEARCHED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rule.validationStatus}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          rule.safetySeverity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : rule.safetySeverity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rule.safetySeverity} SEVERITY
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{rule.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{rule.description}</p>
                  </div>

                  {isAdminUnlocked && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleRuleEnabled(rule)}
                        className={`rounded-xl px-3 py-1 text-xs font-bold transition-colors ${
                          rule.enabled
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(rule)}
                        className="rounded-xl bg-[#0B5D44] px-3.5 py-1 text-xs font-bold text-white hover:bg-[#084533] transition-colors"
                      >
                        Review Rule
                      </button>
                    </div>
                  )}
                </div>

                {/* Compatibility Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Powertrains:</span>
                  {rule.applicablePowertrains.map((p) => (
                    <span key={p} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded capitalize">
                      {p}
                    </span>
                  ))}
                  {rule.applicableTransmissions && (
                    <>
                      <span className="font-semibold text-slate-700 ml-2">Transmissions:</span>
                      {rule.applicableTransmissions.map((t) => (
                        <span key={t} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded capitalize">
                          {t.replace('_', ' ')}
                        </span>
                      ))}
                    </>
                  )}
                </div>

                {/* Technical Sources & Citations */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs space-y-2">
                  <span className="font-bold text-slate-700 block flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0B5D44]" />
                    Authoritative Research & OEM Citations:
                  </span>
                  <div className="space-y-1 pl-1">
                    {rule.sourceReferences.map((ref) => (
                      <div key={ref.id} className="text-slate-600">
                        <strong className="text-slate-800">{ref.sourceTitle}</strong> — {ref.documentSection}
                        <span className="text-[10px] text-slate-400 font-mono ml-2">[{ref.sourceType}]</span>
                      </div>
                    ))}
                  </div>

                  {rule.reviewedBy && (
                    <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200/60 flex items-center justify-between">
                      <span>
                        Reviewed by: <strong className="text-slate-700">{rule.reviewedBy}</strong> on{' '}
                        {rule.reviewedAt ? new Date(rule.reviewedAt).toLocaleDateString() : 'N/A'}
                      </span>
                      <span className="font-mono">v{rule.version}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Passkey Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setShowAdminModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Administrator Authorization</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter administrative security key to propose, edit, review, and validate rules.
            </p>
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input
                type="password"
                placeholder="Enter admin passkey..."
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#0B5D44] focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-[#0B5D44] py-2 text-xs font-bold text-white hover:bg-[#084533] transition-colors"
              >
                Authenticate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Expert Review Modal */}
      {reviewingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setReviewingRule(null)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Automotive Expert Review: {reviewingRule.ruleId}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{reviewingRule.title}</p>

            <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reviewer Name</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-[#0B5D44] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reviewer Credentials / Role</label>
                <input
                  type="text"
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-[#0B5D44] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Updated Validation Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as ValidationStatus)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-[#0B5D44] focus:outline-none bg-white font-semibold"
                >
                  <option value="VALIDATED">VALIDATED (Passed technical criteria & peer review)</option>
                  <option value="RESEARCHED">RESEARCHED (Technical source established)</option>
                  <option value="EXPERT_REVIEW_PENDING">EXPERT_REVIEW_PENDING (Awaiting domain expert)</option>
                  <option value="REJECTED">REJECTED (Inaccurate or obsolete)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Review Comments / Citations</label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Detail OEM manual cross-reference, test verification, or safety considerations..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-[#0B5D44] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingRule(null)}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReview}
                  className="rounded-xl bg-[#0B5D44] px-4 py-1.5 font-bold text-white hover:bg-[#084533] disabled:opacity-50"
                >
                  {savingReview ? 'Saving…' : 'Record Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
