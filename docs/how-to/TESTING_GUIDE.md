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
│   ├── 12-invoice-customer-masterdata.spec.ts # Invoice, customer CRUD, master data
│   ├── 13-validation-negative.spec.ts # Validation & negative/edge-case scenarios
│   └── demo-video.spec.ts       # Annotated demo video recording script
├── demo-output/              # Recorded demo videos (gitignored)
├── test-results/             # Playwright artifacts (gitignored)
├── playwright-report/        # Playwright HTML report (gitignored)
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
| Security | `06-security` | Cross-role access, SQL injection, XSS, CSRF, guest restrictions |
| Portal | `07-portal` | Public lead-capture form, guest API submission, field rendering, thank-you page |
| UI/UX | `08-ui-ux` | Desktop/mobile layout, CSS/JS loading, responsive |
| Others | `09-other-doctypes` | Itinerary, suppliers (6 types), feedback, teams |
| Multi-Tenant | `10-multi-tenant` | Site isolation, tenant data boundary |
| Leads & Branding | `11-lead-and-branding` | Lead pipeline, favicon, logo, CSS/JS assets |
| Invoice, Customer & Master Data | `12-invoice-customer-masterdata` | Invoice lifecycle & calculations, customer CRUD, destinations, travel types, lost reasons |
| Validation & Negative Cases | `13-validation-negative` | Controller validation, calculation edge cases, RBAC denials, lead API errors, auth failures |
| **Demo Video** | `demo-video` | 18-chapter annotated walkthrough of all features (not part of CI test suite) |

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

## npm Scripts

All scripts are defined in `horizon_crm/tests/package.json`. Run them from the `horizon_crm/tests/` directory.

| Script | Command | Description |
|--------|---------|-------------|
| `npm test` | `npx playwright test` | Run all E2E tests |
| `npm run test:headed` | `npx playwright test --headed` | Run with visible browser |
| `npm run test:ui` | `npx playwright test --ui` | Interactive Playwright UI |
| `npm run test:debug` | `npx playwright test --debug` | Step-through debugger |
| `npm run test:auth` | `…01-auth.spec.ts` | Auth tests only |
| `npm run test:agency` | `…02-agency.spec.ts` | Agency tests only |
| `npm run test:staff` | `…03-staff.spec.ts` | Staff tests only |
| `npm run test:inquiry` | `…04-inquiry.spec.ts` | Inquiry tests only |
| `npm run test:booking` | `…05-booking.spec.ts` | Booking tests only |
| `npm run test:security` | `…06-security.spec.ts` | Security tests only |
| `npm run test:portal` | `…07-portal.spec.ts` | Portal tests only |
| `npm run test:ui-ux` | `…08-ui-ux.spec.ts` | UI/UX tests only |
| `npm run test:doctypes` | `…09-other-doctypes.spec.ts` | Supplier/doctype tests |
| `npm run test:multi-tenant` | `…10-multi-tenant.spec.ts` | Multi-tenant tests |
| `npm run test:lead-branding` | `…11-lead-and-branding.spec.ts` | Lead & branding tests |
| `npm run test:invoice-master` | `…12-invoice-customer-masterdata.spec.ts` | Invoice & master data |
| `npm run test:validation` | `…13-validation-negative.spec.ts` | Validation & negative tests |
| `npm run clean` | removes artifacts | Delete test-results, allure-results, reports |
| `npm run test:report` | clean + test + allure generate | Full run with Allure report |
| `npm run report:allure` | generate + open | Generate and open Allure report |
| `npm run report:allure:generate` | `npx allure generate …` | Generate Allure HTML report |
| `npm run report:allure:open` | `npx allure open …` | Open Allure report in browser |
| `npm run report:html` | `npx playwright show-report …` | Open Playwright HTML report |
| `npm run demo` | `npx playwright test e2e/demo-video.spec.ts --project chromium` | Record annotated demo video |

---

## Test Reports & Video Capture

Every test run produces videos, screenshots, and trace files automatically via `playwright.config.ts`:

```typescript
use: {
  video: "on",
  screenshot: "on",
  trace: "on-first-retry",
}
```

### Artifact Locations

| Artifact | Path |
|----------|------|
| Video | `horizon_crm/tests/test-results/<test-name>/video.webm` |
| Screenshot | `horizon_crm/tests/test-results/<test-name>/test-finished-1.png` |
| Trace (retry only) | `horizon_crm/tests/test-results/<test-name>/trace.zip` |
| Playwright HTML report | `horizon_crm/tests/playwright-report/index.html` |
| Allure raw results | `horizon_crm/tests/allure-results/` |
| Allure HTML report | `horizon_crm/reports/allure-report/index.html` |

> All artifact directories are gitignored.

### Playwright HTML Report

The Playwright HTML report is generated automatically after each run. To view it:

```bash
cd horizon_crm/tests
npx playwright show-report playwright-report
```

Or use the npm script:

```bash
npm run report:html
```

The report includes embedded videos and screenshots for every test.

### Allure Report

Allure produces a richer, interactive report with test categorization, history trends, and attached videos/screenshots.

#### Quick: Run tests and generate report in one step

```bash
cd horizon_crm/tests
npm run test:report
```

This runs `clean → test → allure generate` and writes the report to `horizon_crm/reports/allure-report/`.

#### Step-by-step

```bash
cd horizon_crm/tests

# 1. Run tests (generates allure-results/)
npx playwright test

# 2. Generate the HTML report
npx allure generate allure-results -o ../reports/allure-report --clean

# 3. Open in browser
npx allure open ../reports/allure-report
```

Or equivalently:

```bash
npm run report:allure:generate   # step 2
npm run report:allure:open       # step 3
npm run report:allure             # steps 2 + 3 combined
```

The generated report lives at:

```
horizon_crm/reports/allure-report/index.html
```

---

## Demo Video Recording

The project includes a Playwright script that records an **annotated feature demo video** suitable for client review. The script walks through every major feature with on-screen annotations (chapter titles and descriptions) overlaid on the browser.

### Quick Start

```bash
cd horizon_crm/tests
npm run demo
```

The recorded video is saved to:

```
horizon_crm/tests/demo-output/horizon-crm-demo.webm
```

> The `demo-output/` directory is gitignored — the video is a generated artifact.

### What the Demo Covers (18 Chapters)

| # | Chapter | Description |
|---|---------|-------------|
| 1 | Login | Agency Admin login flow |
| 2 | Dashboard | Workspace overview, charts, number cards |
| 3 | Agency Settings | Company configuration (as System Admin) |
| 4 | Staff & Teams | Staff list, team management |
| 5 | Public Portal | Guest-accessible lead-capture form |
| 6 | Lead Pipeline | Lead list, status workflow, convert-to-inquiry |
| 7 | Customers | Customer directory, profile details |
| 8 | Inquiry Workflow | Create inquiry, status transitions |
| 9 | Bookings & Payments | Booking lifecycle, payment tracking |
| 10 | Destinations & Types | Master data management |
| 11 | Airline Suppliers | Airline supplier CRUD |
| 12 | Hotel Suppliers | Hotel supplier CRUD |
| 13 | Tour Operators | Tour operator CRUD |
| 14 | Itineraries | Day-by-day itinerary builder |
| 15 | Invoicing | Invoice generation & calculation |
| 16 | Feedback | Customer feedback collection |
| 17 | Kanban View | Drag-and-drop Kanban board |
| 18 | Dark Theme | Theme switching |

The script also includes a cleanup phase that deletes all demo data created during recording.

### How It Works

- **Annotation overlay**: The `showAnnotation(page, title, subtitle)` helper injects a fixed-position styled banner at the top of the viewport.
- **Resilient navigation**: The `waitForPage(page, "list" | "form")` helper waits for Frappe list/form pages to fully load.
- **Role switching**: Uses API login (`page.request.post("/api/method/login")`) to switch between Agency Admin, System Admin, and Staff roles mid-recording.
- **Single browser context**: Records one continuous video with `recordVideo: { dir: "demo-output/", size: { width: 1280, height: 720 } }`.
- **Timeout**: 15-minute timeout to accommodate the full walkthrough.

### Customizing the Demo

To record only specific chapters, comment out the unwanted `test.step()` blocks in `demo-video.spec.ts`. To change the output resolution or directory, edit the `browser.newContext()` call at the top of the test.

To change annotation styling, modify the CSS in the `showAnnotation()` function.

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
