# Design Database

> **Execution Role:** Database Specification Designer & Schema Architect
> **Target Specification:** `PROJECT/MD/database.md`
> **Core Principle:** Specification precedes implementation. The database schema MUST be derived from the complete project specification and lifecycle requirements, not from isolated files or a single phase.

---

## 1. Purpose

This prompt is responsible for designing or updating the authoritative database schema blueprint:

`PROJECT/MD/database.md`

The objective is to determine the **complete database structure required by the project before implementation begins**, while preserving the project's business rules, domain model, architecture, and future phase requirements.

The Agent MUST design the database from the **complete project context**, not merely from `data.md`.

The database schema must represent the project's known entities, relationships, lifecycle states, transactions, historical records, permissions, audit requirements, and cross-phase dependencies.

---

# 2. Trigger Condition & Database Design Gate

First determine the current state of:

`PROJECT/MD/database.md`

```text
Does an approved and complete database.md already exist?

        │
        ├── YES — APPROVED
        │       │
        │       └── STOP
        │
        │           Do NOT redesign the database.
        │           Proceed to:
        │           prompts/03_database/implement_database.md
        │
        └── NO — Missing / Draft / Incomplete
                │
                └── EXECUTE THIS PROMPT
```

If `database.md` exists but is marked `DRAFT_FOR_REVIEW`, it may be updated.

If `database.md` is marked `APPROVED`, this prompt MUST NOT modify it.

---

# 3. Agent Authority & Hard Boundaries

## 3.1 Write Authority

The Agent MAY write ONLY:

`PROJECT/MD/database.md`

The Agent MUST NOT modify:

* `stack.yaml`
* `business_rules.md`
* `data.md`
* `design_rules.md`
* `README.md`
* phase specifications
* frontend capabilities
* execution engine configuration
* framework files
* application source code

---

## 3.2 No Physical Implementation

This prompt designs the **database specification only**.

The Agent MUST NOT:

* create migrations
* create physical tables
* execute SQL
* modify a live database
* create models
* create repositories
* create controllers
* create services
* invoke the Execution Engine
* begin implementation phases

Physical implementation belongs exclusively to:

`prompts/03_database/implement_database.md`

---

# 4. Database Discovery Strategy

The database MUST be designed using a **Complete Project Specification Discovery** process.

Do NOT assume that `data.md` contains every database requirement.

The Agent MUST inspect the project specification hierarchy and progressively build a complete database requirement model.

The discovery priority is:

```text
                    PROJECT/MD/
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    Governance        Domain          Project Vision
        │                │                │
   stack.yaml      business_rules.md   README.md
        │           data.md
        │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                  Phase Specifications
                         │
                         ▼
              Cross-Phase Requirements
                         │
                         ▼
              Database Requirement Model
                         │
                         ▼
                Schema Design Blueprint
                         │
                         ▼
                    database.md
```

The Agent MUST NOT treat phases as isolated database requests.

Instead, it MUST analyze all known phases and derive their **combined persistent-data requirements**.

---

# 5. Mandatory Source Inspection

The Agent MUST inspect the following sources.

## 5.1 Project Stack

Read:

`PROJECT/MD/stack.yaml`

Extract:

* database engine
* database version
* identifier strategy
* architecture
* communication mode
* backend technology
* relevant persistence technologies
* storage-related technologies
* caching or queue technologies when they affect persistence
* testing requirements affecting database behavior

The database design MUST remain compatible with the declared stack.

The Agent MUST NOT change the stack.

---

# 6. Business Rules Analysis

Read:

`PROJECT/MD/business_rules.md`

Extract every rule that can affect persistence.

Identify:

* business entities
* unique business identifiers
* mandatory fields
* optional fields
* status values
* state transitions
* validation rules
* ownership rules
* tenant boundaries
* authorization boundaries
* financial rules
* inventory rules
* transaction boundaries
* historical records
* audit requirements
* deletion restrictions
* archival requirements
* temporal rules
* relationships implied by business operations

For every business rule, determine:

```text
Does this rule require database representation?

        │
        ├── YES → map it to schema requirements
        │
        └── NO  → keep it as application-level rule
```

Do NOT force every business rule into a database constraint if the rule cannot safely or correctly be represented at database level.

---

# 7. Conceptual Data Model Analysis

Read:

`PROJECT/MD/data.md`

Extract:

* entities
* aggregate roots
* attributes
* relationships
* cardinalities
* ownership
* lifecycle
* soft deletion
* archival
* audit requirements
* historical data
* reference data
* lookup data
* transactional data

Use `data.md` as the **conceptual data foundation**, but NOT as the only database source.

---

# 8. Complete Phase Discovery

The Agent MUST inspect the project's phase specifications.

Locate the phase specification directory defined by the project structure, typically:

`PROJECT/MD/phases/`

Read the phase documentation available there.

At minimum, inspect:

* phase overview
* phase requirements
* phase business rules
* phase data requirements
* phase dependencies
* phase workflows
* phase acceptance criteria

If phases contain additional referenced specification files, follow those references when necessary to understand their database requirements.

---

# 9. Cross-Phase Database Analysis

This is a mandatory step.

The Agent MUST NOT design a database phase-by-phase independently.

Instead, build a **Cross-Phase Data Dependency Matrix**.

For every phase, identify:

| Phase   | Entities | New Attributes | New Relationships | Persistent Events | Historical Data | Dependencies |
| :------ | :------- | :------------- | :---------------- | :---------------- | :-------------- | :----------- |
| Phase X | ...      | ...            | ...               | ...               | ...             | ...          |

Then consolidate all phases.

The Agent MUST identify:

### 9.1 Shared Entities

Entities referenced by multiple phases.

These MUST be designed as shared domain structures rather than duplicated tables.

### 9.2 Phase-Introduced Attributes

Attributes introduced by later phases.

Determine whether they belong on:

* an existing table
* a related table
* a historical table
* a specialized entity

Do NOT automatically create a new table simply because a phase introduces a new field.

### 9.3 Cross-Phase Relationships

Identify relationships where:

```text
Phase A creates Entity X
        ↓
Phase B modifies Entity X
        ↓
Phase C creates historical records for Entity X
```

The database MUST support the complete lifecycle.

### 9.4 Historical Requirements

If a later phase requires historical information that cannot safely be reconstructed from the current state, explicitly model the required history/audit structure.

### 9.5 Future Phase Compatibility

Do NOT invent speculative tables for undocumented future features.

However, if all currently documented phases clearly require a shared structure, that structure MUST be designed now.

---

# 10. Phase Requirement Consolidation

After analyzing all phases, create an internal consolidated model:

```text
Project
   │
   ├── Domain Entities
   │
   ├── Shared Entities
   │
   ├── Transactional Entities
   │
   ├── Historical / Audit Entities
   │
   ├── Reference Entities
   │
   ├── Relationships
   │
   ├── State Machines
   │
   └── Cross-Phase Dependencies
```

The Agent MUST verify that every persistent requirement from the documented phases has a database representation where required.

---

# 11. Database Requirement Classification

Every discovered data requirement MUST be classified as one of:

### A. Persistent Entity

Requires a database table or equivalent persistent structure.

### B. Entity Attribute

Belongs to an existing entity.

### C. Relationship

Requires a foreign key, junction table, embedded structure, or equivalent relationship representation.

### D. Historical Record

Requires historical persistence because current state alone is insufficient.

### E. Audit Record

Requires traceability of an operation or change.

### F. Reference Data

Stable lookup or configuration data.

### G. Derived Data

Can be calculated from existing data and SHOULD NOT automatically become a persisted column/table.

### H. Runtime State

Does not require permanent database persistence unless explicitly required.

This classification prevents unnecessary table proliferation.

---

# 12. Anti-Table-Proliferation Rule

The Agent MUST NOT create a new table simply because:

* a field exists
* a phase mentions a concept
* a UI screen exists
* a report exists
* a calculation exists
* an API response contains a nested object

Before creating a table, determine:

```text
Does this represent an independent persistent entity,
relationship, historical record, audit record, or reference dataset?

        │
        ├── YES → table may be justified
        │
        └── NO  → prefer existing entity / attribute / derived value
```

Every table MUST have a documented business purpose.

---

# 13. Schema Design

After complete discovery and consolidation, design the physical-ready schema.

For every table define:

## 13.1 Table Identity

* table name
* business purpose
* owning domain entity
* source requirements
* phases using the table

## 13.2 Primary Key

Choose according to:

* `stack.yaml`
* framework standards
* existing project conventions
* entity identity requirements

Supported strategies may include:

* BIGINT
* UUID
* ULID
* other strategy explicitly declared by the project

Do NOT arbitrarily change the project's identifier strategy.

## 13.3 Columns

For every column specify:

* name
* type
* nullability
* default
* constraints
* business meaning

Use database-engine-appropriate types.

## 13.4 Foreign Keys

For every relationship specify:

* source column
* target table
* target column
* ON DELETE
* ON UPDATE

Use safe referential actions according to business lifecycle requirements.

## 13.5 Constraints

Define where appropriate:

* NOT NULL
* UNIQUE
* CHECK
* DEFAULT
* foreign key constraints

Constraints MUST reflect documented business invariants.

Do not invent undocumented restrictions.

---

# 14. Financial Data Rules

For every financial requirement, inspect the project's actual business and stack rules.

If monetary values are required:

* use integer minor units where the project's financial policy requires it
* never use FLOAT or DOUBLE for monetary storage
* explicitly store currency where required
* preserve precision requirements from the project specification

Do not impose a currency default such as USD unless the project explicitly defines it.

---

# 15. Index Design

Indexes MUST be derived from:

* foreign keys
* unique business identifiers
* documented search requirements
* documented filtering requirements
* documented sorting requirements
* phase workflows
* high-frequency relational queries explicitly implied by the specifications

Avoid speculative indexes.

Every non-trivial index SHOULD have a documented reason.

---

# 16. Lifecycle & Deletion Design

For every persistent entity determine:

```text
Create
  ↓
Active Lifecycle
  ↓
Update
  ↓
Cancel / Archive / Delete
  ↓
Historical State
```

Determine from the specifications whether the entity requires:

* hard delete
* soft delete
* archive
* status-based deactivation
* immutable history
* audit logging

Never introduce soft deletion merely because it is convenient.

---

# 17. State & Workflow Persistence

For every documented state machine determine:

* current state storage
* valid state values
* transition history requirements
* actor tracking
* timestamps
* related transaction records
* rollback/recovery requirements

If historical transitions are required by business rules, the schema MUST provide a persistent representation.

---

# 18. Transactional Integrity

Identify operations spanning multiple tables.

For each operation determine whether it requires an atomic transaction.

Examples include:

```text
Create Order
    ├── Order
    ├── Order Items
    └── Inventory Changes

Cancel Order
    ├── Order State
    ├── Inventory Restoration
    └── Audit History
```

The schema MUST support the required transactional boundaries.

---

# 19. Database Completeness Verification

Before writing the final blueprint, perform a reverse verification.

For every documented persistent requirement ask:

```text
Requirement
    ↓
Entity?
    ↓
Table?
    ↓
Column / Relationship?
    ↓
Constraint?
    ↓
Index?
    ↓
Lifecycle?
    ↓
Historical requirement?
```

Then perform the reverse check:

```text
Every table
    ↓
Has documented business purpose?
    ↓
Has source requirement?
    ↓
Used by at least one documented domain/phase requirement?
```

If a table cannot be justified, flag it before adding it.

---

# 20. Missing or Conflicting Requirements

If specifications conflict:

* DO NOT silently choose one.
* Identify the conflict.
* Explain which files contain the conflicting definitions.
* Mark the schema decision as `BLOCKED` where necessary.
* Ask the developer for clarification.

If a required database decision is missing:

* identify the missing decision
* do NOT invent business requirements
* propose clearly labeled options where appropriate
* wait for developer clarification when the decision affects schema correctness

---

# 21. Database Schema Blueprint

Write the final specification to:

`PROJECT/MD/database.md`

Use this structure:

```markdown
# Database Schema Blueprint

> **Schema Status:** DRAFT_FOR_REVIEW
> **Target Database Engine:** [engine]
> **Schema Version:** [version]
> **Last Synchronized:** [date]

---

## 1. Database Architecture

[Overall database strategy]

---

## 2. Domain & Relational Topology

[Entity relationship overview]

---

## 3. Cross-Phase Data Model

[How entities are shared and consumed across documented phases]

---

## 4. Table Specifications

### Table: `table_name`

**Purpose:** [business purpose]

**Source Requirements:**
- [business_rules reference]
- [data reference]
- [phase references]

**Used By Phases:**
- [phase]

#### Columns

| Column | Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |

#### Foreign Keys

| Column | References | On Delete | On Update |
| :--- | :--- | :--- | :--- |

#### Indexes

| Name | Type | Columns | Purpose |
| :--- | :--- | :--- | :--- |

#### Lifecycle

[Create / Update / Delete / Archive / History behavior]

---

## 5. State Machines

[Persistent entity states and transition requirements]

---

## 6. Audit & Historical Data

[Audit/history structures and their purposes]

---

## 7. Transactional Boundaries

[Operations requiring atomic transactions]

---

## 8. Global Integrity Rules

[Cross-table integrity requirements]

---

## 9. Cross-Phase Dependency Matrix

| Entity/Table | Phase | Operation | Dependency |
| :--- | :--- | :--- | :--- |

---

## 10. Database Design Decisions

[Important architectural decisions and rationale]

---

## 11. Open Questions / Blockers

[Unresolved decisions requiring developer input]

---

## 12. Schema Completeness Verification

[Evidence that documented persistent requirements have been mapped to the schema]
```

---

# 22. Developer Review Gate

After writing `database.md`, DO NOT proceed automatically.

Present:

### Database Design Summary

Include:

* total tables
* core entities
* relationship topology
* historical/audit structures
* major transaction boundaries
* cross-phase dependencies
* important constraints
* identified risks
* unresolved questions

Then explicitly state:

```text
DATABASE BLUEPRINT STATUS: DRAFT_FOR_REVIEW
```

Request explicit developer approval:

> The database blueprint has been generated from the complete documented project context, including business rules, conceptual data requirements, stack configuration, and all available phase specifications.
>
> Review the proposed tables, relationships, constraints, lifecycle behavior, and cross-phase dependencies.
>
> Reply with `APPROVED` to authorize database implementation, or specify the required changes.

---

# 23. Mandatory Hard Stop

The Agent MUST stop after presenting the database blueprint.

It MUST NOT:

* generate migrations
* create tables
* modify application code
* execute SQL
* invoke the Execution Engine
* start any phase

Only after explicit developer approval may the workflow continue to:

`prompts/03_database/implement_database.md`

---

# 24. Final Design Principle

The final database MUST satisfy this invariant:

```text
Complete Project Specifications
        +
Business Rules
        +
Conceptual Data Model
        +
Stack Constraints
        +
All Documented Phase Requirements
        ↓
Cross-Phase Consolidation
        ↓
Database Requirement Model
        ↓
Normalized Schema Design
        ↓
database.md
        ↓
Developer Approval
        ↓
Implement Database
```

The database is designed **once as a coherent project-wide model**, not independently regenerated for every phase.

Later phases may request schema changes only through an explicit database specification change process; they MUST NOT silently create uncontrolled tables or columns.
