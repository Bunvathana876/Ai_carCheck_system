import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Play,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react';
import type {
  DiagnosisSession,
  DiagnosticHypothesis,
  InferenceResult,
  Question,
  RuleCategory,
  Symptom,
  VehicleEntity,
} from '@voltguard/shared/expert';
import { api } from '../lib/api';

interface ExpertDiagnosisViewProps {
  vehicles: VehicleEntity[];
  activeVehicle: VehicleEntity | null;
  onSelectVehicle: (vehicle: VehicleEntity) => void;
  onOpenAddVehicleModal: () => void;
}

const CATEGORIES: { id: RuleCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'ELECTRICAL', label: 'Electrical' },
  { id: 'GASOLINE_ENGINE', label: 'Gas Engine' },
  { id: 'COOLING_LUBRICATION', label: 'Cooling & Oil' },
  { id: 'BRAKING', label: 'Brakes' },
  { id: 'STEERING_SUSPENSION', label: 'Steering & Tires' },
  { id: 'TRANSMISSION', label: 'Transmission' },
  { id: 'DIESEL_ENGINE', label: 'Diesel' },
  { id: 'EV_HYBRID', label: 'EV & Hybrid' },
];

export function ExpertDiagnosisView({
  vehicles,
  activeVehicle,
  onSelectVehicle,
  onOpenAddVehicleModal,
}: ExpertDiagnosisViewProps) {
  // Symptoms and selection
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [symptomsLoaded, setSymptomsLoaded] = useState(false);
  const [selectedSymptomCodes, setSelectedSymptomCodes] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<RuleCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Diagnosis session state
  const [currentSession, setCurrentSession] = useState<DiagnosisSession | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedOptionValue, setSelectedOptionValue] = useState<string | number | boolean | null>(null);
  const [numericAnswer, setNumericAnswer] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [expandedHypotheses, setExpandedHypotheses] = useState<Record<string, boolean>>({});
  const [showTrace, setShowTrace] = useState(false);

  // Load symptoms on mount
  useState(() => {
    if (!symptomsLoaded) {
      api.symptoms
        .list()
        .then((data) => {
          setSymptoms(data);
          setSymptomsLoaded(true);
        })
        .catch((err) => setError(err.message));
    }
  });

  // Filter symptoms by category, search query, and vehicle compatibility
  const filteredSymptoms = useMemo(() => {
    return symptoms.filter((sym) => {
      if (categoryFilter !== 'ALL' && sym.category !== categoryFilter) return false;
      if (activeVehicle && sym.applicablePowertrains && !sym.applicablePowertrains.includes(activeVehicle.powertrain)) {
        return false;
      }
      if (
        activeVehicle &&
        sym.applicableTransmissions &&
        !sym.applicableTransmissions.includes(activeVehicle.transmission)
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return sym.name.toLowerCase().includes(q) || sym.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [symptoms, categoryFilter, activeVehicle, searchQuery]);

  const toggleSymptom = (code: string) => {
    setSelectedSymptomCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  // Start diagnosis session
  const handleStartDiagnosis = async () => {
    if (!activeVehicle) {
      setError('Please select or register a vehicle first.');
      return;
    }
    if (selectedSymptomCodes.size === 0) {
      setError('Please select at least one symptom.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const session = await api.diagnoses.start(activeVehicle.id, Array.from(selectedSymptomCodes));
      setCurrentSession(session);
      setActiveQuestionIndex(0);
      setSelectedOptionValue(null);
      setNumericAnswer('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start diagnosis.');
    } finally {
      setBusy(false);
    }
  };

  // Submit answer to follow-up question
  const handleSubmitAnswer = async (question: Question) => {
    if (!currentSession) return;
    let answerValue: string | number | boolean | null = null;
    let unit: string | undefined = undefined;

    if (question.type === 'number') {
      if (numericAnswer.trim() === '') {
        setError('Please enter a measurement number.');
        return;
      }
      answerValue = Number(numericAnswer);
      unit = question.unit;
    } else {
      if (selectedOptionValue === null) {
        setError('Please select an option.');
        return;
      }
      answerValue = selectedOptionValue;
    }

    setError(null);
    setBusy(true);
    try {
      const updated = await api.diagnoses.answer(currentSession.id, question.factCode, answerValue, unit);
      setCurrentSession(updated);
      setSelectedOptionValue(null);
      setNumericAnswer('');
      // Move to next question if available
      const remainingQuestions = updated.latestResult?.suggestedQuestions ?? [];
      if (activeQuestionIndex >= remainingQuestions.length) {
        setActiveQuestionIndex(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer.');
    } finally {
      setBusy(false);
    }
  };

  const handleSkipQuestion = () => {
    const totalQ = currentSession?.latestResult?.suggestedQuestions.length ?? 0;
    if (activeQuestionIndex + 1 < totalQ) {
      setActiveQuestionIndex((prev) => prev + 1);
      setSelectedOptionValue(null);
      setNumericAnswer('');
    } else {
      // Force completion / evaluation
      if (currentSession) {
        setBusy(true);
        api.diagnoses
          .results(currentSession.id)
          .then((res) => {
            setCurrentSession((prev) => (prev ? { ...prev, latestResult: res, status: 'COMPLETED' } : null));
          })
          .catch((err) => setError(err.message))
          .finally(() => setBusy(false));
      }
    }
  };

  const handleResetDiagnosis = () => {
    setCurrentSession(null);
    setSelectedSymptomCodes(new Set());
    setActiveQuestionIndex(0);
    setError(null);
  };

  const toggleHypothesisExpand = (ruleId: string) => {
    setExpandedHypotheses((prev) => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  const latestResult: InferenceResult | undefined = currentSession?.latestResult;
  const questionsList: Question[] = latestResult?.suggestedQuestions ?? [];
  const currentQuestion: Question | undefined = questionsList[activeQuestionIndex];

  // Are we showing questions? Yes if session active, not safety halted, and questions remain
  const showingQuestions =
    currentSession &&
    currentSession.status === 'ACTIVE' &&
    latestResult?.status !== 'SAFETY_HALTED' &&
    questionsList.length > 0;

  // Are we showing final results? Yes if session completed, safety halted, or no questions remain
  const showingResults =
    currentSession &&
    (currentSession.status === 'COMPLETED' ||
      latestResult?.status === 'SAFETY_HALTED' ||
      questionsList.length === 0);

  return (
    <div className="space-y-6">
      {/* Top Vehicle Selector Bar */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E8F5EE] text-[#0B5D44] flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Active Test Vehicle</h2>
                {activeVehicle && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 capitalize">
                    {activeVehicle.powertrain} · {activeVehicle.transmission.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {activeVehicle
                  ? `${activeVehicle.year} ${activeVehicle.manufacturer} ${activeVehicle.model} · ${activeVehicle.engineType} (${activeVehicle.mileageKm.toLocaleString()} km)`
                  : 'Select a vehicle to ensure accurate diagnostic rule matching'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeVehicle?.id ?? ''}
              onChange={(e) => {
                const found = vehicles.find((v) => v.id === e.target.value);
                if (found) onSelectVehicle(found);
              }}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:border-[#0B5D44] focus:outline-none"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.manufacturer} {v.model} ({v.powertrain})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onOpenAddVehicleModal}
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              + Add Vehicle
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* PHASE 1: Symptom Selection */}
      {!currentSession && (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Step 1: Select Observed Symptoms</h3>
              <p className="text-xs text-slate-500">
                Choose the symptoms reported by the driver or observed in the shop to initialize working memory.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter symptoms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-[#0B5D44] focus:outline-none w-48 sm:w-64"
                />
              </div>

              <button
                type="button"
                disabled={busy || selectedSymptomCodes.size === 0}
                onClick={handleStartDiagnosis}
                className="flex items-center gap-2 rounded-xl bg-[#0B5D44] px-5 py-2 text-xs font-bold text-white hover:bg-[#084533] disabled:opacity-50 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                {busy ? 'Evaluating…' : `Start Diagnosis (${selectedSymptomCodes.size})`}
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 mb-6 pb-2 border-b border-slate-100">
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

          {/* Symptoms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSymptoms.map((sym) => {
              const isSelected = selectedSymptomCodes.has(sym.code);
              return (
                <label
                  key={sym.id}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#0B5D44] bg-[#F0F8F4] shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSymptom(sym.code)}
                    className="mt-0.5 rounded border-slate-300 text-[#0B5D44] focus:ring-[#0B5D44]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-900">{sym.name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          sym.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : sym.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {sym.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{sym.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* PHASE 2: Step-by-Step Diagnostic Questions */}
      {showingQuestions && currentQuestion && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B5D44]">
              Diagnostic Follow-Up Question {activeQuestionIndex + 1} of {questionsList.length}
            </span>
            <button
              type="button"
              onClick={handleSkipQuestion}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Skip this question →
            </button>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">{currentQuestion.text}</h3>

          {currentQuestion.helpText && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {currentQuestion.helpText}
            </p>
          )}

          {currentQuestion.safetyWarning && (
            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 font-medium">
                <strong className="block font-bold mb-0.5">Automotive Safety Warning:</strong>
                {currentQuestion.safetyWarning}
              </div>
            </div>
          )}

          {/* Options / Input Form */}
          <div className="my-6">
            {currentQuestion.type === 'number' ? (
              <div className="max-w-xs">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Measured Value ({currentQuestion.unit})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={numericAnswer}
                    onChange={(e) => setNumericAnswer(e.target.value)}
                    placeholder={`e.g. 12.4`}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0B5D44] focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-600">{currentQuestion.unit}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {currentQuestion.options?.map((option, idx) => {
                  const isChecked = selectedOptionValue === option.value;
                  return (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#0B5D44] bg-[#F0F8F4] shadow-sm font-semibold text-slate-900'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="question_opt"
                        checked={isChecked}
                        onChange={() => setSelectedOptionValue(option.value)}
                        className="text-[#0B5D44] focus:ring-[#0B5D44]"
                      />
                      <span className="text-xs sm:text-sm">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetDiagnosis}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start Over
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => handleSubmitAnswer(currentQuestion)}
              className="rounded-xl bg-[#0B5D44] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#084533] disabled:opacity-50 transition-colors shadow-sm"
            >
              {busy ? 'Evaluating Inference…' : 'Submit Diagnostic Answer'}
            </button>
          </div>
        </section>
      )}

      {/* PHASE 3: Diagnostic Results & Ranked Hypotheses */}
      {showingResults && latestResult && (
        <section className="space-y-6">
          {/* Safety Alerts Banner */}
          {latestResult.safetyAlerts.length > 0 && (
            <div className="space-y-3">
              {latestResult.safetyAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`rounded-3xl p-6 border shadow-sm ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50 border-red-300 text-red-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <ShieldAlert
                      className={`w-7 h-7 shrink-0 ${
                        alert.severity === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'
                      }`}
                    />
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[11px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                            alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                          }`}
                        >
                          {alert.severity} SAFETY OVERRIDE
                        </span>
                        {!alert.safeToDrive && (
                          <span className="text-[11px] font-bold bg-black text-white px-2 py-0.5 rounded">
                            DO NOT DRIVE VEHICLE
                          </span>
                        )}
                        {alert.emergencyCallRecommended && (
                          <span className="text-[11px] font-bold bg-red-700 text-white px-2 py-0.5 rounded animate-pulse">
                            CALL EMERGENCY SERVICES (911 / 112)
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold">{alert.headline}</h3>

                      <ul className="text-xs space-y-1 list-disc list-inside opacity-90 font-medium">
                        {alert.instructions.map((inst, i) => (
                          <li key={i}>{inst}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Summary Header */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-[#0B5D44]" />
                <h3 className="text-lg font-bold text-slate-900">Diagnosis Findings & Hypotheses</h3>
              </div>
              <p className="text-xs text-slate-500">
                Forward-chaining inference evaluated candidate rules against {Object.keys(currentSession.facts).length} established facts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTrace((prev) => !prev)}
                className="rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                {showTrace ? 'Hide Inference Trace' : 'View Inference Trace'}
              </button>

              <button
                type="button"
                onClick={handleResetDiagnosis}
                className="rounded-xl bg-[#0B5D44] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#084533] transition-colors"
              >
                Start New Diagnosis
              </button>
            </div>
          </div>

          {/* Collapsible Trace Box */}
          {showTrace && (
            <div className="rounded-3xl bg-slate-950 p-5 text-slate-200 font-mono text-[11px] overflow-x-auto shadow-inner border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Deterministic Inference Engine Trace Log
              </h4>
              <div className="space-y-1">
                {latestResult.inferenceTrace.map((line, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ranked Hypotheses Cards */}
          <div className="space-y-4">
            {latestResult.hypotheses.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
                <p className="text-sm text-slate-600 font-semibold mb-1">No conclusive diagnostic rule matched.</p>
                <p className="text-xs text-slate-400">
                  Try providing additional symptoms or verifying measurements with specialized workshop scan equipment.
                </p>
              </div>
            ) : (
              latestResult.hypotheses.map((hyp) => {
                const isExpanded = expandedHypotheses[hyp.ruleId] ?? false;

                const confidenceColors = {
                  STRONG: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  MODERATE: 'bg-blue-100 text-blue-800 border-blue-300',
                  LIMITED: 'bg-amber-100 text-amber-800 border-amber-300',
                  INSUFFICIENT: 'bg-slate-100 text-slate-600 border-slate-300',
                };

                return (
                  <article
                    key={hyp.ruleId}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 transition-all hover:border-slate-300"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-[#0B5D44] bg-[#E8F5EE] px-2 py-0.5 rounded">
                            {hyp.ruleId}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                              confidenceColors[hyp.confidence]
                            }`}
                          >
                            {hyp.confidence} EVIDENCE
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {hyp.validationStatus}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{hyp.ruleTitle}</h4>
                        <p className="text-xs text-slate-500 font-medium">{hyp.primaryFault.name}</p>
                      </div>

                      {/* Rule-Match Score */}
                      <div className="text-right">
                        <div className="text-xl font-black text-slate-900 tabular-nums">
                          {hyp.ruleMatchScore}%
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                          Rule-Match Score
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar for match score */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full transition-all duration-500 ${
                          hyp.confidence === 'STRONG'
                            ? 'bg-emerald-600'
                            : hyp.confidence === 'MODERATE'
                            ? 'bg-blue-600'
                            : hyp.confidence === 'LIMITED'
                            ? 'bg-amber-500'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${hyp.ruleMatchScore}%` }}
                      />
                    </div>

                    {/* Brief primary description */}
                    <p className="text-xs text-slate-600 mb-4">{hyp.primaryFault.description}</p>

                    {/* Expand/Collapse Accordion Button */}
                    <button
                      type="button"
                      onClick={() => toggleHypothesisExpand(hyp.ruleId)}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#0B5D44] hover:text-[#084533] transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          Hide Evidence & Diagnostic Checks <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Inspect Evidence, Alternatives & Recommended Checks <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-slate-100 space-y-4 text-xs">
                        {/* Confirmed Supporting Evidence */}
                        {hyp.supportingEvidence.length > 0 && (
                          <div>
                            <strong className="block text-slate-800 font-bold mb-1.5 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Confirmed Supporting Evidence:
                            </strong>
                            <ul className="space-y-1 list-disc list-inside text-slate-600 pl-1">
                              {hyp.supportingEvidence.map((ev, i) => (
                                <li key={i}>{ev}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Contradictory Evidence */}
                        {hyp.contradictoryEvidence.length > 0 && (
                          <div>
                            <strong className="block text-red-700 font-bold mb-1.5 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              Contradictory Evidence:
                            </strong>
                            <ul className="space-y-1 list-disc list-inside text-red-600 pl-1">
                              {hyp.contradictoryEvidence.map((ev, i) => (
                                <li key={i}>{ev}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Missing Conditions */}
                        {hyp.missingEvidence.length > 0 && (
                          <div>
                            <strong className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                              Missing Verification Facts:
                            </strong>
                            <ul className="space-y-1 list-disc list-inside text-slate-500 pl-1">
                              {hyp.missingEvidence.map((ev, i) => (
                                <li key={i}>{ev}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Alternative Explanations */}
                        {hyp.alternativeExplanations.length > 0 && (
                          <div>
                            <strong className="block text-slate-800 font-bold mb-1.5">
                              Alternative Competing Causes Considered:
                            </strong>
                            <ul className="space-y-1 list-disc list-inside text-slate-600 pl-1">
                              {hyp.alternativeExplanations.map((alt, i) => (
                                <li key={i}>{alt}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommended Next Checks */}
                        {hyp.recommendedChecks.length > 0 && (
                          <div className="rounded-2xl bg-[#F0F8F4] p-4 border border-[#0B5D44]/20">
                            <strong className="block text-[#0B5D44] font-bold mb-1.5 flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-[#0B5D44]" />
                              Recommended Next Workshop Diagnostic Checks:
                            </strong>
                            <ul className="space-y-1 list-disc list-inside text-slate-700 font-medium pl-1">
                              {hyp.recommendedChecks.map((check, i) => (
                                <li key={i}>{check}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}
