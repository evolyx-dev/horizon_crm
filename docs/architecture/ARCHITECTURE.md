# Horizon CRM — System Architecture Document

**Version:** 3.1  
**Date:** 2026-04-01  

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HORIZON CRM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐     │
│  │  Desk UI     │  │  Portal UI   │  │  REST/API Layer   │     │
│  │  (Staff/     │  │  (Customer   │  │  (frappe.client)  │     │
│  │   Admin)     │  │   Portal)    │  │                   │     │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘     │
│         │                 │                    │                │
│  ┌──────┴─────────────────┴────────────────────┴──────────┐    │
│  │              Frappe Framework v15                        │    │
│  │  ┌──────────────────────────────────────────────────┐   │    │
│  │  │  horizon_crm App                                  │   │    │
│  │  │                                                    │   │    │
│  │  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐  │   │    │
│  │  │  │ DocTypes    │ │ Controllers│ │ Permissions   │  │   │    │
│  │  │  │ (Models)    │ │ (Logic)    │ │ (Security)    │  │   │    │
│  │  │  └────────────┘ └────────────┘ └──────────────┘  │   │    │
│  │  │                                                    │   │    │
│  │  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐  │   │    │
│  │  │  │ Hooks       │ │ Portal     │ │ API Methods   │  │   │    │
│  │  │  │ (Events)    │ │ (www/)     │ │ (Whitelisted) │  │   │    │
│  │  │  └────────────┘ └────────────┘ └──────────────┘  │   │    │
│  │  └────────────────────────────────────────────────────┘   │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ MariaDB  │  │ Redis    │  │ Redis    │  │ Node.js  │       │
│  │ (Data)   │  │ (Cache)  │  │ (Queue)  │  │ (Socket) │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. App Structure

```
horizon_crm/                        # ← Repo root IS the Frappe app
├── pyproject.toml
├── docker-compose.yml              # Docker-first dev stack
├── horizon_crm/                    # Python module
│   ├── __init__.py
│   ├── hooks.py                    # App hooks: permissions, events, portal, favicon
│   ├── modules.txt                 # Module definitions
│   ├── patches.txt                 # Database migration patches
│   ├── install.py                  # Post-install setup (roles, defaults, branding)
│   ├── utils.py                    # Utility helpers (agency settings, staff record)
│   ├── commands.py                 # Bench CLI commands (create-tenant, tenant-info)
│   │
│   ├── horizon_crm/               # Main module
│   │   ├── __init__.py
│   │   └── doctype/
│   │       │
│   │       │── # ── Core ──
│   │       ├── travel_agency/          # Singleton: agency config per site
│   │       ├── travel_agency_staff/    # Employees / users
│   │       ├── travel_team/            # Staff grouping
│   │       │
│   │       │── # ── Sales Pipeline ──
│   │       ├── travel_lead/            # Pre-qualification funnel (6 stages)
│   │       ├── travel_inquiry/         # Formal travel request (5 stages)
│   │       ├── travel_inquiry_traveler/  (child)
│   │       │
│   │       │── # ── Operations ──
│   │       ├── travel_itinerary/
│   │       ├── itinerary_day_item/       (child)
│   │       ├── travel_booking/
│   │       ├── booking_payment/          (child)
│   │       │
│   │       │── # ── Supplier Categories (v3.0) ──
│   │       ├── airline_supplier/       # AIR-##### | IATA code, alliance, flags
│   │       ├── hotel_supplier/         # HTL-##### | Star rating, amenities
│   │       ├── visa_agent/             # VISA-##### | Countries, success rate
│   │       ├── transport_supplier/     # TRN-##### | Fleet, vehicle types
│   │       ├── tour_operator/          # TOUR-##### | Specialization, group size
│   │       ├── insurance_provider/     # INS-##### | Coverage, claim turnaround
│   │       ├── supplier_service/         (child: shared by all suppliers)
│   │       │
│   │       │── # ── Billing ──
│   │       ├── travel_invoice/          # INV-##### | Invoice lifecycle
│   │       ├── invoice_item/             (child: line items)
│   │       │
│   │       │── # ── Reference Data ──
│   │       ├── travel_customer/
│   │       ├── travel_destination/
│   │       ├── travel_type/
│   │       ├── travel_lost_reason/
│   │       └── travel_feedback/
│   │
│   ├── api/                        # Whitelisted API methods
│   │   ├── __init__.py
│   │   ├── inquiry.py
│   │   ├── booking.py
│   │   └── portal.py
│   │
│   ├── public/                     # Static assets
│   │   ├── css/
│   │   │   └── horizon.css
│   │   ├── js/
│   │   │   └── horizon.js         # Form handlers, pipeline visualizers
│   │   └── images/
│   │       ├── logo.svg
│   │       ├── logo-dark.svg
│   │       ├── favicon.svg         # Custom favicon (overrides Frappe default)
│   │       └── favicon-dark.svg
│   │
│   ├── templates/                  # Jinja templates
│   │   ├── __init__.py
│   │   ├── includes/
│   │   │   └── portal_navbar.html
│   │   └── pages/
│   │       └── __init__.py
│   │
│   ├── tests/                      # ALL tests (unit + E2E)
│   │   ├── test_doctypes.py        # Server-side unit/integration
│   │   ├── playwright.config.ts    # E2E configuration
│   │   ├── package.json            # E2E Node deps
│   │   └── e2e/                    # Playwright E2E specs
│   │       ├── fixtures.ts
│   │       ├── global-setup.ts
│   │       ├── 01-auth.spec.ts … 12-invoice-customer-masterdata.spec.ts
│   │       └── global-teardown.ts
│   │
│   └── www/                        # Portal pages (guest-accessible)
│       └── portal/
│           ├── inquiry.html          # Public lead-capture form
│           ├── inquiry.py            # Context: destinations, travel types
│           ├── thank-you.html        # Post-submission confirmation
│           └── thank-you.py
│
├── .devcontainer/                  # VS Code Dev Container support
│   ├── devcontainer.json
│   └── docker-compose.extend.yml
├── .vscode/                        # Editor settings & tasks
│   ├── settings.json
│   ├── tasks.json
│   ├── launch.json
│   └── extensions.json
├── pyproject.toml                  # Flit build, Ruff linter (py311+)
├── README.md
├── LICENSE
└── .github/
    └── workflows/
        ├── ci.yml                  # CI: MariaDB 10.6, Python 3.12, Node 18
        ├── builds.yml              # Docker image build & push to GHCR
        ├── linter.yml              # Semgrep + pip-audit
        └── on_release.yml          # Semantic versioning
```

---

## 3. Multi-Tenancy Implementation

### 3.1 Approach: Site-Per-Tenant (Separate Database per Tenant)

Horizon CRM uses Frappe's native **site-per-tenant** architecture. Each tenant (travel agency) runs as an independent Frappe site with its own MariaDB database, Redis namespace, and file storage:

```
┌─────────────────── Frappe Bench ───────────────────┐
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ agency1      │  │ agency2      │  │ agency3  │ │
│  │ .localhost   │  │ .localhost   │  │ .local.. │ │
│  ├──────────────┤  ├──────────────┤  ├──────────┤ │
│  │ DB: _agency1 │  │ DB: _agency2 │  │ DB: _ag3 │ │
│  │ Users: own   │  │ Users: own   │  │ Users:   │ │
│  │ Data: own    │  │ Data: own    │  │ own      │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
│  Shared: Redis, MariaDB server, App code            │
│  Isolated: Database, sessions, files, users         │
└─────────────────────────────────────────────────────┘
```

**Why site-per-tenant (not shared-database row-level isolation)?**

| Concern | Site-Per-Tenant | Shared DB + Row Isolation |
|---------|----------------|--------------------------|
| Data isolation | Complete (separate DB) | Requires agency field + User Permissions on every DocType |
| Security | Zero risk of cross-tenant leaks | Must enforce at every query, API, report |
| Complexity | Frappe handles it natively | Custom code needed everywhere |
| Backup/restore | Per-tenant granularity | All tenants in one DB |
| Performance | Independent scaling | Shared resources, query overhead |
| DocType schema | Clean — no `agency` field needed | Every DocType needs an `agency` Link |
| Frappe compatibility | Works with all standard Frappe features | Custom permission_query_conditions needed |

### 3.2 Isolation Enforcement

```
Layer 1: Database Isolation (Frappe Built-in)
├── Each site has its own MariaDB database
├── No SQL queries can cross database boundaries
└── Complete isolation of all data, users, and sessions

Layer 2: Domain-Based Routing (Frappe Built-in)
├── Each site is accessed via its own domain/subdomain
├── Frappe routes requests to the correct site based on Host header
└── No cross-site request possible via standard HTTP

Layer 3: Role-Based Permissions (App-Level)
├── Within each site, roles control access to features
├── Agency Admin → full agency management
├── Team Lead / Staff → scoped operational access
└── Portal → guest-accessible lead form (no login role needed)
```

### 3.3 Tenant Provisioning

New tenants are created via the `bench` CLI:

```bash
# Create a new tenant site
bench new-site agency1.localhost \
    --db-root-password <db_root_password> \
    --admin-password <admin_password>

# Install the Horizon CRM app on the new site
bench --site agency1.localhost install-app horizon_crm

# Or use the convenience command:
bench --site agency1.localhost horizon-crm create-tenant \
    --agency-name "Acme Travel" \
    --admin-email admin@acmetravel.com \
    --admin-password SecurePass123
```

The `install.py` hook automatically:
1. Creates custom roles (Agency Admin, Team Lead, Staff)
2. Seeds default Travel Types and Destinations
3. Initializes the Travel Agency singleton using the site domain name

### 3.4 Travel Agency as Singleton

Each site has exactly one `Travel Agency` record (DocType with `issingle: 1`). This singleton stores the agency's configuration:
- Agency name, contact info, logo
- Admin user (who gets the Agency Admin role)
- Subscription plan and staff limits

Since each tenant is its own site, there is no need for an `agency` Link field on operational DocTypes — all data within a site belongs to that one agency.

---

## 4. Permission Matrix

| DocType | System Manager | Agency Admin | Team Lead | Staff |
|---------|---------------|-------------|-----------|-------|
| Travel Agency | RWCDE | RW | R | R |
| Travel Agency Staff | RWCDE | RWCD | R | R |
| Travel Team | RWCDE | RWCDE | RWC | RWC |
| Travel Lead | RWCDE | RWCDE | RWC | RWC |
| Travel Inquiry | RWCDE | RWCDE | RWC | RWC |
| Travel Itinerary | RWCDE | RWCDE | RWC | RWC |
| Travel Booking | RWCDE | RWCDE | RWC | RWC |
| Travel Customer | RWCDE | RWCDE | RWC | RWC |
| Travel Invoice | RWCDE | RWCDE | RWC | RWC |
| Airline Supplier | RWCDE | RWCDE | RWC | RWC |
| Hotel Supplier | RWCDE | RWCDE | RWC | RWC |
| Visa Agent | RWCDE | RWCDE | RWC | RWC |
| Transport Supplier | RWCDE | RWCDE | RWC | RWC |
| Tour Operator | RWCDE | RWCDE | RWC | RWC |
| Insurance Provider | RWCDE | RWCDE | RWC | RWC |
| Travel Destination | RWCDE | R | R | R |
| Travel Type | RWCDE | R | R | R |
| Travel Lost Reason | RWCDE | RWCD | R | R |
| Travel Feedback | RWCDE | RWCDE | RWC | RWC |

R=Read, W=Write, C=Create, D=Delete, E=Export

> **Note**: The `Agency Customer` role is no longer used for portal access. The portal is now guest-accessible.

---

## 5. Portal Architecture

### Request Flow
```
Website Visitor → Frappe Web Server
                  → Host header → site resolution (tenant isolation)
                  → www/ route matching (/portal/inquiry)
                  → get_context() loads destinations & travel types
                  → Jinja template rendering
                  → HTML response (public, no auth required)

Form Submission → POST /api/method/horizon_crm.api.portal.submit_lead
                  → allow_guest=True (no auth check)
                  → @rate_limit (10/hour/IP)
                  → Input validation + HTML escaping
                  → Creates Travel Lead (source="Website")
                  → JSON response
```

### Portal Pages
| URL | Purpose | Auth Required |
|-----|---------|---------------|
| `/portal/inquiry` | Lead-capture form | No |
| `/portal/thank-you` | Post-submission confirmation | No |

### Portal Security
- Guest-accessible (no login required)
- CSRF protection via Frappe's built-in token system
- Rate limiting: 10 submissions per IP per hour
- All inputs HTML-escaped via `frappe.utils.escape_html()`
- Email validated server-side via `validate_email_address()`
- Site-per-tenant ensures leads go to the correct agency's database
- No access to any other data or desk APIs

---

## 6. Docker Development Stack

```yaml
services:
  frappe:
    # Custom image: Python 3.11-slim-bookworm, Node 18
    # Runs bench start on port 8000
    # Developer mode enabled (FRAPPE_DEVELOPER_MODE=1)
    # Volumes: repo root mounted at /workspace/horizon_crm, bench volume at /workspace/frappe-bench
    
  mariadb:
    # MariaDB 10.6 on port 3307 (mapped from 3306)
    # Charset: utf8mb4, Collation: utf8mb4_unicode_ci
    
  redis-cache:
    # Redis 7 on port 13000
    
  redis-queue:
    # Redis 7 on port 11000
```

### Dev Container Support (v3.0)

The `.devcontainer/` folder provides a one-click VS Code Dev Container experience:

- **docker-compose.extend.yml**: Extends the root `docker-compose.yml`, mounts the workspace, and sets `FRAPPE_DEVELOPER_MODE=1`

## 7. Production Docker Stack

The `deploy/` directory contains a production-grade deployment with separate service containers:

```
deploy/
├── Dockerfile              # Multi-stage: bench init → app install → lean runtime
├── docker-compose.prod.yml # 7 services + optional MariaDB
├── entrypoint.sh           # Universal entrypoint (web/socketio/worker/scheduler)
├── nginx.conf              # Reverse proxy with rate limiting & security headers
├── .env.template           # Environment variable template
└── .env                    # Local config (gitignored)
```

### Production Architecture

```
                    ┌─────────────────────────────┐
                    │      Nginx (:80)             │
                    │  Static assets, rate limits  │
                    └──────┬──────────────┬────────┘
                           │              │
              HTTP         │              │  WebSocket
                           │              │
               ┌───────────▼──┐    ┌──────▼──────────┐
               │ frappe-web   │    │ frappe-socketio  │
               │ Gunicorn     │    │ Node.js          │
               │ (:8000)      │    │ (:9000)          │
               └──────────────┘    └─────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
  ┌─────▼─────┐ ┌───▼──────┐ ┌──▼──────────┐
  │  Worker   │ │ Scheduler│ │ External DB  │
  │ (bg jobs) │ │ (cron)   │ │ (MySQL/      │
  └───────────┘ └──────────┘ │  MariaDB)    │
                              └──────────────┘
  ┌──────────────┐  ┌──────────────┐
  │ Redis Cache  │  │ Redis Queue  │
  │ (LRU 128MB)  │  │ (AOF persist)│
  └──────────────┘  └──────────────┘
```

### Key Design Decisions

- **External DB by default** — `DB_HOST` env var points to managed MySQL (e.g. Oracle MySQL HeatWave) or a separate MariaDB server. Use `--profile with-db` for a containerized MariaDB during testing.
- **Gunicorn with gthread** — Production-grade WSGI server with thread-based workers, capped at 4 for small instances.
- **Single Docker image** — All Frappe services (web, socketio, worker, scheduler) share one image; the `entrypoint.sh` selects the role via CMD argument.
- **Multi-stage build** — Builder stage compiles the app; production stage is lean (~1.5GB vs ~3GB).
- **ARM64 + AMD64** — Supports both architectures (Oracle A1.Flex ARM, Apple Silicon, standard x86).
- **devcontainer.json**: Configures Python interpreter path, recommended extensions (Ruff, Pylance, Playwright, Prettier), and a `postCreateCommand` to install bench and setup the environment
- **`.vscode/tasks.json`**: Predefined tasks for `bench start`, `bench build`, `bench migrate`, and running E2E tests

---

## 7. Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend Framework | Frappe Framework v15+ |
| Language | Python 3.11+ |
| Database | MariaDB 10.6+ |
| Cache / Queue | Redis 7+ |
| Frontend | Frappe Desk + Jinja Portal |
| CSS | Custom CSS on Frappe base |
| JS | Custom form handlers (horizon.js) |
| Testing — E2E | Playwright (TypeScript) |
| Testing — Unit | pytest (frappe.tests.utils) |
| Linting | Ruff (py311 target, line-length 110) |
| Containerization | Docker + Docker Compose, Dev Containers |
| CI/CD | GitHub Actions (ci.yml, builds.yml, linter.yml, on_release.yml) |
| Build System | Flit (pyproject.toml) |
| Branding | Horizon CRM (custom favicon, logo, CSS) |

---

## 8. Supplier Architecture (v3.0)

In v2.0, all suppliers were stored in a single `Travel Supplier` DocType with a `supplier_type` Select field. In v3.0, suppliers are split into **six category-specific DocTypes**, each with domain-relevant fields:

| DocType | Prefix | Key Fields |
|---------|--------|------------|
| Airline Supplier | `AIR-` | IATA code, alliance (Star/OneWorld/SkyTeam), hub airports, domestic/international/charter flags |
| Hotel Supplier | `HTL-` | Star rating (1–5), property type, room count, check-in/out, amenities (pool/spa/gym/etc.) |
| Visa Agent | `VISA-` | Countries served, visa types, avg processing days, success rate %, express flag |
| Transport Supplier | `TRN-` | Transport type (Car/Bus/Taxi/etc.), fleet size, vehicle types, max passengers, AC flag |
| Tour Operator | `TOUR-` | Specialization (Adventure/Cultural/Wildlife/etc.), destinations, group size min/max, languages |
| Insurance Provider | `INS-` | Insurance types, coverage regions, max coverage amount, claim turnaround days |

**Shared structure**: All 6 DocTypes share a common base of contact fields (email, phone, website), address fields (address, city, country), notes, `is_active` flag, and a `Supplier Service` child table.

**Migration**: The patch `horizon_crm.patches.migrate_suppliers_to_categories` automatically migrates existing `Travel Supplier` records to the appropriate category DocType based on `supplier_type`.

---

## 9. Sales Pipeline Architecture

### Lead → Inquiry → Booking Flow

```
┌──────────────┐     conversion      ┌──────────────────┐     booking      ┌──────────────┐
│  Travel Lead │ ──────────────────→ │  Travel Inquiry   │ ──────────────→ │Travel Booking│
│  (6 stages)  │                     │  (5 stages)       │                 │              │
└──────────────┘                     └──────────────────┘                 └──────────────┘
```

**Travel Lead** (pre-qualification):
- Stages: New → Contacted → Interested → Qualified → Converted → Do Not Contact
- No customer required; single budget estimate
- Tracks source (Website/Phone/Email/Walk-in/Referral/Social Media/Facebook/Instagram/Google Ads/Travel Fair/Partner Agency/Other)

**Travel Inquiry** (formal request):
- Stages: New → Contacted → Quoted → Won → Lost
- Customer required; budget range (min/max)
- Lost-reason tracking, traveler details (child table)
- Can be created from scratch or converted from a Lead
