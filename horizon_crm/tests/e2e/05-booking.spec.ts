/**
 * Travel Booking Workflow E2E Tests
 * Covers: create booking, status updates, payment tracking, balance calculation
 *
 * Uses separate bookings for read-only tests vs. workflow mutation tests
 * to avoid cross-test state dependency issues.
 */
import { test, expect } from "@playwright/test";
import { USERS, login, createDoc, gotoList, getCsrfToken } from "./fixtures";

test.describe("Booking Workflow", () => {
  let customerName: string;
  /** Booking used for status-transition / mutation tests */
  let workflowBookingName: string;
  /** Booking used for read-only assertions */
  let readOnlyBookingName: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Arrange — ensure test customer exists
    const custFilters = JSON.stringify({ email: "booking-test@test.example" });
    const custCheck = await page.request.get(
      `/api/resource/Travel Customer?filters=${custFilters}`
    );
    const custBody = await custCheck.json();
    if (custBody.data.length === 0) {
      const resp = await createDoc(page, "Travel Customer", {
        customer_name: "Booking Test Customer",
        email: "booking-test@test.example",
        phone: "+2222222222",
      });
      customerName = resp.data.name;
    } else {
      customerName = custBody.data[0].name;
    }

    // Create booking for workflow/mutation tests
    const wfResp = await createDoc(page, "Travel Booking", {
      customer: customerName,
      departure_date: "2025-07-01",
      return_date: "2025-07-14",
      num_travelers: 2,
      booking_date: "2025-05-01",
      total_amount: 10000,
      status: "Confirmed",
    });
    workflowBookingName = wfResp.data.name;

    // Create booking for read-only tests
    const roResp = await createDoc(page, "Travel Booking", {
      customer: customerName,
      departure_date: "2025-08-01",
      return_date: "2025-08-10",
      num_travelers: 1,
      booking_date: "2025-05-15",
      total_amount: 5000,
      status: "Confirmed",
    });
    readOnlyBookingName = roResp.data.name;

    await ctx.close();
  });

  test("Agency Admin can view booking list", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await gotoList(page, "Travel Booking");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });

  test("Booking has correct initial status", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Navigate to the booking form to show it in the video
    await page.goto(`/app/travel-booking/${readOnlyBookingName}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".form-layout", { timeout: 15_000 });
    await expect(page.locator('[data-fieldname="status"]').first()).toBeVisible();

    const resp = await page.request.get(`/api/resource/Travel Booking/${readOnlyBookingName}`);
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.data.status).toBe("Confirmed");
  });

  test("Booking status can be updated to In Progress", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.put(
      `/api/resource/Travel Booking/${workflowBookingName}`,
      { data: { status: "In Progress" }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.data.status).toBe("In Progress");

    // Show the updated booking in the form
    await page.goto(`/app/travel-booking/${workflowBookingName}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".form-layout", { timeout: 15_000 });
  });

  test("Payment child table updates balance", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.put(
      `/api/resource/Travel Booking/${workflowBookingName}`,
      {
        data: {
          payments: [
            {
              payment_date: "2025-05-15",
              amount: 3000,
              payment_method: "Bank Transfer",
              status: "Received",
              reference: "PAY-001",
            },
          ],
        },
        headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
      }
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.data.paid_amount).toBe(3000);
    expect(body.data.balance_amount).toBe(7000);

    // Show the booking form with payment details
    await page.goto(`/app/travel-booking/${workflowBookingName}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".form-layout", { timeout: 15_000 });
    await expect(page.locator('[data-fieldname="paid_amount"]').first()).toBeVisible();
  });

  test("Booking summary API returns valid data", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Show the booking list before checking summary
    await gotoList(page, "Travel Booking");
    await expect(page.locator(".frappe-list")).toBeVisible();

    const resp = await page.request.get(
      "/api/method/horizon_crm.api.booking.get_booking_summary"
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.message).toBeDefined();
  });

  test("Booking form renders key fields", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await page.goto(`/app/travel-booking/${readOnlyBookingName}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator('[data-fieldname="customer"]').first()).toBeVisible();
    await expect(page.locator('[data-fieldname="total_amount"]').first()).toBeVisible();
    await expect(page.locator('[data-fieldname="status"]').first()).toBeVisible();
  });

  test("Booking status transitions through full lifecycle", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const statuses = ["In Progress", "Completed"];
    for (const status of statuses) {
      const resp = await page.request.put(
        `/api/resource/Travel Booking/${workflowBookingName}`,
        { data: { status }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
      );
      expect(resp.ok()).toBeTruthy();
      const body = await resp.json();
      expect(body.data.status).toBe(status);

      // Navigate to form after each transition to show status in video
      await page.goto(`/app/travel-booking/${workflowBookingName}`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".form-layout", { timeout: 15_000 });
    }
  });
});
