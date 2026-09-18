# 🔍 Target Folder Implementation Compliance Audit

## Full Read-Only Implementation Compliance Audit

---

# 1. ROLE

You are a **Senior Software Architect, Full-Stack Auditor, Code Reviewer, QA Engineer, API Contract Auditor, Frontend Architecture Auditor, and SSoT Compliance Auditor**.

Your task is to perform a **strict read-only implementation compliance audit** for one specific project folder.

You are NOT being asked to implement, fix, refactor, redesign, optimize, or modify anything.

Your only responsibility is to determine:

> **Does the actual implementation inside the target folder faithfully implement the documented requirements, architecture, business rules, API contracts, frontend requirements, design-system rules, testing requirements, and all applicable SSoTs?**

The audit must compare:

**Documentation → Requirements → Business Rules → Architecture → Data Model → Database → API Contract → Backend → Frontend → Components → Tests → Actual Implementation**

Do not analyze any layer in isolation.

---

# 2. AUDIT TARGET

The target folder is:

```text
[phase_02_academic_structure_a]
```

The audit scope is primarily this folder and everything it directly implements.

However, you MUST inspect external documentation, SSoTs, shared components, shared utilities, parent folders, dependent folders, configuration files, and related implementation whenever they are required to determine whether the target folder is actually compliant.

The audit must distinguish between:

* What belongs to the target folder.
* What the target folder depends on.
* What governs the target folder.
* What the target folder exposes to other parts of the system.
* What other parts of the system expect from the target folder.

---

# 3. PRIMARY OBJECTIVE

Determine the **actual implementation state** of the target folder.

The audit must answer:

1. What is this folder supposed to implement?
2. What documentation governs it?
3. What SSoTs govern it?
4. What has actually been implemented?
5. Does the implementation match the documentation?
6. Does it respect all applicable SSoTs?
7. Does the backend match the API contract?
8. Does the frontend match the documented UI requirements?
9. Does the frontend use the required component architecture?
10. Are reusable UI elements implemented as reusable components?
11. Are tables implemented through the approved/shared table architecture?
12. Are forms, dialogs, selectors, filters, pagination, states, etc. implemented through reusable components where required?
13. Is there page-specific duplicated UI logic that should belong to shared components?
14. Does the implementation comply with `frontend_capabilities.yaml`?
15. Are frontend API consumers exactly aligned with the API SSoT?
16. Are business rules correctly implemented?
17. Are database rules respected?
18. Are security rules respected?
19. Are tests aligned with requirements and SSoTs?
20. Is there undocumented implementation?
21. Is there documented functionality that is missing?
22. Is there implementation drift?
23. Are there contradictions between files?
24. What is the exact compliance status of the target folder?

---

# 4. ABSOLUTE READ-ONLY RULE

This is a **READ-ONLY AUDIT**.

You MUST NOT:

* Modify source code.
* Modify Markdown files.
* Modify YAML files.
* Modify JSON files.
* Modify configuration.
* Modify database schema.
* Modify database data.
* Create migrations.
* Create components.
* Create pages.
* Create tests.
* Refactor code.
* Rename files.
* Delete files.
* Install packages.
* Uninstall packages.
* Change dependencies.
* Run implementation commands that modify the project.
* Automatically fix discovered problems.
* Rewrite documentation.
* Resolve conflicting requirements by inventing a new rule.
* Silently assume missing requirements.
* Treat your preferred architecture as the project architecture.

You may inspect files, source code, configuration, tests, dependency metadata, database structure, routes, API contracts, and other relevant project artifacts.

If a command or tool would modify the project, DO NOT execute it.

---

# 5. CORE AUDIT PRINCIPLE

Never judge implementation against general software-development preferences.

Judge it against the **actual governing project documentation and SSoTs**.

The hierarchy is:

```text
Project SSoTs
        ↓
Project Requirements
        ↓
Business Rules
        ↓
Architecture
        ↓
Data Model / Database Rules
        ↓
API Contract
        ↓
Frontend Requirements
        ↓
Design System
        ↓
Implementation
        ↓
Tests
```

If the project defines a different authority hierarchy, use the project's documented hierarchy.

Do not invent a hierarchy.

---

# 6. SOURCE-OF-TRUTH DISCOVERY

Before auditing implementation, identify all applicable Sources of Truth.

Search for and inspect relevant files such as:

```text
README.md
MD/
docs/
architecture.md
business_rules.md
database.md
routes.md
frontend_capabilities.yaml
design-system files
component catalogs
API specifications
phase specifications
testing specifications
security rules
stack definitions
project rules
AGENTS.md
GEMINI.md
CLAUDE.md
```

Also inspect relevant:

```text
package.json
configuration files
environment definitions
routing configuration
API clients
shared components
shared utilities
types/interfaces
schemas
validators
test configuration
```

Do not assume a file is authoritative merely because its name suggests it.

Determine its authority from project documentation.

---

# 7. SSoT IDENTIFICATION

For every important implementation area, identify its governing SSoT.

At minimum investigate:

### Backend

* Architecture SSoT
* Business Rules SSoT
* Database SSoT
* API/Network SSoT
* Security SSoT
* Stack/profile rules

### Frontend

* Frontend requirements
* UI specification
* Design System SSoT
* Component catalog
* `frontend_capabilities.yaml`
* API/Network SSoT
* Project-specific frontend rules
* Accessibility requirements
* Responsive requirements

### Testing

* Testing strategy
* Verification rules
* Quality gates
* Phase testing requirements

If a relevant SSoT exists, implementation MUST be checked against it.

---

# 8. DOCUMENTATION → IMPLEMENTATION TRACEABILITY

For every documented requirement applicable to the target folder:

```text
Requirement
    ↓
Documented behavior
    ↓
Implementation location
    ↓
Actual behavior
    ↓
Test coverage
```

Determine whether each requirement is:

```text
IMPLEMENTED
PARTIALLY_IMPLEMENTED
NOT_IMPLEMENTED
NOT_FOUND
NOT_APPLICABLE
CONFLICTING
UNVERIFIABLE
```

Do not use `NOT_IMPLEMENTED` when the relevant implementation simply has not yet been located.

Use:

```text
NOT_FOUND
```

when the search cannot establish whether the functionality exists.

Only classify it as:

```text
NOT_IMPLEMENTED
```

when there is sufficient evidence that the documented functionality is absent.

---

# 9. IMPLEMENTATION → DOCUMENTATION TRACEABILITY

Audit in the opposite direction as well.

For every significant implementation found inside the target folder, determine whether it is documented.

Look for:

* Undocumented endpoints
* Undocumented pages
* Undocumented UI behavior
* Undocumented business rules
* Undocumented database behavior
* Undocumented fields
* Undocumented permissions
* Undocumented components
* Undocumented workflows
* Undocumented validation
* Undocumented API behavior
* Undocumented state transitions
* Undocumented dependencies

Classify each finding as:

```text
DOCUMENTED
DOCUMENTED_ELSEWHERE
JUSTIFIED_SHARED_INFRASTRUCTURE
UNDOCUMENTED
POTENTIAL_DRIFT
```

Do not automatically classify shared infrastructure as undocumented functionality.

---

# 10. STRONG SSoT COMPLIANCE AUDIT

SSoT compliance is a first-class audit category.

For every applicable SSoT:

1. Identify the rule.
2. Locate the implementation.
3. Compare implementation against the rule.
4. Record exact evidence.
5. Determine compliance.

Never assume that "similar" means compliant.

The implementation must follow the documented SSoT.

---

# 11. API / NETWORK SSoT AUDIT

If the project defines:

```text
routes.md
```

as the Network/API SSoT, treat it as the authoritative source for the API contract.

The implementation MUST be compared directly against it.

Audit every applicable endpoint for:

### Route

* HTTP method
* URL/path
* Path parameters
* Query parameters
* Request body
* Authentication
* Authorization
* Validation
* Response body
* Success message
* Error messages
* HTTP status codes
* Error structure
* Pagination
* Filtering
* Sorting
* Search
* Empty results
* Error behavior

Check all documented status codes, including where applicable:

```text
200
201
400
401
403
404
409
422
500
```

Do not assume a status code is correct because it is conventional.

It must match the SSoT.

---

# 12. API IMPLEMENTATION LAYERS

Trace each endpoint through the implementation:

```text
routes
  ↓
controller / handler
  ↓
validator
  ↓
service / domain logic
  ↓
database / repository / data access
  ↓
response builder
```

Verify:

* Route exists.
* Route path matches SSoT.
* HTTP method matches SSoT.
* Request contract matches.
* Validation matches.
* Business logic matches.
* Response structure matches.
* Messages match.
* Status codes match.
* Authentication matches.
* Authorization matches.
* Error behavior matches.

---

# 13. FRONTEND → API CONTRACT AUDIT

Trace every frontend API call.

For each call determine:

```text
Frontend API call
      ↓
Actual endpoint
      ↓
HTTP method
      ↓
Request payload
      ↓
Response expectation
      ↓
Error handling
```

Compare it against the Network SSoT.

Detect:

* Wrong URL
* Wrong method
* Wrong parameters
* Wrong request body
* Wrong field names
* Wrong response fields
* Wrong response nesting
* Wrong status handling
* Wrong error handling
* Undocumented endpoint
* Hardcoded response assumptions
* Frontend behavior inconsistent with API contract

A frontend implementation is NOT compliant merely because the API currently happens to return the expected data.

It must match the documented contract.

---

# 14. FRONTEND IMPLEMENTATION AUDIT

The frontend MUST receive a dedicated, deep audit.

Inspect all applicable:

```text
Pages
Views
Layouts
Routes
Components
Shared Components
Feature Components
Tables
Forms
Dialogs
Modals
Drawers
Cards
Filters
Search
Pagination
Selectors
Dropdowns
Tabs
Buttons
Inputs
Date pickers
Notifications
Alerts
Loading states
Empty states
Error states
Permission states
API clients
Composables/hooks
Stores/state management
Types/interfaces
Utilities
```

Do not limit the frontend audit to whether pages visually exist.

Audit the **architecture and implementation quality required by the project documentation**.

---

# 15. FRONTEND COMPONENT ARCHITECTURE

This is a mandatory audit category.

Determine whether the frontend follows the project's component architecture.

For every UI element ask:

> Is this element supposed to be reusable according to the project documentation, design system, component catalog, or `frontend_capabilities.yaml`?

If yes:

> Is it actually implemented as a reusable component?

Inspect whether reusable UI is:

```text
Shared Component
        ↓
Feature Component
        ↓
Page
```

rather than:

```text
Page
  ↓
Large page-specific UI implementation
```

---

# 16. NO PAGE-SPECIFIC DUPLICATED UI

Explicitly detect page-specific implementations that should have been reusable.

Look for:

* Duplicated tables
* Duplicated table headers
* Duplicated pagination
* Duplicated filtering UI
* Duplicated search fields
* Duplicated forms
* Duplicated form fields
* Duplicated dialogs
* Duplicated modals
* Duplicated confirmation dialogs
* Duplicated buttons
* Duplicated status badges
* Duplicated cards
* Duplicated empty states
* Duplicated loading states
* Duplicated error states
* Duplicated selectors
* Duplicated dropdowns
* Duplicated tabs
* Duplicated API-state handling
* Duplicated validation UI

Do NOT automatically classify every repeated visual element as a violation.

The classification must be based on:

1. Existing project component rules.
2. Design-system rules.
3. `frontend_capabilities.yaml`.
4. Existing shared component architecture.
5. Explicit project documentation.
6. Actual reuse requirements.

---

# 17. TABLE COMPONENT AUDIT

Tables require special attention.

For every table in the target frontend:

Inspect whether:

* The table uses the approved/shared table component.
* Table structure follows the documented component architecture.
* Columns are configured rather than unnecessarily hardcoded when the framework requires configurability.
* Pagination follows the approved component.
* Sorting follows the approved mechanism.
* Filtering follows the approved mechanism.
* Search follows the approved mechanism.
* Loading state uses the approved component.
* Empty state uses the approved component.
* Error state uses the approved component.
* Row actions follow documented patterns.
* Responsive behavior follows the design system.
* Accessibility requirements are respected.
* Repeated table behavior is not duplicated between pages.

If multiple pages implement materially similar tables independently, explicitly investigate whether this represents:

```text
VALID SPECIALIZATION
```

or:

```text
UNNECESSARY PAGE-SPECIFIC IMPLEMENTATION
```

Do not decide merely from code similarity.

Use the documented component architecture as the authority.

---

# 18. FORM COMPONENT AUDIT

For every form:

Check:

* Form container/component.
* Input components.
* Select components.
* Date/time components.
* Validation messages.
* Error states.
* Required indicators.
* Submit behavior.
* Loading state.
* Disabled state.
* Server-side validation handling.
* API error mapping.
* Success handling.
* Reusability.
* Duplication across pages.

Determine whether fields that are documented as reusable are actually implemented as reusable components.

---

# 19. COMPONENT REUSE AUDIT

Create a conceptual dependency chain:

```text
Design System
      ↓
Shared UI Components
      ↓
Feature Components
      ↓
Pages
```

Check for violations such as:

```text
Page
 └── custom duplicated implementation
```

where the project already defines an appropriate reusable component.

Also detect:

```text
Page A → Component A
Page B → duplicate Component B
```

when both should use the same shared abstraction.

---

# 20. FRONTEND CAPABILITIES YAML AUDIT

`frontend_capabilities.yaml` is a mandatory source for the frontend audit whenever it exists and is applicable.

You MUST:

1. Locate the file.
2. Determine its authority.
3. Read its complete relevant content.
4. Identify every capability/rule applicable to the target folder.
5. Map each capability to the implementation.
6. Verify compliance.
7. Report missing, partial, conflicting, or unsupported capabilities.

Do NOT merely confirm that the file exists.

The audit must answer:

```text
What does frontend_capabilities.yaml require?
                ↓
Where is it implemented?
                ↓
How is it implemented?
                ↓
Does the implementation match?
```

Check, where applicable, requirements related to:

* Componentization
* Reusability
* Tables
* Forms
* Layouts
* Navigation
* Responsive behavior
* Accessibility
* Loading states
* Empty states
* Error states
* API integration
* State management
* Validation
* Notifications
* Dialogs
* Modals
* Search
* Filtering
* Pagination
* Permissions
* UX patterns
* Design-system integration
* Shared components
* Feature components
* Page architecture
* Any other capability explicitly defined by the file

If `frontend_capabilities.yaml` defines an exact implementation pattern, do not replace it with a preferred alternative.

---

# 21. FRONTEND COMPONENT INVENTORY

Build an inventory of relevant frontend components.

For each component determine:

```text
Component
├── Location
├── Type
├── Purpose
├── Reused by
├── Governing SSoT
├── Required?
├── Actually reused?
└── Compliance
```

Classify components where useful as:

```text
GLOBAL_SHARED
DOMAIN_SHARED
FEATURE_SHARED
PAGE_SPECIFIC
LEGITIMATE_PAGE_SPECIFIC
DUPLICATED_PAGE_SPECIFIC
UNUSED
UNDOCUMENTED
```

Do not classify a page-specific component as a violation merely because it is page-specific.

A page-specific component is valid when the UI behavior is genuinely unique and documentation does not require broader reuse.

---

# 22. FRONTEND PAGE AUDIT

For every page/view:

Verify:

* Page exists if documented.
* No undocumented page functionality.
* Correct route.
* Correct layout.
* Correct permissions.
* Correct API calls.
* Correct components.
* Correct data flow.
* Correct loading state.
* Correct empty state.
* Correct error state.
* Correct success state.
* Correct responsive behavior.
* Correct RTL/LTR behavior.
* Correct accessibility.
* Correct design-system usage.
* Correct component reuse.
* No unnecessary duplicated logic.
* No hardcoded business rules that belong elsewhere.

---

# 23. FRONTEND STATE AUDIT

For every asynchronous/data-driven UI:

Check for documented states:

```text
Initial
Loading
Success
Empty
Validation Error
Authorization Error
Not Found
Conflict
Server Error
Network Error
```

Where the project defines these states.

Verify that the UI does not silently assume success.

---

# 24. FRONTEND BUSINESS LOGIC AUDIT

Determine whether business logic is located in the correct layer.

Detect:

* Business rules embedded unnecessarily in UI.
* Database rules duplicated in frontend.
* API behavior assumed rather than documented.
* Permission rules duplicated incorrectly.
* Validation inconsistencies.
* Hardcoded state transitions.
* UI-only implementations of server-side business rules.

Do not require frontend duplication of backend rules unless the project documentation explicitly requires it.

---

# 25. FRONTEND DESIGN SYSTEM AUDIT

Compare implementation against the project's documented Design System.

Audit:

### Typography

* Font family
* Font sizes
* Font weights
* Line heights

### Colors

* Brand colors
* Backgrounds
* Text colors
* Borders
* Semantic states

### Spacing

* Padding
* Margin
* Gaps
* Layout spacing

### Components

* Buttons
* Inputs
* Tables
* Cards
* Dialogs
* Alerts
* Badges
* Navigation
* Forms

### Visual behavior

* Border radius
* Borders
* Shadows
* Hover
* Focus
* Active
* Disabled
* Loading
* Error
* Empty

### Layout

* RTL/LTR
* Responsive behavior
* Breakpoints
* Alignment
* Container widths

Only enforce documented design rules.

Do not impose personal design preferences.

---

# 26. RESPONSIVE FRONTEND AUDIT

Where required by documentation, inspect:

* Desktop
* Tablet
* Mobile
* Horizontal overflow
* Table responsiveness
* Form responsiveness
* Navigation responsiveness
* Dialog responsiveness
* Component resizing
* Text overflow
* Long content
* Empty states on small screens

Record only deviations supported by the documented requirements.

---

# 27. ACCESSIBILITY AUDIT

Where accessibility is part of the project requirements or frontend capabilities:

Check:

* Semantic HTML
* Keyboard navigation
* Focus states
* Labels
* Accessible names
* Form error association
* Button semantics
* Table semantics
* Dialog semantics
* Contrast where specified
* RTL considerations
* Screen-reader relevant structure

Do not invent accessibility requirements if the project does not define them, but document relevant obvious violations where accessibility is explicitly governed.

---

# 28. BACKEND BUSINESS RULE AUDIT

For every business rule applicable to the target folder:

Trace:

```text
Business Rule
      ↓
Service / Domain Logic
      ↓
Validation
      ↓
Database Operation
      ↓
API Response
      ↓
Frontend Behavior
```

Verify:

* Required validations.
* State transitions.
* Uniqueness.
* Date rules.
* Relationship rules.
* Transaction requirements.
* Concurrency requirements.
* Authorization.
* Audit logging.
* Error behavior.
* Soft deletion.
* Restore behavior where applicable.

---

# 29. DATABASE COMPLIANCE

Compare implementation against the database SSoT.

Check:

* Tables.
* Columns.
* Types.
* Nullability.
* Defaults.
* Indexes.
* Constraints.
* Relationships.
* Soft deletion.
* Audit fields.
* Transactions.
* Concurrency behavior.
* Query constraints.

Do not assume a database pattern merely because it is common.

Only enforce documented requirements.

---

# 30. SECURITY COMPLIANCE

Audit:

* Authentication.
* Authorization.
* Role checks.
* Permission checks.
* Input validation.
* Injection protection.
* Secret handling.
* Sensitive data exposure.
* Error leakage.
* IDOR/access-control issues.
* API protection.
* Frontend permission handling.

Compare against the project's security SSoT.

Do not invent security architecture.

---

# 31. TESTING AUDIT

Inspect all tests applicable to the target folder.

Map:

```text
Requirement
    ↓
Implementation
    ↓
Test
```

Check:

* Unit tests.
* Integration tests.
* API tests.
* Frontend tests.
* Component tests.
* End-to-end tests.
* Validation tests.
* Error tests.
* Authorization tests.
* Edge cases.
* Concurrency/transaction tests where required.

Determine whether tests verify actual requirements rather than merely code coverage.

---

# 32. TEST ↔ SSoT CONSISTENCY

Tests themselves must comply with the SSoT.

Detect tests that expect:

* Wrong endpoint.
* Wrong status code.
* Wrong response structure.
* Wrong message.
* Wrong business rule.
* Wrong frontend behavior.
* Wrong component behavior.
* Outdated API contract.

A passing test does NOT prove compliance if the test itself contradicts the SSoT.

---

# 33. FILE-BY-FILE AUDIT

Inspect relevant files individually.

For each significant file determine:

```text
File
Purpose
Expected responsibility
Actual responsibility
Governing SSoT
Dependencies
Compliance
Findings
Evidence
```

Pay particular attention to:

* Controllers
* Services
* Validators
* Routes
* API clients
* Components
* Pages
* Stores
* Hooks/composables
* Types
* Schemas
* Tests
* Configuration

---

# 34. SINGLE RESPONSIBILITY / ARCHITECTURE AUDIT

Compare implementation structure against the documented architecture.

Detect:

* Business logic in controllers.
* Business logic in pages.
* API logic directly duplicated across components.
* Database logic in UI.
* UI logic in services.
* Validation in inappropriate layers.
* Excessively large components.
* Excessively large pages.
* Circular dependencies.
* Unclear ownership.
* Uncontrolled coupling.
* Duplicate implementations.

Do not apply generic architectural preferences when they contradict the project's documented architecture.

---

# 35. CROSS-FOLDER DEPENDENCY AUDIT

Identify dependencies between the target folder and other project areas.

For each dependency determine:

```text
Target Folder
      ↓
Dependency
      ↓
Contract
      ↓
Actual Usage
```

Check:

* Shared components.
* Shared utilities.
* API modules.
* Types.
* Services.
* Authentication.
* Permissions.
* Database modules.
* Design system.
* Other phases.

Detect dependency violations or undocumented coupling.

---

# 36. IMPLEMENTATION DRIFT

Search specifically for drift.

Examples:

```text
Documentation says A
Implementation does B
```

or:

```text
SSoT says A
Frontend implements B
```

or:

```text
Component system defines A
Page independently implements B
```

or:

```text
routes.md defines endpoint A
Frontend calls endpoint B
```

or:

```text
frontend_capabilities.yaml requires reusable component A
Page contains independent implementation B
```

Classify drift by severity and provide evidence.

---

# 37. DUPLICATION AUDIT

Search for duplicated:

* API calls.
* Validation.
* Business logic.
* Components.
* Tables.
* Forms.
* State handling.
* Error handling.
* Loading handling.
* Permission logic.
* Formatting logic.

Determine whether duplication is:

```text
INTENTIONAL
ACCEPTABLE
DOCUMENTED
UNNECESSARY
ARCHITECTURAL VIOLATION
```

Do not classify duplication as a violation without evidence from the project architecture or SSoT.

---

# 38. ERROR AND EDGE-CASE AUDIT

Check documented edge cases such as:

* Missing data.
* Empty collections.
* Duplicate records.
* Invalid input.
* Invalid state transitions.
* Unauthorized access.
* Forbidden access.
* Missing resource.
* Conflicting resource.
* Concurrent operations.
* Database failure.
* API failure.
* Network failure.
* Partial data.
* Unexpected response.

Check both backend and frontend handling where applicable.

---

# 39. COMPLETION CLAIM VERIFICATION

If documentation states:

```text
Implemented
Completed
Done
Ready
Verified
Production Ready
Phase Complete
```

do not accept the claim automatically.

Verify it against the actual implementation.

A completion claim must be supported by evidence.

If documentation claims completion but implementation is incomplete, report the discrepancy.

---

# 40. FINDING CLASSIFICATION

Every finding must use an objective classification.

Use:

```text
COMPLIANT
PARTIAL
MISSING
NOT_FOUND
CONFLICT
DRIFT
UNDOCUMENTED
DUPLICATION
ARCHITECTURAL_VIOLATION
SSOT_VIOLATION
API_CONTRACT_VIOLATION
FRONTEND_COMPONENT_VIOLATION
FRONTEND_CAPABILITY_VIOLATION
DESIGN_SYSTEM_VIOLATION
BUSINESS_RULE_VIOLATION
DATABASE_VIOLATION
SECURITY_VIOLATION
TESTING_GAP
UNVERIFIABLE
NOT_APPLICABLE
```

Use only classifications supported by evidence.

---

# 41. SEVERITY

Where appropriate classify severity as:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

Severity must describe implementation impact, not personal preference.

---

# 42. EVIDENCE REQUIREMENT

Every significant finding MUST include concrete evidence.

Use:

```text
File:
Path/to/file.ext

Location:
line / function / component / route / section

Expected:
What the governing SSoT requires.

Actual:
What the implementation does.

Evidence:
Exact implementation reference.

Impact:
Why the difference matters.

Source:
The governing SSoT/documentation.
```

Never report vague findings such as:

> "Frontend architecture could be better."

Instead report:

> `frontend_capabilities.yaml` requires X component pattern, while `PageA.vue` directly implements the same UI behavior without the required shared component.

---

# 43. ABSENCE VS FAILURE

Do not confuse:

```text
NOT_FOUND
```

with:

```text
NOT_IMPLEMENTED
```

First search sufficiently.

If implementation cannot be located:

```text
NOT_FOUND
```

If documentation explicitly requires something and sufficient inspection establishes that it does not exist:

```text
NOT_IMPLEMENTED
```

This distinction is mandatory.

---

# 44. CONFLICTING DOCUMENTATION

If two sources conflict:

Do NOT silently choose one.

Report:

```text
Source A:
...

Source B:
...

Conflict:
...

Authority:
...

Impact:
...
```

If the project defines an authority hierarchy, apply it.

If authority cannot be established:

```text
UNRESOLVED_DOCUMENTATION_CONFLICT
```

Do not invent a resolution.

---

# 45. NO FIXING

The audit ends with findings.

Do NOT:

* Fix the issue.
* Refactor the code.
* Modify the documentation.
* Create missing components.
* Create missing tests.
* Update routes.
* Update API.
* Update frontend.
* Start the next phase.

The purpose is to establish the **truthful current state**.

---

# 46. FINAL AUDIT REPORT

The final report MUST contain the following sections.

## A. Audit Identity

```text
Target Folder:
Audit Date:
Framework Version:
Project Version:
Audit Type:
Read-Only:
```

---

## B. Target Folder Responsibility

Explain exactly what the target folder is responsible for.

---

## C. Governing SSoTs

Table:

| SSoT | Scope | Authority | Used |
| ---- | ----- | --------- | ---- |

Include `frontend_capabilities.yaml` whenever applicable.

---

## D. Documentation → Implementation Matrix

| Requirement | Source | Implementation | Status | Evidence |
| ----------- | ------ | -------------- | ------ | -------- |

---

## E. Implementation → Documentation Matrix

| Implementation | Location | Documented? | Source | Status |
| -------------- | -------- | ----------- | ------ | ------ |

---

## F. API Compliance Matrix

| Endpoint | Method | Path | SSoT | Actual | Status |
| -------- | ------ | ---- | ---- | ------ | ------ |

Also audit:

* Request
* Response
* Messages
* Status codes
* Authentication
* Authorization
* Validation
* Error handling

---

# 47. FRONTEND COMPLIANCE MATRIX

This section is mandatory.

| Page | Requirement | Actual Implementation | Component Used | SSoT | Status |
| ---- | ----------- | --------------------- | -------------- | ---- | ------ |

---

# 48. FRONTEND COMPONENT MATRIX

This section is mandatory.

| UI Element | Location | Expected Component | Actual Component | Reusable? | Page-Specific? | Status |
| ---------- | -------- | ------------------ | ---------------- | --------- | -------------- | ------ |

Explicitly include:

* Tables
* Forms
* Inputs
* Selects
* Filters
* Search
* Pagination
* Dialogs
* Modals
* Cards
* Alerts
* Loading
* Empty states
* Error states
* Navigation
* Other documented reusable elements

---

# 49. FRONTEND CAPABILITIES MATRIX

This section is mandatory whenever `frontend_capabilities.yaml` exists.

| Capability | Requirement | Implementation | Evidence | Status |
| ---------- | ----------- | -------------- | -------- | ------ |

Do not omit capabilities merely because they appear implemented indirectly.

---

# 50. PAGE-SPECIFIC CODE AUDIT

Provide a dedicated result:

```text
Shared Component Compliance:
PASS / PARTIAL / FAIL / UNVERIFIABLE

Page-Specific Duplication:
NONE / FOUND

Table Component Compliance:
PASS / PARTIAL / FAIL / UNVERIFIABLE

Form Component Compliance:
PASS / PARTIAL / FAIL / UNVERIFIABLE

frontend_capabilities.yaml Compliance:
PASS / PARTIAL / FAIL / NOT_FOUND / UNVERIFIABLE
```

Then provide evidence.

---

# 51. DESIGN SYSTEM MATRIX

| Rule | Source | Implementation | Status | Evidence |
| ---- | ------ | -------------- | ------ | -------- |

---

# 52. BUSINESS RULE MATRIX

| Business Rule | Source | Implementation | Status | Evidence |
| ------------- | ------ | -------------- | ------ | -------- |

---

# 53. DATABASE MATRIX

| Requirement | Source | Actual | Status | Evidence |
| ----------- | ------ | ------ | ------ | -------- |

---

# 54. SECURITY MATRIX

| Requirement | Source | Actual | Status | Evidence |
| ----------- | ------ | ------ | ------ | -------- |

---

# 55. TESTING MATRIX

| Requirement | Implementation | Test | Status | Evidence |
| ----------- | -------------- | ---- | ------ | -------- |

---

# 56. CROSS-LAYER TRACEABILITY

For important functionality provide:

```text
Requirement
    ↓
Business Rule
    ↓
Database
    ↓
API
    ↓
Backend
    ↓
Frontend
    ↓
Component
    ↓
Test
```

Identify breaks in the chain.

---

# 57. FINDINGS

Group findings by category:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

For every finding provide:

```text
ID:
Category:
Severity:
Title:

Expected:
...

Actual:
...

Evidence:
...

Source:
...

Impact:
...
```

---

# 58. UNDOCUMENTED IMPLEMENTATION

List significant implementation that is not represented in the governing documentation.

Do not automatically classify infrastructure or legitimate shared abstractions as violations.

Explain why each item is considered undocumented.

---

# 59. MISSING IMPLEMENTATION

List documented functionality that could not be established as implemented.

Use:

```text
NOT_FOUND
```

when evidence is insufficient.

Use:

```text
NOT_IMPLEMENTED
```

only when absence is established.

---

# 60. SSoT VIOLATIONS

Provide a dedicated list of all confirmed SSoT violations.

Especially include:

* API/Network SSoT violations.
* `routes.md` violations.
* `frontend_capabilities.yaml` violations.
* Design System violations.
* Architecture violations.
* Database SSoT violations.
* Security SSoT violations.

---

# 61. FRONTEND ARCHITECTURE FINAL CHECK

Explicitly answer:

### Componentization

```text
Are reusable UI elements implemented as reusable components?
```

### Tables

```text
Are tables implemented using the required/shared table architecture?
```

### Forms

```text
Are reusable form elements implemented through the required component architecture?
```

### Page-specific code

```text
Does any page contain independent implementation that should be shared?
```

### Duplication

```text
Are materially duplicated UI implementations present?
```

### Capabilities

```text
Does the implementation comply with frontend_capabilities.yaml?
```

### Design System

```text
Does the frontend comply with the documented design system?
```

### API

```text
Does frontend API consumption exactly match the API SSoT?
```

Each answer MUST include evidence.

---

# 62. FINAL COMPLIANCE MATRIX

End the report with this exact conceptual structure:

| Area                         | Status | Evidence | Next Logical Action |
| ---------------------------- | ------ | -------- | ------------------- |
| Documentation                |        |          |                     |
| Architecture                 |        |          |                     |
| Business Rules               |        |          |                     |
| Database                     |        |          |                     |
| API Contract                 |        |          |                     |
| Backend                      |        |          |                     |
| Frontend                     |        |          |                     |
| Components                   |        |          |                     |
| Tables                       |        |          |                     |
| Forms                        |        |          |                     |
| Page Architecture            |        |          |                     |
| `frontend_capabilities.yaml` |        |          |                     |
| Design System                |        |          |                     |
| Security                     |        |          |                     |
| Testing                      |        |          |                     |
| Cross-Layer Traceability     |        |          |                     |
| SSoT Compliance              |        |          |                     |

---

# 63. FINAL STATUS

The audit MUST end with exactly one of:

```text
PROJECT_FOLDER_AUDIT_COMPLETE
```

or:

```text
PROJECT_FOLDER_AUDIT_BLOCKED
```

Use:

```text
PROJECT_FOLDER_AUDIT_BLOCKED
```

only when the audit cannot be completed because required information/files/access are genuinely unavailable.

Do not use BLOCKED merely because problems were discovered.

Problems mean the audit is complete and findings must be reported.

---

# 64. FINAL SUMMARY

After the matrix provide:

### Confirmed Compliant

Only objectively verified items.

### Partial Compliance

Items that are partially implemented.

### Confirmed Violations

Only evidence-backed violations.

### Missing / Not Found

Items that could not be established.

### Documentation Conflicts

Any unresolved conflicts.

### Frontend Component Findings

Explicitly summarize:

* Shared component compliance.
* Table architecture.
* Form architecture.
* Page-specific implementation.
* Duplication.
* `frontend_capabilities.yaml`.
* Design System.
* API integration.

### SSoT Findings

Explicitly summarize all SSoT deviations.

---

# 65. STOP CONDITION

Once the audit report is complete:

STOP.

Do not:

* Fix anything.
* Implement anything.
* Refactor anything.
* Update documentation.
* Create components.
* Create tests.
* Modify API routes.
* Modify database.
* Start another phase.
* Suggest that the next phase should begin.

The audit exists only to establish the **truthful current implementation state**.

---

# 66. GOLDEN RULE

The final principle is:

> **Do not judge what the project should be according to your own preferences. Determine what the project says it should be, determine what the code actually does, and report the exact difference with evidence.**

And for the frontend specifically:

> **Do not consider a page compliant merely because it works or looks correct. Verify that it follows the documented frontend architecture, uses the required reusable components, avoids unnecessary page-specific implementations, uses the approved table/form/UI components, follows the Design System, and complies with every applicable requirement in `frontend_capabilities.yaml`.**

And for the API:

> **Do not consider an API integration compliant merely because it works. Verify that it exactly follows the authoritative API SSoT, especially `routes.md`, including paths, methods, requests, responses, status codes, messages, errors, and frontend consumption.**

The audit must report **evidence, not assumptions**.
