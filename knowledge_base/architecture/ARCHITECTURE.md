# Horizon CRM — System Architecture Document

**Version:** 1.0  
**Date:** 2026-03-30  

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

### 3.1 Approach: Shared Database with Row-Level Isolation

Frappe supports multi-tenancy via separate sites (each with own database), but for our use case we use a **single-site, shared-database** approach with **row-level tenant isolation**:

- Every tenant-sensitive DocType includes an `agency` Link field pointing to `Travel Agency`
- **User Permissions** are created automatically when staff is added to an agency
- Frappe's built-in User Permission system filters all list views, API calls, and reports

### 3.2 Isolation Enforcement Layers

```
Layer 1: User Permissions (Frappe Built-in)
├── Auto-created when Travel Agency Staff record is saved
├── Filters all standard API calls, list views, reports
└── Prevents cross-agency data access in standard Frappe operations

Layer 2: Controller Validation (Custom Code)
├── validate() hooks on all tenant DocTypes
├── Ensures agency field matches user's assigned agency
└── Blocks direct database manipulation attempts

Layer 3: API Whitelisting (Custom Code)
├── All custom API methods verify user's agency
├── Portal APIs scoped to customer's agency
└── No unauthenticated access to tenant data
```

### 3.3 User Permission Auto-Creation

```python
# In Travel Agency Staff controller (after_insert hook)
def after_insert(self):
    # Create user permission for the staff's agency
    frappe.get_doc({
        "doctype": "User Permission",
        "user": self.staff_user,
        "allow": "Travel Agency",
        "for_value": self.agency,
        "apply_to_all_doctypes": 1
    }).insert(ignore_permissions=True)
```

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
                  → www/ route matching
                  → get_context() loads data
                  → Permission check (user's agency + customer link)
                  → Jinja template rendering
                  → HTML response
```

### Portal Security
- All portal pages check `frappe.session.user`
- Customer data filtered by both agency AND customer record
- CSRF protection via Frappe's built-in token system
- Rate limiting on inquiry submission

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
