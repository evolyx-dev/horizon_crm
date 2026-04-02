/**
 * Multi-Tenant Site Isolation E2E Tests
 *
 * Verifies that Frappe's site-per-tenant architecture provides complete
 * data isolation between tenant sites. Uses one Dockerized bench with
 * deterministic site-pinned web ports for each local tenant.
 */
import { test, expect, APIRequestContext, request } from "@playwright/test";

const PRIMARY_BASE_URL = process.env.FRAPPE_URL || "http://127.0.0.1:8000";
const SECONDARY_BASE_URL = process.env.SECONDARY_FRAPPE_URL || "http://127.0.0.1:8001";
const PRIMARY_SITE_NAME = process.env.PRIMARY_SITE_NAME || "horizon.localhost";
const SECONDARY_SITE_NAME = process.env.SECONDARY_SITE_NAME || "tenant2.localhost";

/** Authenticate as Administrator on a Frappe site */
async function apiLogin(baseURL: string, siteName: string): Promise<APIRequestContext> {
  const ctx = await request.newContext({
    baseURL,
  });
  const resp = await ctx.post("/api/method/login", {
    form: { usr: "Administrator", pwd: "admin" },
  });
  if (!resp.ok()) {
    throw new Error(`Login failed on ${siteName} (${baseURL}): ${resp.status()} ${await resp.text()}`);
  }
  return ctx;
}

/** Get CSRF token for write operations */
async function getCsrf(ctx: APIRequestContext): Promise<string> {
  const resp = await ctx.get("/api/method/frappe.auth.get_csrf_token");
  return (await resp.json()).message;
}

/** Wait for a site to respond */
async function waitForSite(baseURL: string, siteName: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const ctx = await request.newContext({ baseURL });
      const r = await ctx.get("/api/method/ping", { timeout: 2000 });
      await ctx.dispose();
      if (r.ok()) return;
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Site ${siteName} did not respond within ${timeoutMs}ms`);
}

test.describe("Multi-Tenant Site Isolation", () => {
  let site1: APIRequestContext;
  let site2: APIRequestContext;
  let csrf2: string;

  test.beforeAll(async () => {
    await waitForSite(PRIMARY_BASE_URL, PRIMARY_SITE_NAME, 60_000);
    await waitForSite(SECONDARY_BASE_URL, SECONDARY_SITE_NAME, 60_000);

    site1 = await apiLogin(PRIMARY_BASE_URL, PRIMARY_SITE_NAME);
    site2 = await apiLogin(SECONDARY_BASE_URL, SECONDARY_SITE_NAME);
    csrf2 = await getCsrf(site2);
  });

  test.afterAll(async () => {
    await site1?.dispose();
    await site2?.dispose();
  });

  test("Each site has a distinct Travel Agency name", async () => {
    const r1 = await site1.get("/api/resource/Travel Agency/Travel Agency");
    const r2 = await site2.get("/api/resource/Travel Agency/Travel Agency");
    expect(r1.ok()).toBe(true);
    expect(r2.ok()).toBe(true);

    const a1 = (await r1.json()).data;
    const a2 = (await r2.json()).data;

    expect(a1.agency_name).toBeTruthy();
    expect(a2.agency_name).toBeTruthy();
    // Site1 was configured by global-setup; site2 uses install.py default
    expect(a1.agency_name).not.toEqual(a2.agency_name);
  });

  test("Users on site1 do not exist on site2", async () => {
    // Site1 has test users created by global-setup
    const r1 = await site1.get("/api/resource/User/admin@agency1.test");
    expect(r1.ok()).toBe(true);

    // Site2 must NOT have that user — different database
    const r2 = await site2.get("/api/resource/User/admin@agency1.test");
    expect(r2.ok()).toBe(false);
  });

  test("Staff records on site1 are invisible to site2", async () => {
    // Site1 has staff created by global-setup (e.g., admin@agency1.test)
    const r1 = await site1.get(
      `/api/resource/Travel Agency Staff?filters=${encodeURIComponent(
        JSON.stringify({ staff_user: "admin@agency1.test" })
      )}`
    );
    const staff1 = (await r1.json()).data;
    expect(staff1.length).toBeGreaterThan(0);

    // Site2 must NOT have that staff user — different database
    const r2 = await site2.get(
      `/api/resource/Travel Agency Staff?filters=${encodeURIComponent(
        JSON.stringify({ staff_user: "admin@agency1.test" })
      )}`
    );
    const staff2 = (await r2.json()).data;
    expect(staff2).toHaveLength(0);
  });

  test("Customer records on site1 are invisible to site2", async () => {
    // Site1 has test customer with email customer@agency1.test
    const r1 = await site1.get(
      `/api/resource/Travel Customer?filters=${encodeURIComponent(
        JSON.stringify({ email: "customer@agency1.test" })
      )}`
    );
    const cust1 = (await r1.json()).data;
    expect(cust1.length).toBeGreaterThan(0);

    // Site2 must NOT have that customer — different database
    const r2 = await site2.get(
      `/api/resource/Travel Customer?filters=${encodeURIComponent(
        JSON.stringify({ email: "customer@agency1.test" })
      )}`
    );
    const cust2 = (await r2.json()).data;
    expect(cust2).toHaveLength(0);
  });

  test("Creating a record on site2 does not appear on site1", async () => {
    // Create a customer on site2 with a unique email
    const uniqueEmail = `tenant2-${Date.now()}@isolation.test`;
    const createResp = await site2.post("/api/resource/Travel Customer", {
      headers: { "X-Frappe-CSRF-Token": csrf2 },
      data: {
        customer_name: "Tenant2 Exclusive Customer",
        email: uniqueEmail,
        phone: "+9876543210",
      },
    });
    expect(createResp.ok()).toBe(true);
    const created = (await createResp.json()).data;

    // Verify it exists on site2 by searching for the unique email
    const search2 = await site2.get(
      `/api/resource/Travel Customer?filters=${encodeURIComponent(
        JSON.stringify({ email: uniqueEmail })
      )}`
    );
    const found2 = (await search2.json()).data;
    expect(found2.length).toBe(1);

    // Verify it does NOT exist on site1 by searching for the same email
    const search1 = await site1.get(
      `/api/resource/Travel Customer?filters=${encodeURIComponent(
        JSON.stringify({ email: uniqueEmail })
      )}`
    );
    const found1 = (await search1.json()).data;
    expect(found1.length).toBe(0);

    // Cleanup: delete the customer from site2
    await site2.delete(`/api/resource/Travel Customer/${created.name}`, {
      headers: { "X-Frappe-CSRF-Token": csrf2 },
    });
  });

  test("Singleton update on one site does not affect the other", async () => {
    // Capture original values
    const orig1 = (
      await (
        await site1.get("/api/resource/Travel Agency/Travel Agency")
      ).json()
    ).data;
    const orig2 = (
      await (
        await site2.get("/api/resource/Travel Agency/Travel Agency")
      ).json()
    ).data;

    // Update site2's agency name
    const uniqueTag = Date.now().toString(36);
    const tempName = `Isolation Test ${uniqueTag}`;
    await site2.put("/api/resource/Travel Agency/Travel Agency", {
      headers: { "X-Frappe-CSRF-Token": csrf2 },
      data: { agency_name: tempName },
    });

    // Site1 must be unchanged
    const after1 = (
      await (
        await site1.get("/api/resource/Travel Agency/Travel Agency")
      ).json()
    ).data;
    expect(after1.agency_name).toEqual(orig1.agency_name);

    // Site2 must reflect the change
    const after2 = (
      await (
        await site2.get("/api/resource/Travel Agency/Travel Agency")
      ).json()
    ).data;
    expect(after2.agency_name).toEqual(tempName);

    // Restore site2's original name
    await site2.put("/api/resource/Travel Agency/Travel Agency", {
      headers: { "X-Frappe-CSRF-Token": csrf2 },
      data: { agency_name: orig2.agency_name },
    });
  });

  test("Shared reference data is independent per site", async () => {
    // Both sites have default Travel Types from install.py
    const r1 = await site1.get(
      "/api/resource/Travel Type?limit_page_length=0"
    );
    const r2 = await site2.get(
      "/api/resource/Travel Type?limit_page_length=0"
    );
    const types1 = (await r1.json()).data;
    const types2 = (await r2.json()).data;

    // Both should have defaults (installed independently)
    expect(types1.length).toBeGreaterThan(0);
    expect(types2.length).toBeGreaterThan(0);

    // Create a custom type on site2 only
    const customType = `Custom-${Date.now().toString(36)}`;
    await site2.post("/api/resource/Travel Type", {
      headers: { "X-Frappe-CSRF-Token": csrf2 },
      data: { type_name: customType, description: "Isolation test" },
    });

    // Verify it exists on site2
    const check2 = await site2.get(`/api/resource/Travel Type/${customType}`);
    expect(check2.ok()).toBe(true);

    // Verify it does NOT exist on site1
    const check1 = await site1.get(`/api/resource/Travel Type/${customType}`);
    expect(check1.ok()).toBe(false);

    // Cleanup
    await site2.delete(`/api/resource/Travel Type/${customType}`, {
      headers: { "X-Frappe-CSRF-Token": csrf2 },
    });
  });
});
