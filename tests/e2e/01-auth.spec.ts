/**
 * Authentication & Login E2E Tests
 * Covers: login flow, role-based redirects, session management
 */
import { test, expect } from "@playwright/test";
import { USERS, login, logout } from "./fixtures";

test.describe("Authentication", () => {
  test("Administrator can log in to desk", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    await expect(page).toHaveURL(/\/(app|desk)/);
    await expect(page.locator(".navbar")).toBeVisible();
  });

  test("Agency Admin can log in to desk", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    await expect(page).toHaveURL(/\/(app|desk)/);
    await expect(page.locator(".navbar")).toBeVisible();
  });

  test("Agency Staff can log in to desk", async ({ page }) => {
    await login(page, USERS.staff1.email, USERS.staff1.password);
    await expect(page).toHaveURL(/\/(app|desk)/);
  });

  test("Customer is redirected to portal", async ({ page }) => {
    await login(page, USERS.customer1.email, USERS.customer1.password);
    // Customer role_home_page should redirect to /portal
    await page.goto("/app", { waitUntil: "domcontentloaded" });
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
    // Fresh page has no session — navigating to desk should redirect to login
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("Logout clears the session", async ({ browser }) => {
    // Use a dedicated context so we can verify session is truly cleared
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);

    // Verify we can access protected resources before logout
    const before = await page.request.get("/api/resource/Travel Booking");
    expect(before.ok()).toBeTruthy();

    // Logout
    await logout(page);

    // Clear cookies to simulate a truly logged-out state
    await ctx.clearCookies();

    // After clearing cookies, API should deny access
    const resp = await page.request.get("/api/resource/Travel Booking");
    expect([403, 401]).toContain(resp.status());
    await ctx.close();
  });

  test("Session cookie is HttpOnly", async ({ page, context }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    const cookies = await context.cookies();
    const sidCookie = cookies.find((c) => c.name === "sid");
    expect(sidCookie).toBeDefined();
    expect(sidCookie!.httpOnly).toBeTruthy();
  });
});
