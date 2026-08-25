# Analyze Project Rules

> **Purpose:** Ingest, analyze, and synthesize the project's authoritative domain specifications before database design, database implementation, or functional phase execution begins.

> **Execution Role:** Domain & System Analyst

> **Target Specification:** `PROJECT/MD/`

> **Core Principle:** Domain comprehension precedes physical execution. The Agent must build an evidence-based understanding of the project's business rules, conceptual data model, design constraints, system vision, and critical workflows without inventing undocumented requirements.

---

# 1. Agent Constraints & Operational Scope

## 1.1 Strict Read-Only Analytical Mode

This prompt operates in **strict read-only mode**.

The Agent MUST:

* Read and analyze the project specifications.
* Cross-reference related documents.
* Extract documented domain terminology, business rules, entities, relationships, workflows, permissions, and constraints.
* Identify contradictions, ambiguities, missing specifications, and unresolved decisions.
* Produce a unified Domain & Technical Synthesis report.
* Clearly distinguish documented facts from identified gaps.

The Agent MUST NOT:

* Modify any project specification file.
* Modify `stack.yaml`.
* Modify `frontend_capabilities.yaml`.
* Modify `execution_engine.yaml`.
* Create or modify `database.md`.
* Generate application source code.
* Generate database migrations or physical tables.
* Execute application code or tests.
* Invoke the Execution Engine.
* Start any implementation phase.
* Invent business rules, entities, relationships, permissions, or technical requirements.

---

## 1.2 Responsibility Boundary

This prompt is responsible for **understanding and synthesizing the project specifications**.

It is NOT responsible for:

* Project initialization.
* Technology selection.
* Communication architecture selection.
* Frontend capability configuration.
* Execution engine selection.
* Configuration auditing.
* Database schema design.
* Database implementation.
* Phase planning or execution.

Those responsibilities belong to their respective prompts.

---

# 2. Canonical Context Ingestion

The Agent MUST inspect the following project-level sources.

## 2.1 Project Configuration Context

Read:

* `PROJECT/MD/stack.yaml`
* `PROJECT/MD/frontend_capabilities.yaml` when applicable
* `PROJECT/MD/execution_engine.yaml`

These files provide the technical context in which the domain operates.

The Agent MUST NOT reconfigure or modify these files.

The Agent MUST NOT repeat the full configuration audit performed by:

`prompts/01_project_initialization/review_project_configuration.md`

Instead, use their resolved values as contextual constraints when analyzing the domain.

At minimum, identify:

* Backend technology.
* Frontend technology, if any.
* Database technology.
* Runtime.
* Testing stack.
* Communication architecture:

  * `direct`
  * `api_first`
  * `hybrid`
* Relevant consumers.
* Active execution engine.

---

# 3. Global Domain Specification Analysis

The Agent MUST analyze the following authoritative specification pillars.

---

## Pillar 1 — Business Rules

### Source

`PROJECT/MD/business_rules.md`

Extract and synthesize:

### 1.1 Ubiquitous Domain Language

Identify:

* Domain terminology.
* Canonical names.
* Business concepts.
* Synonyms that must not be confused.
* Naming conventions used throughout the project.

### 1.2 Business Invariants

Identify:

* Non-negotiable business rules.
* Validation constraints.
* Mathematical rules and formulas.
* Uniqueness requirements.
* Required conditions.
* Forbidden conditions.
* Business constraints that must never be violated.

### 1.3 Workflows & State Transitions

Identify:

* Entity lifecycle states.
* Valid state transitions.
* Transition prerequisites.
* Validation guards.
* Trigger conditions.
* Side effects.
* Reversal/cancellation/restore behavior when documented.
* Irreversible operations.

Do not invent states or transitions that are not documented.

### 1.4 Authorization & Security Boundaries

Identify:

* Roles.
* Permissions.
* Ownership rules.
* Tenant boundaries.
* Resource access restrictions.
* Actions restricted to specific actors.

---

# 4. Data Specification Analysis

## Source

`PROJECT/MD/data.md`

Extract and synthesize:

## 4.1 Conceptual Entities

Identify:

* Core entities.
* Aggregate roots.
* Supporting entities.
* Value objects when explicitly documented.
* Entity ownership boundaries.

Do not convert conceptual entities into physical tables at this stage.

## 4.2 Relationships

Identify documented relationships:

* `1:1`
* `1:N`
* `N:M`
* Parent/child relationships.
* Ownership relationships.
* Dependency relationships.

Record relationship semantics exactly as supported by the documentation.

## 4.3 Data Lifecycle

Identify:

* Creation rules.
* Update rules.
* Deletion rules.
* Soft-delete requirements.
* Hard-delete restrictions.
* Restore behavior.
* Archival requirements.
* Retention requirements.
* Audit requirements.

## 4.4 Data Integrity

Identify:

* Uniqueness constraints.
* Referential integrity requirements.
* Required fields.
* Immutable fields.
* Transaction boundaries.
* Atomic operations.
* Concurrency-sensitive operations.

## 4.5 Financial & Precision Rules

When applicable, identify:

* Monetary representation.
* Minor-unit/cents requirements.
* Currency handling.
* Decimal precision.
* Zero-float requirements.
* Rounding rules.
* Financial transaction boundaries.

---

# 5. Design Rules Analysis

## Source

`PROJECT/MD/design_rules.md`

Extract only the design constraints relevant to understanding the system.

## 5.1 Visual Identity

Identify:

* Colors.
* Typography.
* Spacing.
* Radius.
* Shadows.
* Component styling.
* Semantic visual states.

## 5.2 Directionality

Identify:

* RTL/LTR requirements.
* Logical spacing rules.
* Direction-aware components.
* Mirroring requirements.

## 5.3 Responsive Behavior

Identify:

* Supported viewport categories.
* Breakpoints.
* Mobile behavior.
* Tablet behavior.
* Desktop behavior.
* Layout adaptation rules.

## 5.4 Accessibility & UX

Identify documented requirements such as:

* Contrast.
* Keyboard navigation.
* Focus states.
* Touch targets.
* Accessibility constraints.

Do not invent additional design requirements.

---

# 6. Project Vision & Roadmap Analysis

## Source

`PROJECT/MD/README.md`

Extract:

## 6.1 System Purpose

Identify:

* Problem being solved.
* Primary system purpose.
* Main capabilities.
* Target users/personas when documented.

## 6.2 Functional Scope

Identify:

* Major functional areas.
* Major modules.
* Documented system boundaries.

## 6.3 Phase Roadmap

Identify:

* Defined phases.
* Phase ordering.
* High-level objectives.
* Explicit dependencies.
* Prerequisites.

Do not plan or execute phases.

---

# 7. Cross-Document Consistency Analysis

After ingesting the specifications, cross-reference them.

The Agent MUST identify:

### 7.1 Business ↔ Data Consistency

Check whether:

* Business rules reference entities absent from `data.md`.
* Data entities have no documented business purpose.
* Relationships conflict with business rules.
* Lifecycle rules conflict with documented data lifecycle behavior.
* Business invariants require data constraints that are not represented conceptually.

### 7.2 Business ↔ Authorization Consistency

Check whether:

* Business actions have corresponding documented permissions.
* Restricted operations have documented authorization boundaries.
* Ownership rules conflict with role permissions.

### 7.3 Data ↔ Financial Integrity

Check whether:

* Financial entities have explicit precision rules.
* Monetary operations have transaction requirements.
* Critical financial workflows have documented atomicity requirements.

### 7.4 Configuration ↔ Domain Consistency

Use `stack.yaml` as the authoritative technical context.

Identify only obvious contextual mismatches such as:

* Domain documentation explicitly requires an API consumer while communication architecture declares `direct`.
* Domain documentation explicitly describes frontend behavior while no frontend is declared.
* Documented consumers conflict with declared communication consumers.

Do NOT modify configuration.

Do NOT decide the correction automatically.

Report the discrepancy for developer resolution.

### 7.5 Design ↔ Product Consistency

Identify documented conflicts between:

* Product requirements.
* UI behavior.
* Responsive requirements.
* Accessibility requirements.
* RTL requirements.

---

# 8. Ambiguity & Missing Specification Detection

The Agent MUST explicitly identify unresolved issues.

Examples include:

* Business rule references an undefined entity.
* Entity has no documented purpose.
* Relationship cardinality is unclear.
* State transition has no documented authorization.
* Deletion behavior is unspecified.
* Financial precision is unspecified.
* API behavior is referenced but not defined.
* A required consumer is not documented.
* Critical business workflow has missing edge cases.

For every issue, report:

| Issue   | Source         | Impact                     | Required Clarification   |
| :------ | :------------- | :------------------------- | :----------------------- |
| [Issue] | [File/Section] | [Low/Medium/High/Critical] | [Question for developer] |

The Agent MUST NOT resolve these ambiguities by assumption.

---

# 9. Domain & Technical Synthesis Report

Produce the final analysis using the following structure.

## Section 1 — Executive Domain Summary

Provide:

* System purpose.
* Primary users/personas.
* Major functional capabilities.
* System boundaries.
* Communication architecture context.

---

## Section 2 — Technology Context

Summarize the already-declared technical environment:

| Dimension          | Declared Value                |
| :----------------- | :---------------------------- |
| Backend            | [Value]                       |
| Frontend           | [Value / N/A]                 |
| Database           | [Value]                       |
| Runtime            | [Value]                       |
| Testing            | [Value]                       |
| Communication Mode | [direct / api_first / hybrid] |
| Consumers          | [Declared consumers]          |
| Execution Engine   | [Engine]                      |

This is a contextual summary only.

The Agent MUST NOT change these values.

---

## Section 3 — Core Domain Entities

Produce:

| Entity   | Role   | Relationships   | Lifecycle | Key Invariants |
| :------- | :----- | :-------------- | :-------- | :------------- |
| [Entity] | [Role] | [Relationships] | [States]  | [Rules]        |

Only include entities supported by the documentation.

---

## Section 4 — Critical Business Workflows

For each documented critical workflow, provide:

1. Initial state.
2. Valid transitions.
3. Preconditions.
4. Authorization requirements.
5. Business invariants.
6. Side effects.
7. Reversal/cancellation/restore behavior.
8. High-risk edge cases.

---

## Section 5 — Data Integrity & Transactional Constraints

Summarize:

* Referential integrity.
* Uniqueness.
* Required fields.
* Immutable data.
* Soft-delete behavior.
* Restore behavior.
* Audit requirements.
* Transaction boundaries.
* Financial precision.
* Concurrency-sensitive operations.

---

## Section 6 — Design & UX Constraints

Summarize the design constraints that affect implementation:

* Visual identity.
* Typography.
* Directionality.
* Responsive behavior.
* Accessibility.
* Critical UX invariants.

---

## Section 7 — Conflicts, Ambiguities & Gaps

List every unresolved issue.

Use:

| ID      | Severity | Source   | Issue   | Required Developer Decision |
| :------ | :------- | :------- | :------ | :-------------------------- |
| GAP-001 | Critical | [Source] | [Issue] | [Decision]                  |

Severity:

* `Critical`
* `High`
* `Medium`
* `Low`

---

# 10. Database Decision Gate

After completing the domain analysis, inspect:

`PROJECT/MD/database.md`

The purpose of this gate is to determine whether the project's authoritative database blueprint already exists.

## Path A — `database.md` Exists and Is Complete

If `database.md` exists and contains a sufficiently defined and internally consistent database specification:

Report:

`DATABASE_STATUS: BLUEPRINT_AVAILABLE`

Then recommend:

`prompts/03_database/implement_database.md`

The Agent MUST NOT redesign the database.

The Agent MUST NOT modify `database.md`.

---

## Path B — `database.md` Does Not Exist

If `database.md` does not exist:

Report:

`DATABASE_STATUS: BLUEPRINT_MISSING`

Then recommend:

`prompts/03_database/design_database.md`

The purpose of the next prompt is to transform the analyzed domain model into an authoritative database blueprint and obtain developer approval.

---

## Path C — `database.md` Exists but Is Incomplete

If `database.md` exists but is incomplete, ambiguous, or insufficiently specified:

Report:

`DATABASE_STATUS: BLUEPRINT_INCOMPLETE`

List the exact missing or ambiguous areas.

Recommend:

`prompts/03_database/design_database.md`

The Agent MUST NOT silently complete or modify `database.md`.

---

# 11. Final Decision

Produce one of the following outcomes.

## `ANALYSIS_COMPLETE`

Use when:

* Domain specifications were successfully analyzed.
* No critical unresolved ambiguity blocks the next stage.
* Database status has been determined.

Then provide the appropriate database next step:

* `implement_database.md`
* OR `design_database.md`

## `ANALYSIS_BLOCKED`

Use when:

* Critical business ambiguity exists.
* Critical data relationship is undefined.
* Critical authorization rule is missing.
* A contradiction prevents reliable domain understanding.

In this case:

* List all blocking issues.
* Identify the required developer decisions.
* Do not recommend implementation.
* Stop.

---

# 12. Mandatory Stop Condition

After presenting the synthesis report:

**STOP.**

Do not:

* Design the database.
* Implement the database.
* Create migrations.
* Create tables.
* Start a phase.
* Write application code.
* Invoke the Execution Engine.

Wait for the developer to review the analysis and explicitly proceed to the appropriate next prompt.
