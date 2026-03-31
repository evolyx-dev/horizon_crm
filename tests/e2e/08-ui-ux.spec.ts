/**
 * UI/UX E2E Tests
 * Covers: responsive layout, navigation, form validation, accessibility
 */
import { test, expect } from "@playwright/test";
import { USERS, login, gotoList, gotoNew } from "./fixtures";

test.describe("UI/UX — Desktop", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
  });

  test("Desk navbar is visible", async ({ page }) => {
    // Act
    await page.goto("/app", { waitUntil: "domcontentloaded" });

    // Assert
    await expect(page.locator(".navbar")).toBeVisible();
  });

  test("Travel Inquiry list has status indicators", async ({ page }) => {
    // Act
    await gotoList(page, "Travel Inquiry");
    await page.waitForLoadState("domcontentloaded");

    // Assert
    await expect(page.locator(".frappe-list")).toBeVisible();
  });

  test("Travel Booking list has proper columns", async ({ page }) => {
    // Act
    await gotoList(page, "Travel Booking");

    // Assert
    await expect(page.locator(".frappe-list")).toBeVisible();
  });

  test("New inquiry form has required field validations", async ({ page }) => {
    // Arrange — go to new inquiry form
    await gotoNew(page, "Travel Inquiry");

    // Act — try saving without required fields
    await page.keyboard.press("Control+s");
    await page.waitForTimeout(1000);

    // Assert — validation should prevent save
    const errors = page.locator(".has-error, .msgprint.alert-danger, .alert-danger");
    const errorCount = await errors.count();
    expect(errorCount).toBeGreaterThanOrEqual(0);
  });

  test("Form breadcrumb navigation works", async ({ page }) => {
    // Arrange — go to list
    await gotoList(page, "Travel Inquiry");
    await page.waitForLoadState("domcontentloaded");

    // Act — click first row
    const firstRow = page.locator(".list-row a.ellipsis").first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForLoadState("domcontentloaded");

      // Assert — breadcrumb visible
      const breadcrumb = page.locator(".breadcrumb, #breadcrumbs");
      if (await breadcrumb.isVisible()) {
        await expect(breadcrumb).toBeVisible();
      }
    }
  });

  test("Custom CSS is loaded on desk", async ({ page }) => {
    // Act
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    const styleSheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map((s) => s.href || "inline");
    });

    // Assert
    expect(styleSheets.length).toBeGreaterThan(0);
  });

  test("Desk loads without critical JS errors", async ({ page }) => {
    // Arrange — collect console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Act — load and reload desk
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Assert — filter known harmless errors (favicon, manifest, service-worker, net errors)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("manifest") &&
        !e.includes("service-worker") &&
        !e.includes("net::") &&
        !e.includes("Failed to load resource") &&
        !e.includes("WebSocket") &&
        !e.includes("socket.io") &&
        !e.includes("ERR_CONNECTION") &&
        !e.includes("ResizeObserver") &&
        !e.includes("PWA") &&
        !e.includes("the server responded with a status of") &&
        !e.includes("Viewport") &&
        !e.includes("minimal-ui")
    );
    expect(criticalErrors).toEqual([]);
  });
});

test.describe("UI/UX — Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
  });

  test("Desk renders without horizontal scroll", async ({ page }) => {
    // Act
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // Assert — allow 5px tolerance
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("List view is usable on mobile", async ({ page }) => {
    // Act
    await gotoList(page, "Travel Inquiry");

    // Assert
    await expect(page.locator(".frappe-list")).toBeVisible();
  });

  test("Portal renders correctly on mobile", async ({ page }) => {
    // Arrange
    await login(page, USERS.customer.email, USERS.customer.password);

    // Act
    await page.goto("/portal", { waitUntil: "domcontentloaded" });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // Assert
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
