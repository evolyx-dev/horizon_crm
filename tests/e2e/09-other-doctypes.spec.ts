/**
 * Itinerary, Supplier, Feedback & Team E2E Tests
 * Covers: itinerary cost calculations, supplier management, feedback workflow, teams
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
    // Arrange — login
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Act
    await gotoList(page, "Travel Itinerary");

    // Assert
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});

test.describe("Supplier Management", () => {
  test("Agency Admin can create a supplier", async ({ page }) => {
    // Arrange — login
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Act — create supplier
    const resp = await createDoc(page, "Travel Supplier", {
      supplier_name: `E2E Supplier ${Date.now()}`,
      supplier_type: "Hotel",
      contact_email: "supplier@test.example",
      services: [
        {
          service_name: "Deluxe Room",
          description: "5-star hotel room",
          price: 250,
        },
      ],
    });

    // Assert
    expect(resp.data.name).toBeDefined();
  });

  test("Supplier list view loads", async ({ page }) => {
    // Arrange — login
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Act
    await gotoList(page, "Travel Supplier");

    // Assert
    await expect(page.locator(".frappe-list")).toBeVisible();
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
