# Review Project Configuration

> **Purpose:** Perform a deep, read-only health check and consistency audit of the project's core configuration before domain analysis, database design, or implementation begins.

> **Execution Role:** Configuration Auditor & Architecture Validator

> **Target Specification:** `PROJECT/MD/`

> **Core Principle:** Detect configuration drift and architectural inconsistencies as early as possible. Configuration problems MUST be resolved before the project proceeds to domain analysis or implementation.

---

# 1. Agent Constraints & Audit Scope

## 1.1 Strict Read-Only Audit

This prompt operates in **strict read-only mode**.

The Agent MUST:

* Read and inspect the relevant configuration files.
* Validate their structure and relationships.
* Report all errors, warnings, and inconsistencies.
* Provide actionable remediation instructions.

The Agent MUST NOT:

* Modify any configuration file.
* Rewrite YAML.
* Add missing keys.
* Remove invalid keys.
* Correct misspelled values.
* Automatically select configuration values.
* Create missing configuration files.
* Apply developer decisions on the developer's behalf.

**A failed audit MUST remain failed until the developer explicitly corrects the configuration and the audit is run again.**

---

## 1.2 Non-Execution Boundary

This prompt performs configuration verification only.

It MUST NOT:

* Execute application code.
* Execute application tests.
* Create or modify database schemas.
* Create migrations.
* Modify application source code.
* Analyze business rules.
* Analyze domain requirements.
* Start implementation phases.
* Invoke the configured Execution Engine.
* Perform recovery or implementation work.

The purpose of this prompt is only to determine whether the project configuration is ready for the next stage.

---

# 2. Canonical Sources of Truth

The Agent MUST use the following sources as authoritative references:

### Project Technology Configuration

```text
PROJECT/MD/stack.yaml
```

Defines the project's declared technologies and architectural communication configuration.

### Frontend Capability Policy

```text
FRAMEWORK/06_stack_profiles/frontend/common/capability_policy.md
```

Defines the canonical frontend capability policy and its 26 supported capability keys.

### Execution Engine Catalog

```text
FRAMEWORK/03_ai_protocol/runtime/execution_engines.yaml
```

Defines the recognized Execution Engines.

### Technology Profiles

```text
FRAMEWORK/06_stack_profiles/
```

Defines specialized technology profiles when available.

### Universal Core Rules

```text
FRAMEWORK/00_core/
```

Provides the universal fallback rules for technologies without specialized profiles.

The Agent MUST NOT create a second source of truth by hardcoding technology, capability, or Execution Engine definitions that conflict with these canonical sources.

---

# 3. Deep Configuration Audit

Execute the following audit gates sequentially.

---

## Gate 1 — Technology Stack & Communication Architecture

Inspect:

```text
PROJECT/MD/stack.yaml
```

### 1.1 File Integrity

Verify:

* The file exists.
* The YAML is syntactically valid.
* The structure is readable and unambiguous.
* There are no duplicate or conflicting declarations.
* Each technology dimension has one authoritative declaration.

Do not modify the file if any problem is found.

---

### 1.2 Technology Coverage

Verify that the applicable project technology dimensions are explicitly declared.

At minimum, inspect the dimensions defined by the project's `stack.yaml` schema, including where applicable:

* Backend
* Frontend
* Database
* Runtime
* Testing
* State
* Styling
* Build
* Deployment

Do not require dimensions that are legitimately not applicable to the project.

Do not invent missing technologies.

Do not treat an unspecified technology as permission to select one.

---

### 1.3 Technology Consistency

Verify that declared technologies represent clear, canonical choices.

Reject ambiguous declarations such as:

```text
backend: Laravel OR Express
```

or configurations that simultaneously declare mutually exclusive technologies without an explicit architectural reason.

Do not attempt to resolve the conflict automatically.

---

## Gate 2 — Communication Architecture Audit

Inspect:

```text
architecture.communication
```

inside:

```text
PROJECT/MD/stack.yaml
```

### 2.1 Communication Mode

Verify that:

```text
architecture.communication.mode
```

exists and contains exactly one supported value:

```text
direct
api_first
hybrid
```

If missing or invalid:

**FAIL the gate.**

Do not repair it.

---

### 2.2 `direct`

If:

```text
mode: direct
```

verify that the declared architecture and technologies support direct/in-process communication such as:

* Server-rendered views
* Blade
* Inertia.js bridge
* Server Actions
* Equivalent full-stack communication

Do not require an API configuration for a purely direct architecture.

---

### 2.3 `api_first`

If:

```text
mode: api_first
```

verify that an API communication style is explicitly declared under the applicable `api` configuration.

Supported API styles are determined by the project's canonical stack schema and may include:

```text
rest
graphql
grpc
trpc
```

If the architecture requires API versioning or equivalent API metadata according to the project's declared schema, verify that it is present and structurally valid.

Do not invent API technologies or versioning strategies.

---

### 2.4 `hybrid`

If:

```text
mode: hybrid
```

verify that the configuration declares both communication channels appropriately.

At minimum, there MUST be:

* At least one direct/web consumer or direct communication path.
* At least one non-direct/API consumer or API communication path.

Do **not** require `mobile` specifically.

Valid external consumers may include, depending on the project:

```text
mobile
partner_api
third_party
desktop
iot
microservices
```

The purpose of this validation is to verify the existence of two distinct communication channels, not to enforce a particular consumer type.

---

### 2.5 Communication / Stack Alignment

Verify that the communication mode does not contradict the declared technologies.

Examples:

* A `direct` architecture must not depend on an API-first architecture without explicit justification.
* An `api_first` architecture must have an API-capable backend configuration.
* A `hybrid` architecture must actually declare both communication paths.

If an inconsistency exists:

**FAIL the gate and report the conflict.**

Do not modify `stack.yaml`.

---

# 4. Gate 3 — Frontend Capabilities Policy

Inspect:

```text
PROJECT/MD/frontend_capabilities.yaml
```

against:

```text
PROJECT/MD/stack.yaml
```

and:

```text
FRAMEWORK/06_stack_profiles/frontend/common/capability_policy.md
```

---

## 4.1 No Frontend

If no Frontend is declared in `stack.yaml`:

* `frontend_capabilities.yaml` MAY be absent.
* If it exists, it MUST explicitly indicate:

```yaml
status: "N/A"
```

Do not perform the 26-key validation when no Frontend exists.

The final status must be:

```text
N/A
```

when the project has no Frontend.

---

## 4.2 Frontend Declared

If a Frontend is declared in `stack.yaml`:

```text
PROJECT/MD/frontend_capabilities.yaml
```

MUST exist.

If missing:

**FAIL the gate.**

Do not create it.

---

## 4.3 Canonical 26-Key Validation

When a Frontend exists:

* Read the canonical capability definitions from:

```text
FRAMEWORK/06_stack_profiles/frontend/common/capability_policy.md
```

* Verify that exactly the canonical 26 capability keys are present.
* Verify that no canonical key is missing.
* Verify that no unrecognized/custom capability key has been added.

The audit MUST NOT hardcode a separate 26-key list if the canonical policy file already defines it.

The canonical policy file remains the source of truth.

---

## 4.4 Capability States

Every capability MUST use one of the supported policy states:

```text
required
enabled
disabled
optional
```

Any other state is a configuration error.

---

## 4.5 Capability Logical Consistency

Check for contradictions between capability policies.

Examples include:

* A capability marked `required` while a directly dependent capability is explicitly `disabled`.
* A capability configuration that contradicts the declared Frontend technology.
* Mutually exclusive capability states being simultaneously required.

Only report contradictions that can be established from the canonical capability policy.

Do not invent dependency relationships.

Do not automatically change capability states.

---

# 5. Gate 4 — Execution Engine Conformance

Inspect:

```text
PROJECT/MD/execution_engine.yaml
```

against:

```text
FRAMEWORK/03_ai_protocol/runtime/execution_engines.yaml
```

---

## 5.1 File Existence

The project MUST contain:

```text
PROJECT/MD/execution_engine.yaml
```

If missing:

**FAIL the gate.**

Do not create it.

---

## 5.2 Catalog Validation

Read the canonical Execution Engine catalog from:

```text
FRAMEWORK/03_ai_protocol/runtime/execution_engines.yaml
```

Verify that:

```text
execution_engine.yaml
```

contains a non-empty engine identity.

The configured engine MUST match an engine registered in the canonical catalog.

Do not use a hardcoded list as the authoritative source.

---

## 5.3 Engine Identity Boundary

`execution_engine.yaml` MUST contain the identity/configuration required to select the Execution Engine.

It MUST NOT become an execution workflow configuration file.

Reject internal execution flags such as:

```text
tdd
planning
debugging
strategy
workflow
implementation_mode
```

or equivalent execution behavior settings.

For example, configurations such as:

```yaml
tdd: true
planning: true
debugging: true
strategy: agile
```

are prohibited.

If such fields exist:

**FAIL the gate.**

Do not remove them automatically.

---

# 6. Gate 5 — Technology Profile Coverage

Cross-reference the technologies declared in:

```text
PROJECT/MD/stack.yaml
```

against:

```text
FRAMEWORK/06_stack_profiles/
```

---

## 6.1 Profile Resolution

For every declared technology:

* Determine whether a specialized profile exists.
* Record the matching profile.
* Identify which profile documents are available.
* Report missing profile coverage.

---

## 6.2 Unknown Technology Protocol

If a declared technology has no specialized profile:

* Report it as `UNPROFILED`.
* Confirm that universal rules from:

```text
FRAMEWORK/00_core/
```

remain the applicable fallback.

An unprofiled technology is **informational**.

It MUST NOT automatically fail the configuration audit.

The Agent MUST NOT invent technology-specific rules.

---

# 7. Cross-Configuration Integrity

After completing the individual gates, perform a final cross-file consistency check.

Verify the relationship:

```text
stack.yaml
    │
    ├── declared technologies
    │
    ├── architecture.communication
    │
    ▼
frontend_capabilities.yaml
    │
    └── must correspond to declared Frontend
    │
    ▼
execution_engine.yaml
    │
    └── must correspond to canonical engine catalog
```

Confirm that:

* Frontend capabilities correspond to the Frontend declared in `stack.yaml`.
* Communication architecture corresponds to the declared technology stack.
* Execution Engine exists in the canonical catalog.
* No configuration file attempts to redefine another file's authority.
* No Execution Engine settings override Taqniya governance.
* No technology profile silently changes the project's declared Stack.
* Unknown technologies use Core fallback rules only.

---

# 8. Configuration Health Matrix

Generate the following report:

| Dimension                         | Target                         | Status                  | Audit Findings & Notes                            |
| :-------------------------------- | :----------------------------- | :---------------------- | :------------------------------------------------ |
| **Technology Stack**              | `PROJECT/MD/stack.yaml`        | `PASS / FAIL`           | Syntax, dimensions, canonical declarations        |
| **Communication Architecture**    | `stack.yaml`                   | `PASS / FAIL`           | Mode and communication-channel alignment          |
| **Frontend Capabilities**         | `frontend_capabilities.yaml`   | `PASS / FAIL / N/A`     | 26/26 canonical keys and policy consistency       |
| **Execution Engine**              | `execution_engine.yaml`        | `PASS / FAIL`           | Registered engine and identity-only configuration |
| **Technology Profiles**           | `FRAMEWORK/06_stack_profiles/` | `RESOLVED / UNPROFILED` | Specialized profiles and Core fallbacks           |
| **Cross-Configuration Integrity** | `PROJECT/MD/*`                 | `PASS / FAIL`           | Relationships between all configuration sources   |

---

# 9. Findings Classification

Classify every finding as one of:

### `ERROR`

A configuration problem that prevents the project from safely proceeding.

Examples:

* Invalid YAML.
* Missing required configuration.
* Unknown Execution Engine.
* Invalid communication mode.
* Missing Frontend capabilities when Frontend is declared.
* Invalid capability state.
* Conflicting architectural configuration.

### `WARNING`

A condition that does not prevent operation but should be known to the developer.

Examples:

* Technology without a specialized profile.
* Optional configuration not explicitly provided.
* Non-critical profile coverage limitation.

### `PASS`

The inspected configuration satisfies the applicable rule.

---

# 10. Overall Decision

After all gates are completed, calculate the final status.

## If all mandatory gates pass

Return:

```text
STATUS: READY_FOR_ANALYSIS
```

Meaning:

* Project configuration is internally consistent.
* Communication architecture is defined.
* Frontend capabilities are valid or `N/A`.
* Execution Engine is valid.
* Technology profile coverage has been resolved or safely classified as unprofiled.
* No blocking configuration errors remain.

Then recommend:

```text
Proceed to the project analysis workflow.
```

Do not automatically execute the next prompt.

---

## If one or more mandatory gates fail

Return:

```text
STATUS: ACTION_REQUIRED
```

Then provide an itemized list containing:

1. Gate that failed.
2. Exact file involved.
3. Exact configuration problem.
4. Why it violates the applicable rule.
5. Required developer correction.

Then:

```text
STOP.
```

Do not continue to domain analysis or implementation.

Do not modify the configuration.

---

# 11. Final Output Structure

The final response MUST contain:

```text
Configuration Health Matrix
        ↓
Detailed Findings
        ↓
Warnings
        ↓
Overall Status
        ↓
Required Actions (if any)
        ↓
Recommended Next Step
```

The Agent MUST NOT output a success status merely because the files exist.

The status must be based on the actual cross-file validation results.

---

# 12. Absolute Boundary

This prompt is an **auditor, not a configurator**.

Its authority is:

```text
READ
  ↓
INSPECT
  ↓
COMPARE
  ↓
VALIDATE
  ↓
REPORT
  ↓
DECIDE READY / ACTION_REQUIRED
```

It has **zero write authority** over project configuration.

It does not repair.

It does not configure.

It does not select.

It does not implement.

It does not invoke the Execution Engine.

It only determines whether the configuration prepared by the initialization process is structurally and architecturally ready for the next Taqniya stage.
