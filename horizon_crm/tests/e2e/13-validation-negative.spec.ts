/**
 * Validation & Negative Scenario E2E Tests
 *
 * Covers worst-case / error-path scenarios:
 * - Required field enforcement (server-side)
 * - Controller validation logic
 * - Invalid states, numeric bounds
 * - Permission denials & cross-customer access
 * - API error handling
 * - Invoice calculator edge cases
 * - Portal error paths
 */
import { test, expect } from "@playwright/test";
import { USERS, login, createDoc, getCsrfToken } from "./fixtures";

const ts = Date.now();

// ─── Travel Lead Validation ──────────────────────────────────────

test.describe("Travel Lead — negative cases", () => {
  test("Lead without any contact method is rejected", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Navigate to lead creation form to show in video
    await page.goto("/app/travel-lead/new", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".form-layout", { timeout: 15_000 });

    const resp = await page.request.post("/api/resource/Travel Lead", {
      data: { lead_name: "No Contact Lead", status: "New" },
      headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    });
    expect(resp.ok()).toBeFalsy();
    const body = await resp.text();
    expect(body.toLowerCase()).toContain("contact");
  });

  test("Lead with only email is accepted", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.post("/api/resource/Travel Lead", {
      data: {
        lead_name: `Email Only Lead-${ts}`,
        email: `emailonly-${ts}@test.example`,
        status: "New",
      },
      headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    });
    expect(resp.ok()).toBeTruthy();
    const name = (await resp.json()).data.name;
    await page.request.delete(`/api/resource/Travel Lead/${name}`, {
      headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    });
  });

  test("Lead with only phone is accepted", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.post("/api/resource/Travel Lead", {
      data: {
        lead_name: `Phone Only Lead-${ts}`,
        phone: "+5551234567",
        status: "New",
      },
      headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    });
    expect(resp.ok()).toBeTruthy();
    const name = (await resp.json()).data.name;
    await page.request.delete(`/api/resource/Travel Lead/${name}`, {
      headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    });
  });
});

// ─── Inquiry API — negative cases ────────────────────────────────

test.describe("Inquiry API — negative cases", () => {
  let customerName: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const f = JSON.stringify({ email: "inquiry-test@test.example" });
    const r = await page.request.get(`/api/resource/Travel Customer?filters=${f}`);
    const body = await r.json();
    if (body.data.length > 0) {
      customerName = body.data[0].name;
    } else {
      const c = await createDoc(page, "Travel Customer", {
        customer_name: "Inquiry Test Customer",
        email: "inquiry-test@test.example",
        phone: "+1111111111",
      });
      customerName = c.data.name;
    }
    await ctx.close();
  });

  test("Converting a non-Won inquiry is rejected", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const inq = await createDoc(page, "Travel Inquiry", {
      customer: customerName,
      customer_name: "Inquiry Test Customer",
      customer_email: "inquiry-test@test.example",
      destination: "Rome",
      departure_date: "2025-08-01",
      return_date: "2025-08-10",
      num_travelers: 1,
      status: "New",
      source: "Website",
    });

    // Navigate to the inquiry form to show its New status
    await page.goto(`/app/travel-inquiry/${inq.data.name}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".form-layout", { timeout: 15_000 });

    const resp = await page.request.post(
      "/api/method/horizon_crm.api.inquiry.create_booking_from_inquiry",
      {
        data: { source_name: inq.data.name },
        headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
      }
    );
    expect(resp.ok()).toBeFalsy();
    const body = await resp.text();
    expect(body).toContain("Won");
  });

  test("Converting same inquiry twice is rejected", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const inq = await createDoc(page, "Travel Inquiry", {
      customer: customerName,
      customer_name: "Inquiry Test Customer",
      customer_email: "inquiry-test@test.example",
      destination: "London",
      departure_date: "2025-09-01",
      return_date: "2025-09-10",
      num_travelers: 1,
      status: "Won",
      source: "Phone",
    });

    const first = await page.request.post(
      "/api/method/horizon_crm.api.inquiry.create_booking_from_inquiry",
      {
        data: { source_name: inq.data.name },
        headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
      }
    );
    expect(first.ok()).toBeTruthy();

    const second = await page.request.post(
      "/api/method/horizon_crm.api.inquiry.create_booking_from_inquiry",
      {
        data: { source_name: inq.data.name },
        headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
      }
    );
    expect(second.ok()).toBeFalsy();
    const body = await second.text();
    expect(body.toLowerCase()).toContain("already exists");
  });

  test("Converting non-existent inquiry returns error", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.post(
      "/api/method/horizon_crm.api.inquiry.create_booking_from_inquiry",
      {
        data: { source_name: "INQ-NONEXISTENT-99999" },
        headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
      }
    );
    expect(resp.ok()).toBeFalsy();
  });
});

// ─── Invoice Calculation Edge Cases ──────────────────────────────

test.describe("Invoice — calculation edge cases", () => {
  let customerName: string;
  let bookingName: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    const f = JSON.stringify({ email: "invoice-test@test.example" });
    const r = await page.request.get(`/api/resource/Travel Customer?filters=${f}`);
    const body = await r.json();
    if (body.data.length === 0) {
      const c = await createDoc(page, "Travel Customer", {
        customer_name: "Invoice Test Customer",
        email: "invoice-test@test.example",
        phone: "+1000000001",
      });
      customerName = c.data.name;
    } else {
      customerName = body.data[0].name;
    }

    const b = await createDoc(page, "Travel Booking", {
      customer: customerName,
      departure_date: "2025-10-01",
      return_date: "2025-10-10",
      num_travelers: 1,
      booking_date: "2025-09-01",
      total_amount: 5000,
      status: "Confirmed",
    });
    bookingName = b.data.name;
    await ctx.close();
  });

  test("Invoice with zero-quantity item calculates correctly", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Travel Invoice", {
      customer: customerName,
      booking: bookingName,
      invoice_date: "2025-09-15",
      due_date: "2025-10-15",
      status: "Draft",
      items: [
        { item_description: `Zero qty ${ts}-a`, quantity: 0, rate: 500 },
        { item_description: `Normal ${ts}-a`, quantity: 2, rate: 100 },
      ],
      tax_percent: 10,
      discount: 0,
    });
    expect(resp.data.subtotal).toBe(200);
    expect(resp.data.grand_total).toBe(220);

    // Navigate to the invoice to show calculations in video
    await page.goto(`/app/travel-invoice/${resp.data.name}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".form-layout", { timeout: 15_000 });
  });

  test("Invoice with 100% tax doubles the total", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Travel Invoice", {
      customer: customerName,
      booking: bookingName,
      invoice_date: "2025-09-15",
      due_date: "2025-10-15",
      status: "Draft",
      items: [
        { item_description: `FullTax ${ts}-b`, quantity: 1, rate: 1000 },
      ],
      tax_percent: 100,
      discount: 0,
    });
    expect(resp.data.subtotal).toBe(1000);
    expect(resp.data.tax_amount).toBe(1000);
    expect(resp.data.grand_total).toBe(2000);
  });

  test("Invoice with discount > subtotal gives negative grand total", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Travel Invoice", {
      customer: customerName,
      booking: bookingName,
      invoice_date: "2025-09-15",
      due_date: "2025-10-15",
      status: "Draft",
      items: [
        { item_description: `BigDisc ${ts}-c`, quantity: 1, rate: 100 },
      ],
      tax_percent: 0,
      discount: 200,
    });
    expect(resp.data.grand_total).toBe(-100);
  });

  test("Invoice overpayment results in negative outstanding", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Travel Invoice", {
      customer: customerName,
      booking: bookingName,
      invoice_date: "2025-09-15",
      due_date: "2025-10-15",
      status: "Paid",
      items: [
        { item_description: `Overpay ${ts}-d`, quantity: 1, rate: 500 },
      ],
      tax_percent: 0,
      discount: 0,
      paid_amount: 1000,
    });
    expect(resp.data.outstanding_amount).toBe(-500);
  });
});

// ─── Booking Validation ──────────────────────────────────────────

test.describe("Booking — payment calculation cases", () => {
  let customerName: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const f = JSON.stringify({ email: "booking-test@test.example" });
    const r = await page.request.get(`/api/resource/Travel Customer?filters=${f}`);
    const body = await r.json();
    if (body.data.length === 0) {
      const c = await createDoc(page, "Travel Customer", {
        customer_name: "Booking Test Customer",
        email: "booking-test@test.example",
        phone: "+2222222222",
      });
      customerName = c.data.name;
    } else {
      customerName = body.data[0].name;
    }
    await ctx.close();
  });

  test("Booking with Received payment calculates balance", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Travel Booking", {
      customer: customerName,
      departure_date: "2025-11-01",
      return_date: "2025-11-10",
      num_travelers: 2,
      booking_date: "2025-10-01",
      total_amount: 5000,
      status: "Confirmed",
      payments: [
        { payment_date: "2025-10-01", amount: 2000, status: "Received", payment_method: "Cash" },
      ],
    });
    expect(resp.data.paid_amount).toBe(2000);
    expect(resp.data.balance_amount).toBe(3000);

    // Navigate to the booking to show payment details in video
    await page.goto(`/app/travel-booking/${resp.data.name}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".form-layout", { timeout: 15_000 });
  });

  test("Booking with no payments has full balance", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Travel Booking", {
      customer: customerName,
      departure_date: "2025-12-01",
      return_date: "2025-12-10",
      num_travelers: 1,
      booking_date: "2025-11-01",
      total_amount: 3000,
      status: "Confirmed",
    });
    expect(resp.data.paid_amount).toBe(0);
    expect(resp.data.balance_amount).toBe(3000);
  });

  test("Pending payments not counted as paid", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Travel Booking", {
      customer: customerName,
      departure_date: "2026-01-01",
      return_date: "2026-01-10",
      num_travelers: 1,
      booking_date: "2025-12-01",
      total_amount: 4000,
      status: "Confirmed",
      payments: [
        { payment_date: "2025-12-01", amount: 1500, status: "Pending", payment_method: "Card" },
        { payment_date: "2025-12-05", amount: 1000, status: "Received", payment_method: "Cash" },
      ],
    });
    expect(resp.data.paid_amount).toBe(1000);
    expect(resp.data.balance_amount).toBe(3000);
  });

  test("Overpayment shows negative balance", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Travel Booking", {
      customer: customerName,
      departure_date: "2026-02-01",
      return_date: "2026-02-10",
      num_travelers: 1,
      booking_date: "2026-01-01",
      total_amount: 1000,
      status: "Confirmed",
      payments: [
        { payment_date: "2026-01-01", amount: 1500, status: "Received", payment_method: "Cash" },
      ],
    });
    expect(resp.data.paid_amount).toBe(1500);
    expect(resp.data.balance_amount).toBe(-500);
  });
});

// ─── Booking Summary API ─────────────────────────────────────────

test.describe("Booking Summary API — validation", () => {
  test("Summary returns expected numeric fields", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Show booking list in video before checking summary
    await page.goto("/app/travel-booking", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".frappe-list", { timeout: 15_000 });

    const resp = await page.request.get(
      "/api/method/horizon_crm.api.booking.get_booking_summary"
    );
    expect(resp.ok()).toBeTruthy();
    const s = (await resp.json()).message;
    expect(typeof s.total).toBe("number");
    expect(typeof s.confirmed).toBe("number");
    expect(typeof s.total_revenue).toBe("number");
    expect(s.total).toBeGreaterThanOrEqual(0);
  });

  test("Status counts sum to total", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.get(
      "/api/method/horizon_crm.api.booking.get_booking_summary"
    );
    expect(resp.ok()).toBeTruthy();
    const s = (await resp.json()).message;
    expect(s.confirmed + s.in_progress + s.completed + s.cancelled).toBe(s.total);
  });
});

// ─── Permission / RBAC Negative Cases ────────────────────────────

test.describe("Permission — RBAC negative cases", () => {
  test("Staff cannot delete a booking", async ({ browser }) => {
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await login(adminPage, USERS.admin.email, USERS.admin.password);

    const custResp = await adminPage.request.get(
      `/api/resource/Travel Customer?limit_page_length=1`
    );
    const custBody = await custResp.json();
    test.skip(custBody.data.length === 0, "No customer available");

    const booking = await createDoc(adminPage, "Travel Booking", {
      customer: custBody.data[0].name,
      departure_date: "2026-03-01",
      return_date: "2026-03-10",
      num_travelers: 1,
      booking_date: "2026-02-15",
      total_amount: 2000,
      status: "Confirmed",
    });

    const staffCtx = await browser.newContext();
    const staffPage = await staffCtx.newPage();
    await login(staffPage, USERS.staff.email, USERS.staff.password);

    const delResp = await staffPage.request.delete(
      `/api/resource/Travel Booking/${booking.data.name}`,
      { headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );
    const deleteStatus = delResp.status();
    const deleteBody = await delResp.text();
    expect(
      [400, 403, 404, 409],
      `Unexpected delete response ${deleteStatus}: ${deleteBody}`
    ).toContain(deleteStatus);

    await staffCtx.close();
    await adminCtx.close();
  });

  test("Guest cannot create booking via API", async ({ page }) => {
    // Navigate as guest (no login)
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });

    const resp = await page.request.post("/api/resource/Travel Booking", {
      data: {
        customer: "Hacker",
        departure_date: "2026-01-01",
        return_date: "2026-01-10",
        num_travelers: 1,
        booking_date: "2025-12-01",
        total_amount: 0,
        status: "Confirmed",
      },
    });
    expect([400, 401, 403]).toContain(resp.status());
  });

  test("Guest cannot write to inquiry", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    const custResp = await page.request.get(
      `/api/resource/Travel Customer?limit_page_length=1`
    );
    const custBody = await custResp.json();
    test.skip(custBody.data.length === 0, "No customer available");

    const inq = await createDoc(page, "Travel Inquiry", {
      customer: custBody.data[0].name,
      customer_name: "Test",
      customer_email: "test@test.example",
      destination: "Dubai",
      departure_date: "2026-06-01",
      return_date: "2026-06-10",
      num_travelers: 1,
      status: "New",
      source: "Website",
    });

    // Clear session to become guest
    await page.context().clearCookies();
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });

    const resp = await page.request.put(
      `/api/resource/Travel Inquiry/${inq.data.name}`,
      {
        data: { status: "Won" },
        headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
      }
    );
    expect([400, 403, 404, 409]).toContain(resp.status());
  });
});

// ─── Lead API — negative cases ───────────────────────────────────

test.describe("Lead API — negative cases", () => {
  test("Submit lead without name is rejected", async ({ page }) => {
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });
    const resp = await page.request.post(
      "/api/method/horizon_crm.api.portal.submit_lead",
      {
        data: {
          full_name: "",
          email: "noname@test.example",
          destination: "Tokyo",
        },
      }
    );
    expect(resp.ok()).toBeFalsy();
    const body = await resp.text();
    expect(body.toLowerCase()).toContain("name");
  });

  test("Submit lead without email is rejected", async ({ page }) => {
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });
    const resp = await page.request.post(
      "/api/method/horizon_crm.api.portal.submit_lead",
      {
        data: {
          full_name: "No Email Person",
          email: "",
          destination: "Dubai",
        },
      }
    );
    expect(resp.ok()).toBeFalsy();
    const body = await resp.text();
    expect(body.toLowerCase()).toContain("email");
  });

  test("Submit lead with invalid email is rejected", async ({ page }) => {
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });
    const resp = await page.request.post(
      "/api/method/horizon_crm.api.portal.submit_lead",
      {
        data: {
          full_name: "Bad Email Person",
          email: "not-valid-email",
          destination: "Rome",
        },
      }
    );
    expect(resp.ok()).toBeFalsy();
    const body = await resp.text();
    expect(body.toLowerCase()).toContain("email");
  });
});

// ─── Auth edge cases ─────────────────────────────────────────────

test.describe("Auth — edge cases", () => {
  test("Empty credentials return error", async ({ page }) => {
    // Show login page in video
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("#login_email", "");
    await page.fill("#login_password", "");
    await page.locator(".btn-login").click();
    await page.waitForTimeout(2000);

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("Wrong password returns error", async ({ page }) => {
    // Show login attempt in video
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("#login_email", USERS.agencyAdmin.email);
    await page.fill("#login_password", "WrongPassword123!");
    await page.locator(".btn-login").click();
    await page.waitForTimeout(2000);

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });
});
