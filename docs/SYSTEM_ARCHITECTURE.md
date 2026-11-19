# System Architecture & Design Specification
## Ai CarCheck Automotive Expert System

---

## 1. High-Level Architectural Pattern

The application is structured as a **three-tier monorepo architecture** utilizing npm workspaces, ensuring absolute separation of concerns between client presentation, rule-based inference, and transactional storage.

```mermaid
flowchart TD
    subgraph ClientTier ["Presentation Tier (React 19 + Vite)"]
        UI["App Navigation Shell"]
        DiagView["ExpertDiagnosisView"]
        HistView["DiagnosisHistoryView"]
        KBView["KnowledgeBaseView"]
        EVView["Voltguard EV Telemetry View"]
        ClientAPI["Typed API Client (src/lib/api.ts)"]
    end

    subgraph DomainTier ["Inference & Domain Tier (@voltguard/shared)"]
        WM["Working Memory (Facts Dictionary)"]
        ForwardChaining["Inference Engine (engine.ts)"]
        SafetyEngine["Safety Engine (safetyEngine.ts)"]
        QuestionSelector["Question Engine (questionSelector.ts)"]
        Explainer["Explanation Engine (explanationEngine.ts)"]
        RulesCatalog["50 Diagnostic Rules Catalog"]
    end

    subgraph ServiceTier ["Service & Persistence Tier (Node 24 + Express)"]
        Router["Express REST Endpoints (/api/*)"]
        AdminAuth["Admin Authorization Guard"]
        Store["DiagnosticStore (/src/store.ts)"]
        DB[("Native SQLite WAL (voltguard.sqlite)")]
    end

    UI --> DiagView
    UI --> HistView
    UI --> KBView
    UI --> EVView

    DiagView --> ClientAPI
    HistView --> ClientAPI
    KBView --> ClientAPI
    EVView --> ClientAPI

    ClientAPI -- "HTTP REST /api" --> Router
    Router --> AdminAuth
    AdminAuth --> Store
    Store --> DB

    Store --> ForwardChaining
    ForwardChaining --> SafetyEngine
    ForwardChaining --> QuestionSelector
    ForwardChaining --> Explainer
    ForwardChaining --> RulesCatalog
    ForwardChaining --> WM
```

---

## 2. Use-Case Diagram

```mermaid
flowchart LR
    User(["Automotive Technician / Driver"])
    Admin(["Knowledge Base Admin"])

    subgraph UseCases ["Ai CarCheck Use Cases"]
        UC1["Register / Select Vehicle Profile"]
        UC2["Select Observed Symptoms"]
        UC3["Answer Interactive Follow-Up Questions"]
        UC4["View Ranked Hypotheses & Evidence"]
        UC5["Receive Urgent Safety Guidance"]
        UC6["Review Past Diagnostic Sessions"]
        UC7["Inspect EV Battery Telemetry Lab"]
        UC8["Browse 50 Diagnostic Rules"]
        UC9["Submit Expert Peer Review"]
        UC10["Enable / Disable Diagnostic Rule"]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8

    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
```

---

## 3. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    VEHICLE {
        string id PK
        string manufacturer
        string model
        int year
        string powertrain
        string transmission
        string engineType
        int mileageKm
        string vin
        datetime createdAt
    }

    DIAGNOSTIC_RULE {
        string ruleId PK
        string title
        string category
        string description
        string safetySeverity
        string validationStatus
        string reviewedBy
        datetime reviewedAt
        string version
        boolean enabled
        json requiredConditions
        json optionalConditions
        json contradictoryConditions
        json measurements
    }

    RULE_REFERENCE {
        string id PK
        string ruleId FK
        string sourceTitle
        string sourceType
        string documentSection
        string url
    }

    DIAGNOSIS_SESSION {
        string id PK
        string vehicleId FK
        string status
        datetime startedAt
        datetime completedAt
        json reportedSymptoms
        json facts
        json latestResult
    }

    RULE_REVIEW {
        string id PK
        string ruleId FK
        string reviewer
        string reviewerRole
        string status
        datetime reviewDate
        string comments
    }

    VEHICLE ||--o{ DIAGNOSIS_SESSION : "has"
    DIAGNOSTIC_RULE ||--o{ RULE_REFERENCE : "cites"
    DIAGNOSTIC_RULE ||--o{ RULE_REVIEW : "receives"
```

---

## 4. Data Flow Diagram (DFD)

### Level 0: Context Diagram
```mermaid
flowchart TD
    User["Vehicle Technician / Driver"]
    Admin["Knowledge Engineer"]
    System[["Ai CarCheck Expert System"]]
    DB[("SQLite Storage")]

    User -- "Vehicle specs & Symptoms" --> System
    User -- "Question answers & Measurements" --> System
    System -- "Safety warnings, Ranked faults, Next checks" --> User

    Admin -- "Rule edits, Peer reviews, Admin key" --> System
    System -- "Rule catalog & Validation status" --> Admin

    System <--> DB
```

### Level 1: Subsystem Data Flow
```mermaid
flowchart TD
    P1["1.0 Vehicle & Symptom Ingestion"]
    P2["2.0 Working Memory Initialization"]
    P3["3.0 Safety Rule Evaluation"]
    P4["4.0 Forward-Chaining Inference"]
    P5["5.0 Question Selection"]
    P6["6.0 Explanation & Reporting"]
    P7["7.0 Knowledge Base Admin"]

    D1[("Vehicles")]
    D2[("Rules Catalog")]
    D3[("Working Memory")]
    D4[("Sessions & History")]

    In1["User Inputs"] --> P1
    P1 --> D1
    P1 --> P2
    P2 --> D3
    D3 --> P3
    P3 -- "Urgent Alerts" --> Out1["Safety Warning Display"]
    D3 --> P4
    D2 --> P4
    P4 --> P5
    P5 -- "Next Questions" --> Out2["Interactive UI"]
    P4 --> P6
    P6 --> D4
    P6 -- "Ranked Results" --> Out3["Diagnosis Findings"]

    In2["Admin Inputs"] --> P7
    P7 <--> D2
```
