export type PowertrainType = 'gasoline' | 'diesel' | 'hybrid' | 'electric';
export type TransmissionType = 'automatic' | 'manual' | 'cvt' | 'direct_drive';

export type RuleCategory =
  | 'ELECTRICAL'
  | 'GASOLINE_ENGINE'
  | 'COOLING_LUBRICATION'
  | 'BRAKING'
  | 'STEERING_SUSPENSION'
  | 'TRANSMISSION'
  | 'DIESEL_ENGINE'
  | 'EV_HYBRID';

export type SafetySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ValidationStatus =
  | 'DRAFT'
  | 'RESEARCHED'
  | 'EXPERT_REVIEW_PENDING'
  | 'VALIDATED'
  | 'REJECTED';

export type ConfidenceLevel =
  | 'STRONG'
  | 'MODERATE'
  | 'LIMITED'
  | 'INSUFFICIENT';

export type ComparisonOperator =
  | '>'
  | '<'
  | '>='
  | '<='
  | '=='
  | '!='
  | 'between'
  | 'in';

export interface VehicleEntity {
  id: string;
  userId?: string;
  manufacturer: string;
  model: string;
  year: number;
  powertrain: PowertrainType;
  engineType: string;
  transmission: TransmissionType;
  mileageKm: number;
  vin?: string;
  createdAt?: string;
}

export interface FactCondition {
  factCode: string;
  expectedValue?: boolean | string | number;
  operator?: ComparisonOperator;
  range?: [number, number];
  unit?: string;
}

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: FactCondition[];
}

export interface RuleReference {
  id: string;
  sourceTitle: string;
  sourceType:
    | 'OEM_MANUAL'
    | 'ASE_TRAINING'
    | 'GOV_SAFETY_STANDARD'
    | 'TECHNICAL_SOCIETY'
    | 'INDUSTRY_REFERENCE';
  documentSection: string;
  url?: string;
  publicationYear?: number;
  notes?: string;
}

export interface RuleValidationReview {
  id: string;
  ruleId: string;
  reviewer: string;
  reviewerRole: string;
  status: ValidationStatus;
  reviewDate: string;
  comments: string;
}

export interface MeasurementRequirement {
  parameter: string;
  unit: string;
  normalRange: { min?: number; max?: number };
  manufacturerSpecific: boolean;
  standardProcedure: string;
}

export interface FaultDefinition {
  code: string;
  name: string;
  description: string;
  systemCategory: RuleCategory;
}

export interface DiagnosticRule {
  ruleId: string; // EL01..EV06
  title: string;
  category: RuleCategory;
  description: string;
  applicablePowertrains: PowertrainType[];
  applicableTransmissions?: TransmissionType[];
  minYear?: number;
  maxYear?: number;
  requiredConditions: ConditionGroup | FactCondition[];
  optionalSupportingConditions?: FactCondition[];
  contradictoryConditions?: FactCondition[];
  requiredMeasurements?: MeasurementRequirement[];
  possibleFaults: FaultDefinition[];
  suggestedFollowUpQuestions: string[]; // Question IDs
  recommendedDiagnosticChecks: string[];
  safetySeverity: SafetySeverity;
  safetyGuidance?: string;
  supportingExplanation: string;
  alternativeExplanations: string[];
  sourceReferences: RuleReference[];
  validationStatus: ValidationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  version: string;
  enabled: boolean;
}

export interface Symptom {
  id: string;
  code: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: SafetySeverity;
  commonFactCode: string;
  initialFactValue?: string | number | boolean;
  applicablePowertrains?: PowertrainType[];
  applicableTransmissions?: TransmissionType[];
}

export interface QuestionOption {
  label: string;
  value: string | number | boolean;
  factValue: string | number | boolean;
  isSafeDIY?: boolean;
}

export interface Question {
  id: string;
  text: string;
  factCode: string;
  category: RuleCategory;
  applicablePowertrains?: PowertrainType[];
  applicableTransmissions?: TransmissionType[];
  type: 'single_choice' | 'boolean' | 'number';
  options?: QuestionOption[];
  unit?: string;
  helpText?: string;
  safetyWarning?: string;
}

export interface Fact {
  code: string;
  value: string | number | boolean;
  unit?: string;
  source:
    | 'symptom_selection'
    | 'question_answer'
    | 'measurement_input'
    | 'vehicle_profile'
    | 'inferred';
  timestamp: string;
}

export type WorkingMemory = Record<string, Fact>;

export interface ConditionEvaluation {
  condition: FactCondition;
  isSatisfied: boolean;
  factFound: boolean;
  actualValue?: unknown;
}

export interface RuleMatchEvidence {
  satisfiedRequired: ConditionEvaluation[];
  unsatisfiedRequired: ConditionEvaluation[];
  unknownRequired: ConditionEvaluation[];
  satisfiedSupporting: ConditionEvaluation[];
  contradictedConditions: ConditionEvaluation[];
}

export interface DiagnosticHypothesis {
  ruleId: string;
  ruleTitle: string;
  category: RuleCategory;
  confidence: ConfidenceLevel;
  ruleMatchScore: number; // 0 - 100 percentage match score (explicitly labeled, not calibrated probability)
  safetySeverity: SafetySeverity;
  safetyWarning?: string;
  primaryFault: FaultDefinition;
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  missingEvidence: string[];
  alternativeExplanations: string[];
  recommendedChecks: string[];
  evidenceSummary: RuleMatchEvidence;
  validationStatus: ValidationStatus;
}

export interface SafetyAlert {
  severity: SafetySeverity;
  headline: string;
  instructions: string[];
  safeToDrive: boolean;
  immediateActionRequired: boolean;
  emergencyCallRecommended: boolean;
  triggeringFactOrRule: string;
}

export interface InferenceResult {
  sessionId: string;
  vehicleId: string;
  evaluatedAt: string;
  safetyAlerts: SafetyAlert[];
  hypotheses: DiagnosticHypothesis[]; // Ranked hypotheses
  suggestedQuestions: Question[];
  inferenceTrace: string[];
  status: 'IN_PROGRESS' | 'DIAGNOSIS_REACHED' | 'SAFETY_HALTED' | 'INCONCLUSIVE';
}

export interface DiagnosisSession {
  id: string;
  vehicleId: string;
  vehicleSummary: {
    manufacturer: string;
    model: string;
    year: number;
    powertrain: PowertrainType;
    transmission: TransmissionType;
    mileageKm: number;
  };
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  reportedSymptomCodes: string[];
  answeredQuestionIds: string[];
  facts: WorkingMemory;
  latestResult?: InferenceResult;
}
