# Horizon CRM — Data Model Reference

**Version:** 1.0  
**Date:** 2026-03-30  

---

## Entity Relationship Diagram (Text)

```
┌──────────────────┐       ┌──────────────────┐
│  Travel Agency   │──1:N──│ Travel Agency     │
│  (Tenant)        │       │ Staff             │
└────────┬─────────┘       └──────────────────┘
         │                         │
         │ 1:N                     │ N:1
         │                         ▼
         │                 ┌──────────────────┐
         │                 │  Travel Team      │
         │                 └──────────────────┘
         │
    ┌────┴────┬──────────┬───────────┬────────────┐
    │         │          │           │            │
    ▼         ▼          ▼           ▼            ▼
┌────────┐┌────────┐┌─────────┐┌─────────┐┌──────────┐
│Inquiry ││Customer││Booking  ││Supplier ││Itinerary │
└───┬────┘└────────┘└────┬────┘└─────────┘└──────────┘
    │                    │
    │                    ▼
    │              ┌──────────┐
    └──────────────│ Feedback │
                   └──────────┘
```

---

## DocType Definitions

### 1. Travel Agency (Parent Tenant)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| agency_name | Data | Yes | Agency display name |
| agency_code | Data | Yes | Unique short code (auto/manual) |
| logo | Attach Image | No | Agency logo |
| contact_email | Data | Yes | Primary email |
| phone | Data | No | Primary phone |
| website | Data | No | Agency website |
| address | Small Text | No | Physical address |
| status | Select | Yes | Active / Inactive |
| admin_user | Link: User | No | Primary admin user |
| subscription_plan | Select | No | Free / Basic / Premium |
| max_staff | Int | No | Maximum staff allowed |

**Naming Rule:** By `agency_name`  
**Permissions:** System Manager (RWCDE)

---

### 2. Travel Agency Staff

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| staff_user | Link: User | Yes | Linked user account |
| agency | Link: Travel Agency | Yes | Parent agency |
| role_in_agency | Select | Yes | Agency Admin / Team Lead / Staff |
| team | Link: Travel Team | No | Assigned team |
| designation | Data | No | Job title |
| phone | Data | No | Contact phone |
| is_active | Check | Yes | Active flag |

**Naming Rule:** By `staff_user`  
**Permissions:** System Manager (RWCDE), Agency Admin (RWC), Team Lead (R), Staff (R self)

---

### 3. Travel Team

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| team_name | Data | Yes | Team display name |
| agency | Link: Travel Agency | Yes | Parent agency |
| team_lead | Link: Travel Agency Staff | No | Team lead |
| description | Small Text | No | Team description |

**Naming Rule:** By `team_name`  
**Permissions:** System Manager (RWCDE), Agency Admin (RWCD)

---

### 4. Travel Inquiry

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| inquiry_number | Data | Auto | INQ-XXXXX |
| agency | Link: Travel Agency | Yes | Parent agency |
| customer | Link: Travel Customer | No | Linked customer |
| customer_name | Data | Yes | Quick name entry |
| customer_email | Data | Yes | Contact email |
| customer_phone | Data | No | Contact phone |
| destination | Link: Travel Destination | No | Target destination |
| destination_text | Data | No | Free-text destination |
| travel_type | Link: Travel Type | No | Type of travel |
| departure_date | Date | No | Planned departure |
| return_date | Date | No | Planned return |
| num_travelers | Int | No | Number of travelers (default: 1) |
| budget_min | Currency | No | Min budget |
| budget_max | Currency | No | Max budget |
| status | Select | Yes | New / Contacted / Quoted / Won / Lost |
| assigned_to | Link: Travel Agency Staff | No | Assigned agent |
| priority | Select | No | Low / Medium / High / Urgent |
| source | Select | No | Walk-in / Phone / Email / Website / Referral |
| notes | Text Editor | No | Internal notes |
| travelers | Table: Travel Inquiry Traveler | No | Traveler details |

**Naming Rule:** Autoname `INQ-.#####`  
**Permissions:** Agency Admin (RWCD), Team Lead (RWCD), Staff (RWC)

---

### 5. Travel Inquiry Traveler (Child DocType)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| traveler_name | Data | Yes | Full name |
| age | Int | No | Age |
| passport_number | Data | No | Passport number |
| special_requirements | Small Text | No | Dietary, medical, etc |

**Parent:** Travel Inquiry

---

### 6. Travel Itinerary

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| itinerary_name | Data | Yes | Display name |
| agency | Link: Travel Agency | Yes | Parent agency |
| inquiry | Link: Travel Inquiry | No | Source inquiry |
| booking | Link: Travel Booking | No | Linked booking |
| start_date | Date | Yes | Start date |
| end_date | Date | Yes | End date |
| total_cost | Currency | No | Calculated total |
| currency | Link: Currency | No | Currency |
| status | Select | Yes | Draft / Shared / Approved / Archived |
| items | Table: Itinerary Day Item | No | Day-by-day items |

**Naming Rule:** By `itinerary_name`  
**Permissions:** Agency Admin (RWCD), Team Lead (RWCD), Staff (RWC)

---

### 7. Itinerary Day Item (Child DocType)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| day_number | Int | Yes | Day 1, 2, 3... |
| date | Date | No | Specific date |
| title | Data | Yes | Day title |
| description | Text Editor | No | Day description |
| accommodation | Data | No | Hotel/accommodation name |
| transport | Data | No | Transport details |
| meals_included | Select | No | None / Breakfast / Half Board / Full Board |
| estimated_cost | Currency | No | Day cost estimate |

**Parent:** Travel Itinerary

---

### 8. Travel Booking

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| booking_number | Data | Auto | BK-XXXXX |
| agency | Link: Travel Agency | Yes | Parent agency |
| inquiry | Link: Travel Inquiry | No | Source inquiry |
| customer | Link: Travel Customer | Yes | Customer |
| assigned_to | Link: Travel Agency Staff | No | Assigned agent |
| itinerary | Link: Travel Itinerary | No | Linked itinerary |
| departure_date | Date | Yes | Departure date |
| return_date | Date | Yes | Return date |
| num_travelers | Int | Yes | Number of travelers |
| total_amount | Currency | Yes | Total booking amount |
| paid_amount | Currency | No | Amount paid so far |
| balance_amount | Currency | No | Computed: total - paid |
| currency | Link: Currency | No | Currency |
| status | Select | Yes | Confirmed / In Progress / Completed / Cancelled |
| booking_date | Date | Yes | Date of booking |
| notes | Text Editor | No | Internal notes |
| payments | Table: Booking Payment | No | Payment records |

**Naming Rule:** Autoname `BK-.#####`  
**Permissions:** Agency Admin (RWCD), Team Lead (RWCD), Staff (RWC)

---

### 9. Booking Payment (Child DocType)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| payment_date | Date | Yes | Payment date |
| amount | Currency | Yes | Payment amount |
| payment_method | Select | No | Cash / Bank Transfer / Card / Online |
| status | Select | Yes | Pending / Received / Refunded |
| reference | Data | No | Transaction reference |
| notes | Small Text | No | Payment notes |

**Parent:** Travel Booking

---

### 10. Travel Customer

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| customer_name | Data | Yes | Full name |
| email | Data | Yes | Email address |
| phone | Data | No | Phone number |
| agency | Link: Travel Agency | Yes | Parent agency |
| portal_user | Link: User | No | Portal user account |
| nationality | Data | No | Nationality |
| passport_number | Data | No | Passport number |
| date_of_birth | Date | No | DOB |
| address | Small Text | No | Address |
| preferences | Text | No | Travel preferences |
| image | Attach Image | No | Photo |

**Naming Rule:** By `customer_name`  
**Permissions:** Agency Admin (RWCD), Team Lead (RWC), Staff (RWC)

---

### 11. Travel Supplier

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| supplier_name | Data | Yes | Supplier name |
| supplier_type | Select | Yes | Hotel / Airline / Tour Operator / Transport / Other |
| agency | Link: Travel Agency | Yes | Parent agency |
| contact_email | Data | No | Email |
| phone | Data | No | Phone |
| website | Data | No | Website |
| address | Small Text | No | Address |
| notes | Text | No | Notes |
| services | Table: Supplier Service | No | Service catalog |

**Naming Rule:** By `supplier_name`  
**Permissions:** Agency Admin (RWCD), Team Lead (R), Staff (R)

---

### 12. Supplier Service (Child DocType)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| service_name | Data | Yes | Service name |
| description | Small Text | No | Description |
| price | Currency | No | Price |
| currency | Link: Currency | No | Currency |

**Parent:** Travel Supplier

---

### 13. Travel Destination

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| destination_name | Data | Yes | Name |
| country | Data | Yes | Country |
| region | Data | No | Region |
| description | Text Editor | No | Description |
| image | Attach Image | No | Image |
| is_popular | Check | No | Featured flag |

**Naming Rule:** By `destination_name`  
**Permissions:** System Manager (RWCDE), All agency roles (R)

---

### 14. Travel Type

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type_name | Data | Yes | Type name |
| description | Small Text | No | Description |
| icon | Data | No | Icon class |

**Naming Rule:** By `type_name`  
**Permissions:** System Manager (RWCDE), All agency roles (R)

---

### 15. Travel Feedback

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| booking | Link: Travel Booking | Yes | Related booking |
| customer | Link: Travel Customer | Yes | Customer |
| agency | Link: Travel Agency | Yes | Parent agency |
| rating | Rating | Yes | 1-5 stars |
| overall_experience | Select | No | Excellent / Good / Average / Poor / Terrible |
| comments | Text | No | Feedback text |
| submitted_on | Date | Auto | Submission date |

**Naming Rule:** Autoname format  
**Permissions:** Agency Admin (R), Customer (RWC if_owner)
