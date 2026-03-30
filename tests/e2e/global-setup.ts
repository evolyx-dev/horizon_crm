/**
 * Global setup — runs once before all test projects.
 * Creates test users and agencies used across the test suite.
 */
import { test as setup, expect } from "@playwright/test";
import { USERS, login, createUser, createDoc } from "./fixtures";

setup("bootstrap test data", async ({ page }) => {
  // Login as Administrator
  await login(page, USERS.admin.email, USERS.admin.password);

  // ── Create Users ──────────────────────────────────────────────
  const usersToCreate = [
    { email: USERS.agencyAdmin1.email, name: "Agency1 Admin" },
    { email: USERS.agencyAdmin2.email, name: "Agency2 Admin" },
    { email: USERS.teamLead1.email, name: "Agency1 Lead" },
    { email: USERS.staff1.email, name: "Agency1 Staff" },
    { email: USERS.customer1.email, name: "Agency1 Customer" },
  ];

  for (const u of usersToCreate) {
    const check = await page.request.get(`/api/resource/User/${u.email}`);
    if (!check.ok()) {
      const resp = await createUser(page, u.email, u.name, "Test@1234");
      // Allow 409 (duplicate) — may already exist from a previous partial run
      expect([200, 409]).toContain(resp.status());
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
      role: "Agency Team Lead",
      is_active: 1,
    },
    {
      staff_user: USERS.staff1.email,
      agency: USERS.staff1.agency,
      role: "Agency Staff",
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
