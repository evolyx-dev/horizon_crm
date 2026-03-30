/**
 * Data Isolation & Security E2E Tests
 * Covers: cross-agency data leakage, permission boundaries, CSRF, XSS prevention
 */
import { test, expect } from "@playwright/test";
import { USERS, login, createDoc, logout } from "./fixtures";

test.describe("Data Isolation", () => {
  let agency1Customer: string;
  let agency1Inquiry: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);

    // Create Agency1-specific customer
    const custFilters = JSON.stringify({
      email: "isolation-cust@test.example",
      agency: USERS.agencyAdmin1.agency,
    });
    const check = await page.request.get(
      `/api/resource/Travel Customer?filters=${custFilters}`
    );
    const body = await check.json();
    if (body.data.length === 0) {
      const resp = await createDoc(page, "Travel Customer", {
        customer_name: "Isolation Test Customer",
        email: "isolation-cust@test.example",
        phone: "+3333333333",
        agency: USERS.agencyAdmin1.agency,
      });
      agency1Customer = resp.data.name;
    } else {
      agency1Customer = body.data[0].name;
    }

    // Create Agency1-specific inquiry
    const iqResp = await createDoc(page, "Travel Inquiry", {
      customer: agency1Customer,
      agency: USERS.agencyAdmin1.agency,
      travel_type: "Adventure",
      destination: "Tokyo",
      departure_date: "2025-08-01",
      return_date: "2025-08-10",
      number_of_travelers: 1,
      budget: 3000,
      status: "New",
      source: "Phone",
    });
    agency1Inquiry = iqResp.data.name;
    await ctx.close();
  });

  test("Agency2 Admin cannot read Agency1 customers", async ({ page }) => {
    await login(page, USERS.agencyAdmin2.email, USERS.agencyAdmin2.password);
    const resp = await page.request.get(
      `/api/resource/Travel Customer/${agency1Customer}`
    );
    expect([403, 404]).toContain(resp.status());
  });

  test("Agency2 Admin cannot list Agency1 customers", async ({ page }) => {
    await login(page, USERS.agencyAdmin2.email, USERS.agencyAdmin2.password);
    const filters = JSON.stringify({
      agency: USERS.agencyAdmin1.agency,
    });
    const resp = await page.request.get(
      `/api/resource/Travel Customer?filters=${filters}`
    );
    const body = await resp.json();
    if (resp.ok()) {
      expect(body.data.length).toBe(0);
    }
  });

  test("Agency2 Admin cannot read Agency1 inquiries", async ({ page }) => {
    await login(page, USERS.agencyAdmin2.email, USERS.agencyAdmin2.password);
    const resp = await page.request.get(
      `/api/resource/Travel Inquiry/${agency1Inquiry}`
    );
    expect([403, 404]).toContain(resp.status());
  });

  test("Agency2 Admin cannot modify Agency1 data", async ({ page }) => {
    await login(page, USERS.agencyAdmin2.email, USERS.agencyAdmin2.password);
    const resp = await page.request.put(
      `/api/resource/Travel Customer/${agency1Customer}`,
      { data: { customer_name: "Hacked Name" } }
    );
    expect([403, 404]).toContain(resp.status());
  });

  test("Agency2 Admin cannot delete Agency1 data", async ({ page }) => {
    await login(page, USERS.agencyAdmin2.email, USERS.agencyAdmin2.password);
    const resp = await page.request.delete(
      `/api/resource/Travel Customer/${agency1Customer}`
    );
    expect([403, 404]).toContain(resp.status());
  });

  test("Staff cannot access data from other agencies", async ({ page }) => {
    await login(page, USERS.staff1.email, USERS.staff1.password);

    // Staff1 is in Agency1, should NOT see Agency2 data
    const filters = JSON.stringify({
      agency: USERS.agencyAdmin2.agency,
    });
    const resp = await page.request.get(
      `/api/resource/Travel Customer?filters=${filters}`
    );
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.data.length).toBe(0);
    }
  });

  test("Cannot inject agency filter via API parameter", async ({ page }) => {
    await login(page, USERS.agencyAdmin2.email, USERS.agencyAdmin2.password);

    // Try to force-filter for Agency1 data
    const filters = JSON.stringify({
      agency: USERS.agencyAdmin1.agency,
    });
    const resp = await page.request.get(
      `/api/resource/Travel Inquiry?filters=${filters}`
    );
    if (resp.ok()) {
      const body = await resp.json();
      // Should still get 0 results due to permission_query_conditions
      expect(body.data.length).toBe(0);
    }
  });

  test("CSRF token is required for write operations", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);

    // Frappe requires X-Frappe-CSRF-Token header for POST requests
    // A raw fetch without proper cookies/token should fail
    const resp = await page.request.fetch("/api/resource/Travel Customer", {
      method: "POST",
      headers: { "X-Frappe-CSRF-Token": "invalid-token" },
      data: JSON.stringify({ customer_name: "CSRF Test" }),
    });
    // Should fail with 400 or 403
    expect([400, 403, 417]).toContain(resp.status());
  });

  test("XSS payload in field is escaped", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);

    const xssPayload = '<script>alert("xss")</script>';
    // Try to create a customer with XSS in name — Frappe should sanitize
    const resp = await page.request.post("/api/resource/Travel Customer", {
      data: {
        customer_name: xssPayload,
        email: "xss-test@test.example",
        phone: "+0000000000",
        agency: USERS.agencyAdmin1.agency,
      },
    });

    if (resp.ok()) {
      const body = await resp.json();
      // Name should be sanitized — no raw script tags
      expect(body.data.customer_name).not.toContain("<script>");

      // Cleanup
      await page.request.delete(
        `/api/resource/Travel Customer/${body.data.name}`
      );
    }
  });

  test("SQL injection in filters returns error or empty", async ({
    page,
  }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);

    const maliciousFilter = JSON.stringify({
      agency: ["like", "%; DROP TABLE tabTravel Agency;--"],
    });
    const resp = await page.request.get(
      `/api/resource/Travel Customer?filters=${maliciousFilter}`
    );
    // Should either fail or return empty — NOT execute SQL
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.data.length).toBe(0);
    }
  });
});
