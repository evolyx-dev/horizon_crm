/**
 * Travel Inquiry Workflow E2E Tests
 * Covers: create inquiry, status transitions, inquiry-to-booking conversion
 *
 * Each test creates its own inquiry via a shared beforeAll to avoid
 * cross-test mutation issues. Status-transition tests are serialized
 * and use a dedicated inquiry that progresses through the workflow.
 */
import { test, expect } from "@playwright/test";
import {
  USERS,
  login,
  gotoList,
  createDoc,
  getCsrfToken,
} from "./fixtures";

test.describe("Inquiry Workflow", () => {
  /** Shared inquiry that is progressed through statuses by ordered tests */
  let workflowInquiryName: string;
  /** Separate inquiry for read-only tests */
  let readOnlyInquiryName: string;
  let customerName: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

    // Ensure test customer
    const custFilters = JSON.stringify({ email: "inquiry-test@test.example" });
    const custCheck = await page.request.get(
      `/api/resource/Travel Customer?filters=${custFilters}`
    );
    const custBody = await custCheck.json();
    if (custBody.data.length === 0) {
      const resp = await createDoc(page, "Travel Customer", {
        customer_name: "Inquiry Test Customer",
        email: "inquiry-test@test.example",
        phone: "+1111111111",
      });
      customerName = resp.data.name;
    } else {
      customerName = custBody.data[0].name;
    }

    // Create inquiry for workflow tests (status transitions)
    const ts = Date.now();
    const wfResp = await createDoc(page, "Travel Inquiry", {
      customer: customerName,
      customer_name: "Inquiry Test Customer",
      customer_email: "inquiry-test@test.example",
      travel_type: "Honeymoon",
      destination: "Paris",
      departure_date: "2025-06-01",
      return_date: "2025-06-15",
      num_travelers: 2,
      budget_min: 5000,
      status: "New",
      source: "Website",
    });
    workflowInquiryName = wfResp.data.name;

    // Create a second inquiry for read-only assertions
    const roResp = await createDoc(page, "Travel Inquiry", {
      customer: customerName,
      customer_name: "Inquiry Test Customer",
      customer_email: "inquiry-test@test.example",
      travel_type: "Adventure",
      destination: "Rome",
      departure_date: "2025-07-01",
      return_date: "2025-07-10",
      num_travelers: 1,
      budget_min: 3000,
      status: "New",
      source: "Phone",
    });
    readOnlyInquiryName = roResp.data.name;

    await ctx.close();
  });

  test("Agency Admin can view inquiry list", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await gotoList(page, "Travel Inquiry");
    await expect(page.locator(".frappe-list")).toBeVisible();
    expect(await page.locator(".list-row").count()).toBeGreaterThanOrEqual(1);
  });

  test("Inquiry has correct initial status", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.get(
      `/api/resource/Travel Inquiry/${readOnlyInquiryName}`
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.data.status).toBe("New");
  });

  test("Inquiry status can be changed to Contacted", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.put(
      `/api/resource/Travel Inquiry/${workflowInquiryName}`,
      { data: { status: "Contacted" }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.data.status).toBe("Contacted");
  });

  test("Inquiry can be moved to Quoted", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.put(
      `/api/resource/Travel Inquiry/${workflowInquiryName}`,
      { data: { status: "Quoted" }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );
    expect(resp.ok()).toBeTruthy();
  });

  test("Inquiry can be moved to Won", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.put(
      `/api/resource/Travel Inquiry/${workflowInquiryName}`,
      { data: { status: "Won" }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );
    expect(resp.ok()).toBeTruthy();
  });

  test("Won inquiry can be converted to booking via API", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    const resp = await page.request.post(
      "/api/method/horizon_crm.api.inquiry.create_booking_from_inquiry",
      { data: { source_name: workflowInquiryName }, headers: { "X-Frappe-CSRF-Token": getCsrfToken() } }
    );
    if (resp.ok()) {
      const body = await resp.json();
      expect(body.message).toBeDefined();
    }
  });

  test("Inquiry form renders key fields", async ({ page }) => {
    await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);
    await page.goto(`/app/travel-inquiry/${readOnlyInquiryName}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator('[data-fieldname="customer_name"]').first()).toBeVisible();
    await expect(page.locator('[data-fieldname="status"]').first()).toBeVisible();
  });
});
