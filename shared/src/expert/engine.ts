import type {
  DiagnosticHypothesis,
  DiagnosticRule,
  FactCondition,
  InferenceResult,
  RuleMatchEvidence,
  VehicleEntity,
  WorkingMemory,
} from './types.js';
import { evaluateCondition } from './conditionEvaluator.js';
import { evaluateSafetyConditions } from './safetyEngine.js';
import { buildExplanation } from './explanationEngine.js';
import { selectNextQuestions } from './questionSelector.js';

export function runInference(
  vehicle: VehicleEntity,
  memory: WorkingMemory,
  rules: DiagnosticRule[],
  sessionId = 'sess-direct'
): InferenceResult {
  const evaluatedAt = new Date().toISOString();
  const inferenceTrace: string[] = [];

  inferenceTrace.push(
    `[INIT] Starting forward chaining for vehicle ${vehicle.year} ${vehicle.manufacturer} ${vehicle.model} (${vehicle.powertrain}, ${vehicle.transmission}).`
  );
  inferenceTrace.push(`[MEMORY] Working memory holds ${Object.keys(memory).length} facts.`);

  // 1. Safety Engine Evaluation
  const safetyAlerts = evaluateSafetyConditions(memory);
  if (safetyAlerts.length > 0) {
    inferenceTrace.push(
      `[SAFETY] Triggered ${safetyAlerts.length} urgent safety conditions: ${safetyAlerts.map((a) => a.headline).join('; ')}`
    );
  }

  const hypotheses: DiagnosticHypothesis[] = [];

  // 2. Evaluate Diagnostic Rules
  for (const rule of rules) {
    if (!rule.enabled) {
      inferenceTrace.push(`[SKIP] Rule ${rule.ruleId} is disabled.`);
      continue;
    }

    // Vehicle Powertrain Compatibility
    if (!rule.applicablePowertrains.includes(vehicle.powertrain)) {
      inferenceTrace.push(
        `[INCOMPATIBLE] Rule ${rule.ruleId} (${rule.title}) does not apply to ${vehicle.powertrain} powertrain.`
      );
      continue;
    }

    // Vehicle Transmission Compatibility
    if (
      rule.applicableTransmissions &&
      !rule.applicableTransmissions.includes(vehicle.transmission)
    ) {
      inferenceTrace.push(
        `[INCOMPATIBLE] Rule ${rule.ruleId} does not apply to ${vehicle.transmission} transmission.`
      );
      continue;
    }

    // Normalize required conditions to array
    const requiredList: FactCondition[] = Array.isArray(rule.requiredConditions)
      ? rule.requiredConditions
      : rule.requiredConditions.conditions;

    const supportingList: FactCondition[] = rule.optionalSupportingConditions ?? [];
    const contradictoryList: FactCondition[] = rule.contradictoryConditions ?? [];

    const evidence: RuleMatchEvidence = {
      satisfiedRequired: [],
      unsatisfiedRequired: [],
      unknownRequired: [],
      satisfiedSupporting: [],
      contradictedConditions: [],
    };

    // Check contradictory conditions first
    let isContradicted = false;
    for (const cond of contradictoryList) {
      const evaluation = evaluateCondition(cond, memory);
      if (evaluation.factFound && evaluation.isSatisfied) {
        evidence.contradictedConditions.push(evaluation);
        isContradicted = true;
      }
    }

    if (isContradicted) {
      inferenceTrace.push(
        `[CONTRADICTED] Rule ${rule.ruleId} contradicted by observed fact: ${evidence.contradictedConditions.map((c) => c.condition.factCode).join(', ')}`
      );
      // We still record contradicted hypothesis with 0 score for explanation transparency
      const explanation = buildExplanation(rule, evidence);
      hypotheses.push({
        ruleId: rule.ruleId,
        ruleTitle: rule.title,
        category: rule.category,
        confidence: 'INSUFFICIENT',
        ruleMatchScore: 0,
        safetySeverity: rule.safetySeverity,
        safetyWarning: rule.safetyGuidance,
        primaryFault: rule.possibleFaults[0],
        supportingEvidence: explanation.supporting,
        contradictoryEvidence: explanation.contradictory,
        missingEvidence: explanation.missing,
        alternativeExplanations: explanation.alternatives,
        recommendedChecks: explanation.nextChecks,
        evidenceSummary: evidence,
        validationStatus: rule.validationStatus,
      });
      continue;
    }

    // Check required conditions
    for (const cond of requiredList) {
      const evaluation = evaluateCondition(cond, memory);
      if (!evaluation.factFound) {
        evidence.unknownRequired.push(evaluation);
      } else if (evaluation.isSatisfied) {
        evidence.satisfiedRequired.push(evaluation);
      } else {
        evidence.unsatisfiedRequired.push(evaluation);
      }
    }

    // Check optional supporting conditions
    for (const cond of supportingList) {
      const evaluation = evaluateCondition(cond, memory);
      if (evaluation.factFound && evaluation.isSatisfied) {
        evidence.satisfiedSupporting.push(evaluation);
      }
    }

    // Determine Match Score & Confidence
    let ruleMatchScore = 0;
    let confidence: 'STRONG' | 'MODERATE' | 'LIMITED' | 'INSUFFICIENT' = 'INSUFFICIENT';

    const totalRequired = requiredList.length;
    const satisfiedReqCount = evidence.satisfiedRequired.length;
    const unsatisfiedReqCount = evidence.unsatisfiedRequired.length;
    const unknownReqCount = evidence.unknownRequired.length;
    const satisfiedSupCount = evidence.satisfiedSupporting.length;
    const totalSupCount = Math.max(1, supportingList.length);

    if (unsatisfiedReqCount > 0) {
      // Known violation of a required condition
      ruleMatchScore = 0;
      confidence = 'INSUFFICIENT';
      inferenceTrace.push(
        `[FAIL] Rule ${rule.ruleId} failed required conditions: ${evidence.unsatisfiedRequired.map((c) => c.condition.factCode).join(', ')}`
      );
    } else if (totalRequired > 0 && satisfiedReqCount === totalRequired) {
      // All required conditions met!
      const reqWeight = 70;
      const supWeight = 30 * (satisfiedSupCount / totalSupCount);
      ruleMatchScore = Math.min(100, Math.round(reqWeight + supWeight));

      if (ruleMatchScore >= 85 && satisfiedSupCount >= 1) {
        confidence = 'STRONG';
      } else if (ruleMatchScore >= 65) {
        confidence = 'MODERATE';
      } else {
        confidence = 'LIMITED';
      }

      inferenceTrace.push(
        `[MATCH] Rule ${rule.ruleId} matched with ${confidence} confidence (score: ${ruleMatchScore}%).`
      );
    } else if (satisfiedReqCount > 0 && unknownReqCount > 0) {
      // Partial match with some unknown conditions
      const partialRatio = satisfiedReqCount / totalRequired;
      ruleMatchScore = Math.round(partialRatio * 50 + (satisfiedSupCount / totalSupCount) * 20);
      confidence = ruleMatchScore >= 45 ? 'LIMITED' : 'INSUFFICIENT';
      inferenceTrace.push(
        `[PARTIAL] Rule ${rule.ruleId} has ${satisfiedReqCount}/${totalRequired} required facts confirmed; ${unknownReqCount} unknown.`
      );
    }

    if (ruleMatchScore > 0 || satisfiedReqCount > 0 || isContradicted) {
      const explanation = buildExplanation(rule, evidence);
      hypotheses.push({
        ruleId: rule.ruleId,
        ruleTitle: rule.title,
        category: rule.category,
        confidence,
        ruleMatchScore,
        safetySeverity: rule.safetySeverity,
        safetyWarning: rule.safetyGuidance,
        primaryFault: rule.possibleFaults[0],
        supportingEvidence: explanation.supporting,
        contradictoryEvidence: explanation.contradictory,
        missingEvidence: explanation.missing,
        alternativeExplanations: explanation.alternatives,
        recommendedChecks: explanation.nextChecks,
        evidenceSummary: evidence,
        validationStatus: rule.validationStatus,
      });
    }
  }

  // Rank hypotheses:
  // First by safety severity if critical/high, then by ruleMatchScore descending
  const severityRank: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    INFO: 0,
  };

  hypotheses.sort((a, b) => {
    // If one is critical and matched, prioritize safety
    if (a.safetySeverity === 'CRITICAL' && a.ruleMatchScore > 0 && b.safetySeverity !== 'CRITICAL') {
      return -1;
    }
    if (b.safetySeverity === 'CRITICAL' && b.ruleMatchScore > 0 && a.safetySeverity !== 'CRITICAL') {
      return 1;
    }
    // Otherwise sort by match score
    if (b.ruleMatchScore !== a.ruleMatchScore) {
      return b.ruleMatchScore - a.ruleMatchScore;
    }
    // Then by severity
    return severityRank[b.safetySeverity] - severityRank[a.safetySeverity];
  });

  // Select next questions
  const suggestedQuestions = selectNextQuestions(hypotheses, rules, memory, vehicle, 4);

  // Determine overall status
  let status: 'IN_PROGRESS' | 'DIAGNOSIS_REACHED' | 'SAFETY_HALTED' | 'INCONCLUSIVE' = 'IN_PROGRESS';

  const hasCriticalSafety = safetyAlerts.some((a) => a.severity === 'CRITICAL');
  const hasStrongHypothesis = hypotheses.some((h) => h.confidence === 'STRONG');

  if (hasCriticalSafety) {
    status = 'SAFETY_HALTED';
  } else if (hasStrongHypothesis || (hypotheses.length > 0 && suggestedQuestions.length === 0)) {
    status = 'DIAGNOSIS_REACHED';
  } else if (hypotheses.length === 0 && suggestedQuestions.length === 0) {
    status = 'INCONCLUSIVE';
  }

  inferenceTrace.push(`[STATUS] Inference completed with status ${status}.`);

  return {
    sessionId,
    vehicleId: vehicle.id,
    evaluatedAt,
    safetyAlerts,
    hypotheses,
    suggestedQuestions,
    inferenceTrace,
    status,
  };
}
