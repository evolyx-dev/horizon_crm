# Horizon CRM — Data Model Reference

**Version:** 3.1  
**Date:** 2026-04-01  

---

## Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    TRAVEL_AGENCY ||--o{ TRAVEL_AGENCY_STAFF : employs
    TRAVEL_AGENCY_STAFF }o--o| TRAVEL_TEAM : belongs_to
    TRAVEL_TEAM ||--o| TRAVEL_AGENCY_STAFF : led_by

    TRAVEL_LEAD ||--o{ TRAVEL_INQUIRY : converts_to
    TRAVEL_LEAD }o--o| TRAVEL_CUSTOMER : becomes

    TRAVEL_CUSTOMER ||--o{ TRAVEL_INQUIRY : raises
    TRAVEL_CUSTOMER ||--o{ TRAVEL_BOOKING : has
    TRAVEL_CUSTOMER ||--o{ TRAVEL_FEEDBACK : gives
    TRAVEL_CUSTOMER ||--o{ TRAVEL_INVOICE : billed_to

    TRAVEL_INQUIRY ||--o{ TRAVEL_INQUIRY_TRAVELER : includes
    TRAVEL_INQUIRY ||--o| TRAVEL_BOOKING : converts_to
    TRAVEL_INQUIRY }o--o| TRAVEL_DESTINATION : for
    TRAVEL_INQUIRY }o--o| TRAVEL_TYPE : type_of
    TRAVEL_INQUIRY }o--o| TRAVEL_LOST_REASON : lost_because

    TRAVEL_BOOKING ||--o{ BOOKING_PAYMENT : paid_via
    TRAVEL_BOOKING }o--o| TRAVEL_ITINERARY : planned_by
    TRAVEL_BOOKING ||--o{ TRAVEL_INVOICE : invoiced_as

    TRAVEL_ITINERARY ||--o{ ITINERARY_DAY_ITEM : contains

    AIRLINE_SUPPLIER ||--o{ SUPPLIER_SERVICE : offers
    HOTEL_SUPPLIER ||--o{ SUPPLIER_SERVICE : offers
    VISA_AGENT ||--o{ SUPPLIER_SERVICE : offers
    TRANSPORT_SUPPLIER ||--o{ SUPPLIER_SERVICE : offers
    TOUR_OPERATOR ||--o{ SUPPLIER_SERVICE : offers
    INSURANCE_PROVIDER ||--o{ SUPPLIER_SERVICE : offers

    TRAVEL_INVOICE ||--o{ INVOICE_ITEM : contains

    TRAVEL_AGENCY {
        string agency_name PK
        string agency_code UK
        string status
        string admin_user FK
        string contact_email
        int max_staff
        string subscription_plan
    }

    TRAVEL_AGENCY_STAFF {
        string staff_user PK
        string role_in_agency
        string team FK
        boolean is_active
    }

    TRAVEL_TEAM {
        string team_name PK
        string team_lead FK
        boolean is_active
    }

    TRAVEL_LEAD {
        string name PK
        string lead_name
        string status
        string email
        string phone
        string mobile_no
        string source
        string assigned_to FK
        string lead_owner FK
        string priority
        date next_follow_up
        string interested_destination FK
        string travel_type FK
        date expected_travel_date
        currency expected_budget
        int num_travelers
    }

    TRAVEL_INQUIRY {
        string name PK
        string status
        string priority
        string customer FK
        string lead FK
        string assigned_to FK
        string customer_name
        string customer_email
        string destination FK
        string travel_type FK
        date departure_date
        date return_date
        int num_travelers
        currency budget_min
        currency budget_max
        string lost_reason FK
        date follow_up_date
    }

    TRAVEL_INQUIRY_TRAVELER {
        string traveler_name
        int age
        string passport_number
    }

    TRAVEL_BOOKING {
        string name PK
        string status
        date booking_date
        string customer FK
        string inquiry FK
        string assigned_to FK
        string itinerary FK
        string destination FK
        date departure_date
        date return_date
        int num_travelers
        currency total_amount
        currency paid_amount
        currency balance_amount
    }

    BOOKING_PAYMENT {
        date payment_date
        currency amount
        string payment_method
        string status
    }

    TRAVEL_CUSTOMER {
        string name PK
        string customer_name
        string email UK
        string phone
        string mobile_no
        string lead FK
        string loyalty_tier
        string portal_user FK
        string gender
        date date_of_birth
        string nationality
        string passport_number
    }

    TRAVEL_ITINERARY {
        string itinerary_name PK
        string status
        string inquiry FK
        string booking FK
        date start_date
        date end_date
        int num_days
        currency total_cost
    }

    ITINERARY_DAY_ITEM {
        int day_number
        date date
        string title
        string accommodation
        string transport
        string meals_included
        currency estimated_cost
    }

    TRAVEL_INVOICE {
        string name PK
        string customer FK
        string booking FK
        string status
        date invoice_date
        date due_date
        currency subtotal
        float tax_percent
        currency tax_amount
        currency discount
        currency grand_total
        currency paid_amount
        currency outstanding_amount
        string payment_method
    }

    INVOICE_ITEM {
        string item_description
        float quantity
        currency rate
        currency amount
    }

    AIRLINE_SUPPLIER {
        string name PK
        string airline_name
        string iata_code
        string alliance
        boolean domestic
        boolean international
    }

    HOTEL_SUPPLIER {
        string name PK
        string hotel_name
        string star_rating
        string property_type
        int total_rooms
    }

    VISA_AGENT {
        string name PK
        string agent_name
        string countries_served
        int avg_processing_days
        float success_rate
    }

    TRANSPORT_SUPPLIER {
        string name PK
        string transport_name
        string transport_type
        int fleet_size
    }

    TOUR_OPERATOR {
        string name PK
        string operator_name
        string specialization
        string destinations_covered
    }

    INSURANCE_PROVIDER {
        string name PK
        string provider_name
        string insurance_types
        string coverage_regions
        currency max_coverage_amount
        int claim_turnaround_days
    }

    SUPPLIER_SERVICE {
        string service_name
        string description
        currency price
    }

    TRAVEL_DESTINATION {
        string destination_name PK
        string country
        string region
        boolean is_popular
    }

    TRAVEL_TYPE {
        string type_name PK
        string description
    }

    TRAVEL_LOST_REASON {
        string reason PK
    }

    TRAVEL_FEEDBACK {
        string name PK
        string booking FK
        string customer FK
        float rating
        string overall_experience
    }
```

---

## Lead vs Inquiry — Workflow Separation

**Travel Lead** and **Travel Inquiry** are intentionally separate doctypes with distinct responsibilities:

| Aspect | Travel Lead | Travel Inquiry |
|--------|------------|----------------|
| **Stage** | Pre-qualification | Formal travel request |
| **Pipeline** | New → Contacted → Interested → Qualified → Converted → DNC | New → Contacted → Quoted → Won → Lost |
| **Customer** | Not required (prospecting) | Required (customer_name mandatory) |
| **Budget** | Single estimate (`expected_budget`) | Range (`budget_min` / `budget_max`) |
| **Dates** | Optional (`expected_travel_date`) | Specific (`departure_date`, `return_date`) |
| **Next step** | Convert to Inquiry or Customer | Convert to Booking |
| **Lost tracking** | N/A | `lost_reason` + `lost_detail` (mandatory when Lost) |
| **Travelers** | Count only (`num_travelers`) | Child table with passport/age details |

**Conversion flow:** Lead (Qualified) → Create Inquiry → Inquiry (Won) → Create Booking

The overlapping fields (destination, travel_type, num_travelers, source) exist intentionally to pre-fill the Inquiry when converting from a Lead.

---

## Supplier Categories (v3.0)

The generic `Travel Supplier` has been replaced with six category-specific doctypes:

| DocType | Prefix | Category-Specific Fields |
|---------|--------|---------------------------|
| Airline Supplier | AIR- | iata_code, alliance, hub_airports, domestic/international/charter |
| Hotel Supplier | HTL- | star_rating, property_type, total_rooms, check-in/out times, amenities |
| Visa Agent | VISA- | countries_served, visa_types, avg_processing_days, success_rate, express |
| Transport Supplier | TRN- | transport_type, fleet_size, vehicle_types, max_passengers |
| Tour Operator | TOUR- | specialization, destinations_covered, group_size, languages |
| Insurance Provider | INS- | insurance_types, coverage_regions, max_coverage_amount, claim_turnaround_days |

All share: contact info, address, notes, and a `services` child table (`Supplier Service`).

---
