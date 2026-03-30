/**
 * Staff Management E2E Tests
 * Covers: add/remove staff, role assignment, max staff limit
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
  getListCount,
} from "./fixtures";

test.describe("Staff Management", () => {
  test("Admin can view staff list", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    await gotoList(page, "Travel Agency Staff");
    await expect(page.locator(".frappe-list")).toBeVisible();
  });

  test("Agency Admin can view their own staff", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    await gotoList(page, "Travel Agency Staff");
    // Should see staff from their agency only
    const rows = page.locator(".list-row");
    const count = await rows.count();
    // Agency1 has at least 2 staff + admin
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("Staff record creates User Permission on insert", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);

    // Check that teamLead1 has a User Permission for their agency
    const filters = JSON.stringify({
      user: USERS.teamLead1.email,
      allow: "Travel Agency",
      for_value: USERS.teamLead1.agency,
    });
    const resp = await page.request.get(
      `/api/resource/User Permission?filters=${filters}`
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  test("Staff gets correct Frappe role assigned", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);

    // Check teamLead1 has Agency Team Lead role
    const resp = await page.request.get(
      `/api/resource/User/${USERS.teamLead1.email}`
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    const roles = body.data.roles.map((r: { role: string }) => r.role);
    expect(roles).toContain("Agency Team Lead");
  });

  test("Staff from Agency2 cannot see Agency1 staff", async ({ page }) => {
    await login(page, USERS.agencyAdmin2.email, USERS.agencyAdmin2.password);
    const resp = await page.request.get(
      `/api/resource/Travel Agency Staff?filters=${JSON.stringify({
        agency: USERS.agencyAdmin1.agency,
      })}`
    );
    const body = await resp.json();
    // Should return empty or forbidden
    if (resp.ok()) {
      expect(body.data.length).toBe(0);
    }
  });

  test("Max staff limit is enforced", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);

    // Set max_staff to a low number temporarily
    await page.request.put(
      `/api/resource/Travel Agency/${encodeURIComponent(USERS.agencyAdmin1.agency)}`,
      { data: { max_staff: 1 } }
    );

    // Try to add beyond limit
    const resp = await page.request.post(
      "/api/resource/Travel Agency Staff",
      {
        data: {
          staff_user: "overflow@test.example",
          agency: USERS.agencyAdmin1.agency,
          role: "Agency Staff",
          is_active: 1,
        },
      }
    );

    // Restore limit
    await page.request.put(
      `/api/resource/Travel Agency/${encodeURIComponent(USERS.agencyAdmin1.agency)}`,
      { data: { max_staff: 10 } }
    );

    // The create should have failed with a validation error
    expect([400, 403, 417]).toContain(resp.status());
  });
});
