"""Unit tests for Horizon CRM doctypes."""

import frappe
from frappe.tests import IntegrationTestCase


class TestTravelLead(IntegrationTestCase):
	"""Test Travel Lead doctype validation and status tracking."""

	def test_requires_contact_method(self):
		"""Lead must have at least one contact method."""
		lead = frappe.new_doc("Travel Lead")
		lead.lead_name = "Test Lead"
		lead.status = "New"
		self.assertRaises(frappe.ValidationError, lead.insert)

	def test_status_change_creates_comment(self):
		"""Changing lead status creates an Info comment."""
		lead = frappe.get_doc(
			{
				"doctype": "Travel Lead",
				"lead_name": "Comment Test Lead",
				"email": "comment-test@example.com",
				"status": "New",
			}
		)
		lead.insert(ignore_permissions=True)

		lead.status = "Contacted"
		lead.save(ignore_permissions=True)

		comments = frappe.get_all(
			"Comment",
			filters={
				"reference_doctype": "Travel Lead",
				"reference_name": lead.name,
				"comment_type": "Info",
			},
		)
		self.assertGreater(len(comments), 0)

		lead.delete(ignore_permissions=True)


class TestTravelInquiry(IntegrationTestCase):
	"""Test Travel Inquiry doctype."""

	def test_won_inquiry_prompts_booking(self):
		"""Setting inquiry to Won should succeed."""
		inquiry = frappe.get_doc(
			{
				"doctype": "Travel Inquiry",
				"customer_name": "Test Customer",
				"customer_email": "inq-test@example.com",
				"status": "New",
			}
		)
		inquiry.insert(ignore_permissions=True)

		inquiry.status = "Won"
		inquiry.save(ignore_permissions=True)

		self.assertEqual(inquiry.status, "Won")
		inquiry.delete(ignore_permissions=True)


class TestSupplierCategories(IntegrationTestCase):
	"""Test that all six supplier category doctypes can be created."""

	def _create_supplier(self, doctype, title_field, title_value, **kwargs):
		doc = frappe.get_doc(
			{
				"doctype": doctype,
				title_field: title_value,
				**kwargs,
			}
		)
		doc.insert(ignore_permissions=True)
		self.assertTrue(doc.name)
		doc.delete(ignore_permissions=True)

	def test_airline_supplier(self):
		self._create_supplier("Airline Supplier", "airline_name", "Test Airline", iata_code="TA")

	def test_hotel_supplier(self):
		self._create_supplier("Hotel Supplier", "hotel_name", "Test Hotel", star_rating="4 Star")

	def test_visa_agent(self):
		self._create_supplier("Visa Agent", "agent_name", "Test Visa Agent")

	def test_transport_supplier(self):
		self._create_supplier(
			"Transport Supplier", "transport_name", "Test Transport", transport_type="Taxi/Cab"
		)

	def test_tour_operator(self):
		self._create_supplier("Tour Operator", "operator_name", "Test Tour Op")

	def test_insurance_provider(self):
		self._create_supplier("Insurance Provider", "provider_name", "Test Insurance")


class TestTravelBooking(IntegrationTestCase):
	"""Test Travel Booking payment calculations."""

	def test_payment_balance_calculation(self):
		"""Adding payments should update paid_amount and balance_amount."""
		# Ensure a customer exists
		if not frappe.db.exists("Travel Customer", {"email": "booking-unit@example.com"}):
			cust = frappe.get_doc(
				{
					"doctype": "Travel Customer",
					"customer_name": "Booking Unit Test",
					"email": "booking-unit@example.com",
				}
			)
			cust.insert(ignore_permissions=True)
		customer = frappe.db.get_value("Travel Customer", {"email": "booking-unit@example.com"}, "name")

		booking = frappe.get_doc(
			{
				"doctype": "Travel Booking",
				"customer": customer,
				"departure_date": "2025-06-01",
				"return_date": "2025-06-07",
				"num_travelers": 1,
				"booking_date": "2025-05-01",
				"total_amount": 5000,
				"status": "Confirmed",
				"payments": [
					{
						"payment_date": "2025-05-01",
						"amount": 2000,
						"payment_method": "Bank Transfer",
						"status": "Received",
					},
				],
			}
		)
		booking.insert(ignore_permissions=True)

		self.assertEqual(booking.paid_amount, 2000)
		self.assertEqual(booking.balance_amount, 3000)

		booking.delete(ignore_permissions=True)
