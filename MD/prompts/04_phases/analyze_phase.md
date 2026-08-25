# Analyze Phase

> **Execution Role:** `Functional Phase Analyst & Scope Decomposer`
>
> **Target Specification:** `PROJECT/MD/phases/<phase_name>/` + Global Project Specifications
>
> **Core Principle:** **Scope isolation, cross-phase consistency, and pre-implementation verification.**
>
> No functional phase may be executed until its requirements, dependencies, database coverage, architectural flow, security boundaries, frontend policies, testing requirements, and Definition of Done have been fully analyzed and explicitly approved by the developer.

---

# 1. Purpose

This prompt performs a comprehensive **pre-implementation analysis** of a targeted functional phase.

The Agent must understand the selected phase as part of the **entire project system**, not as an isolated feature.

The analysis MUST therefore consider:

1. The target phase specifications.
2. Global project governance.
3. Approved database architecture.
4. Global business rules.
5. Global design rules.
6. Technology and communication architecture.
7. Frontend capability policies.
8. Previous phases.
9. Future phases that depend on the target phase.
10. Cross-phase data and workflow dependencies.
11. Security and authorization boundaries.
12. Testing and verification requirements.

The objective is to produce a complete **Phase Impact Analysis Report** before any application code is created or modified.

---

# 2. Trigger & Execution Flow

The developer invokes this prompt for a specific phase:

```text
PROJECT/MD/phases/<phase_name>/
```

The Agent MUST follow this sequence:

```text
Target Phase
     │
     ▼
1. Locate & Validate Phase
     │
     ▼
2. Read Global Specifications
     │
     ▼
3. Read Complete Target Phase
     │
     ▼
4. Analyze Previous & Dependent Phases
     │
     ▼
5. Verify Database Coverage
     │
     ├── Missing schema requirement
     │          │
     │          ▼
     │       🛑 BLOCKED
     │          │
     │          ▼
     │    Return to Design Database
     │
     └── Database coverage valid
                │
                ▼
6. Analyze Architecture & Transport
                │
                ▼
7. Analyze Frontend & Security Policies
                │
                ▼
8. Identify Risks & Edge Cases
                │
                ▼
9. Build Test & Verification Strategy
                │
                ▼
10. Generate Phase Impact Analysis
                │
                ▼
11. Developer Approval
                │
        ┌───────┴────────┐
        │                │
      REJECT           APPROVED
        │                │
        ▼                ▼
 Revise Analysis    execute_phase.md
```

---

# 3. Strict Analytical Boundary

## 3.1 Read-Only Analytical Mode

This prompt operates in **strict read-only analytical mode**.

The Agent MUST:

* Read and analyze the target phase documentation.
* Read and cross-reference relevant global project specifications.
* Inspect previous and dependent phases when required for dependency analysis.
* Verify database coverage against `database.md`.
* Verify architectural and communication-mode alignment.
* Verify frontend capability compliance.
* Identify security, data integrity, and transactional risks.
* Define the required testing strategy.
* Produce a structured Phase Impact Analysis Report.

---

## 3.2 The Agent MUST NOT

The Agent MUST NOT:

* Create application source code.
* Modify application source code.
* Create controllers.
* Create models.
* Create services.
* Create actions.
* Create DTOs.
* Create migrations.
* Execute database migrations.
* Modify database tables.
* Modify `database.md`.
* Modify `stack.yaml`.
* Modify `frontend_capabilities.yaml`.
* Modify `execution_engine.yaml`.
* Modify phase specification files.
* Execute application tests.
* Invoke the Execution Engine.
* Begin implementation.
* Automatically proceed to `execute_phase.md`.
* Invent undocumented business rules.
* Invent undocumented database structures.
* Add missing tables or columns to compensate for an incomplete schema.

---

# 4. Specification Hierarchy

The Agent MUST understand the project through the following specification hierarchy.

```text
                    ┌─────────────────────────┐
                    │     PROJECT GOVERNANCE  │
                    │                         │
                    │ stack.yaml              │
                    │ business_rules.md       │
                    │ design_rules.md         │
                    │ database.md             │
                    │ frontend_capabilities   │
                    │ execution_engine        │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     CROSS-PHASE MODEL   │
                    │                         │
                    │ Previous Phases         │
                    │ Current Phase           │
                    │ Dependent Phases        │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    TARGET PHASE RULES   │
                    │                         │
                    │ README.md               │
                    │ backend.md              │
                    │ frontend.md             │
                    │ routes.md               │
                    │ data.md                 │
                    │ testing.md              │
                    │ checklist.md            │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   PHASE IMPACT MODEL    │
                    └─────────────────────────┘
```

The Agent MUST NOT treat a phase document as authoritative when it conflicts with a higher-level global specification.

Conflicts MUST be reported.

They MUST NOT be silently resolved.

---

# 5. Canonical Global Specifications

The Agent MUST inspect and cross-reference the following files where applicable.

## 5.1 Technology Stack

```text
PROJECT/MD/stack.yaml
```

Extract:

* Backend technology.
* Frontend technology.
* Database technology.
* Runtime.
* Testing framework.
* Build tooling.
* Communication mode.
* API style where applicable.
* Declared architectural constraints.

Communication mode MUST be interpreted strictly as:

```text
direct
api_first
hybrid
```

---

## 5.2 Frontend Capability Policy

```text
PROJECT/MD/frontend_capabilities.yaml
```

Extract:

* `required`
* `enabled`
* `disabled`
* `optional`

The Agent MUST enforce the declared capability policy.

If the phase has no frontend component and the frontend policy is irrelevant to the phase, mark the corresponding analysis as:

```text
N/A — Backend-only phase
```

Do NOT treat an absent `frontend.md` as an automatic failure.

---

## 5.3 Execution Engine

```text
PROJECT/MD/execution_engine.yaml
```

Read the active execution engine for awareness and reporting.

The Agent MUST NOT invoke the engine.

---

## 5.4 Business Rules

```text
PROJECT/MD/business_rules.md
```

Extract:

* Business invariants.
* Domain calculations.
* Validation rules.
* Authorization rules.
* State transitions.
* Ownership rules.
* Tenant boundaries.
* Financial rules.
* Transactional requirements.
* Global lifecycle rules.

---

## 5.5 Design Rules

```text
PROJECT/MD/design_rules.md
```

Extract where relevant:

* Visual design tokens.
* Typography.
* Spacing.
* Responsive behavior.
* RTL requirements.
* Accessibility requirements.
* Interaction conventions.
* Component rules.

---

## 5.6 Database Blueprint

```text
PROJECT/MD/database.md
```

This is the **authoritative physical database specification**.

The Agent MUST verify that all database requirements of the target phase are already represented in the approved schema.

The Agent MUST NOT redesign the database during this prompt.

---

# 6. Target Phase Specification Ingestion

The Agent MUST locate:

```text
PROJECT/MD/phases/<phase_name>/
```

The Agent MUST inspect all specification files that exist in that phase.

Expected files include:

```text
README.md
backend.md
frontend.md
routes.md
data.md
testing.md
checklist.md
```

However, file applicability is conditional.

For example:

```text
Backend-only phase
    frontend.md → N/A

Frontend-only phase
    backend.md → N/A

API-only phase
    frontend.md → N/A
```

The Agent MUST NOT report an applicable file as missing if the phase clearly declares that layer out of scope.

If a required document is absent and the phase does require that layer:

```text
STATUS: BLOCKED
```

---

# 7. Phase README Analysis

Read:

```text
README.md
```

Extract:

* Phase ID.
* Phase name.
* Business objective.
* Functional objective.
* Current status.
* Prerequisite phases.
* Declared dependencies.
* Scope boundaries.
* Expected deliverables.
* Acceptance criteria.
* Phase completion state.

---

# 8. Backend Specification Analysis

If applicable, inspect:

```text
backend.md
```

Extract:

* Business actions.
* Domain services.
* Application services.
* DTOs.
* Validation responsibilities.
* Domain events.
* Event listeners.
* Transaction boundaries.
* Repository requirements.
* Persistence operations.
* Authorization requirements.
* Error handling.
* Idempotency requirements.
* Concurrency requirements.

---

# 9. Frontend Specification Analysis

If applicable, inspect:

```text
frontend.md
```

Extract:

* Screens.
* Pages.
* Components.
* Forms.
* View states.
* Loading states.
* Empty states.
* Error states.
* Validation behavior.
* Interaction rules.
* Responsive behavior.
* RTL behavior.
* Accessibility requirements.
* Frontend capability requirements.

---

# 10. Routing Specification Analysis

If applicable, inspect:

```text
routes.md
```

Extract:

* Routes.
* HTTP methods.
* Controllers.
* Middleware.
* Authentication.
* Authorization.
* Route parameters.
* Request payloads.
* Response contracts.
* Web/API separation.
* Versioning requirements.

---

# 11. Phase Data Specification Analysis

If applicable, inspect:

```text
data.md
```

Extract:

* Entities used by the phase.
* Relationships.
* Read operations.
* Write operations.
* State transitions.
* Required fields.
* Foreign-key relationships.
* Data ownership.
* Soft-delete behavior.
* Audit requirements.
* Transactional relationships.

The Agent MUST cross-reference every declared data requirement against:

```text
PROJECT/MD/database.md
```

---

# 12. Testing Specification Analysis

If applicable, inspect:

```text
testing.md
```

Extract:

* Unit tests.
* Feature tests.
* Integration tests.
* E2E tests.
* Security tests.
* Validation tests.
* Edge-case tests.
* Expected assertions.
* Acceptance criteria.
* Required verification commands.

---

# 13. Checklist & Definition of Done

If applicable, inspect:

```text
checklist.md
```

Extract:

* Deliverables.
* Completion criteria.
* Required verification steps.
* Required documentation.
* Acceptance requirements.

The checklist MUST be reconciled with:

* `README.md`
* `backend.md`
* `frontend.md`
* `routes.md`
* `data.md`
* `testing.md`

Any contradiction MUST be reported.

---

# 14. Cross-Phase Dependency Analysis

This is a mandatory gate.

The Agent MUST NOT analyze the target phase in isolation.

It MUST identify:

## 14.1 Previous Phase Dependencies

Determine:

* Which phases must be completed before this phase.
* Whether those phases are actually marked `COMPLETED`.
* Whether their required outputs exist.
* Whether their database changes have been implemented.
* Whether their contracts are compatible with the current phase.

If a required previous phase is incomplete:

```text
STATUS: BLOCKED
BLOCKER: PREVIOUS_PHASE_NOT_COMPLETED
```

---

## 14.2 Current Phase Dependencies

Determine what this phase depends on:

```text
Business Rules
      ↓
Existing Entities
      ↓
Existing Database Schema
      ↓
Existing Services / Actions
      ↓
Existing Routes / APIs
      ↓
Current Phase
```

---

## 14.3 Future Phase Dependencies

The Agent MUST inspect phase documentation sufficiently to identify whether future phases depend on the target phase.

Determine:

* Which future phases consume entities created here.
* Which future phases depend on states introduced here.
* Which future phases depend on routes or contracts introduced here.
* Which future phases depend on data relationships introduced here.
* Whether the current design could block future phases.

The Agent MUST NOT implement future-phase functionality.

It only analyzes dependency impact.

---

## 14.4 Cross-Phase State Consistency

If an entity appears in multiple phases, verify:

* State names are consistent.
* State transitions are compatible.
* Ownership rules remain consistent.
* Deletion behavior remains consistent.
* Financial rules remain consistent.
* Authorization rules remain consistent.

Example:

```text
Phase 01
invoice.status:
draft → issued

Phase 02
invoice.status:
issued → paid

Phase 03
invoice.status:
paid → cancelled
```

The Agent MUST recognize this as one continuous lifecycle rather than three unrelated definitions.

---

# 15. Database Schema Gap Gate

This is a **mandatory hard gate**.

The Agent MUST compare:

```text
Phase data requirements
        VS
PROJECT/MD/database.md
```

Verify:

* Required tables exist.
* Required columns exist.
* Required relationships exist.
* Required foreign keys exist.
* Required indexes exist.
* Required states are represented.
* Required audit fields exist.
* Required soft-delete behavior exists.
* Required monetary fields follow project financial rules.

---

## 15.1 If Database Coverage Is Complete

Continue analysis.

```text
DATABASE_COVERAGE: PASS
```

---

## 15.2 If Database Coverage Is Missing

The Agent MUST NOT:

* Create a migration.
* Add a table.
* Add a column.
* Modify `database.md`.
* Invent a workaround.
* Continue toward implementation.

Instead:

```text
DATABASE_COVERAGE: FAIL

STATUS: BLOCKED

REQUIRED ACTION:

Return to:
prompts/03_database/design_database.md
```

The report MUST identify:

* Missing table.
* Missing column.
* Missing relationship.
* Missing index.
* Missing constraint.
* Missing lifecycle requirement.
* Source requirement from the phase that caused the gap.

The Agent MUST clearly state:

> The current phase cannot proceed to implementation because the approved database specification does not cover all required schema elements.

---

# 16. Architecture & Communication Analysis

The Agent MUST validate the phase architecture against:

```text
stack.yaml
architecture.communication.mode
```

---

## 16.1 Direct Mode

For:

```text
mode: direct
```

The Agent MUST verify that the phase uses the declared direct/server-rendered architecture.

For example:

```text
Request
  ↓
Middleware
  ↓
Controller
  ↓
Action / Service
  ↓
Repository / Model
  ↓
Database
  ↓
View / Inertia / Server Response
```

The Agent MUST flag unnecessary:

* REST API layers.
* API Resources.
* Bearer-token infrastructure.
* Duplicate API controllers.

unless explicitly required by the project.

---

## 16.2 API-First Mode

For:

```text
mode: api_first
```

Verify:

* API endpoints.
* API versioning.
* Authentication.
* Authorization.
* Request contracts.
* Response contracts.
* Resource/serializer layer.
* Stateless communication where applicable.
* Error response format.

---

## 16.3 Hybrid Mode

For:

```text
mode: hybrid
```

Verify the separation between:

```text
Web
    ↓
Direct presentation

API
    ↓
External / Mobile consumers
```

while preserving shared:

```text
Domain
Application
Actions
Services
Repositories
```

---

# 17. Universal Backend Architecture Validation

Where applicable, validate the following flow:

```text
Request
   ↓
Ingress / Middleware
   ↓
Authentication / Authorization
   ↓
Validation / DTO
   ↓
Thin Controller
   ↓
Domain Action / Application Service
   ↓
Transaction Boundary
   ↓
Repository / Persistence Layer
   ↓
Model / Database
   ↓
Response
```

The Agent MUST identify any deviation.

The Agent MUST NOT automatically change the architecture.

It must report the deviation and classify it as:

```text
COMPLIANT
WARNING
CONFLICT
BLOCKING
```

---

# 18. Frontend Capability Enforcement

If the phase contains frontend work, cross-check it against:

```text
PROJECT/MD/frontend_capabilities.yaml
```

For every capability marked:

```text
required
```

the Agent MUST verify that the phase specification explicitly accounts for it.

For every capability marked:

```text
disabled
```

the Agent MUST verify that the phase does not require or plan to use it.

For:

```text
enabled
optional
```

the Agent should identify relevant usage where applicable but MUST NOT invent requirements.

---

# 19. Security & Authorization Analysis

The Agent MUST analyze:

## 19.1 Authentication

Determine:

* Who must be authenticated.
* Which routes require authentication.
* Which operations are public.
* Which middleware applies.

## 19.2 Authorization

Determine:

* Roles.
* Permissions.
* Ownership rules.
* Tenant boundaries.
* Administrative privileges.

## 19.3 IDOR Prevention

For every resource accessed by identifier, verify:

```text
Can the authenticated actor access this resource?
```

The Agent MUST identify potential insecure direct object reference risks.

---

# 20. Data Integrity Analysis

The Agent MUST identify operations that can modify multiple related records.

Examples:

```text
Invoice
  ├── Invoice Items
  ├── Inventory
  └── Inventory Logs
```

If these must succeed or fail together, identify the required transaction boundary.

The Agent MUST identify:

* Atomic operations.
* Concurrency risks.
* Race conditions.
* Duplicate submissions.
* Idempotency requirements.
* State-transition conflicts.

---

# 21. Financial Integrity Analysis

If the phase handles money, verify:

```text
Integer minor units
+
Explicit currency
+
No FLOAT / DOUBLE
```

Verify:

* Price calculations.
* Tax calculations.
* Discounts.
* Totals.
* Rounding.
* Currency handling.
* Negative-value restrictions.
* Transaction boundaries.

Any conflict with global financial rules MUST be reported as blocking.

---

# 22. High-Risk Edge Case Analysis

The Agent MUST identify phase-specific edge cases including, where relevant:

* Duplicate requests.
* Concurrent updates.
* Race conditions.
* Invalid state transitions.
* Deleted resources.
* Missing relationships.
* Unauthorized access.
* Tenant boundary violations.
* Empty collections.
* Missing records.
* Partial failures.
* Transaction rollback.
* Network failures.
* Stale frontend state.
* Double submission.
* Invalid financial calculations.
* Precision/rounding issues.

Do NOT invent edge cases unrelated to the phase.

Only identify risks supported by the phase, global rules, architecture, or dependency analysis.

---

# 23. Target File & Component Topology

The Agent MUST classify expected implementation impact.

Use:

```text
[NEW]
[MODIFY]
[DELETE]
[READ-ONLY]
[N/A]
```

Possible layers include:

```text
Backend
Frontend
Routes
Actions
Services
DTOs
Repositories
Models
Events
Listeners
Policies
Middleware
Tests
Configuration
Documentation
```

The Agent MUST distinguish:

```text
Expected implementation changes
```

from:

```text
Files merely inspected or depended upon
```

Do NOT claim that a file will be modified unless the specification supports that conclusion.

---

# 24. Scope Boundary Analysis

The Agent MUST explicitly define:

## In Scope

Everything that MUST be delivered by this phase.

## Out of Scope

Everything intentionally deferred to another phase.

## Shared Dependencies

Capabilities that belong to another phase but are required by this phase.

## Future Dependencies

Capabilities this phase must expose or preserve for future phases.

---

# 25. Testing Strategy

The Agent MUST map requirements to tests.

## 25.1 Unit Tests

Identify:

* Domain rules.
* Business calculations.
* Validation.
* State transitions.
* DTO transformations.
* Services/actions.

## 25.2 Feature Tests

Identify:

* HTTP requests.
* Authentication.
* Authorization.
* Validation.
* Database changes.
* Responses.
* Redirects.
* Events.

## 25.3 Integration Tests

Identify:

* Cross-module workflows.
* Multiple repository interactions.
* External integrations.
* Transaction boundaries.

## 25.4 E2E Tests

Only when required by the project.

Identify:

* Critical user journeys.
* Frontend/backend integration.
* Browser workflows.

## 25.5 Security Tests

Where applicable:

* Unauthorized access.
* IDOR.
* Permission bypass.
* Tenant isolation.
* Input manipulation.

---

# 26. Definition of Done

The Agent MUST derive the Definition of Done from the actual phase specifications.

It MUST NOT blindly assume a fixed number of criteria.

The final DoD MUST cover, where applicable:

```text
Functional behavior
Business rules
Database integrity
Authorization
Frontend behavior
Responsive behavior
RTL behavior
Testing
Error handling
Performance
Documentation
```

Every DoD item must be traceable to a specification source.

---

# 27. Phase Readiness Decision

After completing the analysis, classify the phase as exactly one of:

```text
READY_FOR_EXECUTION
BLOCKED
```

---

## READY_FOR_EXECUTION

Use only when:

* Required documentation exists.
* Previous required phases are complete.
* Database coverage is complete.
* No unresolved blocking conflicts exist.
* Communication architecture is compliant.
* Security requirements are understood.
* Frontend policy is compliant where applicable.
* Test strategy is defined.
* Scope boundaries are clear.

---

## BLOCKED

Use when one or more blocking conditions exist.

Examples:

```text
Required previous phase incomplete
Missing database schema requirement
Conflicting business rules
Missing required phase specification
Invalid communication architecture
Security requirement unresolved
Contradictory state machine
Unresolved cross-phase dependency
```

When blocked, the Agent MUST stop.

It MUST NOT recommend implementation until the blocker is resolved.

---

# 28. Phase Impact Analysis Report

Generate the final report using exactly this structure:

````markdown
# Phase Impact Analysis: [Phase ID - Phase Title]

> **Target Phase:** `PROJECT/MD/phases/[phase_name]/`
>
> **Analysis Status:** `[READY_FOR_EXECUTION | BLOCKED]`
>
> **Active Execution Engine:** `[Engine from execution_engine.yaml]`
>
> **Communication Mode:** `[direct | api_first | hybrid]`

---

## 1. Executive Summary

### Phase Goal

[Clear summary of the phase objective.]

### Business Outcome

[What business capability this phase delivers.]

### Analysis Decision

[READY_FOR_EXECUTION or BLOCKED]

### Blocking Issues

- [None / issue]

---

## 2. Scope Definition

### In Scope

- [Deliverable]

### Out of Scope

- [Excluded capability]

### Shared Dependencies

- [Dependency]

### Future Dependencies

- [Future phase dependency]

---

## 3. Prerequisite & Cross-Phase Analysis

| Dependency | Type | Required Status | Actual Status | Result |
| :--- | :--- | :--- | :--- | :--- |
| `[Phase]` | Previous Phase | COMPLETED | `[status]` | PASS / FAIL |
| `[Schema]` | Database | IMPLEMENTED | `[status]` | PASS / FAIL |
| `[Phase]` | Future Dependency | Compatible | `[result]` | PASS / WARNING |

---

## 4. Specification Coverage

| Specification | Status | Findings |
| :--- | :--- | :--- |
| `stack.yaml` | PASS / FAIL | [Findings] |
| `business_rules.md` | PASS / FAIL | [Findings] |
| `design_rules.md` | PASS / N/A | [Findings] |
| `database.md` | PASS / FAIL | [Findings] |
| `frontend_capabilities.yaml` | PASS / N/A | [Findings] |
| `execution_engine.yaml` | PASS | [Engine] |

---

## 5. Phase Documentation Coverage

| Document | Applicable | Present | Status |
| :--- | :--- | :--- | :--- |
| `README.md` | Yes | Yes | PASS |
| `backend.md` | Yes | Yes | PASS |
| `frontend.md` | Yes | Yes | PASS |
| `routes.md` | Yes | Yes | PASS |
| `data.md` | Yes | Yes | PASS |
| `testing.md` | Yes | Yes | PASS |
| `checklist.md` | Yes | Yes | PASS |

---

## 6. Database Coverage Gate

### Required Database Elements

| Requirement | Source | Present in `database.md` | Status |
| :--- | :--- | :--- | :--- |
| `[Table]` | `data.md` | Yes / No | PASS / FAIL |
| `[Column]` | `backend.md` | Yes / No | PASS / FAIL |
| `[Relationship]` | `data.md` | Yes / No | PASS / FAIL |

### Database Decision

`DATABASE_COVERAGE: [PASS | FAIL]`

If FAIL:

> **BLOCKING:** The phase requires schema elements that are not represented in the approved `database.md`. No implementation may proceed. The database specification must be reviewed through `prompts/03_database/design_database.md`.

---

## 7. Cross-Phase Data & Workflow Analysis

### Shared Entities

| Entity | Previous Phases | Current Phase | Future Phases |
| :--- | :--- | :--- | :--- |
| `[Entity]` | `[phases]` | `[usage]` | `[phases]` |

### State Lifecycle

```text
[State] → [State] → [State]
````

### Cross-Phase Risks

* [Risk]
* [Risk]

---

## 8. Affected File Topology

| Action     | File Path      | Layer     | Purpose   |
| :--------- | :------------- | :-------- | :-------- |
| `[NEW]`    | `[path]`       | `[layer]` | [Purpose] |
| `[MODIFY]` | `[path]`       | `[layer]` | [Purpose] |
| `[DELETE]` | `[path]`       | `[layer]` | [Purpose] |
| `[N/A]`    | `[path/layer]` | `[layer]` | [Reason]  |

---

## 9. Architectural Flow

```text
Request
   ↓
Middleware
   ↓
Authentication / Authorization
   ↓
Validation / DTO
   ↓
Thin Controller
   ↓
Domain Action / Service
   ↓
Transaction Boundary
   ↓
Repository / Persistence
   ↓
Database
   ↓
Response
```

[Adapt this flow to the actual project architecture.]

---

## 10. Communication Architecture Compliance

### Mode

`[direct | api_first | hybrid]`

### Validation

* [Finding]
* [Finding]

### Architecture Result

`PASS / WARNING / FAIL`

---

## 11. Frontend Capability Compliance

### Required Capabilities

* `[Capability]`

### Disabled Capabilities

* `[Capability]`

### Result

`PASS / N/A / FAIL`

---

## 12. Security & Authorization

| Security Concern | Requirement   | Phase Handling | Status      |
| :--------------- | :------------ | :------------- | :---------- |
| Authentication   | [Requirement] | [Handling]     | PASS / FAIL |
| Authorization    | [Requirement] | [Handling]     | PASS / FAIL |
| Tenant Isolation | [Requirement] | [Handling]     | PASS / FAIL |
| IDOR Prevention  | [Requirement] | [Handling]     | PASS / FAIL |

---

## 13. Data Integrity & Transaction Boundaries

| Operation     | Related Data        | Transaction Required | Reason   |
| :------------ | :------------------ | :------------------- | :------- |
| `[Operation]` | `[Tables/entities]` | Yes / No             | [Reason] |

---

## 14. Financial Integrity

### Applicable

`YES / NO`

If applicable:

* Integer minor-unit storage confirmed.
* Currency handling confirmed.
* Zero floating-point financial values confirmed.
* Rounding rules identified.
* Transaction boundaries identified.

### Result

`PASS / N/A / FAIL`

---

## 15. High-Risk Edge Cases

| Risk / Edge Case | Impact              | Mitigation   |
| :--------------- | :------------------ | :----------- |
| `[Risk]`         | High / Medium / Low | [Mitigation] |

---

## 16. Testing & Verification Strategy

### Unit Tests

* [Test]

### Feature Tests

* [Test]

### Integration Tests

* [Test]

### E2E Tests

* [Test / N/A]

### Security Tests

* [Test]

### Static Analysis / Linting

* `[Command/tool derived from stack.yaml]`

---

## 17. Definition of Done

* [ ] [Criterion]
* [ ] [Criterion]
* [ ] [Criterion]
* [ ] [Criterion]

All criteria MUST be derived from the phase specifications and global project rules.

---

## 18. Final Readiness Decision

### Status

`READY_FOR_EXECUTION`

OR

`BLOCKED`

### Blocking Issues

* [None / issue]

### Required Developer Actions

* [Action]

````

---

# 29. Mandatory Hard Stop

After producing the Phase Impact Analysis Report, the Agent MUST STOP.

The Agent MUST NOT:

- Write code.
- Modify files.
- Create migrations.
- Execute tests.
- Invoke the Execution Engine.
- Start `execute_phase.md`.

The developer must explicitly review the analysis.

---

# 30. Developer Approval Gate

If the status is:

```text
READY_FOR_EXECUTION
````

the Agent MUST request explicit approval:

> **Phase Impact Analysis for `<phase_name>` is complete.**
>
> Please review the scope, cross-phase dependencies, database coverage, architectural flow, affected files, security requirements, edge cases, testing strategy, and Definition of Done.
>
> Reply with **APPROVED** to proceed to:
>
> `prompts/04_phases/execute_phase.md`
>
> or specify the required adjustments.

If the developer does not provide explicit approval:

```text
STOP
```

---

# 31. Blocking Gate — Database Schema Conflict

If the status is:

```text
BLOCKED
```

because the phase requires database elements that are not represented in the approved schema, the Agent MUST explicitly state:

> **DATABASE SCHEMA GAP DETECTED**
>
> The current phase cannot proceed to implementation because the approved `PROJECT/MD/database.md` does not fully represent the data requirements discovered during phase analysis.
>
> The Agent MUST NOT modify the schema or create migrations.
>
> Required next step:
>
> `prompts/03_database/design_database.md`
>
> After the database blueprint is updated and explicitly approved, the phase MUST be analyzed again before execution.

---

# 32. Blocking Gate — Cross-Phase Conflict

If the Agent discovers a contradiction between phases, it MUST NOT select a winner automatically.

Example:

```text
Phase 02:
invoice.status = issued

Phase 04:
invoice.status = approved
```

The Agent MUST report:

```text
CROSS_PHASE_CONFLICT
```

and identify:

* Conflicting phases.
* Conflicting definitions.
* Affected entity.
* Potential downstream impact.
* Required developer decision.

Then:

```text
STATUS: BLOCKED
STOP
```

---

# 33. Blocking Gate — Business Rule Conflict

If:

```text
Phase Specification
        VS
Global business_rules.md
```

contains a conflict:

```text
STATUS: BLOCKED
```

The Agent MUST NOT override the global business rule.

The conflict must be explicitly reported to the developer.

---

# 34. No Invention Policy

The Agent MUST follow this rule throughout the entire analysis:

```text
If documented:
    Analyze it.

If implied by documented architecture:
    Identify it as an inference.

If uncertain:
    Mark as unresolved.

If missing:
    Report it.

If conflicting:
    Block.

NEVER invent.
NEVER silently assume.
NEVER modify specifications.
```

Any inference MUST be explicitly labeled:

```text
INFERENCE
```

and must identify the specification evidence supporting it.

---

# 35. Final Execution Boundary

This prompt ends at:

```text
PHASE ANALYSIS
      ↓
DEVELOPER REVIEW
      ↓
APPROVED
```

Only after explicit approval may the next prompt be invoked:

```text
prompts/04_phases/execute_phase.md
```

The complete lifecycle is:

```text
┌──────────────────────────────┐
│       PROJECT INITIALIZATION │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│    REVIEW PROJECT CONFIG     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│     ANALYZE PROJECT RULES    │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│       DESIGN DATABASE        │
│                              │
│ Global Rules                 │
│ + All Phase Requirements     │
│ + Cross-Phase Dependencies   │
└──────────────┬───────────────┘
               ↓
          DEVELOPER
          APPROVAL
               ↓
┌──────────────────────────────┐
│      IMPLEMENT DATABASE      │
└──────────────┬───────────────┘
               ↓
       DATABASE READY
               ↓
┌──────────────────────────────┐
│         ANALYZE PHASE        │
│                              │
│ Global Specs                 │
│ + Phase Specs                │
│ + Previous Phases            │
│ + Future Dependencies        │
│ + Database Blueprint         │
│ + Architecture               │
│ + Security                   │
│ + Frontend Policy            │
│ + Testing                    │
└──────────────┬───────────────┘
               ↓
       READINESS GATE
          ↙       ↘
     BLOCKED      READY
        ↓            ↓
  Resolve Issue   DEVELOPER
        ↓          APPROVAL
        └──────┬─────┘
               ↓
┌──────────────────────────────┐
│        EXECUTE PHASE         │
└──────────────────────────────┘
```

**END OF PROMPT**
