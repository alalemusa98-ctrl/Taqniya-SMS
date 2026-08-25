# Implement Database

> **Execution Role:** Database Migration Implementer & Schema Materializer  
> **Target Specification:** `PROJECT/MD/database.md` (Authoritative Physical Schema Blueprint)  
> **Core Principle:** 1:1 Implementation Fidelity. Physical database migrations MUST be a deterministic and exact implementation of the approved `database.md` blueprint. The Agent MUST NOT invent, alter, omit, or silently reinterpret schema elements during implementation.

---

# 1. Precondition & Gatekeeper

The Agent MUST verify the approval status of `PROJECT/MD/database.md` before performing any implementation:

```text
Check: Does PROJECT/MD/database.md exist and is it marked APPROVED?

        │
        ├── YES — APPROVED BLUEPRINT
        │       │
        │       └── PROCEED
        │           Generate and implement migrations
        │           with 100% fidelity to database.md
        │
        └── NO — Missing, Draft, or Incomplete
                │
                └── 🛑 STOP IMMEDIATELY
                    Do NOT generate migrations.
                    Direct the developer to:
                    prompts/03_database/design_database.md
```

### Approval Rule

The Agent MUST NOT treat the existence of `database.md` alone as approval.

The schema MUST explicitly indicate an approved state, such as:

```markdown
Schema Status: APPROVED
```

If the status is `DRAFT_FOR_REVIEW`, missing, ambiguous, or otherwise unapproved, implementation MUST NOT begin.

---

# 2. Agent Constraints & Operational Scope

## 2.1 Strict 1:1 Blueprint Fidelity

The Agent MUST:

* Read the complete approved `PROJECT/MD/database.md`.
* Treat `database.md` as the Single Source of Truth for the physical database schema.
* Implement every declared:
  * table
  * column
  * data type
  * nullability
  * default
  * primary key
  * foreign key
  * referential action
  * unique constraint
  * index
  * composite index
  * check constraint
  * lifecycle requirement
  * schema-level invariant
* Preserve the intended relational topology.
* Ensure migrations are fully reversible where the project's migration technology supports rollback semantics.
* Verify the resulting physical schema against the approved blueprint.

The Agent MUST NOT:

* Invent a table.
* Invent a column.
* Invent a relationship.
* Invent an index.
* Invent a constraint.
* Change a declared data type without explicit approval.
* Change nullability without explicit approval.
* Change foreign-key behavior without explicit approval.
* Silently omit any schema element.
* Modify `PROJECT/MD/database.md` during implementation.
* Modify `PROJECT/MD/stack.yaml`.
* Modify `PROJECT/MD/frontend_capabilities.yaml`.
* Modify `PROJECT/MD/execution_engine.yaml`.
* Modify business rules to accommodate migration requirements.
* Implement application models, controllers, services, repositories, APIs, or UI.
* Start functional phase implementation.
* Invoke or delegate to the Execution Engine for unrelated work.

---

## 2.2 Separation of Responsibilities

The Agent MUST preserve the following architectural separation:

```text
business_rules.md
        │
        │ Business invariants
        ▼
data.md
        │
        │ Conceptual entities & relationships
        ▼
database.md
        │
        │ Approved physical schema
        ▼
Implement Database
        │
        │ Physical realization
        ▼
Database / Migrations
```

`Implement Database` is not a domain-analysis or database-design prompt.

It MUST NOT reopen project-wide domain analysis merely because a later implementation requirement appears inconvenient.

If the approved schema is insufficient for implementation, the Agent MUST stop and report the gap instead of redesigning the schema during migration work.

---

# 3. Strict Gap & Conflict Rule

If the Agent discovers a missing or conflicting schema requirement during implementation:

```text
Missing Schema Requirement / Conflict
                │
                ▼
        🛑 STOP IMMEDIATELY
                │
                ▼
     Do NOT modify the migration
                │
                ▼
     Do NOT modify database.md
                │
                ▼
    Report the exact discrepancy
                │
                ▼
 Developer reviews / updates schema
                │
                ▼
 prompts/03_database/design_database.md
                │
                ▼
 Developer approval
                │
                ▼
 Implement Database runs again
```

### Examples of Gaps / Conflicts:
* A required foreign key is absent from `database.md`.
* A migration requires a column that is not specified.
* Two tables require a relationship that the blueprint does not define.
* A database engine cannot represent a declared schema element as specified.
* A declared constraint conflicts with the target database dialect.
* The physical database already contains undocumented schema elements that conflict with the approved blueprint.

### Absolute Rule
The Agent MUST NOT solve such discrepancies by silently "improving" the migration.

The correct response is:
```text
STOP → REPORT → UPDATE SPECIFICATION → APPROVE → IMPLEMENT
```

---

# 4. Canonical Input References

The Agent MUST consult the following sources in the specified order:

### 4.1 Approved Physical Schema Blueprint
* **Source:** `PROJECT/MD/database.md`
* **Purpose:** Authoritative table definitions, columns, types, keys, relationships, constraints, indexes, referential actions, and schema-level invariants.
* **Authority:** Physical schema definition.

### 4.2 Project Stack & Database Toolchain
* **Source:** `PROJECT/MD/stack.yaml`
* **Extract:** Database engine, database version/dialect where declared, backend technology, migration framework/toolchain, and relevant runtime information.
* **Examples:** MySQL, PostgreSQL, SQLite, SQL Server, MongoDB — paired with Laravel migrations, Django migrations, Prisma, Alembic, Flyway, Drizzle, etc.
* `stack.yaml` determines the technology used to implement the approved schema. It MUST NOT be modified by this prompt.

### 4.3 Technology Profile Standards
* Resolve the applicable technology profile under `FRAMEWORK/06_stack_profiles/`.
* Use the relevant database/backend profile to determine migration syntax, framework conventions, type mapping, index naming conventions, foreign-key syntax, timestamp handling, and migration ordering conventions.
* If a specialized profile does not exist, fall back to `FRAMEWORK/00_core/` and use universal engineering/database standards without inventing technology-specific rules.

### 4.4 Universal Database Governance
* **Source:** `FRAMEWORK/00_core/database_rules.md`
* Apply universal rules such as referential integrity, transactional integrity, reversibility, UTC timestamp requirements where specified, non-destructive schema evolution, financial precision rules, and safe migration practices.

### Financial Rule
Where a field represents monetary value:
* Financial values MUST use integer minor units where required by the approved schema/governance rules (`amount_cents`, `price_cents`).
* Financial values MUST NOT use `FLOAT` or `DOUBLE`.
* Currency representation MUST follow the approved `database.md` specification and applicable governance rules (`currency CHAR(3)`).
* Do NOT impose financial rules on unrelated non-financial numeric fields.

---

# 5. Pre-Implementation Schema Inspection

Before writing any migration, the Agent MUST inspect the complete approved blueprint.

The Agent MUST build an internal implementation map containing:
* Tables
* Columns
* Primary Keys
* Foreign Keys
* Relationships
* Indexes
* Unique Constraints
* Check Constraints
* Defaults
* Nullability
* Delete Actions
* Update Actions
* Lifecycle Requirements

The Agent MUST verify that the blueprint itself is internally coherent enough to implement. If it is not, **STOP** before generating migrations.

---

# 6. Migration Authoring Sequence

## Step 1 — Dependency Topology

Analyze the relationships declared in `database.md` and construct a dependency graph. Classify tables into:

1. **Independent / Parent Tables:** (e.g., `users`, `roles`, `tenants`, `currencies`, `categories`).
2. **Dependent / Child Tables:** (e.g., `orders`, `order_items`, `invoices`, `user_profiles`).
3. **Junction / Pivot Tables:** (e.g., `role_user`, `order_tags`).
4. **Circular or Deferred Dependencies:** Identify relationships where `A → B` and `B → A`, or where foreign keys require deferred creation.

The Agent MUST determine a valid migration order without changing the approved schema.

---

## Step 2 — Migration Ordering

Create migrations in an order that guarantees:

```text
Referenced tables
        ↓
Parent tables
        ↓
Child tables
        ↓
Junction tables
        ↓
Deferred foreign-key constraints
```

Where the migration framework supports safe deferred constraint creation, use the framework's established mechanism. Do not alter relationships simply to avoid dependency problems.

---

## Step 3 — Idiomatic Migration Authoring

For every table in `database.md`:

* **Table:** Use the exact approved table name.
* **Columns:** Implement exact column names, exact data types or the correct dialect-equivalent representation, exact nullability, exact defaults, and exact constraints.
* **Primary Keys:** Implement the exact approved primary-key strategy (`BIGINT`, `UUID`, `ULID`, `Composite key`, or another explicitly approved strategy).
* **Foreign Keys:** Implement source column, target table, target column, `ON DELETE`, and `ON UPDATE`.
* **Indexes:** Implement every approved `INDEX`, `UNIQUE INDEX`, composite index, and required performance index.
* **Check Constraints:** Where declared and supported by the target database/toolchain, implement them exactly. If a declared constraint cannot be represented faithfully, STOP and report the incompatibility.

---

# 7. Financial Integrity Enforcement

For monetary fields defined in `database.md` (`amount_cents`, `price_cents`, `tax_cents`, `total_cents`, or equivalent approved minor-unit fields):

* Use the approved integer representation.
* Do NOT use `FLOAT`.
* Do NOT use `DOUBLE`.
* Preserve the approved currency representation.
* Do not introduce floating-point financial columns to simplify implementation.

If the approved blueprint itself violates an applicable mandatory financial governance rule, STOP and report the conflict rather than silently correcting `database.md`.

---

# 8. Foreign-Key Integrity

Every approved foreign key MUST be implemented with its declared:
* Source
* Target
* `ON DELETE`
* `ON UPDATE`

Possible actions include `RESTRICT`, `CASCADE`, `SET NULL`, or the exact dialect-equivalent defined by the project.

The Agent MUST NOT substitute a different referential action merely because it is easier to implement.

---

# 9. Reversibility

Every migration MUST provide a valid rollback strategy where supported by the migration framework.

Rollback logic MUST respect dependency order:

```text
Create:
Parent ➔ Child ➔ Junction

Rollback:
Junction ➔ Child ➔ Parent
```

Foreign keys MUST be removed before dropping referenced structures when required by the database engine.

The Agent MUST NOT sacrifice rollback correctness to simplify migration code.

---

# 10. Execution & Verification Protocol

After migration files are authored, the Agent MUST verify them against the actual project environment.

## 10.1 Pre-Execution Validation
Before applying migrations:
* Validate migration syntax.
* Validate migration ordering.
* Validate database connectivity/configuration where required.
* Validate that the target database engine matches `stack.yaml`.
* Confirm that no migration introduces undocumented schema elements.

If a prerequisite cannot safely be verified, STOP and report it.

## 10.2 Execute Migrations
Run the project's canonical migration command defined by its stack (e.g., `php artisan migrate`, `npx prisma migrate dev`, `python manage.py migrate`, `alembic upgrade head`).

Do NOT assume a command when `stack.yaml` or the technology profile specifies another toolchain.

Verify:
* All migrations execute successfully.
* No SQL syntax errors occur.
* No foreign-key violations occur.
* No constraint violations occur.
* Migration tracking is correctly recorded.

---

# 11. Rollback & Re-Run Verification

In a safe non-production/test environment, execute a complete rollback cycle:

1. **Rollback:**
   * All migrations roll back successfully.
   * Foreign-key dependencies are handled correctly.
   * No orphaned constraints remain.
   * No unexpected database objects remain.

2. **Re-Run:**
   * Reapply the complete migration set from a clean state.
   * Verify migrations succeed again deterministically.
   * No migration depends on accidental state left by a previous run.

The Agent MUST NOT perform destructive operations against production merely to test rollback behavior.

---

# 12. 1:1 Schema Drift Verification

After successful migration execution, inspect the resulting physical schema and compare it against `PROJECT/MD/database.md`:

| Verification Gate | Expected State | Result |
| :--- | :--- | :--- |
| **Table Parity** | Every approved table exists | `[PASS / FAIL]` |
| **Column Parity** | Every approved column exists | `[PASS / FAIL]` |
| **Type Parity** | Types match the approved blueprint/dialect mapping | `[PASS / FAIL]` |
| **Nullability Parity** | Nullability matches | `[PASS / FAIL]` |
| **Default Parity** | Defaults match | `[PASS / FAIL]` |
| **Primary Key Parity** | Primary keys match | `[PASS / FAIL]` |
| **Foreign Key Parity** | Foreign keys match | `[PASS / FAIL]` |
| **Referential Action Parity** | Delete/update behavior matches | `[PASS / FAIL]` |
| **Constraint Parity** | Approved constraints exist | `[PASS / FAIL]` |
| **Index Parity** | Approved indexes exist | `[PASS / FAIL]` |
| **Zero Ghost Tables** | No undocumented tables were created | `[PASS / FAIL]` |
| **Zero Ghost Columns** | No undocumented columns were created | `[PASS / FAIL]` |

### Zero-Ghost Rule
Any physical table or column that exists but is not authorized by the approved `database.md` MUST be reported. The Agent MUST NOT silently delete it unless that action is explicitly within the project's approved migration/reconciliation procedure.

---

# 13. Failure Protocol

If any verification gate fails:

```text
IMPLEMENTATION FAILED
        │
        ▼
Identify exact discrepancy
        │
        ▼
Do NOT silently patch the schema
        │
        ▼
Determine whether discrepancy is:
        │
        ├── Migration implementation error
        │       ↓
        │   Correct migration code
        │
        └── Specification/design gap
                ↓
        STOP implementation
                ↓
        Return to design_database.md
```

### Important Distinction
* If the problem is caused by an incorrect migration implementation (syntax, order, typo), the Agent MAY correct the migration code.
* If the problem requires changing the approved schema (missing column, table, or constraint), the Agent MUST NOT modify `database.md` itself.

Instead:
```text
Implement Database ➔ Schema gap ➔ STOP ➔ Design Database ➔ Update database.md ➔ Developer Approval ➔ Implement Database
```

---

# 14. Implementation Completion Report

Only after all implementation and verification gates pass, produce a structured completion report containing:

### Migration Summary
* Total migration files generated.
* Tables created.
* Foreign keys created.
* Indexes created.
* Constraints created.

### Execution Results
* Migration execution: `PASS / FAIL`
* Rollback test: `PASS / FAIL`
* Re-run test: `PASS / FAIL`

### Schema Verification
* Table parity: `PASS / FAIL`
* Column parity: `PASS / FAIL`
* Type parity: `PASS / FAIL`
* Foreign-key parity: `PASS / FAIL`
* Constraint parity: `PASS / FAIL`
* Index parity: `PASS / FAIL`
* Ghost tables: `PASS / FAIL`
* Ghost columns: `PASS / FAIL`

### Final Status
Use:
```text
DATABASE IMPLEMENTATION COMPLETE
Physical database schema is 100% synchronized with PROJECT/MD/database.md.
```
only when all required verification gates pass.

---

# 15. Mandatory Handoff Boundary

After successful database implementation:

```text
Database Specification ➔ Physical Database ➔ Verification ➔ DATABASE IMPLEMENTATION COMPLETE ➔ STOP
```

The Agent MUST NOT automatically implement application features.

The next authorized workflow is:

`prompts/04_phases/analyze_phase.md`

for analysis of the specific functional phase.

**Do NOT begin controllers, services, repositories, APIs, views, components, business actions, or other application features until a specific functional phase is explicitly invoked.**

---

## Final Agent Invariant

The entire prompt MUST operate according to this invariant:

```text
APPROVED database.md
        │
        │ 1:1 projection
        ▼
Migration Files
        │
        │ Execute
        ▼
Physical Database
        │
        │ Reverse Verification
        ▼
database.md ↔ Physical Database
        │
        ├── 100% MATCH ────► COMPLETE
        │
        └── MISMATCH ──────► STOP ➔ Diagnose ➔ Correct or return to Design Database
```

* No undocumented schema.
* No silent schema changes.
* No invented tables.
* No invented columns.
* No migration-driven redesign.
* No application implementation.
* Specification first, implementation second, verification always.
