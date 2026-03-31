# Horizon CRM — Development Guide

## Project Structure

```
bench0/
├── apps/
│   ├── frappe/                  # Frappe framework (do not edit)
│   └── horizon_crm/            # Our app
│       └── horizon_crm/
│           ├── hooks.py         # App configuration
│           ├── utils.py         # Multi-tenancy utilities
│           ├── install.py       # Post-install setup
│           ├── permissions.py   # Row-level security
│           ├── api/             # Whitelisted API methods
│           │   ├── inquiry.py
│           │   ├── booking.py
│           │   └── portal.py
│           ├── horizon_crm/
│           │   └── doctype/     # All 15 DocTypes
│           ├── public/          # Static assets (CSS, JS, images)
│           └── www/portal/      # Customer portal pages
├── sites/                       # Site configurations
├── config/                      # Redis configs
└── env/                         # Python virtual environment
```

## Development Workflow

### 1. Start the Development Server

**Local (without Docker):**
```bash
cd bench0
bench start
```

**Docker:**
```bash
docker compose up -d
```

The dev server runs on `http://localhost:8000`.

### 2. Making Changes

#### Python Changes
Python files are hot-reloaded by the bench dev server. Save the file and refresh the browser.

#### DocType Changes
1. Edit the DocType JSON file or use the Frappe doctrine builder at `/app/doctype/`
2. Run migration to apply schema changes:
   ```bash
   bench --site horizon.localhost migrate
   ```

#### JavaScript / CSS Changes
```bash
# One-time build
bench build --app horizon_crm

# Watch mode (auto-rebuild on changes)
bench watch
```

#### Portal Template Changes
Jinja templates in `www/portal/` are auto-reloaded. Just refresh the browser.

### 3. Creating a New DocType

1. **Create Directory**:
   ```bash
   mkdir -p horizon_crm/horizon_crm/doctype/my_new_doctype
   ```

2. **Create JSON Definition** (`my_new_doctype.json`):
   ```json
   {
     "name": "My New Doctype",
     "module": "Horizon CRM",
     "fields": [...],
     "permissions": [...]
   }
   ```

3. **Create Controller** (`my_new_doctype.py`):
   ```python
   import frappe
   from frappe.model.document import Document
   from horizon_crm.utils import validate_agency_access

   class MyNewDoctype(Document):
       def validate(self):
           validate_agency_access(self)
   ```

4. **Create `__init__.py`** (empty file)

5. **Run migration**:
   ```bash
   bench --site horizon.localhost migrate
   ```

### 4. Adding Multi-Tenancy to a New DocType

If your DocType has an `agency` field and needs tenant isolation:

1. Add to `permissions.py`:
   ```python
   def my_new_doctype_query(user):
       return _agency_query_condition("My New Doctype", user)

   def my_new_doctype_permission(doc, ptype, user):
       return _agency_has_permission(doc, ptype, user)
   ```

2. Add to `hooks.py`:
   ```python
   permission_query_conditions = {
       "My New Doctype": "horizon_crm.permissions.my_new_doctype_query",
   }
   has_permission = {
       "My New Doctype": "horizon_crm.permissions.my_new_doctype_permission",
   }
   ```

3. Add `validate_agency_access(self)` in the controller's `validate()` method.

### 5. Adding a New Portal Page

1. Create `horizon_crm/www/portal/mypage.html` (Jinja template)
2. Create `horizon_crm/www/portal/mypage.py` (context provider):
   ```python
   import frappe

   def get_context(context):
       context.no_cache = 1
       if frappe.session.user == "Guest":
           frappe.throw("Please log in.", frappe.AuthenticationError)
       # Add your data to context
   ```
3. Add to `hooks.py` portal_menu_items if needed.

### 6. Adding a New API Endpoint

1. Create or edit a file in `horizon_crm/api/`:
   ```python
   import frappe

   @frappe.whitelist()
   def my_api_method(param1, param2):
       # Validate permissions
       frappe.only_for(["Agency Admin", "Agency Team Lead"])
       # Your logic here
       return {"result": "data"}
   ```

2. Call via: `POST /api/method/horizon_crm.api.module.my_api_method`

## Key Conventions

### Code Style
- Python: Follow PEP 8, use type hints where helpful
- JavaScript: ES6+, camelCase for variables, PascalCase for classes
- CSS: BEM-like naming with `horizon-` prefix

### Multi-Tenancy Rules
- **Every tenant DocType** must have an `agency` Link field
- **Every controller** must call `validate_agency_access(self)` in `validate()`
- **hooks.py** must register both `permission_query_conditions` and `has_permission`
- **Never** trust client-side agency filtering alone

### Security Checklist
- [ ] agency field is set server-side (not from form if user isn't Admin)
- [ ] permission_query_conditions registered in hooks
- [ ] has_permission registered in hooks
- [ ] Controller validate() calls validate_agency_access()
- [ ] API methods use frappe.only_for() for role checks
- [ ] Portal API methods verify customer ownership

### Testing
- Unit tests: `bench --site horizon.localhost run-tests --app horizon_crm`
- E2E tests: See [TESTING_GUIDE.md](./TESTING_GUIDE.md)

## Useful Bench Commands

```bash
# Start dev server
bench start

# Run migrations
bench --site horizon.localhost migrate

# Build assets
bench build --app horizon_crm

# Open Python console with Frappe context
bench --site horizon.localhost console

# Run a specific bench command
bench --site horizon.localhost execute horizon_crm.install.after_install

# Clear cache
bench --site horizon.localhost clear-cache

# Export fixtures
bench --site horizon.localhost export-fixtures

# Create a new DocType interactively
bench --site horizon.localhost add-to-config --global developer_mode 1
```

## Debugging

### Python Debugging
```python
# Add breakpoint in any Python file
import frappe
frappe.log("Debug: " + str(variable))

# Or use Python debugger
breakpoint()  # Python 3.7+
```

### Browser Debugging
- Open DevTools → Console for JS errors
- Network tab to inspect API calls
- Use `frappe.call()` in console to test API methods:
  ```javascript
  frappe.call({
    method: "horizon_crm.api.booking.get_booking_summary",
    args: { agency: "Test Agency Alpha" },
    callback: (r) => console.log(r.message)
  });
  ```
