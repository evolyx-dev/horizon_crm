/**
 * Agency Settings E2E Tests
 * Covers: view/update agency singleton, status toggle, role restrictions
 */
import { test, expect } from "@playwright/test";
import {
  USERS,
  login,
  fillField,
  saveForm,
  getCsrfToken,
} from "./fixtures";

test.describe("Agency Settings", () => {
  test("Admin can view agency settings", async ({ page }) => {
    // Arrange — login as admin
    await login(page, USERS.admin.email, USERS.admin.password);

    // Act — navigate to the singleton
    await page.goto("/app/travel-agency", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".form-layout", { timeout: 15_000 });

    // Assert — agency name field should be visible
    await expect(page.locator('[data-fieldname="agency_name"]').first()).toBeVisible();
  });

  test("Admin can update agency details", async ({ page }) => {
    // Arrange — login as admin and go to agency settings
    await login(page, USERS.admin.email, USERS.admin.password);
    await page.goto("/app/travel-agency", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".form-layout", { timeout: 15_000 });

    // Act — update phone field
    await fillField(page, "phone", "+9999999999");
    await saveForm(page);
    await page.waitForTimeout(500);

    // Assert — phone should persist after reload
    await page.reload({ waitUntil: "domcontentloaded" });
    const phone = page.locator('[data-fieldname="phone"] input');
    await expect(phone).toHaveValue("+9999999999");
  });

  test("Agency status can be toggled via API", async ({ page }) => {
    // Arrange — login as admin
    await login(page, USERS.admin.email, USERS.admin.password);

    // Act — set status to Inactive then back to Active
    const resp = await page.request.put(
      "/api/resource/Travel Agency/Travel Agency",
      { data: { status: "Inactive" }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );
    expect(resp.ok()).toBeTruthy();

    const resp2 = await page.request.put(
      "/api/resource/Travel Agency/Travel Agency",
      { data: { status: "Active" }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );

    // Assert — both operations should succeed
    expect(resp2.ok()).toBeTruthy();
  });

  test("Staff cannot modify agency settings", async ({ page }) => {
    // Arrange — login as regular staff
    await login(page, USERS.staff.email, USERS.staff.password);

    // Act — try to update agency via API
    const resp = await page.request.put(
      "/api/resource/Travel Agency/Travel Agency",
      { data: { phone: "+0000000000" }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );

    // Assert — should be forbidden (staff has read-only)
    expect([403, 401]).toContain(resp.status());
  });

  test("Agency settings page shows correct fields", async ({ page }) => {
    // Arrange — login and navigate to settings
    await login(page, USERS.admin.email, USERS.admin.password);
    await page.goto("/app/travel-agency", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".form-layout", { timeout: 15_000 });

    // Assert — key fields should be present
    await expect(page.locator('[data-fieldname="agency_name"]').first()).toBeVisible();
    await expect(page.locator('[data-fieldname="contact_email"]').first()).toBeVisible();
    await expect(page.locator('[data-fieldname="max_staff"]').first()).toBeVisible();
  });
});
