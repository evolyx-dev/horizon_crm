/**
 * Itinerary, Supplier & Feedback E2E Tests
 * Covers: itinerary cost calculations, supplier management, feedback workflow
 */
import { test, expect } from "@playwright/test";
import { USERS, login, createDoc, gotoList } from "./fixtures";

test.describe("Itinerary Management", () => {
  test("Agency Admin can create an itinerary", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    const resp = await createDoc(page, "Travel Itinerary", {
      itinerary_name: `E2E Itinerary ${Date.now()}`,
      agency: USERS.agencyAdmin1.agency,
      destination: "Paris",
      duration_days: 5,
      total_cost: 0,
      items: [
        {
          day_number: 1,
          title: "Arrival & Hotel Check-in",
          description: "Transfer from airport",
          cost: 200,
        },
        {
          day_number: 2,
          title: "Eiffel Tower Tour",
          description: "Full day sightseeing",
          cost: 150,
        },
      ],
    });
    expect(resp.data.name).toBeDefined();
    // Total cost should be calculated
    expect(resp.data.total_cost).toBe(350);
  });

  test("Agency2 cannot access Agency1 itineraries", async ({ page }) => {
    await login(page, USERS.agencyAdmin2.email, USERS.agencyAdmin2.password);
    const resp = await page.request.get(
      `/api/resource/Travel Itinerary?filters=${JSON.stringify({
        agency: USERS.agencyAdmin1.agency,
      })}`
    );
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.data.length).toBe(0);
    }
  });

  test("Itinerary list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    await gotoList(page, "Travel Itinerary");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});

test.describe("Supplier Management", () => {
  test("Agency Admin can create a supplier", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    const resp = await createDoc(page, "Travel Supplier", {
      supplier_name: `E2E Supplier ${Date.now()}`,
      agency: USERS.agencyAdmin1.agency,
      supplier_type: "Hotel",
      contact_email: "supplier@test.example",
      contact_phone: "+4444444444",
      status: "Active",
      services: [
        {
          service_name: "Deluxe Room",
          description: "5-star hotel room",
          unit_price: 250,
        },
      ],
    });
    expect(resp.data.name).toBeDefined();
  });

  test("Agency2 cannot access Agency1 suppliers", async ({ page }) => {
    await login(page, USERS.agencyAdmin2.email, USERS.agencyAdmin2.password);
    const resp = await page.request.get(
      `/api/resource/Travel Supplier?filters=${JSON.stringify({
        agency: USERS.agencyAdmin1.agency,
      })}`
    );
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.data.length).toBe(0);
    }
  });

  test("Supplier list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    await gotoList(page, "Travel Supplier");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});

test.describe("Travel Feedback", () => {
  test("Feedback can be created for a booking", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);

    // Get an existing customer
    const custResp = await page.request.get(
      `/api/resource/Travel Customer?filters=${JSON.stringify({
        agency: USERS.agencyAdmin1.agency,
      })}&limit_page_length=1`
    );
    const custBody = await custResp.json();
    if (custBody.data.length === 0) return;

    const customerName = custBody.data[0].name;

    // Create a booking to attach feedback to
    const bookResp = await createDoc(page, "Travel Booking", {
      customer: customerName,
      agency: USERS.agencyAdmin1.agency,
      travel_type: "Cultural",
      destination: "Rome",
      departure_date: "2025-05-01",
      return_date: "2025-05-07",
      number_of_travelers: 2,
      total_amount: 4000,
      status: "Completed",
    });

    // Create feedback
    const fbResp = await createDoc(page, "Travel Feedback", {
      booking: bookResp.data.name,
      customer: customerName,
      agency: USERS.agencyAdmin1.agency,
      rating: 4,
      overall_experience: "Good",
      comments: "Great trip, well organized.",
    });
    expect(fbResp.data.name).toBeDefined();
    expect(fbResp.data.rating).toBe(4);
  });

  test("Feedback list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    await gotoList(page, "Travel Feedback");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });

  test("Agency2 cannot see Agency1 feedback", async ({ page }) => {
    await login(page, USERS.agencyAdmin2.email, USERS.agencyAdmin2.password);
    const resp = await page.request.get(
      `/api/resource/Travel Feedback?filters=${JSON.stringify({
        agency: USERS.agencyAdmin1.agency,
      })}`
    );
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.data.length).toBe(0);
    }
  });
});

test.describe("Travel Teams", () => {
  test("Agency Admin can create a team", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    const resp = await createDoc(page, "Travel Team", {
      team_name: `E2E Team ${Date.now()}`,
      agency: USERS.agencyAdmin1.agency,
      team_lead: USERS.teamLead1.email,
      is_active: 1,
    });
    expect(resp.data.name).toBeDefined();
  });

  test("Team list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    await gotoList(page, "Travel Team");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});
