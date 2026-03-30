/**
 * Global setup — runs once before all test projects.
 * Creates test users and agencies used across the test suite.
 */
import { test as setup, expect } from "@playwright/test";
import { USERS, login, createUser, createDoc, getCsrfToken } from "./fixtures";

setup("bootstrap test data", async ({ page }) => {
  // Login as Administrator
  await login(page, USERS.admin.email, USERS.admin.password);

  // ── Create Users ──────────────────────────────────────────────
  // Users that manage agencies need "System Manager" role so they become System Users
  const usersToCreate = [
    { email: USERS.agencyAdmin1.email, name: "Agency1 Admin", roles: ["System Manager"] },
    { email: USERS.agencyAdmin2.email, name: "Agency2 Admin", roles: ["System Manager"] },
    { email: USERS.teamLead1.email, name: "Agency1 Lead", roles: ["System Manager"] },
    { email: USERS.staff1.email, name: "Agency1 Staff", roles: ["System Manager"] },
    { email: USERS.customer1.email, name: "Agency1 Customer", roles: [] as string[] },
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
      // Ensure existing user has the correct roles (may have been created without them)
      if (u.roles.length > 0) {
        const userData = await check.json();
        const existingRoles = (userData.data.roles || []).map((r: { role: string }) => r.role);
        const missingRoles = u.roles.filter((r) => !existingRoles.includes(r));
        if (missingRoles.length > 0) {
          const newRoles = [
            ...userData.data.roles,
            ...missingRoles.map((r) => ({ role: r })),
          ];
          await page.request.put(`/api/resource/User/${u.email}`, {
            headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
            data: { roles: newRoles },
          });
        }
      }
    }
  }

  // ── Create Travel Agencies ────────────────────────────────────
  const agencies = [
    {
      agency_name: USERS.agencyAdmin1.agency,
      contact_email: USERS.agencyAdmin1.email,
      admin_user: USERS.agencyAdmin1.email,
      max_staff: 10,
      status: "Active",
    },
    {
      agency_name: USERS.agencyAdmin2.agency,
      contact_email: USERS.agencyAdmin2.email,
      admin_user: USERS.agencyAdmin2.email,
      max_staff: 10,
      status: "Active",
    },
  ];

  for (const a of agencies) {
    const check = await page.request.get(
      `/api/resource/Travel Agency/${encodeURIComponent(a.agency_name)}`
    );
    if (!check.ok()) {
      await createDoc(page, "Travel Agency", a);
    }
  }

  // ── Create Staff for Agency 1 ────────────────────────────────
  const staffRecords = [
    {
      staff_user: USERS.teamLead1.email,
      agency: USERS.teamLead1.agency,
      role_in_agency: "Team Lead",
      is_active: 1,
    },
    {
      staff_user: USERS.staff1.email,
      agency: USERS.staff1.agency,
      role_in_agency: "Staff",
      is_active: 1,
    },
  ];

  for (const s of staffRecords) {
    const filters = JSON.stringify({ staff_user: s.staff_user });
    const check = await page.request.get(
      `/api/resource/Travel Agency Staff?filters=${filters}`
    );
    const body = await check.json();
    if (body.data.length === 0) {
      await createDoc(page, "Travel Agency Staff", s);
    } else {
      // Update existing staff record if role_in_agency is wrong
      const existing = await page.request.get(
        `/api/resource/Travel Agency Staff/${body.data[0].name}`
      );
      const existingData = await existing.json();
      if (existingData.data.role_in_agency !== s.role_in_agency) {
        await page.request.put(
          `/api/resource/Travel Agency Staff/${body.data[0].name}`,
          {
            headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
            data: { role_in_agency: s.role_in_agency },
          }
        );
      }
    }
  }

  // ── Create a Customer for Agency 1 ───────────────────────────
  const custFilters = JSON.stringify({
    email: USERS.customer1.email,
    agency: USERS.customer1.agency,
  });
  const custCheck = await page.request.get(
    `/api/resource/Travel Customer?filters=${custFilters}`
  );
  const custBody = await custCheck.json();
  if (custBody.data.length === 0) {
    await createDoc(page, "Travel Customer", {
      customer_name: "Test Customer One",
      email: USERS.customer1.email,
      phone: "+1234567890",
      agency: USERS.customer1.agency,
      portal_user: USERS.customer1.email,
    });
  }
});
