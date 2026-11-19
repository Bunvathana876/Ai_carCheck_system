# Software Requirements Specification (SRS)
## Ai CarCheck: University-Level Rule-Based Automotive Expert System

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for **Ai CarCheck**, a deterministic, explainable, rule-based automotive diagnostic expert system. Designed as a final-year university engineering capstone project, Ai CarCheck bridges the gap between driver symptom reporting, workshop test procedures, and domain expertise without relying on black-box generative AI APIs.

### 1.2 Scope
Ai CarCheck accepts vehicle specifications (make, model, year, powertrain, transmission, mileage), observed symptoms, and quantitative test measurements. It executes forward-chaining inference over a validated knowledge base of **exactly 50 diagnostic rules** spanning 8 vehicle subsystems, produces ranked diagnostic hypotheses with transparent evidence explanations, detects urgent safety hazards, and persists session history in an ACID-compliant SQLite datastore.

### 1.3 Target Audience & Personas
1. **Automotive Technicians & Apprentices**: Need step-by-step diagnostic trees, measurement thresholds, and OEM citations to guide physical troubleshooting.
2. **Vehicle Owners / Drivers**: Require plain-language guidance to translate symptoms (e.g. "engine cranks slowly") into prioritized component checks and urgent safety warnings.
3. **Academic Evaluators & Domain Experts**: Require full transparency, deterministic inference traces, and verifiable knowledge engineering.

---

## 2. Overall Description

### 2.1 Product Perspective
Ai CarCheck is a three-tier monorepo application:
- **Presentation Layer**: React 19 single-page application with Tailwind CSS and Framer Motion.
- **Inference & Domain Layer**: Pure TypeScript forward-chaining inference engine with working memory, safety overrides, and explanation engines.
- **Service & Persistence Layer**: Node.js 24 + Express REST API backed by native SQLite in Write-Ahead Logging (WAL) mode.

### 2.2 System Modules
- **Module A: Vehicle Profile Management**
- **Module B: Knowledge Base (50 Rules Catalog)**
- **Module C: Working Memory & Fact Representation**
- **Module D: Forward-Chaining Inference Engine**
- **Module E: Dynamic Question Selection Engine**
- **Module F: Transparent Explanation Engine**
- **Module G: Safety Engine & Override System**
- **Module H: Session Persistence & History**
- **Module I: Knowledge Base Administration & Peer Review**
- **Module J: High-Voltage EV Telemetry Lab (Voltguard)**

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### FR-01: Vehicle Registration & Compatibility Filtering
- **FR-01.1**: The system shall record vehicle manufacturer, model, model year (1950–2030), powertrain classification (`gasoline`, `diesel`, `hybrid`, `electric`), transmission type (`automatic`, `manual`, `cvt`, `direct_drive`), engine displacement/type, mileage, and optional VIN.
- **FR-01.2**: The inference engine shall automatically disqualify rules incompatible with the vehicle's powertrain (e.g., combustion rules EN01–EN10 on pure EVs, diesel rules DS01–DS03 on gasoline vehicles).
- **FR-01.3**: The inference engine shall disqualify rules incompatible with the vehicle's transmission (e.g., manual clutch slip DR02 on automatic transmissions).

#### FR-02: Knowledge Base & Rule Representation
- **FR-02.1**: The system shall contain a catalog of exactly 50 uniquely identified diagnostic rules (EL01–EL08, EN01–EN10, TH01–TH07, BR01–BR05, CH01–CH06, DR01–DR05, DS01–DS03, EV01–EV06).
- **FR-02.2**: Each rule shall define stable identifiers, category, required conditions, optional supporting conditions, contradictory conditions, measurement requirements with explicit engineering units, safety severity, authoritative references, and validation status.

#### FR-03: Forward-Chaining Inference Engine
- **FR-03.1**: The inference engine shall operate deterministically using forward chaining, deriving hypotheses from working memory facts.
- **FR-03.2**: The engine shall evaluate logical operators (`AND`, `OR`, `NOT`, `==`, `!=`, `>`, `<`, `>=`, `<=`, `between`, `in`).
- **FR-03.3**: The engine shall distinguish between `known true`, `known false`, and `unknown` facts. An unanswered question shall never be assumed false.
- **FR-03.4**: If any contradictory condition evaluates to true, the rule shall be invalidated (score = 0).
- **FR-03.5**: The engine shall guarantee cycle-free termination without infinite loops.

#### FR-04: Confidence & Evidence Scoring
- **FR-04.1**: Hypotheses shall be assigned qualitative evidence ratings: `STRONG`, `MODERATE`, `LIMITED`, and `INSUFFICIENT`.
- **FR-04.2**: Quantitative scores shall be explicitly labeled as "Rule-Match Score" (0–100%) and documented as the weighted combination of required conditions (70%) and supporting conditions (30%).

#### FR-05: Safety Engine & Override System
- **FR-05.1**: Safety rules shall evaluate prior to ordinary diagnostic ranking.
- **FR-05.2**: The system shall recognize critical hazards: hydraulic brake failure (BR01), traction battery thermal runaway (EV04), low engine oil pressure (TH06), severe coolant circulation blockage (TH04), and high-voltage isolation loss (EV03).
- **FR-05.3**: Critical safety triggers shall flag `safeToDrive: false`, display immediate emergency instructions, recommend professional towing, and halt vehicle operation.

#### FR-06: Interactive Question Engine
- **FR-06.1**: The system shall identify the most informative follow-up questions from competing candidate hypotheses.
- **FR-06.2**: The question engine shall avoid repeating previously answered questions.
- **FR-06.3**: Questions with safety implications (e.g., hot radiator caps, high-voltage wiring) shall display prominent safety warnings.

#### FR-07: Explanation & Traceability
- **FR-07.1**: The system shall provide an audit breakdown for every hypothesis: confirmed supporting evidence, contradictory evidence, missing facts, and alternative explanations.
- **FR-07.2**: The system shall generate an execution trace logging every rule evaluation step.

#### FR-08: Administrative Knowledge Management
- **FR-08.1**: Administrative endpoints (`/api/admin/*`) shall require a valid authorization key (`x-admin-key`).
- **FR-08.2**: Authorized users shall be permitted to edit rules, toggle enable/disable state, and submit structured peer reviews with reviewer identity, role, validation status, and audit comments.

### 3.2 Non-Functional Requirements
- **NFR-01: Performance**: Inference evaluation over all 50 rules shall complete in under 50 milliseconds.
- **NFR-02: Reliability & ACID Compliance**: State changes shall use SQLite transactions with WAL journaling mode.
- **NFR-03: Security**: API endpoints shall enforce 16kb payload limits, CORS origin checks, and input schema validation.
- **NFR-04: Portability**: The software shall run on standard Node.js 24+ runtimes without requiring external database servers, cloud credentials, or third-party AI APIs.
