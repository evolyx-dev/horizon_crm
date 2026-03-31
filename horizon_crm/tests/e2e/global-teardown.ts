/**
 * Global teardown — runs once after all test projects.
 * Cleans up test-created data to prevent accumulation across runs.
 */
import { test as teardown } from "@playwright/test";
import { USERS, login, getCsrfToken } from "./fixtures";

/** Delete all docs of a given doctype matching an email-based filter */
async function cleanupDocs(
  page: import("@playwright/test").Page,
  doctype: string,
  filterField: string,
  filterValues: string[]
) {
  const token = getCsrfToken();
  for (const val of filterValues) {
    const filters = JSON.stringify({ [filterField]: val });
    const resp = await page.request.get(
      `/api/resource/${doctype}?filters=${filters}&limit_page_length=100`
    );
    if (resp.ok()) {
      const body = await resp.json();
      for (const doc of body.data) {
        await page.request.delete(`/api/resource/${doctype}/${doc.name}`, {
          headers: { "X-Frappe-CSRF-Token": token },
        });
      }
    }
  }
}

/** Delete docs by name pattern */
async function cleanupByPattern(
  page: import("@playwright/test").Page,
  doctype: string,
  fieldName: string,
  pattern: string
) {
  const token = getCsrfToken();
  const filters = JSON.stringify({ [fieldName]: ["like", `%${pattern}%`] });
  const resp = await page.request.get(
    `/api/resource/${doctype}?filters=${filters}&limit_page_length=100`
  );
  if (resp.ok()) {
    const body = await resp.json();
    for (const doc of body.data) {
      await page.request.delete(`/api/resource/${doctype}/${doc.name}`, {
        headers: { "X-Frappe-CSRF-Token": token },
      });
    }
  }
}

teardown("cleanup test data", async ({ page }) => {
  await login(page, USERS.admin.email, USERS.admin.password);

  // Cleanup test emails used across specs
  const testEmails = [
    "inquiry-test@test.example",
    "booking-test@test.example",
    "xss-",
    "overflow@test.example",
  ];

  // Clean up feedback first (depends on booking)
  await cleanupByPattern(page, "Travel Feedback", "comments", "E2E");

  // Clean up bookings (depends on customer)
  await cleanupDocs(page, "Travel Booking", "customer_name", [
    "Booking Test Customer",
    "Inquiry Test Customer",
    "Test Customer One",
  ]);

  // Clean up inquiries
  await cleanupDocs(page, "Travel Inquiry", "customer_email", [
    "inquiry-test@test.example",
  ]);

  // Clean up test teams
  await cleanupByPattern(page, "Travel Team", "team_name", "E2E Team");

  // Clean up test suppliers
  await cleanupByPattern(page, "Travel Supplier", "supplier_name", "E2E Supplier");

  // Clean up test itineraries
  await cleanupByPattern(page, "Travel Itinerary", "itinerary_name", "E2E Itinerary");

  // Clean up test customers (except the portal customer used by fixtures)
  await cleanupDocs(page, "Travel Customer", "email", [
    "inquiry-test@test.example",
    "booking-test@test.example",
  ]);
});
