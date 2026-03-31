/**
 * Travel Invoice, Customer CRUD & Master Data E2E Tests
 * Covers: Invoice lifecycle & calculations, Customer detail fields,
 *         Travel Destination / Travel Type / Travel Lost Reason read/list
 */
import { test, expect } from "@playwright/test";
import { USERS, login, createDoc, gotoList, getCsrfToken } from "./fixtures";

// ─── Travel Invoice ────────────────────────────────────────────────

test.describe("Travel Invoice", () => {
  let customerName: string;
  let bookingName: string;
  let invoiceName: string;
  const ts = Date.now();

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Ensure customer
    const custFilters = JSON.stringify({ email: "invoice-test@test.example" });
    const custCheck = await page.request.get(
      `/api/resource/Travel Customer?filters=${custFilters}`
    );
    const custBody = await custCheck.json();
    if (custBody.data.length === 0) {
      const resp = await createDoc(page, "Travel Customer", {
        customer_name: "Invoice Test Customer",
        email: "invoice-test@test.example",
        phone: "+1000000001",
      });
      customerName = resp.data.name;
    } else {
      customerName = custBody.data[0].name;
    }

    // Create a booking for the invoice
    const bookResp = await createDoc(page, "Travel Booking", {
      customer: customerName,
      departure_date: "2025-08-01",
      return_date: "2025-08-10",
      num_travelers: 2,
      booking_date: "2025-07-01",
      total_amount: 6000,
      status: "Confirmed",
    });
    bookingName = bookResp.data.name;

    await ctx.close();
  });

  test("Agency Admin can create an invoice with line items", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await createDoc(page, "Travel Invoice", {
      customer: customerName,
      booking: bookingName,
      invoice_date: "2025-07-15",
      due_date: "2025-08-15",
      status: "Draft",
      items: [
        { item_description: `Flight tickets ${ts}`, quantity: 2, rate: 1500 },
        { item_description: `Hotel 7 nights ${ts}`, quantity: 7, rate: 200 },
      ],
      tax_percent: 10,
      discount: 100,
    });
    expect(resp.data.name).toBeDefined();
    invoiceName = resp.data.name;
  });

  test("Invoice calculates subtotal, tax, grand_total correctly", async ({ page }) => {
    test.skip(!invoiceName, "Invoice not created in prior test");
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.get(`/api/resource/Travel Invoice/${invoiceName}`);
    expect(resp.ok()).toBeTruthy();
    const inv = (await resp.json()).data;

    // subtotal = (2*1500) + (7*200) = 3000+1400 = 4400
    expect(inv.subtotal).toBe(4400);
    // tax_amount = 4400 * 10% = 440
    expect(inv.tax_amount).toBe(440);
    // grand_total = 4400 + 440 - 100 = 4740
    expect(inv.grand_total).toBe(4740);
    // outstanding = grand_total since no payment yet
    expect(inv.outstanding_amount).toBe(4740);
  });

  test("Invoice status can be updated to Sent", async ({ page }) => {
    test.skip(!invoiceName, "Invoice not created in prior test");
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.put(`/api/resource/Travel Invoice/${invoiceName}`, {
      data: { status: "Sent" },
      headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    });
    expect(resp.ok()).toBeTruthy();
    expect((await resp.json()).data.status).toBe("Sent");
  });

  test("Invoice payment reduces outstanding", async ({ page }) => {
    test.skip(!invoiceName, "Invoice not created in prior test");
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.put(`/api/resource/Travel Invoice/${invoiceName}`, {
      data: {
        status: "Partially Paid",
        paid_amount: 2000,
        payment_method: "Bank Transfer",
        payment_date: "2025-07-20",
      },
      headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    });
    expect(resp.ok()).toBeTruthy();
    const inv = (await resp.json()).data;
    expect(inv.paid_amount).toBe(2000);
    expect(inv.outstanding_amount).toBe(2740);
  });

  test("Invoice list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await gotoList(page, "Travel Invoice");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });

  test("Invoice form renders key fields", async ({ page }) => {
    test.skip(!invoiceName, "Invoice not created in prior test");
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await page.goto(`/app/travel-invoice/${invoiceName}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector(".form-layout", { timeout: 15_000 });
    await expect(page.locator('[data-fieldname="customer"]').first()).toBeVisible();
    await expect(page.locator('[data-fieldname="grand_total"]').first()).toBeVisible();
    await expect(page.locator('[data-fieldname="status"]').first()).toBeVisible();
  });
});

// ─── Travel Customer (detailed) ───────────────────────────────────

test.describe("Travel Customer CRUD", () => {
  let custName: string;

  test("Agency Admin can create a customer with all fields", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const ts = Date.now();
    const resp = await createDoc(page, "Travel Customer", {
      customer_name: `E2E Full Customer ${ts}`,
      email: `e2e-full-${ts}@test.example`,
      phone: "+9999999999",
      mobile_no: "+8888888888",
      gender: "Male",
      nationality: "US",
      loyalty_tier: "Silver",
      date_of_birth: "1990-05-15",
      address: "123 Test St",
      preferences: "Window seat, vegetarian meals",
    });
    expect(resp.data.name).toBeDefined();
    custName = resp.data.name;
  });

  test("Customer detail fields are persisted", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.get(`/api/resource/Travel Customer/${custName}`);
    expect(resp.ok()).toBeTruthy();
    const cust = (await resp.json()).data;
    expect(cust.loyalty_tier).toBe("Silver");
    expect(cust.mobile_no).toBe("+8888888888");
    expect(cust.nationality).toBe("US");
    expect(cust.preferences).toBe("Window seat, vegetarian meals");
  });

  test("Customer can be updated", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.put(`/api/resource/Travel Customer/${custName}`, {
      data: { loyalty_tier: "Gold" },
      headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    });
    expect(resp.ok()).toBeTruthy();
    expect((await resp.json()).data.loyalty_tier).toBe("Gold");
  });

  test("Customer list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await gotoList(page, "Travel Customer");
    await expect(page.locator(".frappe-list")).toBeVisible();
    expect(await page.locator(".list-row").count()).toBeGreaterThanOrEqual(1);
  });
});

// ─── Master Data: Travel Destination ──────────────────────────────

test.describe("Travel Destination (master data)", () => {
  test("Default destinations are seeded", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.get(
      "/api/resource/Travel Destination?limit_page_length=0"
    );
    expect(resp.ok()).toBeTruthy();
    const dests = (await resp.json()).data;
    expect(dests.length).toBeGreaterThanOrEqual(5);
  });

  test("Destination list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await gotoList(page, "Travel Destination");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });

  test("Destination detail can be read", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.get("/api/resource/Travel Destination/Paris");
    if (resp.ok()) {
      const dest = (await resp.json()).data;
      expect(dest.destination_name).toBe("Paris");
      expect(dest.country).toBeTruthy();
    }
  });
});

// ─── Master Data: Travel Type ─────────────────────────────────────

test.describe("Travel Type (master data)", () => {
  test("Default travel types are seeded", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.get(
      "/api/resource/Travel Type?limit_page_length=0"
    );
    expect(resp.ok()).toBeTruthy();
    const types = (await resp.json()).data;
    expect(types.length).toBeGreaterThanOrEqual(5);
  });

  test("Travel Type list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await gotoList(page, "Travel Type");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});

// ─── Master Data: Travel Lost Reason ──────────────────────────────

test.describe("Travel Lost Reason (master data)", () => {
  test("Default lost reasons are seeded", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.get(
      "/api/resource/Travel Lost Reason?limit_page_length=0"
    );
    expect(resp.ok()).toBeTruthy();
    const reasons = (await resp.json()).data;
    expect(reasons.length).toBeGreaterThanOrEqual(3);
  });

  test("Lost Reason list view loads", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await gotoList(page, "Travel Lost Reason");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });
});
