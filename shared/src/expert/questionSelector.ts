import type {
  DiagnosticRule,
  DiagnosticHypothesis,
  Question,
  VehicleEntity,
  WorkingMemory,
} from './types.js';
import { QUESTIONS_CATALOG } from './questionsData.js';

export function selectNextQuestions(
  hypotheses: DiagnosticHypothesis[],
  rules: DiagnosticRule[],
  memory: WorkingMemory,
  vehicle: VehicleEntity,
  maxQuestions = 3
): Question[] {
  // Find questions already answered
  const answeredFactCodes = new Set(Object.keys(memory));

  // Collect candidate questions from the top competing hypotheses that are not yet answered
  const questionScores = new Map<string, number>();

  for (let i = 0; i < hypotheses.length; i++) {
    const hypothesis = hypotheses[i];
    // Competing candidates with some evidence or high severity
    if (hypothesis.confidence === 'INSUFFICIENT' && hypothesis.ruleMatchScore === 0) {
      continue;
    }

    const rule = rules.find((r) => r.ruleId === hypothesis.ruleId);
    if (!rule) continue;

    // Weight higher ranked hypotheses more heavily
    const rankWeight = Math.max(1, 10 - i);

    for (const qId of rule.suggestedFollowUpQuestions) {
      const currentScore = questionScores.get(qId) ?? 0;
      questionScores.set(qId, currentScore + rankWeight);
    }
  }

  // Filter questions
  const selected: Question[] = [];
  const sortedQuestionIds = [...questionScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([qId]) => qId);

  // If no hypothesis has suggested questions, fall back to questions relevant to vehicle category
  const candidatePool = sortedQuestionIds.length > 0
    ? sortedQuestionIds
    : QUESTIONS_CATALOG.map((q) => q.id);

  for (const qId of candidatePool) {
    if (selected.length >= maxQuestions) break;

    const question = QUESTIONS_CATALOG.find((q) => q.id === qId);
    if (!question) continue;

    // Check if already answered in working memory
    if (answeredFactCodes.has(question.factCode)) continue;

    // Check powertrain compatibility
    if (
      question.applicablePowertrains &&
      !question.applicablePowertrains.includes(vehicle.powertrain)
    ) {
      continue;
    }

    // Check transmission compatibility
    if (
      question.applicableTransmissions &&
      !question.applicableTransmissions.includes(vehicle.transmission)
    ) {
      continue;
    }

    // Avoid duplicate selections
    if (!selected.some((q) => q.id === question.id)) {
      selected.push(question);
    }
  }

  return selected;
}
