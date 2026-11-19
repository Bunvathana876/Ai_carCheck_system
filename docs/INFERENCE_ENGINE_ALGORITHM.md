# Inference Engine Specification & Algorithm Design
## Deterministic Forward Chaining for Automotive Fault Diagnosis

---

## 1. Justification of Forward Chaining for Automotive Diagnostics

In expert system theory, two primary inference paradigms exist: **backward chaining** (goal-driven) and **forward chaining** (data-driven).

### Why Forward Chaining Was Selected:
1. **Symptom-to-Fault Mapping**: Automotive troubleshooting naturally begins with observed symptoms (e.g., "engine will not crank", "vehicle pulls under braking") rather than a pre-assumed single fault. Drivers do not know which of 500 components has failed.
2. **Multi-Fault Capability**: A vehicle may simultaneously suffer from a dead 12V battery and a loose alternator belt. Forward chaining discovers all hypotheses supported by the working memory rather than stopping after proving one target goal.
3. **Safety Urgency Pre-emption**: High-voltage battery thermal hazards or brake hydraulic pressure loss must trigger safety overrides immediately upon symptom assertion, without waiting for deep goal trees.
4. **Transparent Audit Trails**: Forward chaining creates direct causal links:
   $$\text{Fact}_1 \land \text{Fact}_2 \implies \text{Conclusion}_A$$
   allowing the explanation engine to present exact reasons why a rule fired.

---

## 2. Working Memory & Fact Representation

Facts are stored in an indexed dictionary (`WorkingMemory`):
$$\text{Memory} = \{ \text{code}_i \mapsto \langle \text{code}_i, \text{value}_i, \text{unit}_i, \text{source}_i, \text{timestamp}_i \rangle \}$$

### Fact Tri-State Logic:
Unlike naive boolean systems that assume unasserted facts are `false` (Closed World Assumption), Ai CarCheck enforces **Open World Semantics**:
- $\text{State}(\text{fact}) \in \{ \text{True}, \text{False}, \text{Unknown} \}$
- If a question has not been answered by the user, its fact code is absent from working memory and evaluates strictly to **Unknown**.
- An unconfirmed fact **never** counts as false, preventing premature disqualification of candidate hypotheses.

---

## 3. Mathematical Condition Evaluation

For a given condition $C_j = \langle \text{factCode}, \text{op}, \text{expectedValue}, \text{range} \rangle$:

$$\text{Eval}(C_j, \text{Memory}) =
\begin{cases}
\text{Unknown}, & \text{if } C_j.\text{factCode} \notin \text{Memory} \\
\text{Satisfied}, & \text{if } \text{Memory}[C_j.\text{factCode}].\text{value} \odot_{\text{op}} C_j.\text{expectedValue} \\
\text{Unsatisfied}, & \text{otherwise}
\end{cases}$$

Supported comparison operators $\odot_{\text{op}}$:
- Equality: $==$, Inequality: $\neq$
- Numerical Ordering: $>$, $<$, $\ge$, $\le$
- Range Bound: $x \in [\min, \max]$ (`between`)
- Set Inclusion: $x \in S$ (`in`)

---

## 4. Evidence Scoring & Confidence Formulation

Each rule $R_k$ consists of:
- Required conditions set: $\mathcal{C}_{\text{req}}$ with size $N_{\text{req}}$
- Optional supporting conditions set: $\mathcal{C}_{\text{sup}}$ with size $N_{\text{sup}}$
- Contradictory conditions set: $\mathcal{C}_{\text{contra}}$ with size $N_{\text{contra}}$

### Step 1: Contradiction Check
If $\exists c \in \mathcal{C}_{\text{contra}}$ such that $\text{Eval}(c, \text{Memory}) = \text{Satisfied}$:
$$\text{MatchScore}(R_k) = 0, \quad \text{Confidence} = \text{INSUFFICIENT (Contradicted)}$$

### Step 2: Required Conditions Evaluation
Let:
- $S_{\text{req}} = |\{ c \in \mathcal{C}_{\text{req}} \mid \text{Eval}(c) = \text{Satisfied} \}|$
- $U_{\text{req}} = |\{ c \in \mathcal{C}_{\text{req}} \mid \text{Eval}(c) = \text{Unsatisfied} \}|$
- $K_{\text{req}} = |\{ c \in \mathcal{C}_{\text{req}} \mid \text{Eval}(c) = \text{Unknown} \}|$

If $U_{\text{req}} > 0$:
$$\text{MatchScore}(R_k) = 0, \quad \text{Confidence} = \text{INSUFFICIENT (Violated)}$$

If $S_{\text{req}} = N_{\text{req}}$ (all required conditions verified):
$$\text{BaseScore} = 70$$
$$\text{SupportingScore} = 30 \times \left( \frac{S_{\text{sup}}}{\max(1, N_{\text{sup}})} \right)$$
$$\text{MatchScore}(R_k) = \min(100, \text{round}(\text{BaseScore} + \text{SupportingScore}))$$

### Step 3: Confidence Level Assignment
$$\text{Confidence}(R_k) =
\begin{cases}
\text{STRONG}, & \text{if } \text{MatchScore} \ge 85 \land S_{\text{sup}} \ge 1 \\
\text{MODERATE}, & \text{if } \text{MatchScore} \ge 65 \\
\text{LIMITED}, & \text{if } \text{MatchScore} \ge 40 \\
\text{INSUFFICIENT}, & \text{otherwise}
\end{cases}$$

---

## 5. Forward-Chaining Inference Engine Pseudocode

```text
ALGORITHM RunInference(Vehicle, Memory, RulesCatalog)
INPUT:
  Vehicle: VehicleEntity (powertrain, transmission, year, mileage)
  Memory: WorkingMemory (dictionary of established facts)
  RulesCatalog: List of 50 DiagnosticRule objects
OUTPUT:
  InferenceResult (SafetyAlerts, RankedHypotheses, NextQuestions, TraceLog, Status)

BEGIN
  TraceLog ← []
  Append TraceLog: "[INIT] Starting forward chaining for " + Vehicle.model
  
  // Phase 1: Pre-inference safety scan
  SafetyAlerts ← EvaluateSafetyConditions(Memory)
  IF SafetyAlerts is not empty THEN
    Append TraceLog: "[SAFETY] Active safety overrides detected"
  END IF

  Hypotheses ← []

  // Phase 2: Iterate and evaluate each rule
  FOR EACH Rule IN RulesCatalog DO
    IF NOT Rule.enabled THEN CONTINUE END IF
    
    // Check vehicle compatibility
    IF Vehicle.powertrain NOT IN Rule.applicablePowertrains THEN
      Append TraceLog: "[INCOMPATIBLE] Powertrain mismatch for " + Rule.ruleId
      CONTINUE
    END IF

    IF Rule.applicableTransmissions is defined AND 
       Vehicle.transmission NOT IN Rule.applicableTransmissions THEN
      Append TraceLog: "[INCOMPATIBLE] Transmission mismatch for " + Rule.ruleId
      CONTINUE
    END IF

    // Check contradictory conditions
    isContradicted ← FALSE
    FOR EACH Cond IN Rule.contradictoryConditions DO
      result ← EvaluateCondition(Cond, Memory)
      IF result.factFound AND result.isSatisfied THEN
        isContradicted ← TRUE
        BREAK
      END IF
    END FOR

    IF isContradicted THEN
      Append TraceLog: "[CONTRADICTED] Rule " + Rule.ruleId + " contradicted by evidence"
      RecordHypothesis(Rule, Score=0, Confidence="INSUFFICIENT")
      CONTINUE
    END IF

    // Evaluate required and supporting conditions
    Evidence ← EvaluateRuleConditions(Rule, Memory)

    IF Evidence.unsatisfiedRequired.length > 0 THEN
      // Hard condition violation
      Score ← 0
      Confidence ← "INSUFFICIENT"
    ELSE IF Evidence.satisfiedRequired.length == Rule.requiredConditions.length THEN
      // Full match
      Score ← ComputeScore(Evidence)
      Confidence ← AssignConfidence(Score, Evidence)
      Append TraceLog: "[MATCH] Rule " + Rule.ruleId + " fired with " + Confidence
    ELSE
      // Partial match with unknown facts
      Score ← ComputePartialScore(Evidence)
      Confidence ← "LIMITED"
    END IF

    IF Score > 0 OR Evidence.satisfiedRequired.length > 0 THEN
      Hypothesis ← BuildHypothesis(Rule, Score, Confidence, Evidence)
      Hypotheses.append(Hypothesis)
    END IF
  END FOR

  // Phase 3: Conflict resolution and ranking
  SortHypotheses(Hypotheses) BY:
    1. SafetySeverity (CRITICAL > HIGH > MEDIUM > LOW > INFO)
    2. RuleMatchScore DESCENDING

  // Phase 4: Follow-up question selection
  NextQuestions ← SelectNextQuestions(Hypotheses, Memory, Vehicle)

  // Phase 5: Termination state determination
  IF HasCriticalSafety(SafetyAlerts) THEN
    Status ← "SAFETY_HALTED"
  ELSE IF HasStrongHypothesis(Hypotheses) OR NextQuestions is empty THEN
    Status ← "DIAGNOSIS_REACHED"
  ELSE
    Status ← "IN_PROGRESS"
  END IF

  RETURN InferenceResult(SafetyAlerts, Hypotheses, NextQuestions, TraceLog, Status)
END
```

---

## 6. Cycle Prevention and Termination Proof

1. **Acyclic Dependency Structure**: Unlike production systems with unbounded rule chaining ($A \to B \to C \to A$), Ai CarCheck rules map facts directly to terminal fault hypotheses. Inferred facts are strictly monotonic.
2. **Finite Iteration Guarantee**: The catalog consists of a bounded set ($N = 50$). Evaluation iterates strictly once through the active rule set per inference cycle ($O(N)$ time complexity).
3. **Monotonic Working Memory**: In a given diagnostic session, answering a question adds a fact or refines an unknown value. Facts cannot oscillate, guaranteeing that question selection converges to an empty set within $M \le 30$ steps.
