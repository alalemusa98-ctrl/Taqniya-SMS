# 🤖 Prompt: Execute Phase

> **phase_08_official_exams:** `Governance Dispatcher & Phase Execution Orchestrator`

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
│  ├── Frontend implementation conventions                     │
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
* Applicable frontend implementation rules.

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
8. Prevent frontend design and componentization drift.
9. Require independent verification after implementation.

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

The same principle applies to frontend technology.

Taqniya Core MUST NOT assume:

* Vue.
* React.
* Angular.
* Svelte.
* Blade.
* JSX.
* Specific CSS framework.
* Specific component library.

The framework defines the **governance outcome**, while the Technology Profile defines the technology-specific implementation mechanism.

---

# 5. Canonical Governance Sources

The Agent MUST assemble the execution context from the following sources.

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
* Design governance.
* AI execution protocol.
* Component reuse and design integrity where declared as universal governance.

---

## 5.4 Technology Profile Governance

Read the Technology Profile selected by the project stack.

The Technology Profile is authoritative for technology-specific implementation methodology.

It may define:

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
Frontend component conventions
Frontend state management
Frontend routing conventions
Frontend styling conventions
Framework-specific UI conventions
```

The Agent MUST NOT duplicate these technology-specific rules inside this prompt.

---

# 6. Resolved Governance Payload

The Agent MUST construct a logical **Resolved Governance Payload**.

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
* Tenant isolation where applicable.
* Input validation.
* IDOR prevention.
* Sensitive-data protection.
* Audit requirements.

Security requirements are governance constraints and MUST NOT be weakened by the implementation method.

---

# 6.5 Layer E — Design & Frontend Contract

Include:

```text
PROJECT/MD/design_rules.md
PROJECT/MD/frontend_capabilities.yaml
```

and all applicable frontend-specific phase specifications.

The Execution Engine MUST treat the approved Design System as an implementation constraint, not as optional visual guidance.

The Frontend Contract includes, where applicable:

```text
Design tokens
Typography
Spacing
Sizing
Colors
Borders
Radius
Icons
Buttons
Inputs
Forms
Tables
Cards
Modals
Dialogs
Navigation
Tabs
Badges
Alerts
Loading states
Empty states
Error states
Responsive behavior
RTL behavior
Accessibility
Interaction patterns
Component reuse
Composition rules
```

Capability states MUST be respected:

```text
required  → MUST be implemented where applicable
enabled   → MAY be used
optional  → MAY be used when justified
disabled  → MUST NOT be used
```

The exact implementation technique remains the responsibility of the Technology Profile.

---

# 6.6 Layer F — Technology Contract

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
Frontend architecture
Frontend component structure
Styling methodology
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
* Register routes or framework configuration when explicitly required.
* Perform implementation-specific configuration changes when allowed by the Technology Profile.
* Create new frontend components when the component governance below permits their creation.

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
* Create duplicate frontend components merely because creating a new component is easier.
* Replace an approved existing component with an ad-hoc implementation.
* bypass the project's Design System.

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
* Bypass authorization.
* Create alternative workflows that contradict the specification.
* Silently reinterpret ambiguous business rules.

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
* Tenant isolation where applicable.
* Resource access boundaries.
* Input validation.
* State transition authorization.
* IDOR prevention.
* Sensitive operation protection.

The implementation method may differ between technologies, but the security outcome MUST satisfy the approved governance.

---

# 15. Frontend & Design Integrity

Where the phase contains frontend work, the Execution Engine MUST NOT treat the frontend as free-form visual implementation.

The frontend MUST be implemented as a direct realization of:

```text
Approved Design Rules
        +
Approved Phase Frontend Specification
        +
Existing Design System
        +
Existing Reusable Components
        +
Resolved Frontend Technology Rules
```

The Agent MUST perform the following sequence before and during implementation:

```text
READ
  ↓
UNDERSTAND
  ↓
INVENTORY EXISTING UI
  ↓
SEARCH FOR REUSABLE COMPONENTS
  ↓
REUSE / EXTEND / CREATE
  ↓
IMPLEMENT COMPONENT
  ↓
INTEGRATE COMPONENT
  ↓
VERIFY DESIGN COMPLIANCE
```

The Agent MUST NOT skip the existing UI inventory and component discovery stages.

---

# 15.1 Frontend Design System Is Mandatory

If the project contains an approved Design System, it is mandatory.

The Agent MUST use the project's existing:

```text
Design Tokens
Components
Patterns
Layouts
UI primitives
Interaction patterns
Typography rules
Spacing rules
Responsive rules
RTL rules
Accessibility rules
```

where applicable.

The Agent MUST NOT create a visually equivalent but independently styled implementation when an approved design-system element already exists.

For example, if an existing Button component satisfies the requirement:

```text
USE EXISTING BUTTON
```

The Agent MUST NOT create:

```text
CustomButton
PageButton
ActionButton
LocalButton
SpecialButton
```

merely because the new page requires a slightly different appearance.

The preferred solution is:

```text
Existing Component
        ↓
Props / Variant / Configuration
        ↓
Required UI
```

or, where appropriate:

```text
Existing Component
        ↓
Extend Existing Component
        ↓
Required UI
```

---

# 15.2 Mandatory Component Discovery — Reuse Before Create

Before creating ANY new frontend component, the Agent MUST search the existing project.

The search MUST cover the complete relevant frontend source tree, including where applicable:

```text
components/
ui/
shared/
common/
layouts/
features/
modules/
pages/
views/
widgets/
patterns/
design-system/
```

The exact directories depend on the active Technology Profile.

The Agent MUST search for:

* Exact component names.
* Similar component names.
* Similar visual structures.
* Similar interactions.
* Similar data presentation.
* Similar forms.
* Similar states.
* Existing variants.
* Existing composition patterns.

The Agent MUST NOT rely only on filename matching.

The Agent MUST inspect the actual component implementation when determining whether reuse is possible.

---

# 15.3 Component Decision Protocol

For every significant frontend UI element, the Agent MUST follow:

```text
                    UI REQUIREMENT
                          │
                          ▼
                Does suitable component exist?
                     /           \
                   YES            NO
                   │               │
                   ▼               ▼
                 REUSE       Does related component exist?
                                  /       \
                                YES        NO
                                │           │
                                ▼           ▼
                              EXTEND      CREATE
                                            │
                                            ▼
                                      IMPLEMENT FIRST
                                            │
                                            ▼
                                          USE
```

The decision rules are mandatory:

### Case A — Existing Suitable Component

```text
REUSE
```

The Agent MUST use the existing component.

Creating a duplicate implementation is prohibited.

### Case B — Existing Related Component

```text
EXTEND
```

If the existing component is conceptually responsible for the requested behavior but lacks a capability, the Agent SHOULD extend it rather than create a parallel component.

Extension is preferred when it:

* Preserves the component's responsibility.
* Does not introduce unrelated complexity.
* Maintains backward compatibility where required.
* Improves legitimate reuse.

### Case C — No Suitable Component

```text
CREATE
```

The Agent MAY create a new component.

However, the new component MUST be created **before** implementing the consuming page/section.

The required order is:

```text
1. Define component boundary.
2. Create component.
3. Define its reusable interface.
4. Implement the component.
5. Verify the component.
6. Integrate it into the page/section.
7. Verify page-level composition.
```

---

# 15.4 Component-First Implementation Rule

When a new frontend section represents a reusable UI responsibility and no suitable existing component exists:

> **The component MUST be created first and the page MUST consume it.**

The Agent MUST NOT:

```text
Create Page
   ↓
Write complete UI directly in Page
   ↓
Leave UI page-local
```

Instead:

```text
Determine Component Boundary
          ↓
Create Component
          ↓
Implement Component
          ↓
Use Component in Page
```

This applies to significant reusable UI structures such as, where applicable:

```text
Forms
Tables
Data cards
Search sections
Filter sections
Dialogs
Modals
Drawers
Tabs
Navigation sections
Status displays
Entity selectors
Complex form fields
Repeated information blocks
Reusable empty states
Reusable loading states
Reusable error states
```

The exact classification remains dependent on the project's architecture and Design System.

---

# 15.5 No Fake Components

Creating a component merely to satisfy the existence of a component file is prohibited.

A component is NOT considered valid merely because:

```text
<Component />
```

exists.

The actual reusable UI responsibility MUST live inside the component.

The consuming page MUST NOT contain a duplicated implementation of the component's internal UI.

The following is prohibited:

```text
Component:
    Empty wrapper

Page:
    Contains the actual UI
```

The following is required:

```text
Component:
    Owns the UI structure
    Owns the relevant presentation behavior
    Exposes a reusable interface

Page:
    Composes and supplies data/configuration
```

A component that only wraps page-local markup without creating a meaningful reusable boundary SHALL be considered a **componentization violation**.

---

# 15.6 Component Creation Justification

Whenever the Agent creates a new frontend component, it MUST internally establish the following justification:

```text
COMPONENT CREATION JUSTIFICATION

Component:
Location:
Purpose:

Existing Components Searched:
Potential Matching Components:
Potential Related Components:

Decision:
[REUSE | EXTEND | CREATE]

If CREATE:
Why existing component is insufficient:
Why extension is inappropriate:
Why a new reusable boundary is justified:

Public Interface:
Props / Inputs:
Outputs / Events:
Slots / Composition:
Variants:
States:

Expected Reuse:
Current Consumer:
Potential Future Consumers:
```

The Agent MUST NOT create a new component solely because:

* It is faster.
* It is easier.
* The current page is unique.
* Copy/paste is convenient.
* The existing component requires understanding.
* The existing component is located in another directory.
* The Agent prefers another implementation style.

---

# 15.7 No Duplicate UI Implementations

The Agent MUST actively prevent duplication.

Before implementing a new UI structure, search for equivalent or similar implementations.

Examples include:

```text
Two different Button implementations
Two different Modal implementations
Two different Search bars
Two different Table wrappers
Two different Empty states
Two different Loading states
Two different Confirmation dialogs
Two different Status badges
Two different Form field implementations
Two different Page headers
Two different Card structures
```

If duplication is discovered:

```text
STOP
 ↓
Compare existing implementations
 ↓
Determine canonical implementation
 ↓
Reuse or consolidate where permitted
```

The Agent MUST NOT automatically create another implementation.

---

# 15.8 Page-Level Responsibility Rule

Pages, views, screens, or equivalent top-level frontend artifacts SHOULD primarily be responsible for:

```text
Composition
Data orchestration
Page-level state
Navigation
Authorization-aware presentation
API interaction orchestration
Layout composition
```

Reusable visual and interaction responsibilities SHOULD live in components according to the project's architecture.

The Agent MUST avoid turning a page into a large monolithic UI implementation when the same responsibility can reasonably be represented as a reusable component.

This does NOT mean that every HTML/UI element requires a component.

The objective is:

> **Meaningful componentization, not componentization for its own sake.**

---

# 15.9 Design Fidelity Rule

The Agent MUST implement the approved design rather than creating an approximate visual interpretation.

Before implementation, the Agent MUST identify applicable:

```text
Typography
Font sizes
Font weights
Line heights
Spacing
Dimensions
Colors
Borders
Radius
Icons
Component variants
Layout
Alignment
Responsive behavior
RTL behavior
Interaction states
Loading states
Empty states
Error states
Accessibility
```

The Agent MUST prefer existing Design Tokens and Components over locally invented values.

The Agent MUST NOT introduce arbitrary values when an approved token or component already exists.

For example, if the Design System defines spacing tokens, the Agent MUST use those tokens instead of introducing unrelated page-specific spacing values.

---

# 15.10 Visual Consistency Rule

A new frontend section MUST visually belong to the existing application.

The Agent MUST preserve the established visual language.

It MUST NOT independently introduce:

* A new button style.
* A new card style.
* A new radius system.
* A new spacing scale.
* A new typography hierarchy.
* A new color interpretation.
* A new icon style.
* A new table style.
* A new form style.
* A new modal style.

unless explicitly required by approved design documentation.

The fact that a new design looks "better" according to the Agent's personal preference is NOT sufficient justification for deviating from the approved Design System.

---

# 15.11 Frontend Responsive / RTL / Accessibility Integrity

Where applicable, the Agent MUST preserve:

```text
Responsive behavior
RTL direction
Keyboard accessibility
Focus states
Semantic structure
Screen-reader compatibility
Touch usability
Error visibility
Loading feedback
Empty-state behavior
```

These are functional UI requirements, not optional cosmetic enhancements.

The Agent MUST NOT sacrifice them merely to reproduce a visual appearance.

---

# 15.12 Frontend State Completeness

For every applicable interactive or data-driven UI, the Agent MUST consider:

```text
Initial state
Loading state
Success state
Empty state
Error state
Disabled state
Validation state
Unauthorized state
Forbidden state
Retry state
```

Only states required by the approved specification need to be implemented.

The Agent MUST NOT invent undocumented product behavior.

---

# 15.13 Frontend API Contract Integrity

When the frontend consumes an API:

```text
Frontend
   ↓
Approved API Contract
   ↓
Backend
```

The Agent MUST NOT invent response fields, status semantics, or error structures.

If `routes.md` is the project's Network SSoT, the frontend MUST follow it exactly.

The Agent MUST NOT compensate for an API mismatch by silently inventing frontend-side assumptions.

If the API contract is insufficient:

> 🛑 STOP and report the contract gap where correctness depends on it.

---

# 15.14 Frontend Implementation Verification

Before considering frontend implementation complete, the Execution Engine MUST verify:

```text
[ ] Phase frontend requirements implemented
[ ] Approved design rules followed
[ ] Existing components searched
[ ] Existing components reused where applicable
[ ] Related components extended where appropriate
[ ] New components created only when justified
[ ] New components created before page integration
[ ] New components are actually consumed
[ ] No fake components created
[ ] No duplicate UI implementation introduced
[ ] Design tokens reused
[ ] Existing patterns reused
[ ] Responsive behavior preserved
[ ] RTL behavior preserved where required
[ ] Accessibility preserved where required
[ ] Loading states implemented where required
[ ] Empty states implemented where required
[ ] Error states implemented where required
[ ] API contract respected
[ ] Frontend capabilities respected
[ ] Page remains focused on composition/orchestration
[ ] No undocumented UI behavior introduced
```

A frontend phase MUST NOT be considered locally complete if these checks have not been evaluated.

---

# 15.15 Frontend Evidence Requirement

When reporting frontend implementation completion, the Execution Engine MUST be able to identify:

```text
Requirement
    ↓
Frontend Specification
    ↓
Component / Page
    ↓
Exact Implementation Location
    ↓
Existing Component Reuse or New Component Decision
    ↓
API Integration where applicable
    ↓
Verification Evidence
```

The Agent MUST NOT claim:

```text
"Design implemented"
```

merely because a page renders.

It must establish that the page follows the approved design and component governance.

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

Likewise, the Agent MUST NOT assume that every frontend project uses:

```text
Components directory
Pages directory
Views directory
Hooks
Composables
Stores
Specific CSS architecture
Specific component library
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
                 IMPLEMENTATION
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
         BACKEND                     FRONTEND
             │                           │
             │                    Read Design Rules
             │                           │
             │                    Inventory Existing UI
             │                           │
             │                    Search Components
             │                           │
             │              ┌────────────┴────────────┐
             │              │                         │
             │           REUSE / EXTEND           CREATE
             │              │                         │
             │              │                  Create Component
             │              │                         │
             │              │                  Implement Component
             │              │                         │
             │              └────────────┬────────────┘
             │                           │
             │                    Integrate in Page
             │                           │
             └───────────────┬───────────┘
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

### Frontend Implementation Summary

Where frontend work exists, additionally report:

```text
Frontend pages/screens implemented:
Frontend components reused:
Frontend components extended:
Frontend components created:
Frontend component creation justifications:
Existing components searched:
Design System elements reused:
Design deviations:
Responsive considerations:
RTL considerations:
Accessibility considerations:
Frontend API integrations:
Frontend states implemented:
```

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
* Frontend component governance.
* Frontend reuse governance.
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
6. Frontend Component Governance
7. Resolved Technology Profile
8. Configured Execution Engine

Frontend Governance Verification:

- Existing components were searched before creating new components.
- Existing suitable components were reused where applicable.
- Related components were extended where appropriate.
- New components were created only when justified.
- New components were implemented before page integration.
- New components are actually consumed by their target pages/sections.
- No fake componentization was introduced.
- No known duplicate UI implementation was intentionally created.
- Approved design rules and design-system constraints were preserved.

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
│ • Frontend Reuse Governance                                │
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
│ • Naming                                                   │
│ • Frontend Technology Implementation                       │
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

### Permanent Frontend Contract

```text
                 APPROVED DESIGN
                       │
                       ▼
              EXISTING DESIGN SYSTEM
                       │
                       ▼
              EXISTING COMPONENTS
                       │
             ┌─────────┴─────────┐
             │                   │
         Suitable             Related
             │                   │
             ▼                   ▼
           REUSE               EXTEND
             │                   │
             └─────────┬─────────┘
                       │
                       ▼
                 No suitable
                  component
                       │
                       ▼
                     CREATE
                       │
                       ▼
              IMPLEMENT COMPONENT
                       │
                       ▼
                 VERIFY IT
                       │
                       ▼
               USE IN PAGE
                       │
                       ▼
              VERIFY COMPOSITION
```

### Non-Negotiable Frontend Rules

```text
REUSE BEFORE CREATE

EXTEND BEFORE DUPLICATE

CREATE COMPONENT BEFORE PAGE INTEGRATION

IMPLEMENT COMPONENT BEFORE CONSUMING IT

NO FAKE COMPONENTS

NO DUPLICATE UI IMPLEMENTATIONS

NO PAGE-LEVEL REIMPLEMENTATION OF EXISTING COMPONENTS

NO ARBITRARY DESIGN SYSTEM

NO UNAUTHORIZED VISUAL DEVIATION

NO UNDOCUMENTED FRONTEND BEHAVIOR

NO COMPLETION CLAIM WITHOUT FRONTEND GOVERNANCE VERIFICATION
```

> **The frontend is part of the system architecture and product implementation, not merely a visual layer.**

> **A functionally correct frontend that violates the approved Design System, duplicates existing components, or bypasses component reuse is NOT considered a correct implementation.**
