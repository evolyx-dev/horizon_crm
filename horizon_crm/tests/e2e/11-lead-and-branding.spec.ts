/**
 * Lead-to-Inquiry Conversion & Branding E2E Tests
 * Covers: lead pipeline, lead-to-inquiry conversion, favicon/branding verification
 */
import { test, expect } from "@playwright/test";
import { USERS, login, createDoc, getCsrfToken } from "./fixtures";

test.describe("Lead Pipeline", () => {
  let leadName: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    const resp = await createDoc(page, "Travel Lead", {
      lead_name: `E2E Lead ${Date.now()}`,
      email: `lead-${Date.now()}@test.example`,
      phone: "+1234567890",
      source: "Website",
      interested_destination: "Paris",
      travel_type: "Honeymoon",
      expected_travel_date: "2025-09-01",
      expected_budget: 5000,
      num_travelers: 2,
    });
    leadName = resp.data.name;
    await ctx.close();
  });

  test("Lead created with correct initial status", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.get(`/api/resource/Travel Lead/${leadName}`);
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.data.status).toBe("New");
  });

  test("Lead progresses through pipeline", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const statuses = ["Contacted", "Interested", "Qualified"];
    for (const status of statuses) {
      const resp = await page.request.put(
        `/api/resource/Travel Lead/${leadName}`,
        { data: { status }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
      );
      expect(resp.ok()).toBeTruthy();
    }
    // Verify final status
    const resp = await page.request.get(`/api/resource/Travel Lead/${leadName}`);
    const body = await resp.json();
    expect(body.data.status).toBe("Qualified");
  });

  test("Qualified lead can spawn a Travel Inquiry", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Get lead details
    const leadResp = await page.request.get(`/api/resource/Travel Lead/${leadName}`);
    const lead = (await leadResp.json()).data;

    // Create inquiry from lead
    const inqResp = await createDoc(page, "Travel Inquiry", {
      lead: leadName,
      customer_name: lead.lead_name,
      customer_email: lead.email,
      customer_phone: lead.phone,
      destination: lead.interested_destination || undefined,
      travel_type: lead.travel_type || undefined,
      source: lead.source,
      departure_date: "2025-09-01",
      return_date: "2025-09-15",
      num_travelers: lead.num_travelers || 1,
      budget_min: lead.expected_budget || 0,
    });
    expect(inqResp.data.name).toBeDefined();
    expect(inqResp.data.lead).toBe(leadName);

    // Mark lead as Converted
    const convResp = await page.request.put(
      `/api/resource/Travel Lead/${leadName}`,
      { data: { status: "Converted" }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );
    expect(convResp.ok()).toBeTruthy();
  });
});

test.describe("Branding & Favicon", () => {
  test("Custom favicon asset is accessible", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.get("/assets/horizon_crm/images/favicon.svg");
    expect(resp.ok()).toBeTruthy();
    const body = await resp.text();
    expect(body).toContain("<svg");
  });

  test("Custom logo asset is accessible", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.get("/assets/horizon_crm/images/logo.svg");
    expect(resp.ok()).toBeTruthy();
    const body = await resp.text();
    expect(body).toContain("Horizon");
  });

  test("Horizon CSS is loaded on desk", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await page.goto("/app", { waitUntil: "domcontentloaded" });

    const hasHorizonCSS = await page.evaluate(() => {
      return Array.from(document.styleSheets).some(
        (s) => s.href && s.href.includes("horizon")
      );
    });
    expect(hasHorizonCSS).toBeTruthy();
  });

  test("Horizon JS is loaded on desk", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await page.goto("/app", { waitUntil: "domcontentloaded" });

    const hasHorizonNs = await page.evaluate(() => {
      return typeof (window as any).horizon_crm !== "undefined";
    });
    expect(hasHorizonNs).toBeTruthy();
  });
});
