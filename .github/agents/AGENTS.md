# Horizon CRM Agents

## Available Agents

### doctype-builder
Specializes in creating and modifying Frappe DocTypes for the Horizon CRM app.
Knows the data model, permission rules, and controller patterns.
Reference: `knowledge_base/architecture/DATA_MODEL.md`

### security-auditor
Verifies multi-tenancy isolation, permission rules, and data access patterns.
Checks controllers for proper agency validation and User Permission setup.
Reference: `knowledge_base/architecture/ARCHITECTURE.md` (Section 3, 4)

### portal-builder
Creates and maintains customer portal pages using Jinja templates.
Handles portal authentication, context building, and responsive layouts.
Reference: `knowledge_base/prd/PRD.md` (Section 7)

### test-writer
Writes unit tests, integration tests, and E2E Playwright tests.
Covers CRUD operations, security boundaries, and UI workflows.
Reference: `knowledge_base/tasks/TASK_BREAKDOWN.md` (Phase 6)

### docker-manager
Manages Docker development environment setup and troubleshooting.
Handles container configuration, bench commands, and service health.
Reference: `knowledge_base/how-to/DOCKER_SETUP.md`
