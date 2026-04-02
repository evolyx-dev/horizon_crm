/**
 * Public Portal & Lead Form E2E Tests
 * Covers: guest-accessible inquiry form, lead creation API, form validation, thank-you page
 */
import { test, expect } from "@playwright/test";
import { USERS, login, getCsrfToken } from "./fixtures";

test.describe("Public Lead-Capture Portal", () => {
  test("Portal inquiry form loads without authentication", async ({ page }) => {
    // Act — navigate to portal as guest (no login)
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });

    // Assert — form should be visible with key fields
    await expect(page.locator("#lead-form")).toBeVisible();
    await expect(page.locator("#full_name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#destination")).toBeVisible();
    await expect(page.locator("#departure_date")).toBeVisible();
    await expect(page.locator("#btn-submit")).toBeVisible();
  });

  test("Form renders all expected fields", async ({ page }) => {
    // Act
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });

    // Assert — all form fields present
    const expectedFields = [
      "full_name", "email", "phone", "destination",
      "travel_type", "num_travelers", "departure_date",
      "return_date", "budget_min", "budget_max", "notes",
    ];
    for (const field of expectedFields) {
      await expect(page.locator(`#${field}`)).toBeVisible();
    }
  });

  test("Travel type select has options from database", async ({ page }) => {
    // Act
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });

    // Assert — select should have travel type options
    const options = page.locator("#travel_type option");
    const count = await options.count();
    expect(count).toBeGreaterThan(1); // At least "-- Select --" + one type
  });

  test("Guest can submit lead via API", async ({ page }) => {
    // Arrange — get CSRF token from portal page (cookie-based)
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Act — submit lead via API
    const resp = await page.request.post(
      "/api/method/horizon_crm.api.portal.submit_lead",
      {
        data: {
          full_name: "E2E Portal Lead",
          email: `portal-e2e-${Date.now()}@test.example`,
          phone: "+9876543210",
          destination: "Bali",
          travel_type: "Honeymoon",
          departure_date: "2026-09-01",
          return_date: "2026-09-10",
          num_travelers: 2,
          budget_min: 5000,
          budget_max: 8000,
          notes: "E2E test lead submission",
        },
      }
    );

    // Assert
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.message.name).toMatch(/^LEAD-/);
    expect(body.message.message).toContain("submitted");
  });

  test("Lead created with correct data and source=Website", async ({ page }) => {
    // Arrange — login as admin to verify lead data
    await login(page, USERS.admin.email, USERS.admin.password);

    const ts = Date.now();
    const email = `verify-lead-${ts}@test.example`;

    // Act — submit lead via API (as guest context)
    const guestCtx = await page.context().browser()!.newContext();
    const guestPage = await guestCtx.newPage();
    await guestPage.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });
    await guestPage.waitForTimeout(500);

    const resp = await guestPage.request.post(
      "/api/method/horizon_crm.api.portal.submit_lead",
      {
        data: {
          full_name: `Verify Lead ${ts}`,
          email: email,
          destination: "Paris",
          departure_date: "2026-10-01",
          num_travelers: 3,
        },
      }
    );
    expect(resp.ok()).toBeTruthy();
    const leadName = (await resp.json()).message.name;
    await guestCtx.close();

    // Assert — verify lead data via admin API
    const leadResp = await page.request.get(`/api/resource/Travel Lead/${leadName}`);
    expect(leadResp.ok()).toBeTruthy();
    const lead = (await leadResp.json()).data;
    expect(lead.lead_name).toContain(`Verify Lead ${ts}`);
    expect(lead.email).toBe(email);
    expect(lead.source).toBe("Website");
    expect(lead.status).toBe("New");
    expect(lead.interested_destination).toBe("Paris");
    expect(lead.num_travelers).toBe(3);
  });

  test("Required field: missing name returns error", async ({ page }) => {
    // Arrange
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Act — submit without name
    const resp = await page.request.post(
      "/api/method/horizon_crm.api.portal.submit_lead",
      {
        data: {
          full_name: "",
          email: "missing-name@test.example",
          destination: "Tokyo",
          departure_date: "2026-07-01",
        },
      }
    );

    // Assert
    expect(resp.ok()).toBeFalsy();
    const body = await resp.text();
    expect(body.toLowerCase()).toContain("name");
  });

  test("Required field: missing email returns error", async ({ page }) => {
    // Arrange
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Act — submit without email
    const resp = await page.request.post(
      "/api/method/horizon_crm.api.portal.submit_lead",
      {
        data: {
          full_name: "Missing Email Lead",
          email: "",
          destination: "Dubai",
          departure_date: "2026-08-01",
        },
      }
    );

    // Assert
    expect(resp.ok()).toBeFalsy();
    const body = await resp.text();
    expect(body.toLowerCase()).toContain("email");
  });

  test("Invalid email format returns error", async ({ page }) => {
    // Arrange
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Act — submit with invalid email
    const resp = await page.request.post(
      "/api/method/horizon_crm.api.portal.submit_lead",
      {
        data: {
          full_name: "Bad Email Lead",
          email: "not-an-email",
          destination: "Rome",
          departure_date: "2026-07-01",
        },
      }
    );

    // Assert
    expect(resp.ok()).toBeFalsy();
    const body = await resp.text();
    expect(body.toLowerCase()).toContain("email");
  });

  test("Thank-you page loads", async ({ page }) => {
    // Act
    await page.goto("/portal/thank-you", { waitUntil: "domcontentloaded" });

    // Assert
    await expect(page.locator("body")).toContainText("Thank You");
    await expect(page.locator("body")).toContainText("submitted");
  });

  test("Guest cannot access admin API resources", async ({ page }) => {
    // Act — try to access admin-only API without login
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });

    const resp = await page.request.get("/api/resource/Travel Agency/Travel Agency");

    // Assert — should be forbidden
    expect(resp.ok()).toBeFalsy();
    expect([401, 403, 404]).toContain(resp.status());
  });

  test("Guest cannot create staff records", async ({ page }) => {
    // Act — try to create staff record without login
    await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });

    const resp = await page.request.post("/api/resource/Travel Agency Staff", {
      data: {
        staff_user: "hack@test.example",
        role_in_agency: "Staff",
        is_active: 1,
      },
    });

    // Assert — should be forbidden
    expect([401, 403]).toContain(resp.status());
  });
});
