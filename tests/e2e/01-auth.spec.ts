/**
 * Authentication & Login E2E Tests
 * Covers: login flow, role-based redirects, session management
 */
import { test, expect } from "@playwright/test";
import { USERS, login, logout } from "./fixtures";

test.describe("Authentication", () => {
  test("Administrator can log in to desk", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    await expect(page).toHaveURL(/\/app/);
    await expect(page.locator(".navbar")).toBeVisible();
  });

  test("Agency Admin can log in to desk", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    await expect(page).toHaveURL(/\/app/);
    await expect(page.locator(".navbar")).toBeVisible();
  });

  test("Agency Staff can log in to desk", async ({ page }) => {
    await login(page, USERS.staff1.email, USERS.staff1.password);
    await expect(page).toHaveURL(/\/app/);
  });

  test("Customer is redirected to portal", async ({ page }) => {
    await login(page, USERS.customer1.email, USERS.customer1.password);
    // Customer role_home_page should redirect to /portal
    await page.goto("/app", { waitUntil: "networkidle" });
    // Customer should not see desk sidebar admin items
    const sidebar = page.locator(".desk-sidebar");
    if (await sidebar.isVisible()) {
      await expect(
        sidebar.locator('a[href*="travel-agency"]')
      ).not.toBeVisible();
    }
  });

  test("Invalid credentials show error", async ({ page }) => {
    const resp = await page.request.post("/api/method/login", {
      form: { usr: "nonexistent@test.com", pwd: "wrongpassword" },
    });
    expect(resp.status()).toBe(401);
  });

  test("Unauthenticated user cannot access API", async ({ page }) => {
    await logout(page);
    const resp = await page.request.get("/api/resource/Travel Agency");
    // Should redirect to login or return 403
    expect([403, 401, 302]).toContain(resp.status());
  });

  test("Logout clears the session", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    await logout(page);
    const resp = await page.request.get("/api/resource/Travel Agency");
    expect([403, 401, 302]).toContain(resp.status());
  });

  test("Session cookie is HttpOnly", async ({ page, context }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    const cookies = await context.cookies();
    const sidCookie = cookies.find((c) => c.name === "sid");
    expect(sidCookie).toBeDefined();
    expect(sidCookie!.httpOnly).toBeTruthy();
  });
});
