# Horizon CRM — Development Guide

## Project Structure

The repository root **is** the Frappe app (same pattern as [frappe/crm](https://github.com/frappe/crm)).

```
horizon_crm/                     # ← Repo root = Frappe app
├── pyproject.toml               # Python package metadata
├── docker-compose.yml           # Docker-first dev stack (MariaDB, Redis, Bench)
├── docker/
│   ├── init.sh                  # First-run bootstrap inside the container
│   └── docker-compose.yml       # Lightweight self-hosting compose
├── scripts/
│   └── init.sh                  # GitHub Codespaces / Dev Container init
├── .devcontainer/               # VS Code Dev Container support
│
├── horizon_crm/                 # Python module
│   ├── hooks.py                 # App hooks & configuration
│   ├── utils.py                 # Multi-tenancy utilities
│   ├── install.py               # Post-install seed data
│   ├── permissions.py           # Row-level security
│   ├── api/                     # Whitelisted API endpoints
│   │   ├── inquiry.py
│   │   ├── booking.py
│   │   └── portal.py
│   ├── horizon_crm/
│   │   └── doctype/             # 26 DocTypes
│   ├── public/                  # Static assets (CSS, JS, images)
│   ├── www/portal/              # Customer portal pages
│   ├── patches/                 # Data migration patches
│   └── tests/                   # ALL tests (unit + E2E)
│       ├── test_doctypes.py     # Server-side unit/integration tests
│       ├── playwright.config.ts # E2E configuration
│       ├── package.json         # E2E Node dependencies
│       └── e2e/                 # Playwright E2E specs
│           ├── fixtures.ts
│           ├── global-setup.ts
│           ├── global-teardown.ts
│           ├── 01-auth.spec.ts
│           ├── ...
│           ├── 12-invoice-customer-masterdata.spec.ts
│           └── 13-validation-negative.spec.ts
│
├── docs/                        # Documentation
└── bench0/                      # Local bench runtime (gitignored)
```

> **`bench0/`** is your local Frappe bench directory. It is gitignored since it
> contains runtime data. A symlink `bench0/apps/horizon_crm → ../../` lets
> bench find the app at the repo root.

## Getting Started — Docker-First Development

All services (MariaDB, Redis, Frappe bench) run inside Docker. You do **not**
need to install MariaDB, Redis, or Python on your host.

### Prerequisites

| Tool           | Version |
|----------------|---------|
| Docker         | 20.10+  |
| Docker Compose | v2+     |
| Git            | 2.x     |

### Quick Start

```bash
# 1. Clone the repository
git clone <repo-url> horizon_crm
cd horizon_crm

# 2. Start everything (MariaDB + Redis + Bench)
docker compose up

# 3. Wait for first-time bootstrap (watch the logs)
#    The init script creates the bench, installs the app, and starts the server.

# 4. Access the application
#    Desk:   http://localhost:8000
#    Portal: http://localhost:8000/portal
#    Login:  Administrator / admin
```

### Day-to-Day Commands

```bash
# Start in background
docker compose up -d

# View logs
docker compose logs -f frappe

# Stop
docker compose down

# Reset everything (DESTRUCTIVE — drops DB)
docker compose down -v
```

### Running Bench Commands

```bash
# Enter the container
docker compose exec frappe bash

# Then use bench normally
cd /workspace/frappe-bench
bench --site horizon.localhost migrate
bench --site horizon.localhost console
bench build --app horizon_crm
```

### Hot-Reload

The app source is bind-mounted into the container at `/workspace/app`. Changes
to Python files are picked up automatically by the bench dev server. For
JavaScript/CSS:

```bash
docker compose exec frappe bash -c "cd /workspace/frappe-bench && bench build --app horizon_crm"
```

---

## Local Development (Without Docker)

If you prefer running bench natively:

```bash
# 1. Install prerequisites: Python 3.11+, Node 18+, MariaDB 10.6+, Redis 7+

# 2. Create a bench
bench init bench0 --frappe-branch version-15

# 3. Symlink the app into the bench
ln -s ../../ bench0/apps/horizon_crm

# 4. Configure bench0/sites/common_site_config.json with your DB/Redis hosts

# 5. Create site and install app
cd bench0
bench new-site horizon.localhost --admin-password admin
bench --site horizon.localhost install-app horizon_crm
bench start
```

---

## Making Changes

### Python Changes
Saved automatically by the bench dev server — just refresh the browser.

### DocType Changes
1. Edit in the Frappe UI at `/app/doctype/` or modify the JSON directly
2. Apply schema changes:
   ```bash
   bench --site horizon.localhost migrate
   ```

### JavaScript / CSS Changes
```bash
# One-time build
bench build --app horizon_crm

# Watch mode (auto-rebuild)
bench watch
```

### Portal Template Changes
Jinja templates in `horizon_crm/www/portal/` are auto-reloaded.

---

## Creating a New DocType

1. Create the directory:
   ```bash
   mkdir -p horizon_crm/horizon_crm/doctype/my_new_doctype
   ```

2. Create the JSON definition (`my_new_doctype.json`)

3. Create the controller (`my_new_doctype.py`):
   ```python
   import frappe
   from frappe.model.document import Document
   from horizon_crm.utils import validate_agency_access

   class MyNewDoctype(Document):
       def validate(self):
           validate_agency_access(self)
   ```

4. Create `__init__.py` (empty)

5. Run migration:
   ```bash
   bench --site horizon.localhost migrate
   ```

### Adding Multi-Tenancy to a New DocType

If your DocType has an `agency` field:

1. Add to `horizon_crm/permissions.py`:
   ```python
   def my_new_doctype_query(user):
       return _agency_query_condition("My New Doctype", user)

   def my_new_doctype_permission(doc, ptype, user):
       return _agency_has_permission(doc, ptype, user)
   ```

2. Register in `horizon_crm/hooks.py`:
   ```python
   permission_query_conditions = {
       "My New Doctype": "horizon_crm.permissions.my_new_doctype_query",
   }
   has_permission = {
       "My New Doctype": "horizon_crm.permissions.my_new_doctype_permission",
   }
   ```

---

## Adding a New API Endpoint

Create or edit a file in `horizon_crm/api/`:

```python
import frappe

@frappe.whitelist()
def my_api_method(param1, param2):
    frappe.only_for(["Agency Admin", "Agency Team Lead"])
    # Your logic
    return {"result": "data"}
```

Call via: `POST /api/method/horizon_crm.api.module.my_api_method`

---

## Key Conventions

### Multi-Tenancy Rules
- **Every tenant DocType** must have an `agency` Link field
- **Every controller** must call `validate_agency_access(self)` in `validate()`
- **hooks.py** must register both `permission_query_conditions` and `has_permission`
- **Never** trust client-side agency filtering alone

### Security Checklist
- [ ] `agency` field is set server-side
- [ ] `permission_query_conditions` registered in hooks
- [ ] `has_permission` registered in hooks
- [ ] Controller `validate()` calls `validate_agency_access()`
- [ ] API methods use `frappe.only_for()` for role checks
- [ ] Portal API methods verify customer ownership

### Testing
- Unit tests: `bench --site horizon.localhost run-tests --app horizon_crm`
- E2E tests: See [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

## Useful Bench Commands

```bash
bench start                                          # Start dev server
bench --site horizon.localhost migrate               # Apply migrations
bench build --app horizon_crm                        # Build JS/CSS
bench --site horizon.localhost console               # Python REPL
bench --site horizon.localhost execute horizon_crm.install.after_install
bench --site horizon.localhost clear-cache
bench --site horizon.localhost export-fixtures
```

## Debugging

### Python
```python
import frappe
frappe.log("Debug: " + str(variable))
breakpoint()  # Python 3.7+
```

### Browser
- DevTools Console for JS errors
- Network tab for API calls
- Test API from console:
  ```javascript
  frappe.call({
    method: "horizon_crm.api.booking.get_booking_summary",
    args: { agency: "Test Agency Alpha" },
    callback: (r) => console.log(r.message)
  });
  ```
