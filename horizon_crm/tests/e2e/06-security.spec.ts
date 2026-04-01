/**
 * Security E2E Tests
 * Covers: role-based access control, CSRF protection, XSS prevention, SQL injection
 */
import { test, expect } from "@playwright/test";
import { USERS, login, createDoc, getCsrfToken } from "./fixtures";

test.describe("Security", () => {
  test("Customer cannot access admin resources", async ({ page }) => {
    // Arrange — login as customer
    await login(page, USERS.customer.email, USERS.customer.password);

    // Act — try to navigate to Travel Agency settings
    await page.goto("/app/travel-agency", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Assert — should be forbidden via API
    const resp = await page.request.get("/api/resource/Travel Agency/Travel Agency");
    expect([403, 404]).toContain(resp.status());
  });

  test("Customer cannot create staff records", async ({ page }) => {
    // Arrange — login as customer
    await login(page, USERS.customer.email, USERS.customer.password);

    // Act — try to navigate to staff creation page
    await page.goto("/app/travel-agency-staff/new", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Assert — should be forbidden via API
    const resp = await page.request.post("/api/resource/Travel Agency Staff", {
      data: {
        staff_user: "hack@test.example",
        role_in_agency: "Staff",
        is_active: 1,
      },
      headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    });
    expect([403, 401]).toContain(resp.status());
  });

  test("CSRF token is required for write operations", async ({ page }) => {
    // Arrange — login and show the desk
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".navbar")).toBeVisible();

    // Act — send POST with invalid CSRF token
    const resp = await page.request.fetch("/api/resource/Travel Customer", {
      method: "POST",
      headers: { "X-Frappe-CSRF-Token": "invalid-token" },
      data: JSON.stringify({ customer_name: "CSRF Test" }),
    });

    // Assert — should fail
    expect([400, 403, 417]).toContain(resp.status());
  });

  test("XSS payload in field is escaped", async ({ page }) => {
    // Arrange — login
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const xssPayload = '<script>alert("xss")</script>';

    // Act — create customer with XSS payload
    const resp = await page.request.post("/api/resource/Travel Customer", {
      data: {
        customer_name: xssPayload,
        email: `xss-${Date.now()}@test.example`,
        phone: "+0000000000",
      },
      headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    });

    // Assert — name should be sanitized
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.data.customer_name).not.toContain("<script>");

      // Navigate to the created customer to show it in video
      await page.goto(`/app/travel-customer/${body.data.name}`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".form-layout", { timeout: 15_000 });
      await page.waitForTimeout(1000);

      // Cleanup
      await page.request.delete(
        `/api/resource/Travel Customer/${body.data.name}`,
        { headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
      );
    }
  });

  test("SQL injection in filters returns error or empty", async ({ page }) => {
    // Arrange — login and show customer list
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await page.goto("/app/travel-customer", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".frappe-list", { timeout: 15_000 });

    // Act — send malicious filter
    const maliciousFilter = JSON.stringify({
      customer_name: ["like", "%; DROP TABLE tabTravel Customer;--"],
    });
    const resp = await page.request.get(
      `/api/resource/Travel Customer?filters=${maliciousFilter}`
    );

    // Assert — should either fail or return empty
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.data.length).toBe(0);
    }
  });
});
