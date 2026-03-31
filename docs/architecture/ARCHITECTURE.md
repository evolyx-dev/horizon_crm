# Horizon CRM — System Architecture Document

**Version:** 3.0  
**Date:** 2025-07-13  

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
│  │              Frappe Framework v17                        │    │
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
│   │       │── # ── Reference Data ──
│   │       ├── travel_customer/
│   │       ├── travel_destination/
│   │       ├── travel_type/
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
│   │       ├── 01-auth.spec.ts … 11-lead-and-branding.spec.ts
│   │       └── global-teardown.ts
│   │
│   └── www/                        # Portal pages
│       └── portal/
│           ├── index.html
│           ├── index.py
│           ├── dashboard.html
│           ├── dashboard.py
│           ├── bookings.html
│           ├── bookings.py
│           ├── inquiry.html
│           └── inquiry.py
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
        ├── ci.yml                  # CI: MariaDB 11.8, Python 3.14, Node 24
        └── linter.yml              # Semgrep + pip-audit
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
└── Customer → portal-only access to own bookings
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
1. Creates custom roles (Agency Admin, Team Lead, Staff, Customer)
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

| DocType | System Manager | Agency Admin | Team Lead | Staff | Customer |
|---------|---------------|-------------|-----------|-------|----------|
| Travel Agency | RWCDE | R | - | - | - |
| Travel Agency Staff | RWCDE | RWC | R | R(self) | - |
| Travel Team | RWCDE | RWCD | R | R | - |
| Travel Lead | RWCDE | RWCD | RWCD | RWC | - |
| Travel Inquiry | RWCDE | RWCD | RWCD | RWC | R(own) |
| Travel Itinerary | RWCDE | RWCD | RWCD | RWC | R(own) |
| Travel Booking | RWCDE | RWCD | RWCD | RWC | R(own) |
| Travel Customer | RWCDE | RWCD | RWC | RWC | R(own) |
| Airline Supplier | RWCDE | RWCDE | RWCD | RWCD | - |
| Hotel Supplier | RWCDE | RWCDE | RWCD | RWCD | - |
| Visa Agent | RWCDE | RWCDE | RWCD | RWCD | - |
| Transport Supplier | RWCDE | RWCDE | RWCD | RWCD | - |
| Tour Operator | RWCDE | RWCDE | RWCD | RWCD | - |
| Insurance Provider | RWCDE | RWCDE | RWCD | RWCD | - |
| Travel Destination | RWCDE | R | R | R | R |
| Travel Type | RWCDE | R | R | R | R |
| Travel Feedback | RWCDE | R | R | R | RWC(own) |

R=Read, W=Write, C=Create, D=Delete, E=Export

---

## 5. Portal Architecture

### Request Flow
```
Customer Browser → Frappe Web Server
                  → Host header → site resolution (tenant isolation)
                  → www/ route matching
                  → get_context() loads data
                  → Permission check (user + customer link)
                  → Jinja template rendering
                  → HTML response
```

### Portal Security
- All portal pages check `frappe.session.user`
- Customer data filtered by customer record linked to portal user
- CSRF protection via Frappe's built-in token system
- Rate limiting on inquiry submission
- Site-per-tenant ensures customers only see their own agency's data

---

## 6. Docker Development Stack

```yaml
services:
  frappe:
    # Custom image: Python 3.11-slim-bookworm, Node 18
    # Runs bench start on port 8000
    # Developer mode enabled (FRAPPE_DEVELOPER_MODE=1)
    # Volumes: repo root mounted at /workspace/app, bench volume at /workspace/frappe-bench
    
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
| CI/CD | GitHub Actions (ci.yml, linter.yml) |
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
- Stages: New → Contacted → Qualified → Proposal Sent → Negotiation → Converted/Lost
- No customer required; single budget estimate
- Tracks source (Website/Referral/Walk-in/Social Media/Advertisement/Other)

**Travel Inquiry** (formal request):
- Stages: New → In Progress → Quotation Sent → Won → Lost
- Customer required; budget range (min/max)
- Lost-reason tracking, traveler details (child table)
- Can be created from scratch or converted from a Lead
