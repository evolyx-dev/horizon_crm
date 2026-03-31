# Horizon CRM — Testing Guide

## Overview

Horizon CRM uses two testing layers:

| Layer | Framework | Scope | Location |
|-------|-----------|-------|----------|
| Unit / Integration | Frappe Test Runner (pytest) | DocType controllers, API methods, permissions | `bench0/apps/horizon_crm/horizon_crm/tests/` |
| E2E / Acceptance | Playwright | Full browser workflows, UI, security | `tests/e2e/` |

---

## Unit Tests (Frappe)

### Running All App Tests

```bash
bench --site horizon.localhost run-tests --app horizon_crm
```

### Running a Specific Test File

```bash
bench --site horizon.localhost run-tests \
  --module horizon_crm.horizon_crm.doctype.travel_agency.test_travel_agency
```

### Running a Single Test

```bash
bench --site horizon.localhost run-tests \
  --module horizon_crm.horizon_crm.doctype.travel_agency.test_travel_agency \
  --test test_agency_creation
```

### Writing Unit Tests

Create `test_<doctype>.py` next to the DocType definition:

```python
import frappe
from frappe.tests import IntegrationTestCase

class TestTravelAgency(IntegrationTestCase):
    def setUp(self):
        # Runs before each test
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
        self.assertEqual(agency.status, "Active")
        agency.delete()

    def test_agency_isolation(self):
        # Create two agencies
        agency1 = frappe.get_doc({...}).insert()
        agency2 = frappe.get_doc({...}).insert()

        # Login as agency1 admin
        frappe.set_user("admin@agency1.test")

        # Should not see agency2 data
        customers = frappe.get_all("Travel Customer",
            filters={"agency": agency2.name})
        self.assertEqual(len(customers), 0)
```

### Test Fixtures

Place test data in `test_records.json` next to the DocType:

```json
[
  {
    "doctype": "Travel Agency",
    "agency_name": "Fixture Agency",
    "contact_email": "fixture@test.example",
    "max_staff": 10,
    "status": "Active"
  }
]
```

---

## E2E Tests (Playwright)

### Prerequisites

```bash
cd tests
npm install
npx playwright install   # Downloads browser binaries
```

### Running All E2E Tests

```bash
# Ensure the dev server is running on localhost:8000
cd tests
npx playwright test
```

### Running Specific Test Suites

```bash
# Auth tests only
npx playwright test e2e/01-auth.spec.ts

# Security tests
npx playwright test e2e/06-security.spec.ts

# Or use the npm scripts:
npm run test:auth
npm run test:security
npm run test:booking
# ... etc (see package.json for all suite shortcuts)

# Run with visible browser
npx playwright test --headed

# Interactive UI mode
npx playwright test --ui

# Debug mode (step through)
npx playwright test --debug
```

### Running in Docker

```bash
# From project root
docker compose run --rm playwright npx playwright test

# Or if playwright service is running
docker compose exec playwright npx playwright test
```

### E2E Test Structure

```
tests/
├── package.json              # Dependencies & scripts
├── playwright.config.ts      # Playwright configuration
├── allure-results/           # Allure raw results (auto-generated)
├── test-results/             # Playwright test artifacts (videos, screenshots)
└── e2e/
    ├── fixtures.ts           # Shared utilities & test helpers
    ├── global-setup.ts       # Creates test users & agencies (runs once)
    ├── 01-auth.spec.ts       # Authentication & session tests
    ├── 02-agency.spec.ts     # Agency CRUD tests
    ├── 03-staff.spec.ts      # Staff management tests
    ├── 04-inquiry.spec.ts    # Inquiry workflow tests
    ├── 05-booking.spec.ts    # Booking workflow tests
    ├── 06-security.spec.ts   # Security, RBAC, CSRF, XSS, SQLi tests
    ├── 07-portal.spec.ts     # Customer portal tests
    ├── 08-ui-ux.spec.ts      # UI/UX & responsive tests
    └── 09-other-doctypes.spec.ts  # Itinerary, Supplier, Feedback tests
```

### Test Suites Coverage

| Suite | File | What it Tests |
|-------|------|---------------|
| Auth | `01-auth.spec.ts` | Login, logout, session, cookies, invalid credentials |
| Agency | `02-agency.spec.ts` | CRUD, status toggle, permission checks |
| Staff | `03-staff.spec.ts` | Staff CRUD, role assignment, max limit |
| Inquiry | `04-inquiry.spec.ts` | Status workflow, inquiry→booking conversion |
| Booking | `05-booking.spec.ts` | Lifecycle, payment tracking, balance calc, summary API |
| Security | `06-security.spec.ts` | Cross-role access, SQL injection, XSS, CSRF |
| Portal | `07-portal.spec.ts` | Dashboard, bookings, inquiry submission, feedback |
| UI/UX | `08-ui-ux.spec.ts` | Desktop/mobile layout, CSS/JS loading, responsive |
| Others | `09-other-doctypes.spec.ts` | Itinerary, Supplier, Feedback, Teams |

### Writing New E2E Tests

Import fixtures from `fixtures.ts`:

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
| `CI` | — | Set in CI to enable retries and forbid .only |

---

## Test Reports & Video Capture

Horizon CRM generates two types of test reports, both with **full video recordings** for every test.

### Video Capture Configuration

Video recording is enabled for **all tests** (not just failures) via `playwright.config.ts`:

```typescript
use: {
  video: "on",        // Record video for EVERY test
  screenshot: "on",   // Take screenshot after each test
  trace: "on-first-retry",  // Full trace on retry
}
```

Artifacts are stored in `tests/test-results/<test-name>/`:
- `video.webm` — Full video recording of the test
- `test-finished-1.png` — Screenshot at test completion
- `trace.zip` — Trace file (on retry only)

### Report Types

| Report | Format | Videos | Best For |
|--------|--------|--------|----------|
| Playwright HTML | Single-file HTML | Embedded in each test | Quick local review |
| Allure Report | Interactive dashboard | Attached per test | Team sharing, CI, history |

---

### 1. Playwright HTML Report

Generated automatically after each test run.

```bash
cd tests

# Run tests (generates report in ../reports/html/)
npm test

# Open the HTML report in browser
npm run report:html
```

**Features:**
- Embedded videos for every test (click a test → see video)
- Embedded screenshots
- Filter by status (passed/failed/skipped)
- Trace viewer for retried tests

---

### 2. Allure Report (Recommended for Teams)

Allure provides a rich interactive dashboard with video/screenshot attachments, test history, trends, and environment info.

#### Quick Start

```bash
cd tests

# Clean previous results, run tests, and generate report
npm run test:report

# Open the generated Allure report
npm run report:allure:open
```

#### Step-by-Step

```bash
cd tests

# 1. Clean stale results (recommended before fresh run)
npm run clean

# 2. Run all E2E tests
npm test

# 3. Generate Allure HTML report from raw results
npm run report:allure:generate

# 4. Open Allure report in browser
npm run report:allure:open

# Or combine generate + open:
npm run report:allure
```

#### Allure Report Features

- **Dashboard**: Overview of pass/fail rates, duration, trends
- **Test details**: Each test shows steps, video recording, and screenshot
- **Video attachments**: Click any test → Attachments tab → play `video.webm`
- **Screenshot attachments**: Inline screenshot preview per test
- **Environment info**: Shows `BASE_URL` and `NODE_VERSION`
- **Categories**: Automatic grouping by test suite and failure type
- **History**: Track pass/fail trends across runs (when `allure-results/` is preserved)

#### Directory Structure After Test Run

```
tests/
├── allure-results/           # Raw Allure JSON + video/screenshot attachments
│   ├── *-result.json         # Test result data
│   ├── *-attachment.webm     # Video recordings (1 per test)
│   └── *-attachment.png      # Screenshots (1 per test)
├── test-results/             # Playwright native artifacts
│   └── <test-name>/
│       ├── video.webm
│       └── test-finished-1.png
reports/
├── html/                     # Playwright HTML report
│   └── index.html
└── allure-report/            # Generated Allure HTML report
    └── index.html
```

---

### NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `npm test` | Run all E2E tests |
| `npm run test:headed` | Run with visible browser |
| `npm run test:ui` | Interactive Playwright UI |
| `npm run test:debug` | Step-through debug mode |
| `npm run test:auth` | Run auth tests only |
| `npm run test:agency` | Run agency tests only |
| `npm run test:staff` | Run staff tests only |
| `npm run test:inquiry` | Run inquiry tests only |
| `npm run test:booking` | Run booking tests only |
| `npm run test:security` | Run security tests only |
| `npm run test:portal` | Run portal tests only |
| `npm run test:ui-ux` | Run UI/UX tests only |
| `npm run test:doctypes` | Run other doctypes tests only |
| `npm run clean` | Delete all test results and reports |
| `npm run report:html` | Open Playwright HTML report |
| `npm run report:allure:generate` | Generate Allure report from results |
| `npm run report:allure:open` | Open Allure report in browser |
| `npm run report:allure` | Generate + open Allure report |
| `npm run test:report` | Clean → test → generate Allure report |

---

### Debugging Failures

1. **Videos**: Every test has a video in `test-results/<test>/video.webm` and in the Allure attachments
2. **Screenshots**: Captured after each test in `test-results/<test>/`
3. **Trace**: Generated on first retry — view with:
   ```bash
   npx playwright show-trace test-results/<test>/trace.zip
   ```
4. **Allure Report**: Open the test in Allure → click "Attachments" tab to view video inline

---

## CI Integration

Example GitHub Actions workflow:

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
        working-directory: tests
        run: npm ci && npx playwright install --with-deps chromium
      - name: Run E2E tests
        working-directory: tests
        run: npm run test:report
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-html-report
          path: reports/html/
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: allure-report
          path: reports/allure-report/
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-videos
          path: tests/test-results/**/video.webm
```
