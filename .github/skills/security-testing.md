# Skill: Security Testing

## Description
Write and run security tests for Horizon CRM multi-tenancy isolation.

## Test Categories

### 1. Cross-Agency Isolation
```python
def test_agency_a_cannot_see_agency_b_data():
    """Staff in Agency A should not see Agency B's inquiries"""
    frappe.set_user(agency_a_staff)
    inquiries = frappe.get_all("Travel Inquiry")
    for inq in inquiries:
        doc = frappe.get_doc("Travel Inquiry", inq.name)
        assert doc.agency == agency_a_name
```

### 2. Role-Based Access
```python
def test_staff_cannot_delete_inquiry():
    """Regular staff should not be able to delete inquiries"""
    frappe.set_user(staff_user)
    with pytest.raises(frappe.PermissionError):
        frappe.delete_doc("Travel Inquiry", inquiry_name)
```

### 3. Portal Authentication
```python
def test_customer_only_sees_own_bookings():
    """Customer portal should only show their bookings"""
    frappe.set_user(customer_portal_user)
    bookings = frappe.get_all("Travel Booking")
    for b in bookings:
        doc = frappe.get_doc("Travel Booking", b.name)
        assert doc.customer == customer_name
```

### 4. API Permission Tests
```python
def test_api_requires_authentication():
    """API endpoints should reject unauthenticated requests"""
    # Test without session
    response = requests.get(f"{site_url}/api/method/horizon_crm.api.booking.get_bookings")
    assert response.status_code == 403
```

## Running Security Tests
```bash
bench --site <site> run-tests --app horizon_crm --module horizon_crm.tests.test_security
```
