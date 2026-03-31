# Horizon CRM — System Architecture Document

**Version:** 2.0  
**Date:** 2026-03-31  

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
bench0/apps/horizon_crm/
├── horizon_crm/
│   ├── __init__.py
│   ├── hooks.py                    # App hooks: permissions, events, portal
│   ├── modules.txt                 # Module definitions
│   ├── patches.txt                 # Database migration patches
│   ├── install.py                  # Post-install setup (roles, defaults)
│   │
│   ├── horizon_crm/               # Main module
│   │   ├── __init__.py
│   │   └── doctype/
│   │       ├── travel_agency/
│   │       │   ├── travel_agency.json
│   │       │   ├── travel_agency.py
│   │       │   ├── travel_agency.js
│   │       │   └── test_travel_agency.py
│   │       ├── travel_agency_staff/
│   │       ├── travel_team/
│   │       ├── travel_inquiry/
│   │       ├── travel_inquiry_traveler/  (child doctype)
│   │       ├── travel_itinerary/
│   │       ├── itinerary_day_item/       (child doctype)
│   │       ├── travel_booking/
│   │       ├── booking_payment/          (child doctype)
│   │       ├── travel_customer/
│   │       ├── travel_supplier/
│   │       ├── supplier_service/         (child doctype)
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
│   │   │   └── horizon.js
│   │   └── images/
│   │       ├── logo.svg
│   │       ├── logo-dark.svg
│   │       ├── favicon.svg
│   │       └── favicon-dark.svg
│   │
│   ├── templates/                  # Jinja templates
│   │   ├── __init__.py
│   │   ├── includes/
│   │   │   └── portal_navbar.html
│   │   └── pages/
│   │       └── __init__.py
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
├── pyproject.toml
├── README.md
├── LICENSE
└── .github/
    └── workflows/
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
| Travel Inquiry | RWCDE | RWCD | RWCD | RWC | R(own) |
| Travel Itinerary | RWCDE | RWCD | RWCD | RWC | R(own) |
| Travel Booking | RWCDE | RWCD | RWCD | RWC | R(own) |
| Travel Customer | RWCDE | RWCD | RWC | RWC | R(own) |
| Travel Supplier | RWCDE | RWCD | R | R | - |
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
    # Frappe bench with horizon_crm app
    # Python 3.11+, Node 18+
    
  mariadb:
    # MariaDB 10.6+
    
  redis-cache:
    # Redis for caching
    
  redis-queue:
    # Redis for background jobs
    
  playwright:
    # Playwright for E2E testing
```

---

## 7. Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend Framework | Frappe Framework v17 |
| Language | Python 3.11+ |
| Database | MariaDB 10.6+ |
| Cache | Redis 7+ |
| Frontend | Frappe Desk + Jinja Portal |
| CSS | Custom CSS on Frappe base |
| Testing | Playwright (E2E), pytest (unit) |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
