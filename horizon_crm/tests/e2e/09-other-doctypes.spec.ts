/**
 * Itinerary, Suppliers, Feedback & Team E2E Tests
 * Covers: itinerary cost calculations, category supplier management, feedback workflow, teams
 */
import { test, expect } from "@playwright/test";
import { USERS, login, createDoc, gotoList } from "./fixtures";

test.describe("Itinerary Management", () => {
  test("Agency Admin can create an itinerary", async ({ page }) => {
    // Arrange — login
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Act — create itinerary with items
    const resp = await createDoc(page, "Travel Itinerary", {
      itinerary_name: `E2E Itinerary ${Date.now()}`,
      start_date: "2025-06-01",
      end_date: "2025-06-05",
      total_cost: 0,
      items: [
        {
          day_number: 1,
          title: "Arrival & Hotel Check-in",
          description: "Transfer from airport",
          estimated_cost: 200,
        },
        {
          day_number: 2,
          title: "Eiffel Tower Tour",
          description: "Full day sightseeing",
          estimated_cost: 150,
        },
      ],
    });

    // Assert — total cost should be calculated
    expect(resp.data.name).toBeDefined();
    expect(resp.data.total_cost).toBe(350);
  });

  test("Itinerary list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await gotoList(page, "Travel Itinerary");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});

test.describe("Airline Supplier", () => {
  test("Agency Admin can create an airline supplier", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Airline Supplier", {
      airline_name: `E2E Airline ${Date.now()}`,
      iata_code: "TS",
      alliance: "Star Alliance",
      domestic: 1,
      international: 1,
      services: [
        { service_name: "Economy Class", description: "Standard seat", price: 450 },
      ],
    });
    expect(resp.data.name).toBeDefined();
  });

  test("Airline Supplier list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await gotoList(page, "Airline Supplier");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});

test.describe("Hotel Supplier", () => {
  test("Agency Admin can create a hotel supplier", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Hotel Supplier", {
      hotel_name: `E2E Hotel ${Date.now()}`,
      star_rating: "5 Star",
      property_type: "Resort",
      services: [
        { service_name: "Deluxe Room", description: "Ocean view", price: 350 },
      ],
    });
    expect(resp.data.name).toBeDefined();
  });

  test("Hotel Supplier list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await gotoList(page, "Hotel Supplier");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});

test.describe("Visa Agent", () => {
  test("Agency Admin can create a visa agent", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Visa Agent", {
      agent_name: `E2E Visa Agent ${Date.now()}`,
      countries_served: "United States, United Kingdom, Schengen",
      avg_processing_days: 15,
    });
    expect(resp.data.name).toBeDefined();
  });

  test("Visa Agent list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await gotoList(page, "Visa Agent");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});

test.describe("Transport Supplier", () => {
  test("Agency Admin can create a transport supplier", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Transport Supplier", {
      transport_name: `E2E Transport ${Date.now()}`,
      transport_type: "Car Rental",
      fleet_size: 50,
    });
    expect(resp.data.name).toBeDefined();
  });
});

test.describe("Tour Operator", () => {
  test("Agency Admin can create a tour operator", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Tour Operator", {
      operator_name: `E2E Tour Op ${Date.now()}`,
      specialization: "Adventure",
      destinations_covered: "Nepal, Peru, Tanzania",
    });
    expect(resp.data.name).toBeDefined();
  });
});

test.describe("Insurance Provider", () => {
  test("Agency Admin can create an insurance provider", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Insurance Provider", {
      provider_name: `E2E Insurance ${Date.now()}`,
      insurance_types: "Travel Medical, Trip Cancellation",
      max_coverage_amount: 100000,
    });
    expect(resp.data.name).toBeDefined();
  });
});

test.describe("Travel Feedback", () => {
  test("Feedback can be created for a booking", async ({ page }) => {
    // Arrange — login and get a customer
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const custResp = await page.request.get(
      `/api/resource/Travel Customer?limit_page_length=1`
    );
    const custBody = await custResp.json();
    if (custBody.data.length === 0) return;
    const customerName = custBody.data[0].name;

    // Arrange — create a completed booking
    const bookResp = await createDoc(page, "Travel Booking", {
      customer: customerName,
      departure_date: "2025-05-01",
      return_date: "2025-05-07",
      num_travelers: 2,
      booking_date: "2025-04-15",
      total_amount: 4000,
      status: "Completed",
    });

    // Act — create feedback
    const fbResp = await createDoc(page, "Travel Feedback", {
      booking: bookResp.data.name,
      customer: customerName,
      rating: 0.8,
      overall_experience: "Good",
      comments: "Great trip, well organized.",
    });

    // Assert
    expect(fbResp.data.name).toBeDefined();
    expect(fbResp.data.rating).toBeGreaterThan(0);
  });

  test("Feedback list view loads", async ({ page }) => {
    // Arrange — login
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Act
    await gotoList(page, "Travel Feedback");

    // Assert
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});

test.describe("Travel Teams", () => {
  test("Agency Admin can create a team", async ({ page }) => {
    // Arrange — login
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Act — create team
    const resp = await createDoc(page, "Travel Team", {
      team_name: `E2E Team ${Date.now()}`,
      team_lead: USERS.teamLead.email,
    });

    // Assert
    expect(resp.data.name).toBeDefined();
  });

  test("Team list view loads", async ({ page }) => {
    // Arrange — login
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Act
    await gotoList(page, "Travel Team");

    // Assert
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});
