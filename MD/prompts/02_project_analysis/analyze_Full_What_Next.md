# 🔍 Full Project Documentation → Implementation Audit

> **Role:** Senior Software Architect + Domain Analyst + Code Auditor + QA Engineer + Systems Verification Engineer
>
> **Mode:** READ-ONLY — FULL PROJECT AUDIT
>
> **Objective:** Perform a complete evidence-based audit of the actual project, starting from project documentation and continuing through architecture, database, backend, API, frontend, testing, configuration, and implementation.
>
> The primary objective is to determine:
>
> **How much of the documented project has actually been implemented, whether it was implemented correctly, and whether the current implementation faithfully follows the approved documentation.**

---

# 1. CORE PRINCIPLE

Do NOT analyze the documentation in isolation.

Do NOT analyze the code in isolation.

The audit MUST compare both.

The fundamental audit chain is:

```text
PROJECT DOCUMENTATION
        ↓
REQUIREMENTS
        ↓
BUSINESS RULES
        ↓
ARCHITECTURE
        ↓
DATA MODEL
        ↓
DATABASE
        ↓
API CONTRACT
        ↓
BACKEND
        ↓
FRONTEND
        ↓
TESTS
        ↓
ACTUAL IMPLEMENTATION
```

The Agent must determine whether this chain is consistent.

---

# 2. STRICT READ-ONLY MODE

This audit is strictly read-only.

## The Agent MUST:

* Read the complete project structure.
* Read all relevant documentation.
* Read project MD files.
* Read configuration.
* Read source code.
* Read database definitions/migrations/schema when present.
* Read API implementation.
* Read frontend implementation.
* Read tests.
* Read phase documentation.
* Read relevant scripts/configuration.
* Cross-reference documentation and implementation.
* Trace requirements to implementation.
* Trace implementation back to requirements.
* Detect missing implementation.
* Detect undocumented implementation.
* Detect incorrect implementation.
* Detect architectural violations.
* Detect API mismatches.
* Detect database mismatches.
* Detect frontend/backend mismatches.
* Detect testing gaps.
* Determine actual project progress.
* Produce a complete audit report.

## The Agent MUST NOT:

* Modify code.
* Modify documentation.
* Refactor.
* Fix bugs.
* Create files.
* Delete files.
* Rename files.
* Generate migrations.
* Modify the database.
* Install packages.
* Change configuration.
* Execute implementation.
* Automatically resolve conflicts.
* Invent requirements.
* Assume missing functionality exists.
* Assume undocumented functionality is approved.

---

# 3. FIRST STEP — COMPLETE PROJECT DISCOVERY

Before making any judgment, inspect the project root.

Build the actual project tree.

Identify:

```text
Documentation
Configuration
Architecture
Business Rules
Data
Database
Backend
Frontend
API
Authentication
Authorization
Design System
Components
Pages
Services
Controllers / Handlers
Models
Repositories when applicable
Migrations
Tests
Scripts
Infrastructure
Integrations
Phases
Reports
```

Do not assume any of these structures exist.

Use the actual project structure.

Produce:

| Area | Actual Path | Files Found | Purpose | Status |
| ---- | ----------- | ----------- | ------- | ------ |

---

# 4. DOCUMENTATION INVENTORY

Read all project documentation relevant to implementation.

Identify:

* README
* Architecture
* Business rules
* Data model
* Database specification
* API specification
* Routes
* Design system
* UI specifications
* Security rules
* Coding rules
* Testing strategy
* Phase specifications
* ADRs
* Reports
* Completion reports
* Implementation notes
* Configuration documentation

Create:

| Document | Authority | Scope | Related Implementation | Current |
| -------- | --------- | ----- | ---------------------- | ------- |

Identify stale or superseded documentation.

---

# 5. SOURCE-OF-TRUTH ANALYSIS

Determine the project's actual authority hierarchy.

Do not invent the hierarchy.

Find evidence for which document controls:

* Business rules
* Architecture
* Database
* API
* UI
* Security
* Testing
* Phase requirements

If multiple documents claim authority over the same subject:

> REPORT THE CONFLICT.

Never silently select one.

---

# 6. PROJECT VISION VS ACTUAL SYSTEM

Extract the documented project vision.

Then inspect the actual implementation.

Compare:

```text
DOCUMENTED SYSTEM
        ↕
ACTUAL SYSTEM
```

Determine:

* Which documented capabilities exist.
* Which are partially implemented.
* Which do not exist.
* Which exist but are different from the specification.
* Which exist without documentation.

Produce:

| Capability | Documentation | Implementation | Match | Evidence |
| ---------- | ------------- | -------------- | ----- | -------- |

---

# 7. REQUIREMENT TRACEABILITY AUDIT

Extract every meaningful requirement.

Assign an identifier:

```text
REQ-001
REQ-002
REQ-003
...
```

For each requirement trace:

```text
REQ
 ↓
Specification
 ↓
Architecture
 ↓
Implementation
 ↓
Test
 ↓
Verification
```

Produce:

| ID | Requirement | Source | Implementation | Test | Verification | Status |
| -- | ----------- | ------ | -------------- | ---- | ------------ | ------ |

Status:

```text
IMPLEMENTED
PARTIALLY_IMPLEMENTED
NOT_IMPLEMENTED
INCORRECT_IMPLEMENTATION
UNVERIFIABLE
```

---

# 8. BUSINESS RULE COMPLIANCE AUDIT

Read the documented business rules.

For every important business rule:

1. Find where it should be implemented.
2. Search the actual source code.
3. Identify the actual implementation.
4. Compare implementation behavior with the documented rule.
5. Determine whether the rule is enforced.
6. Determine whether it is tested.

Produce:

| Rule ID | Business Rule | Expected Behavior | Actual Implementation | Test | Compliance |
| ------- | ------------- | ----------------- | --------------------- | ---- | ---------- |

Compliance:

```text
FULL
PARTIAL
VIOLATION
MISSING
NOT_VERIFIABLE
```

---

# 9. DOMAIN MODEL VS IMPLEMENTATION

Compare documented entities with actual implementation.

For every entity:

Check:

* Existence
* Naming
* Attributes
* Relationships
* Ownership
* Lifecycle
* State
* Business invariants
* Validation
* Services/use-cases
* Side effects

Produce:

| Entity | Documented | Implemented | Correct | Missing Behavior |
| ------ | ---------: | ----------: | ------: | ---------------- |

Detect:

* documented entity missing in code
* code entity absent from documentation
* incorrect relationship
* missing lifecycle behavior
* incorrect business logic

---

# 10. ARCHITECTURE COMPLIANCE AUDIT

Read the documented architecture rules.

Then inspect actual source structure.

Compare:

```text
ARCHITECTURAL RULE
        ↓
EXPECTED STRUCTURE
        ↓
ACTUAL STRUCTURE
```

Check:

* Boundaries
* Dependencies
* Responsibilities
* Coupling
* Separation of concerns
* Domain logic placement
* Infrastructure separation
* API boundaries
* Error handling
* Configuration boundaries
* Testing boundaries

Produce:

| Rule | Expected | Actual | Evidence | Compliance |
| ---- | -------- | ------ | -------- | ---------- |

---

# 11. DATABASE DOCUMENTATION VS ACTUAL DATABASE IMPLEMENTATION

This section is mandatory.

Compare:

```text
MD/database.md
      ↓
Data Model
      ↓
Migrations / Schema
      ↓
Actual Database Implementation
```

Check:

### Tables / Entities

* Missing
* Extra
* Renamed
* Incorrect

### Columns

* Missing
* Extra
* Incorrect type
* Incorrect nullable state
* Incorrect default
* Incorrect immutability

### Constraints

* Unique
* Primary keys
* Foreign keys when documented
* Check constraints
* Indexes
* Cascades
* Soft deletion

### Lifecycle

* Create
* Update
* Delete
* Restore
* Archive

### Transactions

Verify documented transaction boundaries.

### Concurrency

Verify documented concurrency-sensitive operations.

Produce:

| Database Element | Documentation | Actual | Match | Severity |
| ---------------- | ------------- | ------ | ----- | -------- |

Do not redesign the database.

---

# 12. API CONTRACT VS ACTUAL API

Determine the authoritative API specification.

For every endpoint:

```text
METHOD
PATH
AUTHENTICATION
AUTHORIZATION
REQUEST
VALIDATION
BUSINESS LOGIC
RESPONSE
STATUS CODE
ERROR
MESSAGE
SIDE EFFECTS
```

Compare documentation with:

* Routes
* Controllers/handlers
* Services
* Validators
* Serializers
* Response builders
* Frontend consumers
* API tests

Produce:

| Endpoint | Documented | Implemented | Request Match | Response Match | Status Match | Error Match | Compliance |
| -------- | ---------: | ----------: | ------------: | -------------: | -----------: | ----------: | ---------- |

Detect:

* undocumented endpoints
* missing endpoints
* wrong paths
* wrong methods
* request mismatch
* response mismatch
* status-code mismatch
* message mismatch
* authorization mismatch
* undocumented fields
* frontend expecting a different contract

---

# 13. BACKEND IMPLEMENTATION AUDIT

Analyze the actual backend.

Trace:

```text
API
 ↓
Controller / Handler
 ↓
Validation
 ↓
Service / Use Case
 ↓
Domain Logic
 ↓
Persistence
 ↓
Database
```

Adapt the chain to the actual architecture.

Verify:

* Business logic placement
* Validation
* Authorization
* Transactions
* Error handling
* Persistence
* Side effects
* Audit logging
* Concurrency handling
* Configuration
* External integrations

Determine whether implementation matches documentation.

---

# 14. FRONTEND IMPLEMENTATION AUDIT

If a frontend exists, compare documentation against actual UI.

Inspect:

* Routes
* Pages
* Layouts
* Components
* Forms
* Tables
* API calls
* State management
* Loading states
* Empty states
* Error states
* Permissions
* Responsive behavior
* Accessibility
* Design-system usage

Trace:

```text
UI Requirement
 ↓
Page Specification
 ↓
Actual Page
 ↓
Component
 ↓
API Consumer
 ↓
Backend Endpoint
```

Detect:

* documented pages missing
* undocumented pages
* missing functionality
* incorrect behavior
* wrong API usage
* hardcoded behavior
* design violations

---

# 15. DESIGN SYSTEM COMPLIANCE

Compare:

```text
Design Documentation
        ↓
Tokens
        ↓
Components
        ↓
Pages
        ↓
Actual UI
```

Check only documented rules.

Verify:

* Typography
* Colors
* Spacing
* Radius
* Borders
* Shadows
* States
* Components
* RTL/LTR
* Responsive behavior
* Accessibility

Produce:

| Design Rule | Expected | Actual | Compliance |
| ----------- | -------- | ------ | ---------- |

---

# 16. SECURITY IMPLEMENTATION AUDIT

Compare documented security requirements with actual code.

Check:

* Authentication
* Authorization
* Roles
* Permissions
* Ownership
* Input validation
* Injection prevention
* Secrets handling
* Sensitive data
* API protection
* Access boundaries
* Audit logging
* Security-sensitive transactions

For every finding:

```text
SECURITY-ID
Requirement
Actual Implementation
Evidence
Severity
```

Do not introduce security requirements that the project does not document unless clearly labeled as an external security observation.

---

# 17. TESTING IMPLEMENTATION AUDIT

Analyze actual tests.

Map:

```text
Requirement
 ↓
Implementation
 ↓
Test
```

Determine:

* Which requirements have tests.
* Which critical rules have no tests.
* Which tests verify outdated behavior.
* Which tests contradict current documentation.
* Which tests only test happy paths.
* Which edge cases are missing.

Produce:

| Requirement | Code | Test | Coverage Quality | Status |
| ----------- | ---- | ---- | ---------------- | ------ |

Do not execute tests unless explicitly authorized.

---

# 18. PHASE EXECUTION AUDIT

Discover every project phase.

For each phase compare:

```text
Phase Specification
        ↓
Required Files
        ↓
Required Features
        ↓
Actual Implementation
        ↓
Tests
        ↓
Completion Report
```

Determine:

* phase specification exists
* implementation exists
* implementation is complete
* tests exist
* verification exists
* completion report is supported by evidence

Produce:

| Phase | Spec | Implementation | Tests | Verification | Completion Evidence | Actual Status |
| ----- | ---: | -------------: | ----: | -----------: | ------------------: | ------------- |

Statuses:

```text
NOT_STARTED
SPECIFIED_ONLY
IN_PROGRESS
IMPLEMENTED
PARTIALLY_IMPLEMENTED
IMPLEMENTED_UNVERIFIED
VERIFIED
BLOCKED
UNKNOWN
```

IMPORTANT:

A phase MUST NOT be marked `VERIFIED` simply because:

* files exist
* code exists
* a report says "complete"
* tests exist

Verification requires evidence.

---

# 19. DOCUMENTATION IMPLEMENTATION COVERAGE

Calculate the actual implementation coverage of documented requirements.

Do not create a fake percentage.

Classify every documented requirement into:

```text
FULLY_IMPLEMENTED
PARTIALLY_IMPLEMENTED
NOT_IMPLEMENTED
IMPLEMENTED_DIFFERENTLY
UNVERIFIABLE
```

Then summarize:

| Category                | Count |
| ----------------------- | ----: |
| Fully Implemented       |     X |
| Partially Implemented   |     X |
| Not Implemented         |     X |
| Implemented Differently |     X |
| Unverifiable            |     X |

If enough reliable data exists, calculate:

```text
Documentation Implementation Coverage
=
Fully Implemented Requirements
÷
Total Verifiable Requirements
× 100
```

Clearly state what was included/excluded from the calculation.

---

# 20. IMPLEMENTATION → DOCUMENTATION AUDIT

This is equally important.

Search the actual code for meaningful functionality that is NOT documented.

Classify:

```text
UNDOCUMENTED_FEATURE
UNDOCUMENTED_BUSINESS_RULE
UNDOCUMENTED_ENDPOINT
UNDOCUMENTED_DATABASE_BEHAVIOR
UNDOCUMENTED_UI_BEHAVIOR
UNDOCUMENTED_SECURITY_BEHAVIOR
UNDOCUMENTED_DEPENDENCY
```

Produce:

| ID | Actual Implementation | Location | Documentation Found | Risk |
| -- | --------------------- | -------- | ------------------- | ---- |

Do not automatically conclude that undocumented behavior is wrong.

It may simply require documentation.

---

# 21. DOCUMENTATION → IMPLEMENTATION AUDIT

Now perform the reverse direction.

For every important documented item:

```text
DOCUMENTATION
      ↓
SEARCH CODE
      ↓
LOCATE IMPLEMENTATION
      ↓
VERIFY BEHAVIOR
```

Report missing implementation.

---

# 22. IMPLEMENTATION → DOCUMENTATION DRIFT

Identify all cases where implementation differs from documentation.

Classify:

### DRIFT-01

Documented behavior differs from actual behavior.

### DRIFT-02

Documentation describes functionality that does not exist.

### DRIFT-03

Code contains functionality not documented.

### DRIFT-04

Database differs from documented model.

### DRIFT-05

API differs from documented contract.

### DRIFT-06

Frontend differs from documented UX.

### DRIFT-07

Tests validate behavior that documentation does not define.

---

# 23. CROSS-LAYER TRACEABILITY

Perform end-to-end tracing for every critical feature.

Example:

```text
Business Requirement
        ↓
Business Rule
        ↓
Domain Entity
        ↓
Database
        ↓
Backend Service
        ↓
API Endpoint
        ↓
Frontend
        ↓
Test
        ↓
Verification
```

For each critical feature determine whether the complete chain exists.

Produce:

| Feature | Domain | DB | Backend | API | Frontend | Test | Verification |
| ------- | -----: | -: | ------: | --: | -------: | ---: | -----------: |

---

# 24. CRITICAL WORKFLOW AUDIT

For every critical business workflow inspect actual implementation.

Compare:

```text
DOCUMENTED WORKFLOW
        ↓
ACTUAL CODE PATH
```

Verify:

1. Initial state
2. Preconditions
3. Authorization
4. Validation
5. Transaction
6. State change
7. Side effects
8. Audit
9. Error handling
10. Reversal / restore / cancellation
11. Concurrency behavior
12. Final state

Report every missing or incorrect step.

---

# 25. ERROR & EDGE-CASE AUDIT

For critical operations identify documented edge cases.

Check actual implementation for:

* invalid input
* duplicate records
* missing resources
* unauthorized access
* forbidden operations
* concurrency
* partial failure
* transaction rollback
* retries
* cancellation
* restore
* boundary values
* empty data
* null values
* unexpected state

Do not invent business behavior.

If the specification does not define the expected behavior:

```text
UNSPECIFIED_EDGE_CASE
```

---

# 26. CONFIGURATION VS IMPLEMENTATION

Compare declared configuration with actual usage.

Check:

* Stack
* Runtime
* Database
* API mode
* Frontend
* Testing
* Environment configuration
* External integrations
* Feature flags

Detect:

```text
DECLARED_BUT_UNUSED
USED_BUT_UNDECLARED
CONFLICTING_CONFIGURATION
DOCUMENTATION_CONFIGURATION_DRIFT
```

Do not modify configuration.

---

# 27. DEPENDENCY ANALYSIS

Analyze package/dependency usage.

Identify:

* Declared dependencies
* Actually used dependencies
* Unused dependencies
* Undocumented dependencies
* Duplicate dependencies
* Version inconsistencies

Do not recommend replacements unless necessary to explain a finding.

---

# 28. CODE STRUCTURE VS PROJECT ARCHITECTURE

Determine whether the actual source tree reflects the documented architecture.

Inspect:

* Folder boundaries
* Module boundaries
* Dependency direction
* Cross-module imports
* Shared utilities
* Domain leakage
* Infrastructure leakage
* UI/business coupling
* Database access leakage

Identify violations with concrete evidence.

---

# 29. COMPLETION CLAIM VERIFICATION

If the project contains reports claiming:

* completed
* verified
* passed
* production-ready
* phase complete
* audit passed

DO NOT trust the claim automatically.

Verify it against the actual project.

For every completion claim:

| Claim | Source | Evidence Found | Actual State | Valid? |
| ----- | ------ | -------------- | ------------ | ------ |

---

# 30. FINDINGS CLASSIFICATION

Every finding must have:

```text
ID
Category
Severity
Source
Actual Location
Expected Behavior
Actual Behavior
Evidence
Impact
Recommended Action
```

Severity:

```text
BLOCKER
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

Do NOT provide a fix unless requested.

The "Recommended Action" should describe the required decision or correction direction, not implementation code.

---

# 31. EVIDENCE REQUIREMENT

Every significant finding must contain concrete evidence.

Evidence can be:

* File path
* Section
* Function
* Class
* Route
* Migration
* Component
* Test
* Configuration entry
* Documented rule

Example:

```text
Evidence:
MD/business_rules.md → Section X
Backend:
src/.../Service.ts → method Y
Test:
tests/.../test.spec.ts
```

Never report:

> "The code probably does..."

Use:

> "The implementation at [location] does X, while the specification at [location] requires Y."

---

# 32. DO NOT CONFUSE ABSENCE WITH FAILURE

If an implementation cannot be located:

Do NOT immediately classify it as `NOT_IMPLEMENTED`.

Use:

```text
NOT_FOUND
```

Then search:

* alternative naming
* services
* utilities
* shared modules
* framework conventions
* dynamic registration
* generated files
* configuration
* indirect implementations

Only after reasonable investigation classify:

```text
NOT_IMPLEMENTED
```

---

# 33. FINAL PROJECT STATE

After completing the audit, reconstruct the real project state.

Produce:

| Area         | Documented | Designed | Implemented | Tested | Verified | Actual State |
| ------------ | ---------: | -------: | ----------: | -----: | -------: | ------------ |
| Domain       |            |          |             |        |          |              |
| Architecture |            |          |             |        |          |              |
| Database     |            |          |             |        |          |              |
| Backend      |            |          |             |        |          |              |
| API          |            |          |             |        |          |              |
| Frontend     |            |          |             |        |          |              |
| Security     |            |          |             |        |          |              |
| Testing      |            |          |             |        |          |              |

---

# 34. FINAL AUDIT REPORT

The final report MUST contain:

# Full Project Documentation & Implementation Audit

## 1. Executive Summary

## 2. Actual Project Structure

## 3. Source-of-Truth Hierarchy

## 4. Technology Context

## 5. Project Vision vs Actual System

## 6. Requirements Traceability

## 7. Business Rules Compliance

## 8. Domain Model Audit

## 9. Architecture Compliance

## 10. Database Documentation vs Implementation

## 11. API Contract vs Implementation

## 12. Backend Compliance

## 13. Frontend Compliance

## 14. Design System Compliance

## 15. Security Compliance

## 16. Testing & Verification Audit

## 17. Phase-by-Phase Execution Audit

## 18. Documentation → Implementation Coverage

## 19. Implementation → Documentation Gaps

## 20. Specification / Implementation Drift

## 21. Cross-Layer Traceability

## 22. Critical Workflow Audit

## 23. Edge-Case Audit

## 24. Configuration Audit

## 25. Dependency Audit

## 26. Completion Claims Verification

## 27. Critical Findings

## 28. All Findings

## 29. Risks

## 30. Required Developer Decisions

## 31. Recommended Next Step

## 32. Final Project Status

---

# 35. FINAL STATUS

The Agent MUST conclude with exactly one:

```text
PROJECT_AUDIT_COMPLETE
```

or

```text
PROJECT_AUDIT_BLOCKED
```

Use `PROJECT_AUDIT_BLOCKED` only when the project cannot be reliably audited because critical information or access is unavailable.

---

# 36. MANDATORY FINAL MATRIX

At the very end provide:

```text
==================================================
PROJECT AUDIT RESULT
==================================================

PROJECT_STATUS:
[PROJECT_AUDIT_COMPLETE / PROJECT_AUDIT_BLOCKED]

PROJECT_MATURITY:
[EARLY / DEVELOPING / ADVANCED / NEAR_COMPLETE / PRODUCTION_READY]
[Only if evidence supports it]

DOCUMENTATION_STATUS:
[COMPLETE / PARTIAL / INCONSISTENT / INSUFFICIENT]

IMPLEMENTATION_STATUS:
[COMPLETE / PARTIAL / INCONSISTENT / INSUFFICIENT]

DOCUMENTATION_IMPLEMENTATION_COVERAGE:
[VALUE or NOT_RELIABLY_CALCULABLE]

ARCHITECTURE_COMPLIANCE:
[FULL / PARTIAL / VIOLATIONS / NOT_VERIFIABLE]

DATABASE_COMPLIANCE:
[FULL / PARTIAL / VIOLATIONS / NOT_VERIFIABLE]

API_COMPLIANCE:
[FULL / PARTIAL / VIOLATIONS / NOT_APPLICABLE]

BACKEND_COMPLIANCE:
[FULL / PARTIAL / VIOLATIONS / NOT_VERIFIABLE]

FRONTEND_COMPLIANCE:
[FULL / PARTIAL / VIOLATIONS / NOT_APPLICABLE]

SECURITY_COMPLIANCE:
[FULL / PARTIAL / VIOLATIONS / NOT_VERIFIABLE]

TESTING_STATUS:
[STRONG / PARTIAL / WEAK / MISSING]

TRACEABILITY:
[STRONG / GOOD / PARTIAL / WEAK / MISSING]

DOCUMENTATION_DRIFT:
[NONE / LOW / MEDIUM / HIGH / CRITICAL]

IMPLEMENTATION_DRIFT:
[NONE / LOW / MEDIUM / HIGH / CRITICAL]

CRITICAL_FINDINGS:
[COUNT]

BLOCKERS:
[COUNT]

HIGH_RISKS:
[COUNT]

CURRENT_PHASE:
[ACTUAL PHASE]

ACTUAL_COMPLETED_PHASES:
[...]

PARTIALLY_COMPLETED_PHASES:
[...]

BLOCKED_PHASES:
[...]

NEXT_LOGICAL_ACTION:
[...]

IMPLEMENTATION_ALLOWED:
[YES / NO]
==================================================
```

---

# 37. MANDATORY STOP CONDITION

After producing the complete audit:

# STOP.

Do NOT:

* Fix findings.
* Modify documentation.
* Modify code.
* Refactor.
* Create migrations.
* Change database.
* Install packages.
* Start the next phase.
* Execute implementation.
* Automatically resolve contradictions.

The purpose of this audit is to establish the **truthful current state of the project**.

Any correction or implementation must happen only after the developer explicitly reviews the audit and authorizes the next action.
