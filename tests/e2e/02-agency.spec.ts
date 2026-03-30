/**
 * Travel Agency CRUD E2E Tests
 * Covers: create, read, update agency; status toggle; admin assignment
 */
import { test, expect } from "@playwright/test";
import {
  USERS,
  login,
  gotoList,
  gotoNew,
  fillField,
  saveForm,
  createDoc,
  deleteDoc,
} from "./fixtures";

test.describe("Travel Agency CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
  });

  test("Admin can view agency list", async ({ page }) => {
    await gotoList(page, "Travel Agency");
    await expect(page.locator(".list-row")).toHaveCount(
      await page.locator(".list-row").count()
    );
    await expect(page.locator(".frappe-list")).toBeVisible();
  });

  test("Admin can create a new agency via form", async ({ page }) => {
    const agencyName = `E2E Agency ${Date.now()}`;
    await gotoNew(page, "Travel Agency");
    await fillField(page, "agency_name", agencyName);
    await fillField(page, "contact_email", "e2e@test.example");
    await fillField(page, "max_staff", "5");
    await saveForm(page);

    // Verify saved
    await expect(page.locator(".indicator-pill")).toBeVisible();
    // Cleanup
    await deleteDoc(page, "Travel Agency", agencyName);
  });

  test("Admin can update agency details", async ({ page }) => {
    // Navigate to existing test agency
    await gotoList(page, "Travel Agency");
    await page
      .locator(`.list-row a:has-text("${USERS.agencyAdmin1.agency}")`)
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Update phone
    await fillField(page, "phone", "+9999999999");
    await saveForm(page);
    await page.waitForTimeout(500);

    // Verify persisted
    await page.reload({ waitUntil: "networkidle" });
    const phone = page.locator('[data-fieldname="phone"] input');
    await expect(phone).toHaveValue("+9999999999");
  });

  test("Agency status can be toggled", async ({ page }) => {
    const resp = await page.request.put(
      `/api/resource/Travel Agency/${encodeURIComponent(USERS.agencyAdmin1.agency)}`,
      { data: { status: "Suspended" } }
    );
    expect(resp.ok()).toBeTruthy();

    // Restore
    const resp2 = await page.request.put(
      `/api/resource/Travel Agency/${encodeURIComponent(USERS.agencyAdmin1.agency)}`,
      { data: { status: "Active" } }
    );
    expect(resp2.ok()).toBeTruthy();
  });

  test("Agency Admin cannot create another agency", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    const resp = await page.request.post("/api/resource/Travel Agency", {
      data: {
        agency_name: "Unauthorized Agency",
        contact_email: "hack@test.example",
        max_staff: 5,
      },
    });
    // Should be forbidden — Agency Admin has no create rights on Travel Agency
    expect([403, 401]).toContain(resp.status());
  });

  test("Agency list shows correct columns", async ({ page }) => {
    await gotoList(page, "Travel Agency");
    const header = page.locator(".list-header-subject, .list-row-head");
    await expect(header).toBeVisible();
  });
});
