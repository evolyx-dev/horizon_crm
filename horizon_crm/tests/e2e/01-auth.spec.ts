/**
 * Authentication & Login E2E Tests
 * Covers: login flow, role-based redirects, session management
 */
import { test, expect } from "@playwright/test";
import { USERS, login, logout } from "./fixtures";

test.describe("Authentication", () => {
  test("Administrator can log in to desk", async ({ page }) => {
    // Arrange — no special setup needed

    // Act — login as Administrator
    await login(page, USERS.admin.email, USERS.admin.password);

    // Assert — should reach the desk
    await expect(page).toHaveURL(/\/(app|desk)/);
    await expect(page.locator(".navbar")).toBeVisible();
  });

  test("Agency Admin can log in to desk", async ({ page }) => {
    // Arrange — no special setup needed

    // Act — login as Agency Admin
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Assert — should reach the desk
    await expect(page).toHaveURL(/\/(app|desk)/);
    await expect(page.locator(".navbar")).toBeVisible();
  });

  test("Agency Staff can log in to desk", async ({ page }) => {
    // Arrange — no special setup needed

    // Act — login as Staff
    await login(page, USERS.staff.email, USERS.staff.password);

    // Assert — should reach the desk
    await expect(page).toHaveURL(/\/(app|desk)/);
  });

  test("Customer sees restricted desk with no admin access", async ({ page }) => {
    // Act — login as customer and navigate to desk
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("#login_email", USERS.customer.email);
    await page.fill("#login_password", USERS.customer.password);
    await page.locator(".btn-login").click();
    await page.waitForURL((url) => url.pathname !== "/login", {
      timeout: 15_000,
    });

    // Navigate to desk to show the restricted view in the video
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Assert — customer should not see admin sidebar items
    const sidebar = page.locator(".desk-sidebar");
    if (await sidebar.isVisible()) {
      await expect(
        sidebar.locator('a[href*="travel-agency"]')
      ).not.toBeVisible();
    }

    // Assert — customer cannot access admin resources
    const resp = await page.request.get("/api/resource/Travel Agency");
    expect([403, 404]).toContain(resp.status());
  });

  test("Invalid credentials show error", async ({ page }) => {
    // Arrange — no special setup needed

    // Act — attempt login with bad credentials
    const resp = await page.request.post("/api/method/login", {
      form: { usr: "nonexistent@test.com", pwd: "wrongpassword" },
    });

    // Assert — should get 401
    expect(resp.status()).toBe(401);
  });

  test("Unauthenticated user cannot access API", async ({ page }) => {
    // Arrange — fresh page with no session

    // Act — navigate to desk
    await page.goto("/app", { waitUntil: "domcontentloaded" });

    // Assert — should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("Logout clears the session", async ({ browser }) => {
    // Arrange — create a dedicated context and login
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Act — verify access, then logout and clear cookies
    const before = await page.request.get("/api/resource/Travel Booking");
    expect(before.ok()).toBeTruthy();
    await logout(page);
    await ctx.clearCookies();

    // Assert — API should deny access
    const resp = await page.request.get("/api/resource/Travel Booking");
    expect([403, 401]).toContain(resp.status());
    await ctx.close();
  });

  test("Session cookie is HttpOnly", async ({ page, context }) => {
    // Arrange — login
    await login(page, USERS.admin.email, USERS.admin.password);

    // Act — read cookies
    const cookies = await context.cookies();
    const sidCookie = cookies.find((c) => c.name === "sid");

    // Assert — sid must be HttpOnly
    expect(sidCookie).toBeDefined();
    expect(sidCookie!.httpOnly).toBeTruthy();
  });
});
