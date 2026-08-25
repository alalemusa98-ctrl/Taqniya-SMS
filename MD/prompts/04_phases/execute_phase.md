# 🤖 Prompt: Execute Phase

> **Architectural Name:** `Governance Dispatcher & Phase Execution Orchestrator`

> **Purpose:**
> يُستخدم هذا الموجّه لتسليم المرحلة الوظيفية المعتمدة، وسياقها، ومتطلباتها، وقيودها، ومعايير قبولها إلى **محرك التنفيذ المعتمد (Configured Execution Engine)** بعد التأكد من جاهزية جميع المتطلبات السابقة.

> **Core Principle:**
> **Taqniya defines WHAT must be built and WHAT must never be violated.**
> **The Technology Profile defines HOW the selected technology should implement it.**
> **The Execution Engine defines HOW the implementation work itself is planned and executed.**

---

# 1. Architectural Responsibility Model

يعتمد هذا الموجّه على فصل صارم بين ثلاث مسؤوليات مستقلة:

```text
┌─────────────────────────────────────────────────────────────┐
│                     TAQNIYA CORE                            │
│                                                             │
│  WHAT                                                        │
│  ├── Business Requirements                                  │
│  ├── Domain Rules                                            │
│  ├── Security Boundaries                                    │
│  ├── Database SSoT                                          │
│  ├── Design Rules                                            │
│  ├── Phase Scope                                             │
│  ├── Acceptance Criteria                                    │
│  └── Non-Negotiable Governance                              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  TECHNOLOGY PROFILE                         │
│                                                             │
│  TECHNOLOGY-SPECIFIC HOW                                    │
│  ├── Architecture Patterns                                  │
│  ├── Framework Conventions                                   │
│  ├── Layer Structure                                         │
│  ├── Repository / Service / Action / DTO rules               │
│  ├── ORM conventions                                         │
│  ├── Validation mechanisms                                   │
│  ├── Testing conventions                                     │
│  ├── Naming conventions                                      │
│  └── Technology-specific implementation rules               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXECUTION ENGINE                           │
│                                                             │
│  EXECUTION METHODOLOGY                                      │
│  ├── Task Breakdown                                          │
│  ├── Planning                                                 │
│  ├── Coding Workflow                                         │
│  ├── TDD / Testing Workflow                                  │
│  ├── Debugging                                               │
│  ├── Iteration                                                │
│  └── Local Self-Correction                                   │
└─────────────────────────────────────────────────────────────┘
```

### Mandatory Architectural Rule

The Agent MUST preserve this separation.

The Agent MUST NOT move technology-specific implementation decisions into Taqniya Core.

---

# 2. Preconditions & Execution Gatekeeper

Before initiating implementation, the Agent MUST verify that the target phase is ready.

```text
Check: Is the phase ready for physical execution?

        │
        ├── 1. Phase Analysis APPROVED?
        │       │
        │       └── NO → 🛑 STOP
        │
        ├── 2. Prerequisite phases COMPLETED?
        │       │
        │       └── NO → 🛑 STOP
        │
        ├── 3. Database schema synchronized?
        │       │
        │       └── NO → 🛑 STOP
        │
        ├── 4. Technology Profile resolved?
        │       │
        │       └── NO → 🛑 STOP
        │
        └── ALL VERIFIED
                │
                ▼
        🟢 DISPATCH EXECUTION
```

## 2.1 Phase Analysis Approval

Verify that:

```text
prompts/04_phases/analyze_phase.md
```

has been executed for the target phase and that its resulting analysis has been explicitly approved by the developer.

If no approved analysis exists:

> 🛑 STOP.

Do not begin implementation.

---

## 2.2 Prerequisite Phase Verification

Read the target phase `README.md` and determine all declared prerequisite phases.

Verify that every required predecessor is marked as completed according to the project's phase governance.

If a prerequisite is incomplete:

> 🛑 STOP.

Report the blocking prerequisite.

Do not bypass the dependency.

---

## 2.3 Database Foundation Verification

Verify that:

```text
PROJECT/MD/database.md
```

exists and is approved.

Verify that the database implementation phase has already materialized the approved schema.

The phase execution process MUST NOT become a mechanism for creating missing schema elements.

If the required database foundation is missing:

> 🛑 STOP.

Direct the developer to:

```text
prompts/03_database/implement_database.md
```

---

## 2.4 Technology Profile Resolution

The Agent MUST resolve the active technology stack from:

```text
PROJECT/MD/stack.yaml
```

and then resolve the applicable Technology Profile from the framework's technology profile system.

The Agent MUST identify:

* Backend technology.
* Frontend technology.
* Database technology.
* Testing technology.
* Communication architecture/mode if declared.
* Applicable framework-specific profiles.
* Applicable technology-specific architecture rules.

If the required Technology Profile cannot be resolved:

> 🛑 STOP.

Do not invent technology-specific conventions.

---

# 3. Agent Operational Boundary

This prompt acts as a **Governance Dispatcher**.

Its responsibility is to:

1. Verify execution prerequisites.
2. Resolve the project's active technology profile.
3. Resolve the active execution engine.
4. Assemble the complete governance context.
5. Deliver that context to the configured Execution Engine.
6. Enforce Taqniya's non-negotiable boundaries.
7. Prevent unauthorized architectural or database drift.
8. Require independent verification after implementation.

---

# 4. What This Prompt Does NOT Define

This prompt MUST NOT prescribe technology-specific implementation patterns.

The Agent MUST NOT independently mandate:

* Repository Pattern.
* Service Layer.
* Action Pattern.
* DTO Pattern.
* Form Request Pattern.
* MVC variations.
* ORM-specific patterns.
* Specific dependency injection conventions.
* Specific testing methodology.
* TDD.
* BDD.
* Specific folder structures.
* Specific naming conventions.
* Specific framework APIs.
* Specific framework helper functions.
* Specific libraries or packages.

These rules belong to the **resolved Technology Profile** or the project's declared architecture.

For example:

```text
Repository Pattern
```

must NOT be considered universally required.

Instead:

```text
stack.yaml
      ↓
Technology Profile
      ↓
Architecture Rules
      ↓
Execution Engine
```

determines whether Repository is:

```text
REQUIRED
OPTIONAL
DISABLED
NOT APPLICABLE
```

The Execution Engine MUST follow the resolved Technology Profile.

---

# 5. Canonical Governance Sources

The Agent MUST assemble the execution context from the following sources.

---

## 5.1 Phase Specifications

Read the complete target phase directory:

```text
PROJECT/MD/phases/<phase_name>/
```

Where present, inspect:

```text
README.md
backend.md
frontend.md
routes.md
data.md
testing.md
checklist.md
```

Do not assume all files exist.

If a phase document is referenced as mandatory but missing:

> 🛑 STOP and report the missing specification.

---

## 5.2 Global Domain Governance

Read the applicable global specifications:

```text
PROJECT/MD/business_rules.md
PROJECT/MD/data.md
PROJECT/MD/design_rules.md
PROJECT/MD/database.md
PROJECT/MD/stack.yaml
PROJECT/MD/frontend_capabilities.yaml
PROJECT/MD/execution_engine.yaml
```

Only use files that are applicable to the project configuration.

---

## 5.3 Framework Governance

Read the applicable Taqniya Core rules.

These establish universal project governance such as:

* Security boundaries.
* Database governance.
* Non-destructive evolution.
* Universal data integrity rules.
* Design governance where applicable.
* AI execution protocol.

---

## 5.4 Technology Profile Governance

Read the Technology Profile selected by the project stack.

The Technology Profile is authoritative for technology-specific implementation methodology.

It may define, depending on the selected stack:

```text
Architecture style
Layer boundaries
Repository usage
Service usage
Action usage
DTO usage
Validation strategy
ORM conventions
Controller conventions
Testing conventions
Naming conventions
Directory conventions
Dependency rules
Framework-specific security rules
Framework-specific performance rules
```

The Agent MUST NOT duplicate these rules inside this prompt.

The Agent MUST resolve and pass them to the Execution Engine.

---

# 6. Resolved Governance Payload

The Agent MUST construct a logical **Resolved Governance Payload**.

The payload consists of the following layers.

---

## 6.1 Layer A — Phase Contract

The Phase Contract defines WHAT must be delivered.

Include:

* Target phase.
* Phase objective.
* In-scope functionality.
* Out-of-scope functionality.
* Required deliverables.
* Required files identified by approved phase analysis.
* Acceptance criteria.
* Definition of Done.
* Required tests.
* Declared dependencies.

---

## 6.2 Layer B — Domain Contract

Include the applicable domain rules:

```text
business_rules.md
data.md
```

Include:

* Business invariants.
* Domain workflows.
* State transitions.
* Validation constraints.
* Financial rules.
* Data ownership.
* Authorization boundaries.
* Domain relationships.
* Transactional requirements.

The Execution Engine MUST treat these as non-negotiable domain constraints.

---

## 6.3 Layer C — Database Contract

Include:

```text
PROJECT/MD/database.md
```

as the authoritative physical database schema.

The Execution Engine MUST treat it as the database SSoT.

The phase implementation MUST NOT silently modify:

* Tables.
* Columns.
* Foreign keys.
* Indexes.
* Constraints.
* Data types.

If implementation discovers a missing database requirement:

> 🛑 STOP.

The required schema change MUST first pass through the database specification workflow.

---

## 6.4 Layer D — Security Contract

Include all applicable security rules.

The Execution Engine MUST preserve:

* Authentication requirements.
* Authorization rules.
* RBAC boundaries.
* Ownership checks.
* Tenant isolation.
* Input validation requirements.
* IDOR prevention.
* Sensitive-data protection.
* Audit requirements.

Security requirements are governance constraints and MUST NOT be weakened by the implementation method.

---

## 6.5 Layer E — Design & Frontend Contract

Include:

```text
PROJECT/MD/design_rules.md
PROJECT/MD/frontend_capabilities.yaml
```

The Execution Engine MUST implement the UI according to the active project design system and enabled capabilities.

Capability states MUST be respected:

```text
required  → MUST be implemented where applicable
enabled   → MAY be used
optional  → MAY be used when justified
disabled  → MUST NOT be used
```

The exact implementation technique remains the responsibility of the Technology Profile.

---

## 6.6 Layer F — Technology Contract

The Technology Contract is loaded from the resolved Technology Profile.

It defines HOW the project's selected technology should be implemented.

Examples may include:

```text
Repository Pattern
Service Pattern
Action Pattern
DTOs
Framework-specific Requests
ORM conventions
Component conventions
Testing conventions
File organization
Naming conventions
Dependency injection
Framework-specific architecture
```

These are examples only.

The Agent MUST NOT assume that any specific pattern is required unless the resolved Technology Profile declares it.

---

# 7. Technology Profile Precedence

When determining implementation methodology, use this precedence model:

```text
Project-specific approved architecture
                ↑
Technology Profile
                ↑
Framework Profile
                ↑
Execution Engine native practices
```

However, none of these may violate Taqniya's higher-level non-negotiable governance.

The final precedence model is:

```text
                    TAQNIYA GOVERNANCE
                           │
              ┌────────────┴────────────┐
              │                         │
       Domain / Security /       Database / Acceptance
       Business / Design              Rules
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
                PROJECT TECHNOLOGY STACK
                           │
                           ▼
                  TECHNOLOGY PROFILE
                           │
                           ▼
                  EXECUTION ENGINE
```

### Important Rule

The Execution Engine MUST NOT replace a Technology Profile rule with its own preferred architecture.

Likewise, Taqniya MUST NOT invent technology-specific rules that do not belong to its Core governance.

---

# 8. Execution Engine Resolution

Resolve the active engine from:

```text
PROJECT/MD/execution_engine.yaml
```

If the file is present:

1. Read the configured engine.
2. Validate that it is supported by the runtime protocol.
3. Resolve the engine's operational capabilities.

If the file is absent:

```text
native
```

may be used as the deterministic fallback where permitted by the framework.

The resolved engine may be:

```text
superpowers
claude_code
antigravity
codex
custom
native
```

or another engine explicitly supported by the framework.

---

# 9. Execution Engine Responsibility

The Execution Engine owns the implementation methodology.

It may independently determine:

* Task decomposition.
* Implementation order.
* Internal planning.
* TDD or non-TDD workflow.
* Local testing cycles.
* Debugging strategy.
* Refactoring strategy.
* Incremental implementation.
* Internal checkpoints.
* Self-correction.

The Execution Engine MUST nevertheless remain inside the supplied Governance Payload.

---

# 10. Execution Boundary

The Execution Engine is authorized to modify only artifacts required to implement the approved phase.

It MAY:

* Create approved source files.
* Modify approved source files.
* Create required tests.
* Modify required tests.
* Register routes or framework configuration when explicitly required by the approved phase.
* Perform implementation-specific configuration changes when allowed by the Technology Profile.

It MUST NOT:

* Change the project's technology stack.
* Change the active execution engine.
* Change business rules.
* Change approved database design.
* Invent undocumented domain requirements.
* Expand phase scope without approval.
* Implement future phases.
* Bypass security rules.
* Disable required capabilities.
* Enable disabled capabilities without authorization.
* Modify framework governance files to make implementation easier.

---

# 11. Phase Scope Isolation

Implementation MUST remain inside the approved phase boundary.

If the Execution Engine discovers functionality belonging to another phase:

> Do NOT implement it merely because it is convenient.

Instead:

1. Identify the dependency.
2. Determine whether it is genuinely required for the current phase.
3. If required, report it as a dependency or blocking requirement.
4. If not required, defer it to its appropriate phase.

The Execution Engine MUST NOT silently expand the scope.

---

# 12. Database Drift Protection

During phase execution:

```text
PHASE IMPLEMENTATION
        │
        ├── Read database.md
        │
        ├── Use existing approved schema
        │
        └── DO NOT redesign database
```

The Execution Engine MUST NOT:

* Create undocumented tables.
* Add undocumented columns.
* Change column types.
* Add undocumented indexes.
* Remove constraints.
* Alter foreign-key behavior.
* Generate unrelated migrations.

If the phase requires a schema element that does not exist:

```text
🛑 STOP
     ↓
Report schema gap
     ↓
Update database specification
     ↓
Developer approval
     ↓
Implement database
     ↓
Resume phase
```

---

# 13. Domain Integrity During Execution

The Execution Engine MUST preserve all approved domain invariants.

It MUST NOT:

* Change business calculations.
* Change state transition rules.
* Bypass validation.
* bypass authorization.
* Create alternative workflows that contradict the specification.
* silently reinterpret ambiguous business rules.

If an ambiguity is discovered:

> 🛑 Do not invent the answer.

Report the ambiguity to the developer and request clarification where the ambiguity affects correctness.

---

# 14. Security Integrity During Execution

The Execution Engine MUST treat security rules as hard constraints.

It MUST verify, according to the project's actual architecture:

* Authentication.
* Authorization.
* Ownership.
* Tenant isolation.
* Resource access boundaries.
* Input validation.
* State transition authorization.
* IDOR prevention.
* Sensitive operation protection.

The implementation method may differ between technologies, but the security outcome MUST satisfy the approved governance.

---

# 15. Frontend & Design Integrity

Where the phase contains frontend work, the Execution Engine MUST:

1. Read `design_rules.md`.
2. Read active frontend capability states.
3. Read the Technology Profile's frontend implementation rules.
4. Implement the required visual and UX behavior.
5. Avoid disabled capabilities.
6. Preserve RTL requirements where declared.
7. Preserve responsive requirements.
8. Preserve accessibility requirements.

The Agent MUST NOT dictate a framework-specific implementation technique here.

The Technology Profile determines HOW the selected frontend technology implements these requirements.

---

# 16. No Universal Architecture Assumptions

The following rule is mandatory:

> **Taqniya Core MUST remain architecture-pattern neutral unless a rule is explicitly declared as universal governance.**

Therefore the Agent MUST NOT assume that every project has:

```text
Repository
Service
Action
DTO
FormRequest
Resource
Controller
Model
MVC
REST API
GraphQL
ORM
```

The actual architecture is resolved from:

```text
PROJECT/MD/stack.yaml
        +
Technology Profile
        +
Project-specific approved architecture
```

---

# 17. Execution Flow

The final execution flow is:

```text
                    APPROVED PHASE
                           │
                           ▼
                Analyze Phase Approval
                           │
                           ▼
              Verify Prerequisites
                           │
                           ▼
              Verify Database SSoT
                           │
                           ▼
                Resolve Stack.yaml
                           │
                           ▼
             Resolve Technology Profile
                           │
                           ▼
             Resolve Execution Engine
                           │
                           ▼
            Build Governance Payload
                           │
                           ▼
              ┌──────────────────────┐
              │  WHAT                │
              │  Taqniya Governance  │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  HOW                 │
              │ Technology Profile   │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ EXECUTION             │
              │ Execution Engine      │
              └──────────┬───────────┘
                         │
                         ▼
                  Code Implementation
                         │
                         ▼
                Engine Self-Verification
                         │
                         ▼
                  HARD STOP
                         │
                         ▼
              review_phase.md
```

---

# 18. Implementation Completion Gate

When the Execution Engine considers implementation complete, it MUST provide:

### Implementation Summary

* Files created.
* Files modified.
* Files deleted, if any.
* Features implemented.
* Tests executed.
* Test results.
* Known limitations.
* Deferred items.
* Any deviations discovered.
* Any unresolved issues.

The Execution Engine MUST NOT declare the phase officially `COMPLETED` merely because its local implementation succeeded.

---

# 19. Independent Verification Boundary

After implementation:

```text
Execution Engine
       │
       ▼
Implementation Complete
       │
       ▼
🛑 HARD STOP
       │
       ▼
review_phase.md
       │
       ▼
Independent Verification
```

The implementation MUST be independently reviewed by:

```text
prompts/04_phases/review_phase.md
```

The review process is responsible for determining whether the phase actually satisfies:

* Domain requirements.
* Security requirements.
* Database compliance.
* Architecture compliance.
* Design compliance.
* Testing requirements.
* Acceptance criteria.
* Definition of Done.

---

# 20. Phase Completion Rule

The Execution Engine MUST NOT:

* Mark the phase as officially completed.
* Mark the phase `COMPLETED` in its authoritative phase documentation.
* Start the next phase.

until the independent review process issues an official approval.

The lifecycle is therefore:

```text
ANALYZE
   ↓
APPROVE
   ↓
EXECUTE
   ↓
IMPLEMENTATION COMPLETE
   ↓
REVIEW
   ↓
APPROVED
   ↓
PHASE COMPLETED
```

---

# 21. Mandatory Hard Stop

When execution is complete, output:

```text
PHASE IMPLEMENTATION COMPLETED BY EXECUTION ENGINE

The approved phase has been implemented according to:

1. Taqniya Core Governance
2. Approved Phase Specification
3. Approved Database Blueprint
4. Project Security Rules
5. Project Design Rules
6. Resolved Technology Profile
7. Configured Execution Engine

Independent verification is now required.

NEXT STEP:
prompts/04_phases/review_phase.md
```

Then:

> 🛑 **STOP.**

Do not execute the review automatically unless the framework explicitly delegates that action.

---

# 22. Final Architectural Contract

This prompt MUST preserve the following permanent contract:

```text
┌────────────────────────────────────────────────────────────┐
│ Taqniya Core                                                │
│                                                            │
│ Defines WHAT                                                │
│                                                            │
│ • Domain                                                   │
│ • Business Rules                                           │
│ • Security                                                 │
│ • Database SSoT                                             │
│ • Design Governance                                        │
│ • Phase Scope                                              │
│ • Acceptance Criteria                                      │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│ Technology Profile                                          │
│                                                            │
│ Defines TECHNOLOGY HOW                                      │
│                                                            │
│ • Architecture Patterns                                    │
│ • Framework Conventions                                    │
│ • Repository / Service / Action / DTO rules                 │
│ • ORM                                                      │
│ • Validation                                               │
│ • Testing                                                  │
│ • File Structure                                           │
│ • Naming                                                  │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│ Execution Engine                                            │
│                                                            │
│ Defines EXECUTION HOW                                       │
│                                                            │
│ • Planning                                                 │
│ • Task Breakdown                                           │
│ • Coding Workflow                                          │
│ • Testing Workflow                                         │
│ • Debugging                                                │
│ • Iteration                                                │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼
                       CODEBASE
```

### Non-Negotiable Principle

> **Taqniya Core governs the contract.**
>
> **Technology Profiles govern technology-specific implementation.**
>
> **Execution Engines govern execution methodology.**
>
> **No layer may silently assume or impose responsibilities belonging to another layer.**
