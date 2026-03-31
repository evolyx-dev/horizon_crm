# Horizon CRM — Testing Guide

## Overview

All tests live under `horizon_crm/tests/`:

| Layer | Framework | Location |
|-------|-----------|----------|
| Unit / Integration | Frappe Test Runner (pytest) | `horizon_crm/tests/test_doctypes.py` |
| E2E / Acceptance | Playwright | `horizon_crm/tests/e2e/` |

---

## Unit Tests (Frappe)

### Running All App Tests

```bash
bench --site horizon.localhost run-tests --app horizon_crm
```

### Running a Specific Test File

```bash
bench --site horizon.localhost run-tests \
  --module horizon_crm.tests.test_doctypes
```

### Running a Single Test

```bash
bench --site horizon.localhost run-tests \
  --module horizon_crm.tests.test_doctypes \
  --test test_travel_lead_creation
```

### Writing Unit Tests

Add test classes to `horizon_crm/tests/test_doctypes.py` (or create new `test_*.py` files in the same directory):

```python
import frappe
from frappe.tests import IntegrationTestCase

class TestTravelAgency(IntegrationTestCase):
    def setUp(self):
        pass

    def tearDown(self):
        frappe.set_user("Administrator")

    def test_agency_creation(self):
        agency = frappe.get_doc({
            "doctype": "Travel Agency",
            "agency_name": "Unit Test Agency",
            "contact_email": "unit@test.example",
            "max_staff": 5,
            "status": "Active",
        })
        agency.insert()
        self.assertEqual(agency.agency_name, "Unit Test Agency")
        agency.delete()
```

---

## E2E Tests (Playwright)

### Prerequisites

```bash
cd horizon_crm/tests
npm install
npx playwright install --with-deps chromium
```

### Running All E2E Tests

Make sure the dev server is running on `localhost:8000`, then:

```bash
cd horizon_crm/tests
npx playwright test
```

### Running Specific Test Suites

```bash
# Auth tests only
npx playwright test e2e/01-auth.spec.ts

# Security tests
npx playwright test e2e/06-security.spec.ts

# Multi-tenant tests
npx playwright test --project=multi-tenant

# Run with visible browser
npx playwright test --headed

# Interactive UI mode
npx playwright test --ui

# Debug mode (step through)
npx playwright test --debug
```

### E2E Test Structure

```
horizon_crm/tests/
├── test_doctypes.py          # Server-side unit tests (pytest)
├── playwright.config.ts      # Playwright configuration
├── package.json              # Node dependencies & scripts
├── e2e/
│   ├── fixtures.ts           # Shared utilities & test helpers
│   ├── global-setup.ts       # Creates test users & data (runs once)
│   ├── global-teardown.ts    # Cleans up test data
│   ├── 01-auth.spec.ts       # Authentication & sessions
│   ├── 02-agency.spec.ts     # Agency CRUD
│   ├── 03-staff.spec.ts      # Staff management
│   ├── 04-inquiry.spec.ts    # Inquiry workflow
│   ├── 05-booking.spec.ts    # Booking workflow
│   ├── 06-security.spec.ts   # RBAC, CSRF, XSS, SQLi
│   ├── 07-portal.spec.ts     # Customer portal
│   ├── 08-ui-ux.spec.ts      # UI/UX & responsive
│   ├── 09-other-doctypes.spec.ts # Itinerary, suppliers, feedback, teams
│   ├── 10-multi-tenant.spec.ts   # Multi-site isolation
│   ├── 11-lead-and-branding.spec.ts # Lead pipeline, branding
│   └── 12-invoice-customer-masterdata.spec.ts # Invoice, customer CRUD, master data
├── test-results/             # Playwright artifacts (gitignored)
├── allure-results/           # Allure raw results (gitignored)
└── node_modules/             # (gitignored)
```

### Test Suite Coverage

| Suite | File | What it Tests |
|-------|------|---------------|
| Auth | `01-auth` | Login, logout, session, cookies, invalid credentials |
| Agency | `02-agency` | CRUD, status toggle, permission checks |
| Staff | `03-staff` | Staff CRUD, role assignment, max limit |
| Inquiry | `04-inquiry` | Status workflow, inquiry → booking conversion |
| Booking | `05-booking` | Lifecycle, payment tracking, balance calc, summary API |
| Security | `06-security` | Cross-role access, SQL injection, XSS, CSRF |
| Portal | `07-portal` | Dashboard, bookings, inquiry submission, feedback |
| UI/UX | `08-ui-ux` | Desktop/mobile layout, CSS/JS loading, responsive |
| Others | `09-other-doctypes` | Itinerary, suppliers (6 types), feedback, teams |
| Multi-Tenant | `10-multi-tenant` | Site isolation, tenant data boundary |
| Leads & Branding | `11-lead-and-branding` | Lead pipeline, favicon, logo, CSS/JS assets |
| Invoice, Customer & Master Data | `12-invoice-customer-masterdata` | Invoice lifecycle & calculations, customer CRUD, destinations, travel types, lost reasons |

**Playwright projects:** Tests run across `chromium` (desktop), `mobile` (iPhone 13), and `multi-tenant` (API-only with two sites).

### Writing New E2E Tests

```typescript
import { test, expect } from "@playwright/test";
import { USERS, login, createDoc, gotoList } from "./fixtures";

test.describe("My Feature", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
  });

  test("should do something", async ({ page }) => {
    await gotoList(page, "Travel Booking");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});
```

### Available Test Helpers

| Helper | Purpose |
|--------|---------|
| `login(page, email, pw)` | Log in via API and navigate to /app |
| `logout(page)` | Clear session |
| `gotoList(page, doctype)` | Navigate to list view |
| `gotoNew(page, doctype)` | Navigate to new form |
| `fillField(page, name, value, type)` | Fill a Frappe form field |
| `saveForm(page)` | Ctrl+S to save |
| `createDoc(page, doctype, data)` | Create document via API |
| `deleteDoc(page, doctype, name)` | Delete via API |
| `getListCount(page, doctype, filters)` | Count list results |
| `createUser(page, email, name, pw, roles)` | Create a User |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FRAPPE_URL` | `http://localhost:8000` | Base URL of Frappe site |
| `CI` | — | Enables retries and forbids `.only` |

---

## Test Reports & Video Capture

Video recording is on for **all tests** via `playwright.config.ts`:

```typescript
use: {
  video: "on",
  screenshot: "on",
  trace: "on-first-retry",
}
```

Artifacts:
- `horizon_crm/tests/test-results/<test-name>/video.webm`
- `horizon_crm/tests/test-results/<test-name>/test-finished-1.png`
- `horizon_crm/tests/test-results/<test-name>/trace.zip` (on retry only)

### Playwright HTML Report

```bash
cd horizon_crm/tests
npx playwright test
npx playwright show-report
```

### Allure Report

```bash
cd horizon_crm/tests
npx playwright test
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

---

## Debugging Failures

1. **Videos**: Every test has a video in `test-results/<test>/video.webm`
2. **Screenshots**: Captured after each test
3. **Trace**: View with:
   ```bash
   npx playwright show-trace test-results/<test>/trace.zip
   ```
4. **Headed mode**: Re-run failing test with `--headed --debug`

---

## CI Integration

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Start services
        run: docker compose up -d
      - name: Wait for Frappe
        run: |
          for i in $(seq 1 60); do
            curl -s http://localhost:8000 && break
            sleep 5
          done
      - name: Install test deps
        working-directory: horizon_crm/tests
        run: npm ci && npx playwright install --with-deps chromium
      - name: Run E2E tests
        working-directory: horizon_crm/tests
        run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: horizon_crm/tests/playwright-report/
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-videos
          path: horizon_crm/tests/test-results/**/video.webm
```
