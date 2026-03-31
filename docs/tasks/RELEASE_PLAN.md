# Horizon CRM — Release Plan

**Version:** 3.0.0  
**Target:** Frappe Marketplace Publication  
**Date:** 2025-07-13  

---

## 1. Release Overview

Horizon CRM v3.0 is a **multi-tenant Travel Agency CRM** built on Frappe Framework. This release refactors the supplier model, updates branding, adds Docker/Dev Container support, and prepares the app for public listing on the [Frappe Marketplace](https://frappecloud.com/marketplace).

### What's New in v3.0

| Area | Change |
|------|--------|
| **Supplier Architecture** | Replaced generic `Travel Supplier` with 6 category-specific DocTypes: Airline Supplier, Hotel Supplier, Visa Agent, Transport Supplier, Tour Operator, Insurance Provider |
| **Migration** | Automatic patch migrates existing Travel Supplier records to category-specific DocTypes |
| **Branding** | Updated from "Evolyx Lab" to "Horizon CRM"; custom favicon override |
| **Dev Environment** | Added `.devcontainer/` and `.vscode/` scaffolding for one-click Docker development |
| **Documentation** | Complete rewrite of ARCHITECTURE.md, DATA_MODEL.md, README.md |
| **Testing** | Updated E2E tests for new suppliers; added server-side unit tests; added Lead pipeline tests |
| **Build** | Python 3.11+ target; Ruff linter configured; pyproject.toml with proper classifiers |
| **Workspace** | Sidebar reorganized with 6 category-specific supplier links |

---

## 2. Version Strategy

### Semantic Versioning

```
MAJOR.MINOR.PATCH
  3   . 0  . 0
```

- **MAJOR** (3): Breaking change — supplier model restructured (migration patch provided)
- **MINOR**: New features, backward-compatible
- **PATCH**: Bug fixes

### Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | — | Initial release with Travel Supplier |
| 2.0.0 | — | Multi-tenancy, Travel Lead, portal |
| **3.0.0** | **2025-07-13** | **Supplier categories, branding, dev env** |

---

## 3. Pre-Release Checklist

### 3.1 Code Quality

- [ ] All Python files pass `ruff check` with zero errors
- [ ] All JS files pass ESLint
- [ ] No hardcoded credentials or secrets in source
- [ ] No `print()` statements — use `frappe.logger()` instead
- [ ] All DocType JSON files have correct `module` set to `Horizon CRM`
- [ ] `hooks.py` has correct `app_version` matching pyproject.toml
- [ ] All controllers have proper `validate()` and `before_save()` methods where needed
- [ ] `patches.txt` lists the migration patch under `[post_model_sync]`

### 3.2 Testing

- [ ] Server-side unit tests pass: `bench --site horizon.localhost run-tests --app horizon_crm`
- [ ] E2E tests pass: `cd tests && npx playwright test`
- [ ] Migration patch tested on a site with existing Travel Supplier data
- [ ] Fresh install tested: `bench new-site test.localhost && bench --site test.localhost install-app horizon_crm`
- [ ] Multi-tenant tested: two sites running independently, no data leakage

### 3.3 Documentation

- [ ] README.md includes: installation, features, screenshots, license
- [ ] ARCHITECTURE.md up to date (v3.0)
- [ ] DATA_MODEL.md up to date with ER diagram (v3.0)
- [ ] DEVELOPMENT_GUIDE.md reflects Docker-based workflow
- [ ] All broken links in docs resolved

### 3.4 Branding & Assets

- [ ] `favicon.svg` and `favicon-dark.svg` present in `public/images/`
- [ ] `logo.svg` and `logo-dark.svg` present in `public/images/`
- [ ] `hooks.py` → `website_context.favicon` points to custom favicon
- [ ] `install.py` → `set_branding()` uses "Horizon CRM"
- [ ] No references to "Evolyx Lab" remain in codebase

### 3.5 Build & Packaging

- [ ] `pyproject.toml` has correct metadata (name, version, description, authors, license, requires-python)
- [ ] `pyproject.toml` keywords and classifiers populated
- [ ] `flit build` produces a valid wheel
- [ ] `modules.txt` lists all modules
- [ ] No unnecessary files in package (check `.gitignore`)

---

## 4. Frappe Marketplace Submission

### 4.1 Requirements

The Frappe Marketplace requires:

1. **Public GitHub repository** with the app source code
2. **Valid `pyproject.toml`** with proper metadata
3. **Frappe Framework compatibility** — specify minimum Frappe version
4. **README.md** — clear description, installation instructions, screenshots
5. **LICENSE** — open-source license (MIT, GPL, etc.)

### 4.2 Submission Steps

```
1. Push all code to GitHub (public repo)
2. Create a GitHub Release with tag v3.0.0
3. Go to https://frappecloud.com/marketplace
4. Click "Publish App"
5. Connect GitHub repository
6. Fill in app details:
   - Name: Horizon CRM
   - Description: Multi-tenant Travel Agency CRM for Frappe
   - Category: CRM / Industry-Specific
   - Frappe Version: >=15.0.0
   - Screenshots: Dashboard, Inquiry Pipeline, Supplier List, Portal
7. Submit for review
8. Wait for approval (typically 2-7 days)
```

### 4.3 App Listing Content

**Title:** Horizon CRM  
**Tagline:** Multi-tenant Travel Agency CRM for Frappe  
**Description:**

> Horizon CRM is a purpose-built CRM for travel agencies, running on the Frappe Framework. It supports multi-tenant operation (site-per-tenant), a complete sales pipeline from Lead → Inquiry → Booking, six specialized supplier categories (Airlines, Hotels, Visa Agents, Transport, Tour Operators, Insurance), and a customer portal for self-service booking management.

**Key Features:**
- Multi-tenant (site-per-tenant) architecture
- Sales pipeline: Lead → Inquiry → Booking
- 6 supplier categories with domain-specific fields
- Customer portal (inquiries, bookings, feedback)
- Kanban boards for pipeline visualization
- Dashboard with Number Cards and Charts
- Role-based access (Agency Admin, Team Lead, Staff, Customer)

---

## 5. Release Process

### 5.1 Branching

```
main (stable releases)
  └── develop (active development)
       └── feature/* (feature branches)
```

### 5.2 Release Steps

```bash
# 1. Ensure develop is stable
git checkout develop
bench --site horizon.localhost run-tests --app horizon_crm
cd tests && npx playwright test && cd ..

# 2. Update version
# Edit pyproject.toml: version = "3.0.0"
# Edit hooks.py: app_version = "3.0.0"

# 3. Merge to main
git checkout main
git merge develop
git tag -a v3.0.0 -m "Release v3.0.0 — Supplier categories, branding, dev env"

# 4. Push
git push origin main --tags

# 5. Create GitHub Release
# Go to GitHub → Releases → Draft new release
# Tag: v3.0.0
# Title: Horizon CRM v3.0.0
# Body: Copy changelog from below

# 6. Verify on Frappe Cloud (if linked)
# The marketplace auto-detects new releases
```

### 5.3 Changelog (v3.0.0)

```markdown
## [3.0.0] - 2025-07-13

### Breaking Changes
- Replaced `Travel Supplier` DocType with 6 category-specific supplier DocTypes
- Migration patch included: `horizon_crm.patches.migrate_suppliers_to_categories`

### Added
- Airline Supplier DocType (AIR-##### prefix, IATA code, alliance, hub airports)
- Hotel Supplier DocType (HTL-##### prefix, star rating, amenities, property type)
- Visa Agent DocType (VISA-##### prefix, countries served, success rate)
- Transport Supplier DocType (TRN-##### prefix, fleet size, vehicle types)
- Tour Operator DocType (TOUR-##### prefix, specialization, group size)
- Insurance Provider DocType (INS-##### prefix, coverage regions, claim turnaround)
- `.devcontainer/` for VS Code Dev Container support
- `.vscode/` with tasks, launch configs, settings, and recommended extensions
- Server-side unit tests (`test_doctypes.py`)
- E2E tests for all supplier categories
- Lead pipeline E2E tests
- Branding/favicon smoke tests

### Changed
- Branding updated from "Evolyx Lab" to "Horizon CRM"
- Custom favicon override via `hooks.py` website_context
- Workspace sidebar reorganized with category-specific supplier links
- `pyproject.toml` updated: requires-python >=3.11, keywords, classifiers
- README.md rewritten for marketplace readiness
- ARCHITECTURE.md updated to v3.0
- DATA_MODEL.md updated to v3.0 with Mermaid ER diagram

### Fixed
- Python version target corrected from 3.14 to 3.11+ for broader compatibility
```

---

## 6. Post-Release

### 6.1 Monitoring

- Watch GitHub Issues for bug reports
- Monitor Frappe Cloud deployment logs (if applicable)
- Track marketplace download/install count

### 6.2 Next Release (v3.1.0) Candidates

| Feature | Priority | Notes |
|---------|----------|-------|
| WhatsApp integration | High | Customer notification via WhatsApp API |
| Invoice generation | High | PDF invoice from Travel Booking |
| Supplier linking on Inquiry | Medium | Link airline/hotel/etc. to inquiry items |
| Dashboard charts per supplier category | Medium | Booking volume by airline, hotel occupancy |
| Email templates | Medium | Auto-send inquiry confirmation, booking receipt |
| Multi-currency support | Low | Handle bookings in different currencies |
| Calendar integration | Low | Sync itinerary dates to calendar |

---

## 7. Rollback Plan

If critical issues are found after release:

```bash
# 1. Revert to previous version on affected sites
bench --site <site> migrate --skip-failing

# 2. If supplier migration caused data issues, the patch is idempotent
#    and marks migrated records — manual rollback is possible by:
#    - Re-enabling Travel Supplier DocType
#    - Restoring from backup

# 3. Create hotfix branch
git checkout -b hotfix/3.0.1 v3.0.0
# Fix, test, tag, release
```

### Backup Before Upgrade

Always advise users to backup before upgrading:

```bash
bench --site <site> backup --with-files
```
