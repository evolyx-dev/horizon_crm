# Horizon CRM — Research Notes

## Frappe Framework Key Concepts

### App Creation
- `bench new-app <app_name>` scaffolds the app structure
- Apps live in `bench/apps/<app_name>/`
- Each app has `hooks.py` (events, includes), `modules.txt`, `patches.txt`
- `pyproject.toml` specifies Python dependencies

### DocTypes
- Core building block — defines both model and view
- JSON-defined schema, auto-creates DB tables prefixed with `tab`
- Controller: Python class extending `frappe.model.document.Document`
- Client script: JavaScript for form behavior
- Naming: autoname, by fieldname, format string, hash, etc.
- Child DocTypes: linked via parent table field

### Permissions
- Role-based: roles assigned to users
- DocType Permissions: per-role CRUD matrix
- User Permissions: row-level restriction by Link field value
- Automatic roles: Guest, All, Administrator, Desk User
- Permission Levels: group fields for separate role access

### Portal Pages
- `www/` folder maps directly to URL routes
- `.html` + `.py` controller with `get_context()`
- Jinja2 templating with Frappe standard API
- Extend `templates/web.html` for consistent layout
- Custom CSS/JS can accompany each page

### Testing
- Test files: `test_<doctype>.py` in doctype folder
- Run: `bench --site <site> run-tests --app <app>`
- Frappe provides `FrappeTestCase` base class
- Test fixtures auto-create dependent records
- For UI: Cypress (built-in) or Playwright (custom)

### Hooks System
- `doc_events`: hook into document lifecycle (validate, on_update, etc.)
- `permission_query_conditions`: add SQL WHERE for permission filtering
- `has_permission`: custom permission check function
- `after_install`: setup code after app installation
- `website_route_rules`: custom URL routing
- `portal_menu_items`: add items to portal navbar
- `app_include_css/js`: include static assets for desk

---

## Frappe CRM Analysis

### Structure
- Frontend: Vue.js (Frappe UI) — separate SPA
- Backend: Frappe DocTypes in `crm/fcrm/doctype/`
- Key DocTypes: CRM Lead, CRM Deal, CRM Organization, CRM Contacts, CRM Task
- Settings: CRM Global Settings, FCRM Settings, CRM Fields Layout
- Integrations: Twilio, Exotel, WhatsApp, ERPNext

### Key Concepts Borrowed
1. **Status pipeline**: Lead stages (New → Contacted → Qualified → etc.)
2. **Organization-centric**: Leads/Deals linked to organizations
3. **Agent assignment**: Agents assigned to leads/deals
4. **SLA tracking**: Service Level Agreement on response times
5. **Global settings**: Centralized configuration DocType

### Differences for Horizon CRM
1. **No Vue SPA** — we use Frappe Desk + Jinja portal (simpler, faster to build)
2. **Travel-specific entities** — Inquiry, Itinerary, Booking instead of Lead/Deal
3. **Multi-tenant** — row-level agency isolation (CRM is single-org)
4. **Customer portal** — server-rendered portal pages
5. **Simpler stack** — no separate frontend build, pure Frappe

---

## Docker Development Strategy

### Approach
Based on `frappe/frappe_docker` devcontainer approach:
- Docker Compose with MariaDB, Redis (cache + queue), Frappe container
- Mount app code for hot-reloading
- `bench start` inside container for development
- Playwright container for E2E tests

### Key Container Services
1. **frappe** — Main development container with bench
2. **mariadb** — Database (MariaDB 10.6+)
3. **redis-cache** — Cache store
4. **redis-queue** — Background job queue (also for socketio)

---

## Multi-Tenancy Patterns in Frappe

### Option A: Site-per-tenant (Native Frappe)
- Each tenant = separate Frappe site with own DB
- Complete isolation by default
- Higher resource usage per tenant
- **Not chosen**: overkill for shared CRM, complex management

### Option B: Shared DB with Row-Level Isolation (Chosen)
- Single site, single database
- Every DocType has `agency` Link field
- User Permissions auto-filter data per user's agency
- Lower resource overhead, simpler management
- Requires careful controller validation

### Implementation Pattern
```python
class TenantDocType(Document):
    def validate(self):
        if not self.agency:
            self.agency = get_user_agency()
        if self.agency != get_user_agency():
            frappe.throw("Access denied: invalid agency")
```

Combined with Frappe User Permissions for automatic list/API filtering.
