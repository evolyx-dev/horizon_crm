/**
 * Global setup — runs once before all test projects.
 * Creates test users and staff records used across the test suite.
 *
 * Role assignment flow:
 *   1. Users are created with NO special roles (just basic desk access via user_type).
 *   2. Agency singleton is configured with admin_user → triggers _ensure_admin_staff()
 *      which creates a Travel Agency Staff record → after_insert hook assigns "Agency Admin" role.
 *   3. Staff records are created for team lead and staff → after_insert hooks assign
 *      "Agency Team Lead" and "Agency Staff" Frappe roles respectively.
 */
import { test as setup, expect } from "@playwright/test";
import { USERS, login, createUser, createDoc, getCsrfToken } from "./fixtures";

setup("bootstrap test data", async ({ page }) => {
  // Arrange — login as Administrator
  await login(page, USERS.admin.email, USERS.admin.password);

  // Act — create users needed for tests
  // NOTE: Do NOT assign System Manager to non-admin users.
  // The Travel Agency Staff after_insert hooks will assign the correct
  // custom roles (Agency Admin, Agency Team Lead, Agency Staff).
  const usersToCreate = [
    { email: USERS.agencyAdmin.email, name: "Agency Admin", roles: [] as string[] },
    { email: USERS.teamLead.email, name: "Team Lead", roles: [] as string[] },
    { email: USERS.staff.email, name: "Staff User", roles: [] as string[] },
  ];

  for (const u of usersToCreate) {
    const check = await page.request.get(`/api/resource/User/${u.email}`);
    if (!check.ok()) {
      const resp = await createUser(page, u.email, u.name, "Test@1234", u.roles);
      if (![200, 409].includes(resp.status())) {
        const body = await resp.text();
        console.error(`Failed to create user ${u.email}: ${resp.status()} ${body}`);
      }
      expect([200, 409]).toContain(resp.status());
    } else {
      // Ensure existing user has the correct roles and does NOT have System Manager
      const userData = await check.json();
      const existingRoles: string[] = (userData.data.roles || []).map(
        (r: { role: string }) => r.role
      );

      // Remove System Manager if user is not Administrator
      const shouldRemoveSM =
        u.email !== USERS.admin.email && existingRoles.includes("System Manager");

      const missingRoles = u.roles.filter((r) => !existingRoles.includes(r));

      if (shouldRemoveSM || missingRoles.length > 0) {
        let newRoles = userData.data.roles.filter(
          (r: { role: string }) =>
            !(shouldRemoveSM && r.role === "System Manager")
        );
        newRoles = [...newRoles, ...missingRoles.map((r) => ({ role: r }))];
        await page.request.put(`/api/resource/User/${u.email}`, {
          headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
          data: { roles: newRoles },
        });
      }
    }
  }

  // Act — configure Agency Settings singleton
  // Setting admin_user triggers _ensure_admin_staff() which creates a staff
  // record with role_in_agency="Agency Admin" → after_insert assigns "Agency Admin" role.
  await page.request.put("/api/resource/Travel Agency/Travel Agency", {
    headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    data: {
      agency_name: "Test Agency Alpha",
      contact_email: USERS.agencyAdmin.email,
      admin_user: USERS.agencyAdmin.email,
      max_staff: 10,
      status: "Active",
    },
  });

  // Act — create staff records (triggers after_insert → assign_role for each)
  const staffRecords = [
    {
      staff_user: USERS.agencyAdmin.email,
      role_in_agency: "Agency Admin",
      is_active: 1,
    },
    {
      staff_user: USERS.teamLead.email,
      role_in_agency: "Team Lead",
      is_active: 1,
    },
    {
      staff_user: USERS.staff.email,
      role_in_agency: "Staff",
      is_active: 1,
    },
  ];

  for (const s of staffRecords) {
    const check = await page.request.get(
      `/api/resource/Travel Agency Staff/${encodeURIComponent(s.staff_user)}`
    );
    if (!check.ok()) {
      try {
        await createDoc(page, "Travel Agency Staff", s);
      } catch (error) {
        const message = String(error);
        if (!message.includes("DuplicateEntryError")) {
          throw error;
        }
      }
    }
  }

  // Multi-tenant isolation tests expect a primary-site customer that
  // does not exist on the secondary site.
  const customerFilters = JSON.stringify({ email: "customer@agency1.test" });
  const customerCheck = await page.request.get(
    `/api/resource/Travel Customer?filters=${customerFilters}`
  );
  const customerBody = await customerCheck.json();
  if (customerBody.data.length === 0) {
    await createDoc(page, "Travel Customer", {
      customer_name: "Primary Tenant Customer",
      email: "customer@agency1.test",
      phone: "+9999999999",
    });
  }

  // Verify roles were assigned correctly by the hooks
  for (const [userKey, expectedRole] of [
    ["agencyAdmin", "Agency Admin"],
    ["teamLead", "Agency Team Lead"],
    ["staff", "Agency Staff"],
  ] as const) {
    const userEmail = USERS[userKey].email;
    const userResp = await page.request.get(`/api/resource/User/${userEmail}`);
    if (userResp.ok()) {
      const userData = await userResp.json();
      const roles: string[] = (userData.data.roles || []).map(
        (r: { role: string }) => r.role
      );
      if (!roles.includes(expectedRole)) {
        console.warn(
          `⚠️ User ${userEmail} missing expected role "${expectedRole}". ` +
          `Current roles: [${roles.join(", ")}]. Adding it manually.`
        );
        // Fallback: add the role manually if hooks didn't fire
        await page.request.put(`/api/resource/User/${userEmail}`, {
          headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
          data: {
            roles: [...userData.data.roles, { role: expectedRole }],
          },
        });
      }
    }
  }
});
