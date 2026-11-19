import type { DiagnosticRule, RuleMatchEvidence } from './types.js';

export function buildExplanation(
  rule: DiagnosticRule,
  evidence: RuleMatchEvidence
): {
  supporting: string[];
  contradictory: string[];
  missing: string[];
  alternatives: string[];
  nextChecks: string[];
} {
  const supporting: string[] = [];
  const contradictory: string[] = [];
  const missing: string[] = [];

  // 1. Supporting evidence from required conditions
  for (const evalItem of evidence.satisfiedRequired) {
    const op = evalItem.condition.operator ? ` ${evalItem.condition.operator} ` : ' = ';
    supporting.push(
      `Confirmed: ${evalItem.condition.factCode}${op}${String(evalItem.condition.expectedValue ?? '')} (Observed value: ${String(evalItem.actualValue)})`
    );
  }

  // 2. Supporting evidence from optional conditions
  for (const evalItem of evidence.satisfiedSupporting) {
    const op = evalItem.condition.operator ? ` ${evalItem.condition.operator} ` : ' = ';
    supporting.push(
      `Corroborating: ${evalItem.condition.factCode}${op}${String(evalItem.condition.expectedValue ?? '')} (Observed value: ${String(evalItem.actualValue)})`
    );
  }

  // 3. Contradictory evidence
  for (const evalItem of evidence.contradictedConditions) {
    contradictory.push(
      `Contradicted by: ${evalItem.condition.factCode} observed as ${String(evalItem.actualValue)} (expected: ${evalItem.condition.operator ?? '=='} ${String(evalItem.condition.expectedValue ?? '')})`
    );
  }

  // 4. Missing required evidence
  for (const evalItem of evidence.unknownRequired) {
    const op = evalItem.condition.operator ? ` ${evalItem.condition.operator} ` : ' = ';
    missing.push(
      `Unconfirmed fact: ${evalItem.condition.factCode}${op}${String(evalItem.condition.expectedValue ?? '')}`
    );
  }

  return {
    supporting,
    contradictory,
    missing,
    alternatives: rule.alternativeExplanations,
    nextChecks: rule.recommendedDiagnosticChecks,
  };
}
