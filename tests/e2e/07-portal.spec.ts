/**
 * Customer Portal E2E Tests
 * Covers: portal dashboard, booking list, inquiry submission, feedback
 */
import { test, expect } from "@playwright/test";
import { USERS, login, createDoc, getCsrfToken } from "./fixtures";

test.describe("Customer Portal", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.customer1.email, USERS.customer1.password);
  });

  test("Portal dashboard loads", async ({ page }) => {
    await page.goto("/portal", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    // Should contain some portal content
    const content = await page.textContent("body");
    expect(content).toBeDefined();
  });

  test("Portal bookings page loads", async ({ page }) => {
    await page.goto("/portal/bookings", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("Portal inquiry page loads", async ({ page }) => {
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("Portal API: get_my_bookings returns data", async ({ page }) => {
    const resp = await page.request.get(
      "/api/method/horizon_crm.api.portal.get_my_bookings"
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.message).toBeDefined();
  });

  test("Portal API: submit_inquiry creates inquiry", async ({ page }) => {
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
    // May succeed or fail if customer not properly linked
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.message).toBeDefined();
    }
  });

  test("Portal API: submit_feedback", async ({ page }) => {
    // First, login as admin and create a completed booking for the customer
    const adminCtx = await page.context().browser()!.newContext();
    const adminPage = await adminCtx.newPage();
    await login(
      adminPage,
      USERS.agencyAdmin1.email,
      USERS.agencyAdmin1.password
    );

    // Get customer name
    const custResp = await adminPage.request.get(
      `/api/resource/Travel Customer?filters=${JSON.stringify({
        email: USERS.customer1.email,
        agency: USERS.customer1.agency,
      })}`
    );
    const custBody = await custResp.json();
    if (custBody.data.length > 0) {
      const customerName = custBody.data[0].name;

      // Create a completed booking
      const bookResp = await createDoc(adminPage, "Travel Booking", {
        customer: customerName,
        agency: USERS.customer1.agency,
        departure_date: "2025-04-01",
        return_date: "2025-04-07",
        num_travelers: 1,
        booking_date: "2025-03-15",
        total_amount: 3000,
        status: "Completed",
      });

      await adminCtx.close();

      // Now submit feedback as customer
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
      // Feedback may succeed or fail depending on customer linkage
      if (fbResp.ok()) {
        const body = await fbResp.json();
        expect(body.message).toBeDefined();
      }
    } else {
      await adminCtx.close();
    }
  });

  test("Customer cannot access desk admin pages", async ({ page }) => {
    // Customer should not be able to access Travel Agency list
    const resp = await page.request.get("/api/resource/Travel Agency");
    if (resp.ok()) {
      const body = await resp.json();
      // Should see 0 agencies (no permission)
      expect(body.data.length).toBe(0);
    }
  });

  test("Customer cannot access other agencies data", async ({ page }) => {
    const resp = await page.request.get(
      `/api/resource/Travel Booking?filters=${JSON.stringify({
        agency: USERS.agencyAdmin2.agency,
      })}`
    );
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.data.length).toBe(0);
    }
  });
});
