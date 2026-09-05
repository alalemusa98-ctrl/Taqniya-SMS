# Taqniya School Management System (Taqniya-SMS) — Engineering Instructions

This project is governed by the **Taqniya AI Development Framework v1.0** and powered by the **Superpowers Execution Engine**.

- **Master Framework Root:** `C:/Users/alale/OneDrive/Desktop/work/taqniya-framework-project-md/FRAMEWORK`
- **Project Specifications (SSoT):** `MD/`
- **Stack Configuration:** `MD/stack.yaml` (NestJS 10.x, Vue 3, MySQL 8.0 / Prisma)
- **Frontend Capabilities:** `MD/frontend_capabilities.yaml`
- **Execution Engine:** `MD/execution_engine.yaml` (Superpowers TDD engine)
- **Active Backend Profile:** `C:/Users/alale/OneDrive/Desktop/work/taqniya-framework-project-md/FRAMEWORK/06_stack_profiles/backend/nestjs/`

## Operating Directives:
1. **SSoT Precedence:** `MD/database.md` and `MD/business_rules.md` are the single source of truth. Never invent unapproved tables or columns.
2. **NestJS Modular Architecture:** Structure backend into feature modules (`src/modules/*`), thin controllers, domain services, DTOs with `class-validator`, and guards for RBAC.
3. **Superpowers Execution Workflow:**
   - **TDD (Red-Green-Refactor):** Author failing tests first, implement minimal code to pass, then refactor cleanly.
   - **Systematic Debugging:** Trace issues with hypothesis-driven investigations.
4. **Pre-Completion Gatekeeper:** Every phase deliverable must satisfy the 8-stage verification gates before sign-off.
5. **Phase Tracking:** Update `MD/phases/<phase_name>/README.md` when tasks are completed.
