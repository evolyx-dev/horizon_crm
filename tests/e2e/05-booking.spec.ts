/**
 * Travel Booking Workflow E2E Tests
 * Covers: create booking, status updates, payment tracking, balance calculation
 */
import { test, expect } from "@playwright/test";
import { USERS, login, createDoc, gotoList, getCsrfToken } from "./fixtures";

test.describe("Booking Workflow", () => {
  let customerName: string;
  let bookingName: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);

    // Ensure test customer exists
    const custFilters = JSON.stringify({
      email: "booking-test@test.example",
      agency: USERS.agencyAdmin1.agency,
    });
    const custCheck = await page.request.get(
      `/api/resource/Travel Customer?filters=${custFilters}`
    );
    const custBody = await custCheck.json();
    if (custBody.data.length === 0) {
      const resp = await createDoc(page, "Travel Customer", {
        customer_name: "Booking Test Customer",
        email: "booking-test@test.example",
        phone: "+2222222222",
        agency: USERS.agencyAdmin1.agency,
      });
      customerName = resp.data.name;
    } else {
      customerName = custBody.data[0].name;
    }

    // Create a booking
    const bResp = await createDoc(page, "Travel Booking", {
      customer: customerName,
      agency: USERS.agencyAdmin1.agency,
      departure_date: "2025-07-01",
      return_date: "2025-07-14",
      num_travelers: 2,
      booking_date: "2025-05-01",
      total_amount: 10000,
      status: "Confirmed",
    });
    bookingName = bResp.data.name;
    await ctx.close();
  });

  test("Agency Admin can view booking list", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    await gotoList(page, "Travel Booking");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });

  test("Booking has correct initial status", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    const resp = await page.request.get(
      `/api/resource/Travel Booking/${bookingName}`
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.data.status).toBe("Confirmed");
  });

  test("Booking status can be updated to In Progress", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    const resp = await page.request.put(
      `/api/resource/Travel Booking/${bookingName}`,
      { data: { status: "In Progress" }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.data.status).toBe("In Progress");
  });

  test("Payment child table updates balance", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);

    // Add a payment via API
    const resp = await page.request.put(
      `/api/resource/Travel Booking/${bookingName}`,
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
    // paid_amount should be 3000, balance should be 7000
    expect(body.data.paid_amount).toBe(3000);
    expect(body.data.balance_amount).toBe(7000);
  });

  test("Booking summary API returns valid data", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    const resp = await page.request.get(
      `/api/method/horizon_crm.api.booking.get_booking_summary?agency=${encodeURIComponent(USERS.agencyAdmin1.agency)}`
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.message).toBeDefined();
  });

  test("Agency2 cannot see Agency1 bookings", async ({ page }) => {
    await login(page, USERS.agencyAdmin2.email, USERS.agencyAdmin2.password);
    const resp = await page.request.get(
      `/api/resource/Travel Booking/${bookingName}`
    );
    expect([403, 404]).toContain(resp.status());
  });

  test("Booking form renders key fields", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    await page.goto(`/app/travel-booking/${bookingName}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.locator('[data-fieldname="customer"]').first()
    ).toBeVisible();
    await expect(
      page.locator('[data-fieldname="total_amount"]').first()
    ).toBeVisible();
    await expect(
      page.locator('[data-fieldname="status"]').first()
    ).toBeVisible();
  });

  test("Booking status transitions through full lifecycle", async ({
    page,
  }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);

    const statuses = ["In Progress", "Completed"];
    for (const status of statuses) {
      const resp = await page.request.put(
        `/api/resource/Travel Booking/${bookingName}`,
        { data: { status }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
      );
      expect(resp.ok()).toBeTruthy();
      const body = await resp.json();
      expect(body.data.status).toBe(status);
    }
  });
});
