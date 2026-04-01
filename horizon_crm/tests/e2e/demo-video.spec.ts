// Horizon CRM — Feature Demonstration Video (~10 min)
//
// Run:
//   cd horizon_crm/tests
//   npx playwright test e2e/demo-video.spec.ts --project=chromium
//
// Output:
//   horizon_crm/tests/test-results/demo-video-.../video.webm
import { test, expect, type Page } from "@playwright/test";
import { USERS, login, createDoc, getCsrfToken } from "./fixtures";

/* ── Annotation overlay helper ────────────────────────────────── */

/** Injects a styled annotation banner at the top of the viewport. */
async function showAnnotation(page: Page, text: string, subtext = "") {
  await page.evaluate(
    ({ text, subtext }) => {
      // Remove any existing annotation
      document.getElementById("demo-annotation")?.remove();

      const overlay = document.createElement("div");
      overlay.id = "demo-annotation";
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: #fff; padding: 18px 32px; font-family: system-ui, sans-serif;
        box-shadow: 0 4px 24px rgba(0,0,0,0.3); display: flex;
        align-items: center; gap: 18px; border-bottom: 3px solid #ff6b6b;
        animation: slideDown 0.4s ease-out;
      `;
      overlay.innerHTML = `
        <div style="
          background: #ff6b6b; color: #fff; font-weight: 700;
          padding: 6px 16px; border-radius: 6px; font-size: 13px;
          letter-spacing: 1px; white-space: nowrap;
        ">HORIZON CRM</div>
        <div>
          <div style="font-size: 18px; font-weight: 600; line-height: 1.3;">${text}</div>
          ${subtext ? `<div style="font-size: 13px; color: #94a3b8; margin-top: 2px;">${subtext}</div>` : ""}
        </div>
      `;

      // Add animation keyframe
      if (!document.getElementById("demo-annotation-style")) {
        const style = document.createElement("style");
        style.id = "demo-annotation-style";
        style.textContent = `@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }`;
        document.head.appendChild(style);
      }

      document.body.appendChild(overlay);
    },
    { text, subtext }
  );
  // Give the viewer time to read the annotation
  await page.waitForTimeout(800);
}

/** Removes the annotation overlay. */
async function hideAnnotation(page: Page) {
  await page.evaluate(() => {
    document.getElementById("demo-annotation")?.remove();
  });
}

/** Show annotation, wait for reading, then optionally hide. */
async function annotate(
  page: Page,
  text: string,
  subtext = "",
  readMs = 3000,
  persist = false
) {
  await showAnnotation(page, text, subtext);
  await page.waitForTimeout(readMs);
  if (!persist) await hideAnnotation(page);
}

/** Pauses to let the viewer see the current screen. */
async function pause(page: Page, ms = 2000) {
  await page.waitForTimeout(ms);
}

/** Wait for a page to be ready — tries multiple selectors */
async function waitForPage(page: Page, type: "list" | "form" = "list") {
  const selector = type === "list" ? ".frappe-list" : ".form-layout, .form-page, [data-page-container]";
  try {
    await page.waitForSelector(selector, { timeout: 15000 });
  } catch {
    // Page might have a different structure; just wait a bit
    await page.waitForTimeout(3000);
  }
}

/** Slowly scrolls the page down to reveal content. */
async function slowScroll(page: Page, distance = 400, durationMs = 1500) {
  const steps = 20;
  const stepPx = distance / steps;
  const stepDelay = durationMs / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((px) => window.scrollBy(0, px), stepPx);
    await page.waitForTimeout(stepDelay);
  }
}

/** Highlights an element with a glowing border */
async function highlight(page: Page, selector: string, durationMs = 2500) {
  await page.evaluate(
    ({ selector, duration }) => {
      const el = document.querySelector(selector) as HTMLElement;
      if (!el) return;
      const prev = el.style.cssText;
      el.style.cssText += `
        outline: 3px solid #ff6b6b !important;
        outline-offset: 4px;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(255,107,107,0.4);
        transition: all 0.3s ease;
      `;
      setTimeout(() => {
        el.style.cssText = prev;
      }, duration);
    },
    { selector, duration: durationMs }
  );
  await page.waitForTimeout(durationMs + 300);
}

/* ── Test configuration ───────────────────────────────────────── */

test.use({
  viewport: { width: 1440, height: 900 },
  video: { mode: "on", size: { width: 1440, height: 900 } },
  launchOptions: { slowMo: 80 },
});

/* ── Unique identifiers for demo data ─────────────────────────── */
const TS = Date.now();
const DEMO_CUSTOMER = `Demo Client ${TS}`;
const DEMO_EMAIL = `demo-client-${TS}@example.com`;
const DEMO_LEAD = `Demo Lead ${TS}`;

/* ── THE DEMO ─────────────────────────────────────────────────── */

test("Horizon CRM — Full Feature Demo", async ({ page }) => {
  test.setTimeout(15 * 60 * 1000); // 15 min max

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 1: TITLE SCREEN & LOGIN                         ║
  // ╚═══════════════════════════════════════════════════════════╝

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await annotate(
    page,
    "Horizon CRM — Feature Demonstration",
    "A multi-tenant Travel Agency CRM built on Frappe Framework",
    5000
  );

  await annotate(page, "Chapter 1: Login & Authentication", "Secure role-based access for agency staff");

  // Type credentials visibly
  const emailInput = page.getByPlaceholder("jane@example.com");
  const passwordInput = page.getByPlaceholder("•••••");

  await emailInput.waitFor({ timeout: 10000 });
  await emailInput.fill("");
  await emailInput.type(USERS.agencyAdmin.email, { delay: 40 });
  await pause(page, 500);
  await passwordInput.fill("");
  await passwordInput.type(USERS.agencyAdmin.password, { delay: 40 });
  await pause(page, 800);

  await showAnnotation(page, "Logging in as Agency Admin", "admin@agency1.test — Full management access");
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForTimeout(3000);
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 2: DASHBOARD & WORKSPACE                        ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 2: Dashboard & Workspace",
    "KPIs, charts, and quick navigation for agency operations"
  );

  // Navigate to workspace
  await page.goto("/app/horizon-crm", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  await showAnnotation(page, "Agency Dashboard", "Number cards show real-time KPIs — Inquiries, Bookings, Revenue");
  await pause(page, 4000);
  await hideAnnotation(page);

  // Scroll to show charts
  await showAnnotation(page, "Analytics Charts", "Inquiry pipeline funnel & monthly revenue trends", true);
  await slowScroll(page, 500, 2000);
  await pause(page, 3000);
  await hideAnnotation(page);

  // Scroll back up and show sidebar
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(1000);

  await showAnnotation(
    page,
    "Sidebar Navigation",
    "Organized sections: Pipeline, Customers, Billing, Trip Planning, Suppliers, Team, Settings"
  );
  await pause(page, 4000);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 3: AGENCY SETTINGS (System Admin view)          ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 3: Agency Configuration",
    "Each tenant site has its own agency settings — logo, name, staff limits"
  );

  // Agency settings requires System Manager — use API login
  await page.request.post("/api/method/login", {
    form: { usr: USERS.admin.email, pwd: USERS.admin.password },
  });

  await page.goto("/app/travel-agency", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  await pause(page, 1500);

  await showAnnotation(
    page,
    "Travel Agency (Singleton)",
    "One per tenant site — agency name, admin user, staff capacity, contact info"
  );
  await pause(page, 4000);
  await slowScroll(page, 300, 1500);
  await pause(page, 2000);
  await hideAnnotation(page);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(800);

  // Switch back to Agency Admin for remaining chapters
  await page.request.post("/api/method/login", {
    form: { usr: USERS.agencyAdmin.email, pwd: USERS.agencyAdmin.password },
  });

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 4: STAFF & TEAM MANAGEMENT                      ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 4: Staff & Team Management",
    "Manage agency employees, assign roles, and organize teams"
  );

  // Staff list
  await page.goto("/app/travel-agency-staff", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await pause(page, 1500);

  await showAnnotation(
    page,
    "Staff Directory",
    "Each staff member is linked to a User with role-based desk access"
  );
  await pause(page, 3500);
  await hideAnnotation(page);

  // Open first staff record
  const firstStaff = page.locator(".frappe-list .list-row .level-left a").first();
  if (await firstStaff.isVisible()) {
    await firstStaff.click();
    await waitForPage(page, "form");
    await pause(page, 1500);

    await showAnnotation(
      page,
      "Staff Profile",
      "Role in Agency (Admin / Team Lead / Staff), linked User account, active status"
    );
    await pause(page, 3500);
    await hideAnnotation(page);
  }

  // Teams
  await page.goto("/app/travel-team", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await showAnnotation(page, "Teams", "Group staff into teams with designated team leads");
  await pause(page, 3000);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 5: PUBLIC PORTAL — LEAD CAPTURE FORM            ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 5: Public Lead-Capture Portal",
    "Guest-accessible form — no login required. Embeddable via iframe."
  );

  // Clear cookies to demonstrate guest access
  await page.context().clearCookies();
  await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await showAnnotation(
    page,
    "Public Inquiry Form",
    "Website visitors fill this form — creates a Travel Lead with source='Website'"
  );
  await pause(page, 3500);
  await hideAnnotation(page);

  // Fill the form visually
  await showAnnotation(page, "Filling the inquiry form…", "All fields rendered as plain HTML — works for any visitor");

  await page.type("#full_name", DEMO_LEAD, { delay: 30 });
  await pause(page, 400);
  await page.type("#email", `demo-lead-${TS}@example.com`, { delay: 25 });
  await pause(page, 400);
  await page.type("#phone", "+91 98765 43210", { delay: 25 });
  await pause(page, 400);
  await page.fill("#destination", "");
  await page.type("#destination", "Bali", { delay: 50 });
  await pause(page, 400);
  await page.selectOption("#travel_type", { index: 1 }); // pick first travel type
  await pause(page, 400);
  await page.fill("#num_travelers", "2");
  await pause(page, 400);
  // Set dates
  const today = new Date();
  const dep = new Date(today);
  dep.setDate(dep.getDate() + 30);
  const ret = new Date(dep);
  ret.setDate(ret.getDate() + 7);
  await page.fill("#departure_date", dep.toISOString().split("T")[0]);
  await pause(page, 300);
  await page.fill("#return_date", ret.toISOString().split("T")[0]);
  await pause(page, 300);
  await page.fill("#budget_max", "150000");
  await pause(page, 300);

  await slowScroll(page, 200, 800);

  await page.type("#notes", "Honeymoon trip — need luxury resort, spa, private pool villa.", { delay: 20 });
  await pause(page, 1000);
  await hideAnnotation(page);

  // Submit
  await showAnnotation(page, "Submitting the form…", "POST to /api/method/horizon_crm.api.portal.submit_lead (rate-limited: 10/hr)");
  await page.click("#btn-submit");
  await page.waitForURL("**/portal/thank-you**", { timeout: 15000 });
  await page.waitForTimeout(1500);
  await hideAnnotation(page);

  await annotate(
    page,
    "Thank You Page",
    "Visitor sees confirmation. Lead is now in the CRM for staff to follow up.",
    4000
  );

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 6: LEAD PIPELINE                                ║
  // ╚═══════════════════════════════════════════════════════════╝

  // Log back in as admin
  await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

  await annotate(
    page,
    "Chapter 6: Lead Pipeline",
    "Pre-qualification funnel — New → Contacted → Qualified → Converted"
  );

  await page.goto("/app/travel-lead", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await pause(page, 1500);

  await showAnnotation(
    page,
    "Travel Leads List",
    "The lead submitted from the portal appears here with source='Website'"
  );
  await pause(page, 3500);
  await hideAnnotation(page);

  // Open the lead we just created (it should be at the top or we find it)
  const portalLead = page.locator(`.frappe-list .list-row:has-text("${DEMO_LEAD}")`).first();
  if (await portalLead.isVisible({ timeout: 3000 }).catch(() => false)) {
    await portalLead.locator("a").first().click();
    await waitForPage(page, "form");
    await pause(page, 1500);

    await showAnnotation(
      page,
      "Website Lead Detail",
      "All portal form data captured — name, email, destination, budget, notes"
    );
    await pause(page, 4000);
    await slowScroll(page, 300, 1500);
    await pause(page, 2000);
    await hideAnnotation(page);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await page.waitForTimeout(800);
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 7: CUSTOMER MANAGEMENT                          ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 7: Customer Management",
    "Customer profiles with contact info, preferences, and travel history"
  );

  // Create a customer for the demo
  await page.goto("/app/travel-customer/new", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "form");
  await pause(page, 1000);

  await showAnnotation(page, "Creating a New Customer", "Track customer details, passport info, and preferences");

  // Fill customer form
  const custNameField = page.locator('[data-fieldname="customer_name"] input');
  await custNameField.fill("");
  await custNameField.type(DEMO_CUSTOMER, { delay: 30 });
  await pause(page, 400);

  const custEmailField = page.locator('[data-fieldname="email"] input');
  await custEmailField.fill("");
  await custEmailField.type(DEMO_EMAIL, { delay: 25 });
  await pause(page, 400);

  const custPhoneField = page.locator('[data-fieldname="phone"] input');
  await custPhoneField.fill("");
  await custPhoneField.type("+91 87654 32100", { delay: 25 });
  await pause(page, 400);

  await hideAnnotation(page);

  // Save
  await showAnnotation(page, "Saving customer record…");
  await page.keyboard.press("Control+s");
  await page.waitForTimeout(2500);
  await hideAnnotation(page);

  await annotate(page, "Customer Saved!", "Ready to link to inquiries and bookings", 2500);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 8: INQUIRY WORKFLOW                             ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 8: Inquiry Workflow",
    "Full sales pipeline — New → Contacted → Quoted → Won → Lost"
  );

  await page.goto("/app/travel-inquiry/new", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "form");
  await pause(page, 1000);

  await showAnnotation(page, "Creating a Travel Inquiry", "Link customer, set destination, dates, budget, and travel details");

  // Fill inquiry — customer link
  const custLinkInput = page.locator('[data-fieldname="customer"] .control-input input');
  await custLinkInput.fill("");
  await custLinkInput.fill(DEMO_CUSTOMER);
  await page.waitForTimeout(800);
  const suggestion = page.locator(".awesomplete li").first();
  if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
    await suggestion.click();
  }
  await pause(page, 500);

  // Destination
  const destInput = page.locator('[data-fieldname="destination"] .control-input input');
  await destInput.fill("Bali");
  await page.waitForTimeout(600);
  const destSuggestion = page.locator(".awesomplete li").first();
  if (await destSuggestion.isVisible({ timeout: 2000 }).catch(() => false)) {
    await destSuggestion.click();
  }
  await pause(page, 400);

  // Travel type
  const ttSelect = page.locator('[data-fieldname="travel_type"] .control-input select');
  if (await ttSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    const options = await ttSelect.locator("option").allTextContents();
    if (options.length > 1) {
      await ttSelect.selectOption({ index: 1 });
    }
  }
  await pause(page, 400);

  // Dates
  const depField = page.locator('[data-fieldname="departure_date"] .control-input input');
  if (await depField.isVisible({ timeout: 2000 }).catch(() => false)) {
    const depDate = new Date();
    depDate.setDate(depDate.getDate() + 45);
    await depField.fill(depDate.toISOString().split("T")[0]);
  }
  await pause(page, 300);

  const retField = page.locator('[data-fieldname="return_date"] .control-input input');
  if (await retField.isVisible({ timeout: 2000 }).catch(() => false)) {
    const retDate = new Date();
    retDate.setDate(retDate.getDate() + 52);
    await retField.fill(retDate.toISOString().split("T")[0]);
  }
  await pause(page, 300);

  await hideAnnotation(page);

  // Save
  await showAnnotation(page, "Saving inquiry…");
  await page.keyboard.press("Control+s");
  await page.waitForTimeout(2500);
  await hideAnnotation(page);

  // Show the pipeline bar
  await showAnnotation(
    page,
    "Inquiry Pipeline Bar",
    "Visual status indicator — drag through New → Contacted → Quoted → Won"
  );
  await pause(page, 4000);
  await hideAnnotation(page);

  // Show inquiry list
  await page.goto("/app/travel-inquiry", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await pause(page, 1500);

  await showAnnotation(page, "Inquiry List View", "Filter by status, assigned agent, destination, or date range");
  await pause(page, 3500);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 9: BOOKINGS & PAYMENTS                          ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 9: Bookings & Payment Tracking",
    "Convert won inquiries to bookings, track payments with visual progress bar"
  );

  await page.goto("/app/travel-booking/new", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "form");
  await pause(page, 1000);

  await showAnnotation(
    page,
    "Creating a Booking",
    "Link customer, set travel details, total amount — then record payments"
  );

  // Fill booking customer
  const bookCust = page.locator('[data-fieldname="customer"] .control-input input');
  await bookCust.fill("");
  await bookCust.fill(DEMO_CUSTOMER);
  await page.waitForTimeout(800);
  const bookSug = page.locator(".awesomplete li").first();
  if (await bookSug.isVisible({ timeout: 3000 }).catch(() => false)) {
    await bookSug.click();
  }
  await pause(page, 500);

  // Total amount
  const amtField = page.locator('[data-fieldname="total_amount"] .control-input input');
  if (await amtField.isVisible({ timeout: 2000 }).catch(() => false)) {
    await amtField.fill("150000");
  }
  await pause(page, 400);

  // Destination
  const bookDest = page.locator('[data-fieldname="destination"] .control-input input');
  if (await bookDest.isVisible({ timeout: 2000 }).catch(() => false)) {
    await bookDest.fill("Bali");
    await page.waitForTimeout(600);
    const dSug = page.locator(".awesomplete li").first();
    if (await dSug.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dSug.click();
    }
  }
  await pause(page, 400);

  await hideAnnotation(page);

  // Save booking
  await showAnnotation(page, "Saving booking…");
  await page.keyboard.press("Control+s");
  await page.waitForTimeout(2500);
  await hideAnnotation(page);

  await showAnnotation(
    page,
    "Booking Created!",
    "Payment tracking starts — add payments in the child table to see the progress bar"
  );
  await slowScroll(page, 400, 1500);
  await pause(page, 3500);
  await hideAnnotation(page);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(800);

  // Booking list
  await page.goto("/app/travel-booking", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await pause(page, 1500);

  await showAnnotation(page, "Booking List", "Track all bookings — Confirmed, In Progress, Completed, Cancelled");
  await pause(page, 3000);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 10: DESTINATIONS & TRAVEL TYPES                 ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 10: Master Data — Destinations & Travel Types",
    "Pre-configured lookup data used across the CRM"
  );

  await page.goto("/app/travel-destination", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await pause(page, 1500);

  await showAnnotation(
    page,
    "Travel Destinations",
    "Bali, Paris, Dubai, Maldives… — mark popular ones for portal form dropdown"
  );
  await pause(page, 3500);
  await hideAnnotation(page);

  // Open a destination
  const firstDest = page.locator(".frappe-list .list-row .level-left a").first();
  if (await firstDest.isVisible()) {
    await firstDest.click();
    await waitForPage(page, "form");
    await pause(page, 1500);

    await showAnnotation(page, "Destination Detail", "Name, country, region, image, and 'Is Popular' flag");
    await pause(page, 3000);
    await hideAnnotation(page);
  }

  // Travel Types
  await page.goto("/app/travel-type", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await pause(page, 1500);

  await showAnnotation(page, "Travel Types", "Adventure, Beach, Business, Cultural, Honeymoon, Family, Group, Solo…");
  await pause(page, 3000);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 11: SUPPLIER MANAGEMENT                         ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 11: Supplier Management",
    "Six category-specific supplier DocTypes with domain-relevant fields"
  );

  // Airlines
  await page.goto("/app/airline-supplier", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await showAnnotation(page, "Airline Suppliers", "IATA code, alliance, hub airports, domestic/international flags");
  await pause(page, 3000);
  await hideAnnotation(page);

  // Hotels
  await page.goto("/app/hotel-supplier", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await showAnnotation(page, "Hotel Suppliers", "Star rating, property type, room count, amenities");
  await pause(page, 3000);
  await hideAnnotation(page);

  // Tour Operators
  await page.goto("/app/tour-operator", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await showAnnotation(page, "Tour Operators", "Specialization, destinations covered, group sizes, languages");
  await pause(page, 3000);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 12: ITINERARY PLANNING                          ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 12: Itinerary Builder",
    "Day-by-day travel plans attached to bookings"
  );

  await page.goto("/app/travel-itinerary", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await showAnnotation(page, "Travel Itineraries", "Create detailed day-by-day plans with activities, accommodations, and costs");
  await pause(page, 3500);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 13: INVOICING                                   ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 13: Invoicing & Billing",
    "Create invoices with line items, track outstanding amounts"
  );

  await page.goto("/app/travel-invoice", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await showAnnotation(page, "Travel Invoices", "Customer billing with grand total, due date, and outstanding amount tracking");
  await pause(page, 3500);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 14: FEEDBACK                                    ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 14: Customer Feedback",
    "Post-travel feedback with 1-5 star ratings"
  );

  await page.goto("/app/travel-feedback", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await showAnnotation(page, "Travel Feedback", "Star rating, comments — linked to booking and customer for tracking");
  await pause(page, 3000);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 15: KANBAN BOARDS                               ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 15: Kanban Boards",
    "Visual drag-and-drop pipeline management"
  );

  // Try to show inquiry kanban
  await page.goto("/app/travel-lead?view=Kanban&kanban_board=Lead Pipeline", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000);

  await showAnnotation(
    page,
    "Lead Pipeline Kanban",
    "Drag cards between columns to update status — New, Contacted, Qualified, Converted"
  );
  await pause(page, 4000);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 16: ROLE-BASED ACCESS                           ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 16: Role-Based Access Control",
    "Demonstrating different views for Staff vs Admin roles"
  );

  // Login as staff — use API login for reliability
  await page.request.get("/api/method/logout");
  await page.waitForTimeout(1000);

  await showAnnotation(page, "Switching to Staff User", `${USERS.staff.email} — Limited operational access`);

  await page.request.post("/api/method/login", {
    form: { usr: USERS.staff.email, pwd: USERS.staff.password },
  });
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await hideAnnotation(page);

  await showAnnotation(
    page,
    "Staff View",
    "Staff can see inquiries, bookings, customers — but cannot access agency settings or staff management"
  );
  await pause(page, 4000);
  await hideAnnotation(page);

  // Show that staff can access inquiries
  await page.goto("/app/travel-inquiry", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await showAnnotation(page, "Staff — Inquiry Access", "Staff can create & manage inquiries assigned to them");
  await pause(page, 3000);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 17: DARK THEME                                  ║
  // ╚═══════════════════════════════════════════════════════════╝

  // Switch back to admin for the finale
  await login(page, USERS.agencyAdmin.email, USERS.agencyAdmin.password);

  await annotate(page, "Chapter 17: Dark Theme", "Built-in support for light and dark modes");

  // Try to toggle dark theme via Frappe API
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    document.body.classList.add("dark");
  });
  await page.waitForTimeout(1000);

  await page.goto("/app/horizon-crm", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  await showAnnotation(page, "Dark Mode Dashboard", "Full dark theme support across the entire CRM");
  await pause(page, 4000);
  await hideAnnotation(page);

  // Switch back to light
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.body.classList.remove("dark");
  });
  await page.waitForTimeout(1000);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER 18: MULTI-TENANCY                               ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Chapter 18: Multi-Tenancy Architecture",
    "Each agency runs on a separate Frappe site with its own database — complete data isolation"
  );

  await page.goto("/app/horizon-crm", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await showAnnotation(
    page,
    "Site-Per-Tenant Model",
    "agency1.example.com, agency2.example.com — separate databases, shared app code. Zero cross-tenant data leakage."
  );
  await pause(page, 5000);
  await hideAnnotation(page);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CLOSING                                                 ║
  // ╚═══════════════════════════════════════════════════════════╝

  await annotate(
    page,
    "Thank You!",
    "Horizon CRM — Multi-tenant Travel Agency CRM • Built on Frappe Framework",
    6000
  );

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CLEANUP — remove demo records                           ║
  // ╚═══════════════════════════════════════════════════════════╝

  await hideAnnotation(page);

  // Cleanup demo data via API
  const csrf = getCsrfToken();

  // Delete demo customer bookings/inquiries first
  const inquiriesResp = await page.request.get(
    `/api/resource/Travel Inquiry?filters=${JSON.stringify({ customer_name: DEMO_CUSTOMER })}&limit_page_length=100`
  );
  if (inquiriesResp.ok()) {
    const inquiries = (await inquiriesResp.json()).data || [];
    for (const inq of inquiries) {
      await page.request.delete(`/api/resource/Travel Inquiry/${inq.name}`, {
        headers: { "X-Frappe-CSRF-Token": csrf },
      });
    }
  }

  const bookingsResp = await page.request.get(
    `/api/resource/Travel Booking?filters=${JSON.stringify({ customer: DEMO_CUSTOMER })}&limit_page_length=100`
  );
  if (bookingsResp.ok()) {
    const bookings = (await bookingsResp.json()).data || [];
    for (const b of bookings) {
      await page.request.delete(`/api/resource/Travel Booking/${b.name}`, {
        headers: { "X-Frappe-CSRF-Token": csrf },
      });
    }
  }

  // Delete demo customer
  await page.request.delete(
    `/api/resource/Travel Customer/${encodeURIComponent(DEMO_CUSTOMER)}`,
    { headers: { "X-Frappe-CSRF-Token": csrf } }
  );

  // Delete demo lead(s)
  const leadsResp = await page.request.get(
    `/api/resource/Travel Lead?filters=${JSON.stringify({ lead_name: ["like", `%${TS}%`] })}&limit_page_length=100`
  );
  if (leadsResp.ok()) {
    const leads = (await leadsResp.json()).data || [];
    for (const l of leads) {
      await page.request.delete(`/api/resource/Travel Lead/${l.name}`, {
        headers: { "X-Frappe-CSRF-Token": csrf },
      });
    }
  }
});
