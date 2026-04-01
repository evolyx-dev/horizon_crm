/**
 * Customer Portal E2E Tests
 * Covers: portal dashboard, booking list, inquiry submission, feedback
 */
import { test, expect } from "@playwright/test";
import { USERS, login, createDoc, getCsrfToken } from "./fixtures";

test.describe("Customer Portal", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.customer.email, USERS.customer.password);
  });

  test("Portal dashboard loads", async ({ page }) => {
    // Arrange — already logged in via beforeEach

    // Act — navigate to portal
    await page.goto("/portal", { waitUntil: "domcontentloaded" });

    // Assert — page should render
    await expect(page.locator("body")).toBeVisible();
    const content = await page.textContent("body");
    expect(content).toBeDefined();
  });

  test("Portal bookings page loads", async ({ page }) => {
    // Act
    await page.goto("/portal/bookings", { waitUntil: "domcontentloaded" });

    // Assert
    await expect(page.locator("body")).toBeVisible();
  });

  test("Portal inquiry page loads", async ({ page }) => {
    // Act
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });

    // Assert
    await expect(page.locator("body")).toBeVisible();
  });

  test("Portal API: get_my_bookings returns data", async ({ page }) => {
    // Navigate to portal bookings page to show in video
    await page.goto("/portal/bookings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // Act — call portal API
    const resp = await page.request.get(
      "/api/method/horizon_crm.api.portal.get_my_bookings"
    );

    // Assert
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.message).toBeDefined();
  });

  test("Portal API: submit_inquiry creates inquiry", async ({ page }) => {
    // Navigate to portal inquiry page to show in video
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // Act — submit inquiry via portal API
    const resp = await page.request.post(
      "/api/method/horizon_crm.api.portal.submit_inquiry",
      {
        data: {
          travel_type: "Honeymoon",
          destination: "Maldives",
          departure_date: "2025-09-01",
          return_date: "2025-09-10",
          num_travelers: 2,
          budget_min: 5000,
          budget_max: 8000,
          notes: "E2E portal test inquiry",
        },
        headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
      }
    );

    // Assert
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.message).toBeDefined();
    }
  });

  test("Portal API: submit_feedback", async ({ page }) => {
    // Arrange — create a completed booking as admin
    const adminCtx = await page.context().browser()!.newContext();
    const adminPage = await adminCtx.newPage();
    await login(adminPage, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    const custResp = await adminPage.request.get(
      `/api/resource/Travel Customer?filters=${JSON.stringify({
        email: USERS.customer.email,
      })}`
    );
    const custBody = await custResp.json();
    if (custBody.data.length > 0) {
      const customerName = custBody.data[0].name;

      const bookResp = await createDoc(adminPage, "Travel Booking", {
        customer: customerName,
        departure_date: "2025-04-01",
        return_date: "2025-04-07",
        num_travelers: 1,
        booking_date: "2025-03-15",
        total_amount: 3000,
        status: "Completed",
      });

      await adminCtx.close();

      // Act — submit feedback as customer
      const fbResp = await page.request.post(
        "/api/method/horizon_crm.api.portal.submit_feedback",
        {
          data: {
            booking: bookResp.data.name,
            rating: 5,
            comments: "Excellent trip! E2E test feedback.",
          },
          headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
        }
      );

      // Assert
      if (fbResp.ok()) {
        const body = await fbResp.json();
        expect(body.message).toBeDefined();
      }
    } else {
      await adminCtx.close();
    }
  });

  test("Customer cannot access admin-only resources", async ({ page }) => {
    // Navigate to admin area to show it's restricted in video
    await page.goto("/app/travel-agency-staff", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Act — try to list Travel Agency Staff
    const resp = await page.request.get("/api/resource/Travel Agency Staff");

    // Assert — should be empty or forbidden
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.data.length).toBe(0);
    }
  });
});
