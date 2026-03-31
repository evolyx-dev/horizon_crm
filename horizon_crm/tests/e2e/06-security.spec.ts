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

    // Act — try to access Travel Agency settings
    const resp = await page.request.get("/api/resource/Travel Agency/Travel Agency");

    // Assert — should be forbidden
    expect([403, 404]).toContain(resp.status());
  });

  test("Customer cannot create staff records", async ({ page }) => {
    // Arrange — login as customer
    await login(page, USERS.customer.email, USERS.customer.password);

    // Act — try to create a staff record
    const resp = await page.request.post("/api/resource/Travel Agency Staff", {
      data: {
        staff_user: "hack@test.example",
        role_in_agency: "Staff",
        is_active: 1,
      },
      headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    });

    // Assert — should be forbidden (customer has no create permission on staff)
    expect([403, 401]).toContain(resp.status());
  });

  test("CSRF token is required for write operations", async ({ page }) => {
    // Arrange — login
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

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

      // Cleanup
      await page.request.delete(
        `/api/resource/Travel Customer/${body.data.name}`,
        { headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
      );
    }
  });

  test("SQL injection in filters returns error or empty", async ({ page }) => {
    // Arrange — login
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

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
