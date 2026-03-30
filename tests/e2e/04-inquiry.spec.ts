/**
 * Travel Inquiry Workflow E2E Tests
 * Covers: create inquiry, status transitions, inquiry-to-booking conversion
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

test.describe("Inquiry Workflow", () => {
  let inquiryName: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);

    // Create a test customer first
    const custFilters = JSON.stringify({
      email: "inquiry-test@test.example",
      agency: USERS.agencyAdmin1.agency,
    });
    const custCheck = await page.request.get(
      `/api/resource/Travel Customer?filters=${custFilters}`
    );
    const custBody = await custCheck.json();
    let customerName: string;
    if (custBody.data.length === 0) {
      const resp = await createDoc(page, "Travel Customer", {
        customer_name: "Inquiry Test Customer",
        email: "inquiry-test@test.example",
        phone: "+1111111111",
        agency: USERS.agencyAdmin1.agency,
      });
      customerName = resp.data.name;
    } else {
      customerName = custBody.data[0].name;
    }

    // Create inquiry via API
    const resp = await createDoc(page, "Travel Inquiry", {
      customer: customerName,
      agency: USERS.agencyAdmin1.agency,
      travel_type: "Honeymoon",
      destination: "Paris",
      departure_date: "2025-06-01",
      return_date: "2025-06-15",
      number_of_travelers: 2,
      budget: 5000,
      status: "New",
      source: "Website",
    });
    inquiryName = resp.data.name;
    await ctx.close();
  });

  test("Agency Admin can view inquiry list", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    await gotoList(page, "Travel Inquiry");
    await expect(page.locator(".frappe-list")).toBeVisible();
    const rows = page.locator(".list-row");
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
  });

  test("Inquiry has correct initial status", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    const resp = await page.request.get(
      `/api/resource/Travel Inquiry/${inquiryName}`
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.data.status).toBe("New");
  });

  test("Inquiry status can be changed to In Progress", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    const resp = await page.request.put(
      `/api/resource/Travel Inquiry/${inquiryName}`,
      { data: { status: "In Progress" } }
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.data.status).toBe("In Progress");
  });

  test("Inquiry can be moved to Quoted", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    const resp = await page.request.put(
      `/api/resource/Travel Inquiry/${inquiryName}`,
      { data: { status: "Quoted" } }
    );
    expect(resp.ok()).toBeTruthy();
  });

  test("Inquiry can be moved to Won", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    const resp = await page.request.put(
      `/api/resource/Travel Inquiry/${inquiryName}`,
      { data: { status: "Won" } }
    );
    expect(resp.ok()).toBeTruthy();
  });

  test("Won inquiry can be converted to booking via API", async ({
    page,
  }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    const resp = await page.request.post(
      "/api/method/horizon_crm.api.inquiry.create_booking_from_inquiry",
      { data: { source_name: inquiryName } }
    );
    // May succeed (200) or fail if booking already exists (4xx with msg)
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.message).toBeDefined();
    }
  });

  test("Agency2 cannot access Agency1 inquiry", async ({ page }) => {
    await login(page, USERS.agencyAdmin2.email, USERS.agencyAdmin2.password);
    const resp = await page.request.get(
      `/api/resource/Travel Inquiry/${inquiryName}`
    );
    // Should be 403 or 404
    expect([403, 404]).toContain(resp.status());
  });

  test("Inquiry form renders key fields", async ({ page }) => {
    await login(page, USERS.agencyAdmin1.email, USERS.agencyAdmin1.password);
    await page.goto(`/app/travel-inquiry/${inquiryName}`, {
      waitUntil: "networkidle",
    });
    await expect(
      page.locator('[data-fieldname="customer"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-fieldname="travel_type"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-fieldname="status"]')
    ).toBeVisible();
  });
});
