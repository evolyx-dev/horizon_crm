# Horizon CRM — Portal & Lead Form Guide

> **Audience**: Agency admins and developers who configure the public lead-capture form.

---

## Overview

Horizon CRM includes a **public portal form** at `/portal/inquiry` that allows website visitors to submit travel inquiries without creating an account. Submissions are captured as **Travel Leads** and appear in the staff desk immediately.

**Key points:**
- No login or customer account required
- Form creates a `Travel Lead` with `source = "Website"`
- Rate-limited to 10 submissions per IP per hour
- Embeddable via `<iframe>` in external agency websites
- Works on every agency tenant site (multi-tenant ready)

---

## 1. How the Portal Form Works

### Visitor Flow

1. Visitor navigates to `https://your-site.example.com/portal/inquiry`
2. Fills in: name, email, phone, destination, travel type, dates, budget, notes
3. Clicks **Submit Inquiry**
4. Sees a **Thank You** confirmation page
5. A `Travel Lead` is created with status "New" and source "Website"
6. Agency staff sees the lead in the desk and can follow up

### What Gets Created

| Portal Field | Travel Lead Field | Required |
|-------------|-------------------|----------|
| Full Name | `lead_name` | Yes |
| Email | `email` | Yes |
| Phone | `phone` | No |
| Destination | `interested_destination` | No |
| Travel Type | `travel_type` | No |
| Departure Date | `expected_travel_date` | No |
| Number of Travelers | `num_travelers` | No |
| Maximum Budget | `expected_budget` | No |
| Notes | `notes` | No |

The `source` field is automatically set to **"Website"**.

---

## 2. Embedding the Form in Your Website

The portal form can be embedded in any external website using an iframe:

```html
<iframe
  src="https://your-crm-site.example.com/portal/inquiry"
  width="100%"
  height="700"
  frameborder="0"
  style="border: none; border-radius: 12px;"
  title="Travel Inquiry Form"
></iframe>
```

Replace `your-crm-site.example.com` with your actual Frappe site URL.

### Multi-Tenant Embedding

Each agency tenant has its own site URL. Leads submitted via the form are stored in that tenant's database:

- `acme-travel.example.com/portal/inquiry` → leads in Acme Travel's DB
- `wanderlust.example.com/portal/inquiry` → leads in Wanderlust's DB

---

## 3. API Reference

### `POST /api/method/horizon_crm.api.portal.submit_lead`

**Authentication**: None required (guest-accessible)

**Rate Limit**: 10 requests per IP per hour

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `full_name` | string | Yes | Visitor's full name |
| `email` | string | Yes | Valid email address |
| `phone` | string | No | Phone number |
| `destination` | string | No | Desired destination |
| `travel_type` | string | No | Type of travel (Adventure, Beach, etc.) |
| `departure_date` | string | No | YYYY-MM-DD format |
| `return_date` | string | No | YYYY-MM-DD format |
| `num_travelers` | integer | No | Default: 1 |
| `budget_min` | float | No | Minimum budget |
| `budget_max` | float | No | Maximum budget |
| `notes` | string | No | Additional details |

**Success Response (200):**
```json
{
  "message": {
    "name": "LEAD-00042",
    "message": "Thank you! Your inquiry has been submitted."
  }
}
```

**Error Response (400/417):**
```json
{
  "_server_messages": "[{\"message\": \"Full name is required.\"}]"
}
```

---

## 4. Portal Pages

| URL | Purpose | Auth Required |
|-----|---------|---------------|
| `/portal/inquiry` | Lead-capture form | No |
| `/portal/thank-you` | Post-submission confirmation | No |

---

## 5. Customizing the Form

### Styling

The form uses CSS from `/assets/horizon_crm/css/horizon_portal.css`. Key classes:

- `.portal-container` — outer wrapper (max-width: 1100px)
- `.portal-header` — gradient header banner
- `.portal-form` — form card with shadow and border-radius

### Adding/Removing Fields

Edit `horizon_crm/www/portal/inquiry.html` to add or remove form fields. The API in `horizon_crm/api/portal.py` must be updated to accept any new fields.

### Travel Types and Destinations

The form dynamically loads travel types and popular destinations from the database. Manage these via:

- **Travel Types**: Desk → Settings → Travel Types
- **Destinations**: Desk → Trip Planning → Destinations (mark as "Is Popular" to show in form)

---

## 6. Security

- **Input sanitization**: All text inputs are HTML-escaped before storage
- **Email validation**: Server-side email format validation
- **Rate limiting**: 10 submissions per IP per hour (prevents spam)
- **CSRF protection**: Frappe's CSRF token from cookie is required
- **No authentication bypass**: The form only creates leads — it cannot access any other data
