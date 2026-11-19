import type { FactCondition, WorkingMemory, ConditionEvaluation } from './types.js';

export function evaluateCondition(condition: FactCondition, memory: WorkingMemory): ConditionEvaluation {
  const fact = memory[condition.factCode];
  if (!fact || fact.value === 'unknown' || fact.value === undefined || fact.value === null) {
    return {
      condition,
      isSatisfied: false,
      factFound: false,
    };
  }

  const actualValue = fact.value;
  const operator = condition.operator ?? '==';

  let isSatisfied = false;

  switch (operator) {
    case '==':
      isSatisfied = actualValue === condition.expectedValue;
      break;

    case '!=':
      isSatisfied = actualValue !== condition.expectedValue;
      break;

    case '>':
      if (typeof actualValue === 'number' && typeof condition.expectedValue === 'number') {
        isSatisfied = actualValue > condition.expectedValue;
      }
      break;

    case '<':
      if (typeof actualValue === 'number' && typeof condition.expectedValue === 'number') {
        isSatisfied = actualValue < condition.expectedValue;
      }
      break;

    case '>=':
      if (typeof actualValue === 'number' && typeof condition.expectedValue === 'number') {
        isSatisfied = actualValue >= condition.expectedValue;
      }
      break;

    case '<=':
      if (typeof actualValue === 'number' && typeof condition.expectedValue === 'number') {
        isSatisfied = actualValue <= condition.expectedValue;
      }
      break;

    case 'between':
      if (typeof actualValue === 'number' && condition.range) {
        const [min, max] = condition.range;
        isSatisfied = actualValue >= min && actualValue <= max;
      }
      break;

    case 'in':
      if (Array.isArray(condition.expectedValue)) {
        isSatisfied = (condition.expectedValue as unknown[]).includes(actualValue);
      } else {
        isSatisfied = actualValue === condition.expectedValue;
      }
      break;

    default:
      isSatisfied = false;
  }

  return {
    condition,
    isSatisfied,
    factFound: true,
    actualValue,
  };
}
