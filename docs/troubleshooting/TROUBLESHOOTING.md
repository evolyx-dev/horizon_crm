# Horizon CRM — Troubleshooting Guide

## Installation & Setup

### "Site not found" after bench new-site

**Symptom**: `frappe.exceptions.SiteNotSpecifiedError` or "Site not found"

**Fix**:
```bash
bench use horizon.localhost
# Verify
cat sites/currentsite.txt
```

### "Module Horizon CRM not found" after install

**Symptom**: Migration fails with module not found error.

**Fix**: Ensure `modules.txt` contains the correct module name:
```bash
cat bench0/apps/horizon_crm/horizon_crm/modules.txt
# Should contain: Horizon CRM
```

### bench start fails with "Address already in use"

**Fix**:
```bash
# Find and kill the process on port 8000
lsof -i :8000
kill -9 <PID>

# Or use a different port
bench start --port 8001
```

### MariaDB "Access denied for user"

**Symptom**: `OperationalError: (1045, "Access denied for user 'root'@'localhost'")`

**Fix (Docker)**:
```bash
# Reset MariaDB password
docker compose exec mariadb mysql -u root -pfrappe
# If that fails, recreate the volume
docker compose down -v
docker compose up -d
```

**Fix (Local)**:
```bash
# Set root password in common_site_config.json
bench set-config -g db_root_password YOUR_PASSWORD
```

### Redis connection refused

**Fix**:
```bash
# Check Redis is running
redis-cli ping

# Docker: check service
docker compose ps redis-cache redis-queue

# Verify config
cat sites/common_site_config.json | grep redis
```

---

## Multi-Tenancy & Permissions

### User cannot see any data after being added as staff

**Cause**: User Permission was not created automatically.

**Diagnosis**:
```bash
bench --site horizon.localhost console
>>> frappe.get_all("User Permission", filters={"user": "user@example.com"})
```

**Fix**: The Travel Agency Staff controller should auto-create User Permissions on insert. If missing:
```python
bench --site horizon.localhost console
>>> from frappe.permissions import add_user_permission
>>> add_user_permission("Travel Agency", "Agency Name", "user@example.com")
>>> frappe.db.commit()
```

### Agency Admin can see data from other agencies

**Diagnosis Checklist**:
1. Check `User Permission` exists for the user:
   ```python
   frappe.get_all("User Permission",
       filters={"user": "admin@agency1.test", "allow": "Travel Agency"})
   ```
2. Check `permission_query_conditions` in hooks.py includes the DocType.
3. Check `has_permission` in hooks.py includes the DocType.
4. Verify the DocType has an `agency` Link field.
5. Check the controller calls `validate_agency_access()`.

### "Permission denied" for Agency Admin on their own records

**Cause**: DocType permission table may not include the correct role.

**Fix**: Check DocType JSON permissions array:
```json
"permissions": [
  {"role": "Agency Admin", "read": 1, "write": 1, "create": 1, "delete": 1}
]
```

Then migrate:
```bash
bench --site horizon.localhost migrate
```

### Staff can edit records they shouldn't

**Diagnosis**: Check DocType permissions. Staff should have limited write access.

**Fix**: Update the DocType JSON to restrict Staff permissions, then migrate.

---

## Portal Issues

### Portal page returns 404

**Cause**: File not in correct location or missing context provider.

**Checklist**:
- Template at `horizon_crm/www/portal/<page>.html`
- Context provider at `horizon_crm/www/portal/<page>.py`
- The `.py` file has a `get_context(context)` function
- No syntax errors in the Jinja template

**Fix**:
```bash
bench --site horizon.localhost clear-cache
bench --site horizon.localhost clear-website-cache
```

### Portal shows "Please log in" for authenticated user

**Cause**: Session cookie not set, or Guest user.

**Fix**:
1. Ensure the user has logged in at `/login`
2. Check `frappe.session.user` in the context provider
3. Verify the customer role is assigned to the user

### Portal CSS not loading

**Fix**:
```bash
bench build --app horizon_crm
bench --site horizon.localhost clear-cache
```

Check that `web_include_css` is set in `hooks.py`:
```python
web_include_css = "/assets/horizon_crm/css/horizon_portal.css"
```

---

## DocType Issues

### "DocType <name> not found" after creating files

**Cause**: Migration not run, or JSON has syntax errors.

**Fix**:
```bash
# Validate JSON
python -m json.tool bench0/apps/horizon_crm/horizon_crm/horizon_crm/doctype/my_doctype/my_doctype.json

# Run migration
bench --site horizon.localhost migrate
```

### Migration fails with SQL error

**Common causes**:
1. Field name conflicts with MariaDB reserved words
2. Changing field type on existing column with data
3. Duplicate field names

**Fix**:
```bash
# Check the exact error in the traceback
bench --site horizon.localhost migrate --verbose

# If stuck, try
bench --site horizon.localhost migrate --rebuild-website
```

### Child table rows not saving

**Cause**: `istable` not set to 1 in child DocType JSON, or parent field missing.

**Fix**: Verify child DocType JSON has:
```json
{
  "istable": 1,
  "editable_grid": 1
}
```

And parent DocType field references it correctly:
```json
{
  "fieldname": "items",
  "fieldtype": "Table",
  "options": "Itinerary Day Item"
}
```

---

## UI / Assets

### Custom CSS/JS not loading on Desk

**Cause**: Assets not built, or hooks misconfigured.

**Fix**:
```bash
bench build --app horizon_crm
```

Verify `hooks.py`:
```python
app_include_css = "/assets/horizon_crm/css/horizon.css"
app_include_js = "/assets/horizon_crm/js/horizon.js"
```

### Form client script not running

**Cause**: Client script file not properly named or not in correct location.

**Checklist**:
- File at `doctype/<doctype>/<doctype>.js`
- File starts with `frappe.ui.form.on('<DocType Name>', { ... })`
- No JS syntax errors (check browser DevTools console)

### Logo not showing in app switcher

**Fix**: Verify `hooks.py`:
```python
app_logo_url = "/assets/horizon_crm/images/logo.svg"

add_to_apps_screen = [
    {
        "name": "horizon_crm",
        "logo": "/assets/horizon_crm/images/logo.svg",
        "title": "Horizon CRM",
        "route": "/app/horizon-crm",
    }
]
```

Then rebuild:
```bash
bench build --app horizon_crm
bench --site horizon.localhost clear-cache
```

---

## Docker-Specific Issues

### Container keeps restarting

```bash
# Check logs
docker compose logs --tail=50 frappe

# Common fixes
docker compose down
docker compose up -d --build  # Rebuild image
```

### "bench: command not found" inside container

**Cause**: PATH not set or bench not installed.

**Fix**:
```bash
docker compose exec frappe bash
export PATH=$PATH:/home/frappe/.local/bin
which bench
```

### Volume permissions issue

**Symptom**: `PermissionError: [Errno 13] Permission denied`

**Fix**:
```bash
docker compose exec -u root frappe chown -R frappe:frappe /home/frappe
```

### Playwright cannot connect to Frappe

**Symptom**: `net::ERR_CONNECTION_REFUSED` in E2E tests

**Fix**: Update `FRAPPE_URL` to use the Docker service name:
```bash
FRAPPE_URL=http://frappe:8000 npx playwright test
```

Or update `playwright.config.ts` to use the correct host.

---

## Performance

### Slow list views

**Possible causes**:
1. Missing database indexes on frequently filtered fields
2. Too many permission checks

**Fix**: Add indexes in DocType JSON:
```json
{
  "search_fields": "customer_name, email",
  "sort_field": "modified",
  "sort_order": "DESC"
}
```

### High memory usage

```bash
# Check process memory
bench --site horizon.localhost doctor

# Clear old logs
bench --site horizon.localhost clear-log-table --days 30
```

---

## Getting Help

1. **Frappe Forum**: https://discuss.frappe.io
2. **Frappe Documentation**: https://frappeframework.com/docs
3. **Project Knowledge Base**: See `knowledge_base/` folder
4. **Check Logs**: `bench0/logs/` directory
