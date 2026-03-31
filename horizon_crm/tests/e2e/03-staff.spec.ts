/**
 * Staff Management E2E Tests
 * Covers: view staff list, role assignment, max staff limit
 */
import { test, expect } from "@playwright/test";
import {
  USERS,
  login,
  gotoList,
  getCsrfToken,
} from "./fixtures";

test.describe("Staff Management", () => {
  test("Admin can view staff list", async ({ page }) => {
    // Arrange — login as admin
    await login(page, USERS.admin.email, USERS.admin.password);

    // Act — navigate to staff list
    await gotoList(page, "Travel Agency Staff");

    // Assert — list should be visible
    await expect(page.locator(".frappe-list")).toBeVisible();
  });

  test("Agency Admin can view staff list", async ({ page }) => {
    // Arrange — login as agency admin
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Act — navigate to staff list
    await gotoList(page, "Travel Agency Staff");

    // Assert — should see staff (at least admin + lead + staff)
    const rows = page.locator(".list-row");
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
  });

  test("Staff gets correct Frappe role assigned", async ({ page }) => {
    // Arrange — login as admin
    await login(page, USERS.admin.email, USERS.admin.password);

    // Act — fetch team lead user data
    const resp = await page.request.get(
      `/api/resource/User/${USERS.teamLead.email}`
    );

    // Assert — should have Agency Team Lead role
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    const roles = body.data.roles.map((r: { role: string }) => r.role);
    expect(roles).toContain("Agency Team Lead");
  });

  test("Max staff limit is enforced", async ({ page }) => {
    // Arrange — login as admin, set max_staff to 1
    await login(page, USERS.admin.email, USERS.admin.password);
    await page.request.put(
      "/api/resource/Travel Agency/Travel Agency",
      { data: { max_staff: 1 }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );

    // Act — try to add a new staff member beyond limit
    const resp = await page.request.post(
      "/api/resource/Travel Agency Staff",
      {
        data: {
          staff_user: "overflow@test.example",
          role_in_agency: "Staff",
          is_active: 1,
        },
        headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
      }
    );

    // Assert — should fail with validation error
    expect([400, 403, 417]).toContain(resp.status());

    // Cleanup — restore max_staff
    await page.request.put(
      "/api/resource/Travel Agency/Travel Agency",
      { data: { max_staff: 10 }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );
  });
});
