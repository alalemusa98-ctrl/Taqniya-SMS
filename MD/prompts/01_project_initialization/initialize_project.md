# Initialize Project

> **Purpose:** One-time project initialization and configuration bootstrap for a new or existing project using the Taqniya AI Development Framework.

> **Execution Role:** Project Initialization & Configuration Bootstrapper

> **Target Specification:** `PROJECT/MD/`

> **Core Principle:** `stack.yaml` is the authoritative source of truth for project technologies. Taqniya must never invent, guess, replace, or modify declared technologies during initialization.

---

## 1. Agent Constraints & Write Authority

### 1.1 `stack.yaml` is the Technology SSoT

`PROJECT/MD/stack.yaml` is the authoritative source for all declared project technologies and technology-related configuration.

The Agent MUST:

* Read `stack.yaml` before performing any initialization work.
* Treat all declared technologies as developer-owned decisions.
* Never invent, guess, replace, remove, or change declared technologies.
* Never ask the developer to select technologies that are already declared in `stack.yaml`.

If `PROJECT/MD/stack.yaml` does not exist:

**STOP IMMEDIATELY.**

Do not attempt to infer the project's technology stack.

Request that the developer provide or create `stack.yaml` before continuing.

---

### 1.2 Scoped Write Authority on `stack.yaml`

The Agent has extremely limited write authority over `PROJECT/MD/stack.yaml`.

The Agent MAY modify **only**:

```text
architecture.communication
```

and only when that configuration is missing or undefined and the developer explicitly selects the communication mode.

The Agent MUST NOT modify any declared technology or unrelated configuration, including:

* Backend
* Frontend
* Database
* Runtime
* Testing
* State management
* Styling
* Build
* Deployment
* Package configuration
* Any other existing `stack.yaml` property

---

### 1.3 Initialization Scope

This prompt performs configuration initialization only.

It does NOT:

* Implement application features.
* Modify application source code.
* Create database tables.
* Execute project phases.
* Plan feature implementation.
* Perform TDD.
* Perform debugging or recovery workflows.
* Delegate implementation work to the Execution Engine.

After initialization is successfully verified, stop and wait for the next project workflow or prompt.

---

# 2. Initialization Sequence

## Step 1 — Read and Validate `stack.yaml`

Read:

```text
PROJECT/MD/stack.yaml
```

Validate that the file exists and is syntactically valid.

Extract the technologies explicitly declared by the developer, including the applicable dimensions such as:

* Backend
* Frontend
* Database
* Runtime
* Testing
* State
* Styling
* Build
* Deployment

Do not alter these declarations.

---

## Step 2 — Resolve Declared Technology Profiles

For each technology explicitly declared in `stack.yaml`:

1. Locate the corresponding profile under:

```text
FRAMEWORK/06_stack_profiles/
```

2. If a matching profile exists, load the applicable profile rules into the initialization context.

3. If no specialized profile exists:

* Do not invent technology-specific rules.
* Do not modify `stack.yaml`.
* Fall back only to the applicable universal rules defined by `FRAMEWORK/00_core/`.

An unknown technology is not automatically an initialization failure.

---

## Step 3 — Resolve Communication Architecture

Check:

```text
architecture.communication.mode
```

inside:

```text
PROJECT/MD/stack.yaml
```

### If already defined

Validate that the declared communication configuration is structurally valid and compatible with the declared stack.

Do not change it.

### If missing or undefined

Ask the developer to select one of the supported communication modes:

```text
1. direct
   Direct application communication such as Blade, Inertia.js,
   server-rendered views, or equivalent in-process/full-stack communication.

2. api_first
   A decoupled client-server architecture primarily communicating
   through REST, GraphQL, gRPC, tRPC, or another declared API protocol.

3. hybrid
   A system combining direct web communication with dedicated APIs
   for additional consumers such as mobile applications or partners.
```

After the developer explicitly selects a mode:

* Write **only** the `architecture.communication` configuration.
* Preserve all existing `stack.yaml` content.
* Do not modify any technology declaration.

The resulting configuration must remain consistent with the project's declared technologies.

---

## Step 4 — Configure Frontend Capabilities

Determine whether a Frontend is explicitly declared in `stack.yaml`.

### If no Frontend is declared

Do not create frontend-specific configuration.

Treat frontend capabilities as:

```text
N/A
```

Continue to Step 5.

### If a Frontend is declared

Identify the declared Frontend technology from `stack.yaml`.

Load the corresponding baseline from:

```text
FRAMEWORK/06_stack_profiles/frontend/common/capability_policy.md
```

Present the developer with two choices:

```text
1. Recommended
2. Customize
```

### Recommended

Use the appropriate recommended baseline for the declared Frontend technology and create:

```text
PROJECT/MD/frontend_capabilities.yaml
```

The generated file represents the project's selected configuration.

### Customize

Allow the developer to explicitly customize the supported capability states.

Use only the states defined by the Taqniya capability policy:

```text
required
enabled
disabled
optional
```

Create:

```text
PROJECT/MD/frontend_capabilities.yaml
```

using the developer's explicit selections.

The Agent MUST NOT silently select Customize values on behalf of the developer.

---

## Step 5 — Configure Execution Engine

Read the canonical Execution Engine catalog:

```text
FRAMEWORK/03_ai_protocol/runtime/execution_engines.yaml
```

This catalog is the authoritative list of Execution Engines recognized by Taqniya.

Inspect:

```text
PROJECT/MD/execution_engine.yaml
```

### If the file exists

Validate the configured engine against the canonical catalog.

If valid:

* Keep the existing configuration.
* Do not replace it.
* Do not ask the developer to select another engine.

If invalid:

* Stop initialization.
* Report a `CONFIGURATION_ERROR`.
* Request that the developer correct the configured engine.

### If the file does not exist

Ask the developer to select an Execution Engine from the registered catalog.

Do not assume an engine automatically.

After the developer selects an engine, create:

```text
PROJECT/MD/execution_engine.yaml
```

containing the selected engine identity.

Example:

```yaml
name: "superpowers"
```

The file MUST identify the Execution Engine only.

It MUST NOT contain internal workflow flags such as:

```text
tdd
planning
debugging
workflow
strategy
```

Those responsibilities belong to the configured Execution Engine itself, not to the Taqniya project configuration.

---

# 3. Final Initialization Verification

After completing the required initialization steps, verify:

### Stack

```text
PROJECT/MD/stack.yaml
```

* Exists.
* Is valid.
* Declared technologies remain unchanged.
* Communication architecture is defined and valid.

### Frontend

If a Frontend is declared:

```text
PROJECT/MD/frontend_capabilities.yaml
```

must exist and be valid according to the applicable capability policy.

If no Frontend is declared:

```text
frontend_capabilities = N/A
```

### Execution Engine

```text
PROJECT/MD/execution_engine.yaml
```

must:

* Exist.
* Contain a valid registered engine.
* Match an entry in:

```text
FRAMEWORK/03_ai_protocol/runtime/execution_engines.yaml
```

---

# 4. Initialization Completion

When all checks pass, report that project initialization is complete.

Provide a concise summary containing:

* Declared technology stack
* Communication mode
* Frontend capability configuration or `N/A`
* Selected Execution Engine
* Any unresolved profile warnings

Do not begin implementation.

Do not automatically invoke another project phase.

Do not modify application source code.

**Initialization ends here.**

Wait for the developer's next instruction or the appropriate project prompt.

---

## Authority Boundary

The final responsibility separation is:

```text
Taqniya
│
├── Reads project configuration
├── Enforces project rules
├── Resolves declared technologies
├── Configures communication architecture
├── Configures frontend capabilities
├── Records the selected Execution Engine
└── Verifies initialization
```

```text
Execution Engine
│
└── Executes project tasks according to the resolved Taqniya context
```

`initialize_project.md` does not become an Execution Engine and does not perform implementation work.
