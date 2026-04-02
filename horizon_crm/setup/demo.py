"""Horizon CRM — Demo Data Seeder.

Creates realistic demo data so clients can explore a populated CRM.
Run via: bench --site <site> execute horizon_crm.setup.demo.seed
"""

import frappe
from frappe.utils import add_days, today, getdate, nowdate


def seed():
	"""Main entry point — idempotent, safe to run multiple times."""
	if frappe.db.exists("Travel Customer", {"customer_name": "Sarah Johnson"}):
		print("Demo data already exists, skipping.")
		return

	print("Creating demo user...")
	_create_demo_user()

	print("Creating customers...")
	customers = _create_customers()

	print("Creating leads...")
	leads = _create_leads()

	print("Creating suppliers...")
	_create_suppliers()

	print("Creating inquiries...")
	inquiries = _create_inquiries(customers)

	print("Creating bookings...")
	bookings = _create_bookings(customers, inquiries)

	print("Creating invoices...")
	_create_invoices(customers, bookings)

	frappe.db.commit()
	print(f"Demo data created: {len(customers)} customers, {len(leads)} leads, "
		  f"{len(inquiries)} inquiries, {len(bookings)} bookings")


def _create_demo_user():
	"""Create a demo login user with Agency Admin role."""
	email = "demo@horizon.com"
	if frappe.db.exists("User", email):
		return

	user = frappe.get_doc({
		"doctype": "User",
		"email": email,
		"first_name": "Demo",
		"last_name": "User",
		"enabled": 1,
		"send_welcome_email": 0,
		"user_type": "System User",
		"roles": [
			{"role": "Agency Admin"},
			{"role": "System Manager"},
		],
	})
	user.insert(ignore_permissions=True)

	# Set password directly, bypassing strength check
	from frappe.utils.password import update_password
	update_password(email, "demo1234")

	# Create matching staff record
	if not frappe.db.exists("Travel Agency Staff", {"staff_user": email}):
		staff = frappe.get_doc({
			"doctype": "Travel Agency Staff",
			"staff_user": email,
			"role_in_agency": "Agency Admin",
			"is_active": 1,
			"designation": "Sales Director",
			"join_date": "2025-01-15",
		})
		staff.insert(ignore_permissions=True)


def _create_customers():
	"""Create sample travel customers."""
	data = [
		{
			"customer_name": "Sarah Johnson",
			"email": "sarah.johnson@example.com",
			"phone": "+1-555-0101",
			"mobile_no": "+1-555-0102",
			"gender": "Female",
			"loyalty_tier": "Gold",
			"nationality": "American",
			"address": "123 Oak Avenue, New York, NY 10001",
			"preferences": "Window seat, vegetarian meals, prefers boutique hotels",
		},
		{
			"customer_name": "James Chen",
			"email": "james.chen@example.com",
			"phone": "+65-9123-4567",
			"mobile_no": "+65-8123-4567",
			"gender": "Male",
			"loyalty_tier": "Platinum",
			"nationality": "Singaporean",
			"address": "45 Marina Bay, Singapore 018956",
			"preferences": "Business class, luxury resorts, golf packages",
		},
		{
			"customer_name": "Priya Sharma",
			"email": "priya.sharma@example.com",
			"phone": "+91-98765-43210",
			"gender": "Female",
			"loyalty_tier": "Silver",
			"nationality": "Indian",
			"address": "B-12 Hauz Khas, New Delhi 110016",
			"preferences": "Family-friendly, cultural tours, halal food options",
		},
		{
			"customer_name": "Michael Brown",
			"email": "michael.brown@example.com",
			"phone": "+44-20-7946-0958",
			"gender": "Male",
			"loyalty_tier": "Bronze",
			"nationality": "British",
			"address": "10 Downing Close, London SW1A 2AA",
		},
		{
			"customer_name": "Fatima Al-Rashid",
			"email": "fatima.alrashid@example.com",
			"phone": "+971-50-123-4567",
			"gender": "Female",
			"loyalty_tier": "Gold",
			"nationality": "Emirati",
			"address": "Villa 25, Jumeirah Beach Road, Dubai",
			"preferences": "Five-star only, private tours, spa packages",
		},
		{
			"customer_name": "David Kim",
			"email": "david.kim@example.com",
			"phone": "+82-10-1234-5678",
			"gender": "Male",
			"loyalty_tier": "Silver",
			"nationality": "Korean",
			"address": "Gangnam-gu, Seoul 06000",
			"preferences": "Adventure travel, photography tours",
		},
	]

	customers = []
	for d in data:
		doc = frappe.get_doc({"doctype": "Travel Customer", **d})
		doc.insert(ignore_permissions=True)
		customers.append(doc)
	return customers


def _create_leads():
	"""Create sample travel leads in various pipeline stages."""
	base_date = getdate(today())
	data = [
		{
			"lead_name": "Emma Wilson",
			"status": "New",
			"source": "Website",
			"email": "emma.wilson@example.com",
			"phone": "+1-555-0201",
			"priority": "High",
			"interested_destination": "Bali",
			"travel_type": "Honeymoon",
			"expected_travel_date": str(add_days(base_date, 45)),
			"expected_budget": 8000,
			"num_travelers": 2,
			"country": "United States",
			"notes": "Getting married in June, wants a 10-day honeymoon package",
		},
		{
			"lead_name": "Robert Taylor",
			"status": "Contacted",
			"source": "Phone",
			"email": "r.taylor@example.com",
			"phone": "+44-77-1234-5678",
			"priority": "Medium",
			"interested_destination": "Tokyo",
			"travel_type": "Cultural",
			"expected_travel_date": str(add_days(base_date, 60)),
			"expected_budget": 5000,
			"num_travelers": 4,
			"country": "United Kingdom",
			"notes": "Family of 4, interested in cherry blossom season",
		},
		{
			"lead_name": "Aisha Mohammed",
			"status": "Interested",
			"source": "Instagram",
			"email": "aisha.m@example.com",
			"phone": "+971-55-987-6543",
			"priority": "High",
			"interested_destination": "Maldives",
			"travel_type": "Luxury",
			"expected_travel_date": str(add_days(base_date, 30)),
			"expected_budget": 15000,
			"num_travelers": 2,
			"country": "UAE",
			"notes": "Anniversary trip, wants overwater villa",
		},
		{
			"lead_name": "Carlos Mendez",
			"status": "Qualified",
			"source": "Referral",
			"email": "carlos.mendez@example.com",
			"phone": "+1-555-0303",
			"priority": "Urgent",
			"interested_destination": "Dubai",
			"travel_type": "Business",
			"expected_travel_date": str(add_days(base_date, 14)),
			"expected_budget": 12000,
			"num_travelers": 1,
			"country": "United States",
			"notes": "Corporate retreat for 20 people, needs conference venue",
		},
		{
			"lead_name": "Sophie Martin",
			"status": "Converted",
			"source": "Google Ads",
			"email": "sophie.martin@example.com",
			"phone": "+33-6-12-34-56-78",
			"priority": "Medium",
			"interested_destination": "Bangkok",
			"travel_type": "Adventure",
			"expected_budget": 3000,
			"num_travelers": 2,
			"country": "France",
		},
		{
			"lead_name": "Tom Anderson",
			"status": "New",
			"source": "Walk-in",
			"email": "tom.anderson@example.com",
			"phone": "+61-4-1234-5678",
			"priority": "Low",
			"interested_destination": "Rome",
			"travel_type": "Cultural",
			"expected_travel_date": str(add_days(base_date, 90)),
			"expected_budget": 4000,
			"num_travelers": 2,
			"country": "Australia",
			"notes": "First time to Europe, flexible dates",
		},
		{
			"lead_name": "Yuki Tanaka",
			"status": "Interested",
			"source": "Social Media",
			"email": "yuki.t@example.com",
			"phone": "+81-90-1234-5678",
			"priority": "High",
			"interested_destination": "Paris",
			"travel_type": "Honeymoon",
			"expected_travel_date": str(add_days(base_date, 75)),
			"expected_budget": 10000,
			"num_travelers": 2,
			"country": "Japan",
		},
	]

	leads = []
	for d in data:
		doc = frappe.get_doc({"doctype": "Travel Lead", **d})
		doc.insert(ignore_permissions=True)
		leads.append(doc)
	return leads


def _create_suppliers():
	"""Create sample suppliers across categories."""
	# Hotels
	hotels = [
		{
			"hotel_name": "Grand Hyatt Bali",
			"star_rating": "5 Star",
			"property_type": "Resort",
			"contact_email": "reservations@grandhyattbali.com",
			"phone": "+62-361-771234",
			"website": "https://www.hyatt.com",
			"city": "Nusa Dua",
			"country": "Indonesia",
			"total_rooms": 350,
			"pool": 1, "spa": 1, "gym": 1, "restaurant": 1, "wifi": 1,
			"parking": 1, "airport_shuttle": 1,
			"services": [
				{"service_name": "Deluxe Room", "price": 250},
				{"service_name": "Ocean Suite", "price": 550},
				{"service_name": "Airport Transfer", "price": 45},
			],
		},
		{
			"hotel_name": "Ritz-Carlton Maldives",
			"star_rating": "5 Star",
			"property_type": "Resort",
			"contact_email": "maldives@ritzcarlton.com",
			"phone": "+960-660-8800",
			"city": "Fari Islands",
			"country": "Maldives",
			"total_rooms": 100,
			"pool": 1, "spa": 1, "gym": 1, "restaurant": 1, "wifi": 1,
			"services": [
				{"service_name": "Overwater Villa", "price": 1200},
				{"service_name": "Beach Villa", "price": 900},
				{"service_name": "Sunset Cruise", "price": 350},
			],
		},
		{
			"hotel_name": "Sakura Inn Tokyo",
			"star_rating": "3 Star",
			"property_type": "Boutique",
			"contact_email": "info@sakurainn.jp",
			"phone": "+81-3-1234-5678",
			"city": "Shinjuku",
			"country": "Japan",
			"total_rooms": 45,
			"wifi": 1, "restaurant": 1,
			"services": [
				{"service_name": "Standard Room", "price": 120},
				{"service_name": "Japanese Suite", "price": 220},
			],
		},
	]
	for h in hotels:
		services = h.pop("services", [])
		doc = frappe.get_doc({"doctype": "Hotel Supplier", **h})
		for s in services:
			doc.append("services", s)
		doc.insert(ignore_permissions=True)

	# Airlines
	airlines = [
		{
			"airline_name": "Emirates",
			"iata_code": "EK",
			"alliance": "None",
			"hub_airports": "Dubai (DXB)",
			"international": 1,
			"domestic": 0,
			"contact_email": "trade@emirates.com",
			"country": "UAE",
			"services": [
				{"service_name": "Economy Class", "price": 600},
				{"service_name": "Business Class", "price": 2500},
				{"service_name": "First Class", "price": 5000},
			],
		},
		{
			"airline_name": "Singapore Airlines",
			"iata_code": "SQ",
			"alliance": "Star Alliance",
			"hub_airports": "Singapore (SIN)",
			"international": 1,
			"contact_email": "sales@singaporeair.com",
			"country": "Singapore",
			"services": [
				{"service_name": "Economy Class", "price": 550},
				{"service_name": "Business Class", "price": 2200},
			],
		},
	]
	for a in airlines:
		services = a.pop("services", [])
		doc = frappe.get_doc({"doctype": "Airline Supplier", **a})
		for s in services:
			doc.append("services", s)
		doc.insert(ignore_permissions=True)

	# Tour Operators
	operators = [
		{
			"operator_name": "Asia Explorer Tours",
			"specialization": "Cultural",
			"destinations_covered": "Japan, Thailand, Vietnam, Cambodia",
			"group_size_min": 2,
			"group_size_max": 15,
			"languages": "English, Japanese, Thai",
			"contact_email": "info@asiaexplorer.com",
			"country": "Thailand",
			"services": [
				{"service_name": "Tokyo Cultural Tour (3 days)", "price": 450},
				{"service_name": "Bangkok Street Food Tour", "price": 85},
				{"service_name": "Angkor Wat Day Trip", "price": 120},
			],
		},
		{
			"operator_name": "Safari Unlimited",
			"specialization": "Wildlife & Safari",
			"destinations_covered": "Kenya, Tanzania, South Africa",
			"group_size_min": 2,
			"group_size_max": 8,
			"languages": "English, Swahili",
			"contact_email": "bookings@safariunlimited.com",
			"country": "Kenya",
			"services": [
				{"service_name": "5-Day Masai Mara Safari", "price": 2500},
				{"service_name": "Serengeti Migration Tour", "price": 3800},
			],
		},
	]
	for o in operators:
		services = o.pop("services", [])
		doc = frappe.get_doc({"doctype": "Tour Operator", **o})
		for s in services:
			doc.append("services", s)
		doc.insert(ignore_permissions=True)


def _create_inquiries(customers):
	"""Create inquiries across all pipeline stages."""
	base_date = getdate(today())
	data = [
		{
			"customer": customers[0].name,
			"customer_name": customers[0].customer_name,
			"customer_email": customers[0].email,
			"status": "Won",
			"priority": "High",
			"source": "Website",
			"destination": "Bali",
			"travel_type": "Honeymoon",
			"departure_date": str(add_days(base_date, 30)),
			"return_date": str(add_days(base_date, 40)),
			"num_travelers": 2,
			"budget_min": 5000,
			"budget_max": 8000,
			"notes": "<p>10-night honeymoon package. Wants private villa with pool.</p>",
			"travelers": [
				{"traveler_name": "Sarah Johnson", "age": 29},
				{"traveler_name": "Mark Johnson", "age": 31},
			],
		},
		{
			"customer": customers[1].name,
			"customer_name": customers[1].customer_name,
			"customer_email": customers[1].email,
			"status": "Won",
			"priority": "High",
			"source": "Referral",
			"destination": "Maldives",
			"travel_type": "Luxury",
			"departure_date": str(add_days(base_date, 15)),
			"return_date": str(add_days(base_date, 22)),
			"num_travelers": 2,
			"budget_min": 10000,
			"budget_max": 18000,
			"notes": "<p>Anniversary celebration. Overwater villa required. Champagne on arrival.</p>",
			"travelers": [
				{"traveler_name": "James Chen", "age": 42},
				{"traveler_name": "Lisa Chen", "age": 39},
			],
		},
		{
			"customer": customers[2].name,
			"customer_name": customers[2].customer_name,
			"customer_email": customers[2].email,
			"status": "Quoted",
			"priority": "Medium",
			"source": "Email",
			"destination": "Tokyo",
			"travel_type": "Family",
			"departure_date": str(add_days(base_date, 50)),
			"return_date": str(add_days(base_date, 57)),
			"num_travelers": 4,
			"budget_min": 4000,
			"budget_max": 6000,
			"notes": "<p>Family trip with 2 kids (ages 8 & 12). Disney Tokyo must-have.</p>",
			"travelers": [
				{"traveler_name": "Priya Sharma", "age": 38},
				{"traveler_name": "Raj Sharma", "age": 40},
				{"traveler_name": "Ananya Sharma", "age": 12},
				{"traveler_name": "Arjun Sharma", "age": 8},
			],
		},
		{
			"customer": customers[3].name,
			"customer_name": customers[3].customer_name,
			"customer_email": customers[3].email,
			"status": "Contacted",
			"priority": "Low",
			"source": "Walk-in",
			"destination": "Dubai",
			"travel_type": "Business",
			"departure_date": str(add_days(base_date, 20)),
			"return_date": str(add_days(base_date, 24)),
			"num_travelers": 1,
			"budget_min": 2000,
			"budget_max": 4000,
			"notes": "<p>Business trip with 2 days leisure. Needs hotel near DIFC.</p>",
		},
		{
			"customer": customers[4].name,
			"customer_name": customers[4].customer_name,
			"customer_email": customers[4].email,
			"status": "New",
			"priority": "High",
			"source": "Social Media",
			"destination": "Paris",
			"travel_type": "Luxury",
			"departure_date": str(add_days(base_date, 60)),
			"return_date": str(add_days(base_date, 67)),
			"num_travelers": 2,
			"budget_min": 12000,
			"budget_max": 20000,
			"notes": "<p>Luxury Paris experience. Private Louvre tour, Michelin dining.</p>",
			"travelers": [
				{"traveler_name": "Fatima Al-Rashid", "age": 35},
				{"traveler_name": "Ahmed Al-Rashid", "age": 38},
			],
		},
		{
			"customer": customers[5].name,
			"customer_name": customers[5].customer_name,
			"customer_email": customers[5].email,
			"status": "New",
			"priority": "Medium",
			"source": "Website",
			"destination": "Sydney",
			"travel_type": "Adventure",
			"departure_date": str(add_days(base_date, 45)),
			"return_date": str(add_days(base_date, 55)),
			"num_travelers": 1,
			"budget_min": 3000,
			"budget_max": 5000,
			"notes": "<p>Solo adventure trip. Great Barrier Reef diving + Blue Mountains hiking.</p>",
		},
		{
			"customer": customers[0].name,
			"customer_name": customers[0].customer_name,
			"customer_email": customers[0].email,
			"status": "Lost",
			"priority": "Low",
			"source": "Phone",
			"destination": "London",
			"travel_type": "Cultural",
			"num_travelers": 2,
			"budget_min": 3000,
			"budget_max": 5000,
			"lost_reason": "Budget Too High",
			"lost_detail": "Customer found a cheaper package through another agency",
		},
	]

	inquiries = []
	for d in data:
		travelers = d.pop("travelers", [])
		doc = frappe.get_doc({"doctype": "Travel Inquiry", **d})
		for t in travelers:
			doc.append("travelers", t)
		doc.insert(ignore_permissions=True)
		inquiries.append(doc)
	return inquiries


def _create_bookings(customers, inquiries):
	"""Create bookings from won inquiries + additional ones."""
	base_date = getdate(today())
	data = [
		{
			"customer": customers[0].name,
			"inquiry": inquiries[0].name,
			"status": "Confirmed",
			"booking_date": str(add_days(base_date, -5)),
			"destination": "Bali",
			"departure_date": str(add_days(base_date, 30)),
			"return_date": str(add_days(base_date, 40)),
			"num_travelers": 2,
			"total_amount": 6500,
			"notes": "<p>Bali honeymoon — Grand Hyatt villa, private pool, couple spa package included.</p>",
			"payments": [
				{
					"payment_date": str(add_days(base_date, -5)),
					"amount": 2000,
					"payment_method": "Card",
					"status": "Received",
					"reference": "PAY-001",
				},
			],
		},
		{
			"customer": customers[1].name,
			"inquiry": inquiries[1].name,
			"status": "Confirmed",
			"booking_date": str(add_days(base_date, -3)),
			"destination": "Maldives",
			"departure_date": str(add_days(base_date, 15)),
			"return_date": str(add_days(base_date, 22)),
			"num_travelers": 2,
			"total_amount": 14500,
			"notes": "<p>Ritz-Carlton overwater villa, all-inclusive, seaplane transfer.</p>",
			"payments": [
				{
					"payment_date": str(add_days(base_date, -3)),
					"amount": 7000,
					"payment_method": "Bank Transfer",
					"status": "Received",
					"reference": "PAY-002",
				},
				{
					"payment_date": str(add_days(base_date, -1)),
					"amount": 3500,
					"payment_method": "Card",
					"status": "Received",
					"reference": "PAY-003",
				},
			],
		},
		{
			"customer": customers[2].name,
			"status": "In Progress",
			"booking_date": str(add_days(base_date, -20)),
			"destination": "Bangkok",
			"departure_date": str(add_days(base_date, -5)),
			"return_date": str(add_days(base_date, 2)),
			"num_travelers": 4,
			"total_amount": 4800,
			"notes": "<p>Family Bangkok trip — temples, street food tour, floating market.</p>",
			"payments": [
				{
					"payment_date": str(add_days(base_date, -20)),
					"amount": 4800,
					"payment_method": "Bank Transfer",
					"status": "Received",
					"reference": "PAY-004",
				},
			],
		},
		{
			"customer": customers[4].name,
			"status": "Completed",
			"booking_date": str(add_days(base_date, -45)),
			"destination": "Dubai",
			"departure_date": str(add_days(base_date, -30)),
			"return_date": str(add_days(base_date, -25)),
			"num_travelers": 2,
			"total_amount": 9200,
			"notes": "<p>Completed Dubai luxury tour — Burj Al Arab, desert safari, gold souk.</p>",
			"payments": [
				{
					"payment_date": str(add_days(base_date, -45)),
					"amount": 5000,
					"payment_method": "Card",
					"status": "Received",
					"reference": "PAY-005",
				},
				{
					"payment_date": str(add_days(base_date, -30)),
					"amount": 4200,
					"payment_method": "Card",
					"status": "Received",
					"reference": "PAY-006",
				},
			],
		},
		{
			"customer": customers[5].name,
			"status": "Confirmed",
			"booking_date": str(add_days(base_date, -2)),
			"destination": "New York",
			"departure_date": str(add_days(base_date, 25)),
			"return_date": str(add_days(base_date, 32)),
			"num_travelers": 1,
			"total_amount": 3200,
			"notes": "<p>NYC photography tour — Brooklyn Bridge, Central Park, Times Square.</p>",
			"payments": [
				{
					"payment_date": str(add_days(base_date, -2)),
					"amount": 1000,
					"payment_method": "Online",
					"status": "Received",
					"reference": "PAY-007",
				},
			],
		},
	]

	bookings = []
	for d in data:
		payments = d.pop("payments", [])
		doc = frappe.get_doc({"doctype": "Travel Booking", **d})
		for p in payments:
			doc.append("payments", p)
		doc.insert(ignore_permissions=True)
		bookings.append(doc)
	return bookings


def _create_invoices(customers, bookings):
	"""Create invoices for completed/confirmed bookings."""
	base_date = getdate(today())
	data = [
		{
			"customer": customers[0].name,
			"booking": bookings[0].name,
			"invoice_date": str(add_days(base_date, -5)),
			"due_date": str(add_days(base_date, 25)),
			"status": "Sent",
			"items": [
				{"item_description": "Grand Hyatt Bali — Villa (10 nights)", "quantity": 10, "rate": 450},
				{"item_description": "Airport Transfer (round-trip)", "quantity": 2, "rate": 45},
				{"item_description": "Couple Spa Package", "quantity": 1, "rate": 280},
				{"item_description": "Private Sunset Dinner", "quantity": 1, "rate": 180},
			],
			"tax_percent": 10,
			"paid_amount": 2000,
		},
		{
			"customer": customers[1].name,
			"booking": bookings[1].name,
			"invoice_date": str(add_days(base_date, -3)),
			"due_date": str(add_days(base_date, 12)),
			"status": "Partially Paid",
			"items": [
				{"item_description": "Ritz-Carlton Overwater Villa (7 nights)", "quantity": 7, "rate": 1200},
				{"item_description": "Seaplane Transfer (round-trip)", "quantity": 2, "rate": 500},
				{"item_description": "All-Inclusive Dining Package", "quantity": 7, "rate": 350},
				{"item_description": "Sunset Dolphin Cruise", "quantity": 1, "rate": 350},
			],
			"tax_percent": 5,
			"paid_amount": 10500,
		},
		{
			"customer": customers[4].name,
			"booking": bookings[3].name,
			"invoice_date": str(add_days(base_date, -45)),
			"due_date": str(add_days(base_date, -30)),
			"status": "Paid",
			"items": [
				{"item_description": "Burj Al Arab Suite (5 nights)", "quantity": 5, "rate": 1200},
				{"item_description": "Desert Safari Premium", "quantity": 1, "rate": 450},
				{"item_description": "Private Yacht Cruise", "quantity": 1, "rate": 800},
				{"item_description": "Gold Souk Shopping Tour", "quantity": 1, "rate": 150},
			],
			"tax_percent": 5,
			"paid_amount": 9200,
			"payment_method": "Credit Card",
			"payment_date": str(add_days(base_date, -30)),
		},
		{
			"customer": customers[2].name,
			"booking": bookings[2].name,
			"invoice_date": str(add_days(base_date, -20)),
			"due_date": str(add_days(base_date, -5)),
			"status": "Paid",
			"items": [
				{"item_description": "Bangkok Hotel (7 nights)", "quantity": 7, "rate": 180},
				{"item_description": "Temple Tour (family)", "quantity": 1, "rate": 200},
				{"item_description": "Street Food Walking Tour", "quantity": 1, "rate": 120},
				{"item_description": "Floating Market Day Trip", "quantity": 4, "rate": 85},
			],
			"tax_percent": 7,
			"paid_amount": 4800,
			"payment_method": "Bank Transfer",
			"payment_date": str(add_days(base_date, -20)),
		},
	]

	for d in data:
		items = d.pop("items", [])
		doc = frappe.get_doc({"doctype": "Travel Invoice", **d})
		for item in items:
			doc.append("items", item)
		doc.insert(ignore_permissions=True)
