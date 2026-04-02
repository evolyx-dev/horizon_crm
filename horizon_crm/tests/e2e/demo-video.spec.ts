// Horizon CRM — Complete Feature Demonstration Video (~20 min)
//
// Records an annotated walkthrough of every major feature with
// pre-created demo data so lists and forms are fully populated.
//
// Run:
//   cd horizon_crm/tests
//   npm run demo
//   # or:
//   npx playwright test e2e/demo-video.spec.ts --project=chromium
//
// Output:
//   horizon_crm/tests/test-results/demo-video-*/video.webm
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import {
  USERS,
  login,
  logout,
  createDoc,
  deleteDoc,
  getCsrfToken,
} from "./fixtures";

/* ═══════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

async function showAnnotation(page: Page, text: string, subtext = "") {
  await page.evaluate(
    ({ text, subtext }) => {
      document.getElementById("demo-annotation")?.remove();
      const el = document.createElement("div");
      el.id = "demo-annotation";
      el.style.cssText = `
        position:fixed;top:0;left:0;right:0;z-index:99999;
        background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);
        color:#fff;padding:18px 32px;font-family:system-ui,sans-serif;
        box-shadow:0 4px 24px rgba(0,0,0,.3);display:flex;
        align-items:center;gap:18px;border-bottom:3px solid #ff6b6b;
        animation:demoSlide .4s ease-out;
      `;
      el.innerHTML = `
        <div style="background:#ff6b6b;color:#fff;font-weight:700;
          padding:6px 16px;border-radius:6px;font-size:13px;
          letter-spacing:1px;white-space:nowrap;">HORIZON CRM</div>
        <div>
          <div style="font-size:18px;font-weight:600;line-height:1.3">${text}</div>
          ${subtext ? `<div style="font-size:13px;color:#94a3b8;margin-top:2px">${subtext}</div>` : ""}
        </div>`;
      if (!document.getElementById("demo-ann-style")) {
        const s = document.createElement("style");
        s.id = "demo-ann-style";
        s.textContent = "@keyframes demoSlide{from{transform:translateY(-100%)}to{transform:translateY(0)}}";
        document.head.appendChild(s);
      }
      document.body.appendChild(el);
    },
    { text, subtext },
  );
  await page.waitForTimeout(600);
}

async function hideAnnotation(page: Page) {
  await page.evaluate(() => document.getElementById("demo-annotation")?.remove());
}

async function annotate(page: Page, text: string, subtext = "", readMs = 4000) {
  await showAnnotation(page, text, subtext);
  await page.waitForTimeout(readMs);
  await hideAnnotation(page);
}

async function pause(page: Page, ms = 2000) {
  await page.waitForTimeout(ms);
}

async function slowScroll(page: Page, distance = 400, durationMs = 2000) {
  const steps = 25;
  const px = distance / steps;
  const delay = durationMs / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy(0, d), px);
    await page.waitForTimeout(delay);
  }
}

async function scrollToTop(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(800);
}

async function waitForPage(page: Page, type: "list" | "form" = "list") {
  const sel = type === "list" ? ".frappe-list" : ".form-layout, .form-page";
  try {
    await page.waitForSelector(sel, { timeout: 15000 });
  } catch {
    await page.waitForTimeout(3000);
  }
  await page.waitForTimeout(800);
}

async function openFirstListItem(page: Page): Promise<boolean> {
  const link = page.locator(
    ".frappe-list .result .list-row a, .frappe-list .list-row--col a.ellipsis, .frappe-list .level-left a",
  ).first();
  try {
    await link.waitFor({ state: "visible", timeout: 5000 });
    await link.click();
    await waitForPage(page, "form");
    return true;
  } catch {
    return false;
  }
}

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

async function chapterTitle(page: Page, num: number, title: string, subtitle: string) {
  await annotate(page, `Chapter ${num}: ${title}`, subtitle, 5000);
}

async function showcaseList(page: Page, route: string, title: string, sub: string) {
  await page.goto(`/app/${route}`, { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await pause(page, 1000);
  await showAnnotation(page, title, sub);
  await pause(page, 5000);
  await slowScroll(page, 300, 1500);
  await pause(page, 2000);
  await hideAnnotation(page);
}

async function refreshCsrf(page: Page): Promise<string> {
  try {
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => (window as any).frappe?.csrf_token, null, { timeout: 10000 });
    return await page.evaluate(() => (window as any).frappe?.csrf_token || "");
  } catch {
    return "";
  }
}

/* ═══════════════════════════════════════════════════════════════
   TEST CONFIGURATION
   ═══════════════════════════════════════════════════════════════ */

test.use({
  viewport: { width: 1440, height: 900 },
  video: { mode: "on", size: { width: 1440, height: 900 } },
  launchOptions: { slowMo: 80 },
});

const TS = Date.now();

/* ═══════════════════════════════════════════════════════════════
   THE DEMO
   ═══════════════════════════════════════════════════════════════ */

test("Horizon CRM — Complete Feature Demo", async ({ page, context }) => {
  test.setTimeout(30 * 60 * 1000);

  const created: Record<string, string[]> = {
    customers: [], leads: [], inquiries: [], bookings: [],
    itineraries: [], invoices: [], feedbacks: [], teams: [], suppliers: [],
  };

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║  PHASE 1 — SEED DEMO DATA                                   ║
  // ╚═══════════════════════════════════════════════════════════════╝

  await login(page, USERS.admin.email, USERS.admin.password);
  await showAnnotation(page, "Preparing Demo Environment", "Creating sample customers, leads, bookings, suppliers, and more…");
  await pause(page, 2000);

  // ── Customers ──
  for (const c of [
    { customer_name: "Rajesh Sharma", email: "rajesh.sharma@horizon-demo.test", phone: "+91 98765 43210", nationality: "Indian" },
    { customer_name: "Priya Patel", email: "priya.patel@horizon-demo.test", phone: "+91 87654 32100", loyalty_tier: "Gold", nationality: "Indian" },
    { customer_name: "John Williams", email: "john.williams@horizon-demo.test", phone: "+1 555 019 8234", nationality: "American" },
    { customer_name: "Aisha Khan", email: "aisha.khan@horizon-demo.test", phone: "+91 77654 32100", nationality: "Indian" },
  ]) {
    const r = await createDoc(page, "Travel Customer", c);
    created.customers.push(r.data.name);
  }

  // ── Leads ──
  for (const l of [
    { lead_name: "Ananya Verma", email: "ananya.verma@horizon-demo.test", phone: "+91 99876 54321", status: "New", source: "Website", interested_destination: "Bali", travel_type: "Honeymoon", expected_budget: 200000, num_travelers: 2 },
    { lead_name: "Michael Chen", email: "michael.chen@horizon-demo.test", status: "Contacted", source: "Referral", interested_destination: "Tokyo", travel_type: "Cultural", num_travelers: 3, priority: "Medium" },
    { lead_name: "Sarah Johnson", email: "sarah.johnson@horizon-demo.test", status: "Qualified", source: "Social Media", interested_destination: "Paris", travel_type: "Luxury", expected_budget: 500000, priority: "High" },
    { lead_name: "Amit Kumar", email: "amit.kumar@horizon-demo.test", phone: "+91 88765 43210", status: "Interested", source: "Google Ads", interested_destination: "Dubai", travel_type: "Business", priority: "High" },
    { lead_name: "Emma Wilson", email: "emma.wilson@horizon-demo.test", status: "Converted", source: "Travel Fair", interested_destination: "Maldives", travel_type: "Honeymoon", expected_budget: 600000 },
  ]) {
    const r = await createDoc(page, "Travel Lead", l);
    created.leads.push(r.data.name);
  }

  // ── Inquiries ──
  for (const i of [
    { customer: created.customers[0], destination: "Bali", travel_type: "Honeymoon", status: "New", departure_date: futureDate(30), return_date: futureDate(37), num_travelers: 2, budget_min: 100000, budget_max: 200000, source: "Walk-in" },
    { customer: created.customers[1], destination: "Paris", travel_type: "Family", status: "Quoted", departure_date: futureDate(60), return_date: futureDate(70), num_travelers: 4, budget_min: 300000, budget_max: 500000, source: "Phone", priority: "High" },
    { customer: created.customers[2], destination: "Maldives", travel_type: "Luxury", status: "Won", departure_date: futureDate(90), return_date: futureDate(97), num_travelers: 2, budget_max: 600000, source: "Email" },
    { customer: created.customers[3], destination: "Dubai", travel_type: "Business", status: "Contacted", departure_date: futureDate(45), return_date: futureDate(50), num_travelers: 1, source: "Referral" },
    { customer: created.customers[0], destination: "Tokyo", travel_type: "Cultural", status: "Lost", departure_date: futureDate(20), return_date: futureDate(28), num_travelers: 2, source: "Website", lost_reason: "Budget Too High" },
  ]) {
    const r = await createDoc(page, "Travel Inquiry", i);
    created.inquiries.push(r.data.name);
  }

  // ── Bookings with payments ──
  for (const b of [
    {
      customer: created.customers[2], destination: "Maldives",
      departure_date: futureDate(90), return_date: futureDate(97),
      num_travelers: 2, total_amount: 520000, status: "Confirmed",
      inquiry: created.inquiries[2],
      payments: [
        { amount: 200000, payment_date: todayStr(), payment_method: "Bank Transfer", status: "Received", reference: "NEFT-78234" },
        { amount: 120000, payment_date: todayStr(), payment_method: "Card", status: "Received", reference: "CC-4521" },
      ],
    },
    {
      customer: created.customers[1], destination: "Paris",
      departure_date: futureDate(60), return_date: futureDate(70),
      num_travelers: 4, total_amount: 420000, status: "In Progress",
      payments: [
        { amount: 200000, payment_date: todayStr(), payment_method: "Online", status: "Received", reference: "UPI-9988" },
      ],
    },
    {
      customer: created.customers[0], destination: "Dubai",
      departure_date: futureDate(45), return_date: futureDate(50),
      num_travelers: 1, total_amount: 155000, status: "Confirmed",
      payments: [
        { amount: 155000, payment_date: todayStr(), payment_method: "Bank Transfer", status: "Received", reference: "NEFT-65432" },
      ],
    },
  ]) {
    const r = await createDoc(page, "Travel Booking", b);
    created.bookings.push(r.data.name);
  }

  // ── Itinerary ──
  {
    const r = await createDoc(page, "Travel Itinerary", {
      itinerary_name: `Maldives Luxury 7D-6N (${TS})`,
      booking: created.bookings[0],
      start_date: futureDate(90), end_date: futureDate(97), status: "Shared",
      items: [
        { day_number: 1, title: "Arrival & Resort Check-in", description: "Male airport pickup, speedboat to resort, welcome cocktail & villa orientation", accommodation: "Water Villa — Paradise Island Resort", meals_included: "Full Board", estimated_cost: 35000 },
        { day_number: 2, title: "Snorkeling & Spa Day", description: "Morning reef snorkeling with guide, afternoon couples spa with ocean view", accommodation: "Water Villa", meals_included: "Full Board", estimated_cost: 25000 },
        { day_number: 3, title: "Island Hopping Cruise", description: "Private dhoni cruise, visit local island, sunset dolphin watching", accommodation: "Water Villa", transport: "Private Dhoni", meals_included: "Full Board", estimated_cost: 32000 },
        { day_number: 4, title: "Scuba Diving & Beach", description: "Morning introductory scuba dive, afternoon beach relaxation, night fishing", accommodation: "Water Villa", meals_included: "Full Board", estimated_cost: 28000 },
        { day_number: 5, title: "Cultural Tour & Cooking Class", description: "Visit Male city, local fish market, Maldivian cooking class", transport: "Speedboat", accommodation: "Water Villa", meals_included: "Half Board", estimated_cost: 22000 },
        { day_number: 6, title: "Free Day & Farewell Dinner", description: "Free morning for leisure, overwater restaurant farewell dinner with live music", accommodation: "Water Villa", meals_included: "Full Board", estimated_cost: 38000 },
        { day_number: 7, title: "Departure", description: "Breakfast, resort checkout, speedboat to Male airport", transport: "Speedboat + Flight", meals_included: "Breakfast", estimated_cost: 15000 },
      ],
    });
    created.itineraries.push(r.data.name);
  }

  // ── Invoice with line items ──
  {
    const r = await createDoc(page, "Travel Invoice", {
      customer: created.customers[2], booking: created.bookings[0],
      invoice_date: todayStr(), due_date: futureDate(30), status: "Sent", tax_percent: 18,
      items: [
        { item_description: `Return Flights — Male International 2 pax (${TS})`, quantity: 2, rate: 85000 },
        { item_description: `Water Villa — Paradise Island Resort 6 nights (${TS})`, quantity: 6, rate: 42000 },
        { item_description: `Speedboat Airport Transfers round trip (${TS})`, quantity: 2, rate: 7500 },
        { item_description: `Reef Snorkeling Package 2 pax (${TS})`, quantity: 2, rate: 5000 },
        { item_description: `Couples Spa Treatment (${TS})`, quantity: 1, rate: 18000 },
        { item_description: `Private Dhoni Cruise Half Day (${TS})`, quantity: 1, rate: 25000 },
      ],
    });
    created.invoices.push(r.data.name);
  }

  // ── Feedback ──
  {
    const r = await createDoc(page, "Travel Feedback", {
      booking: created.bookings[2], customer: created.customers[0],
      rating: 1, overall_experience: "Excellent", would_recommend: 1,
      comments: "Absolutely wonderful trip to Dubai! The hotel was luxurious, the desert safari was a once-in-a-lifetime experience, and the city tours were perfectly planned. Our travel agent went above and beyond. Highly recommend!",
    });
    created.feedbacks.push(r.data.name);
  }

  // ── Suppliers ──
  const supplierDefs: { dt: string; data: Record<string, unknown> }[] = [
    { dt: "Airline Supplier", data: { airline_name: `Air India (${TS})`, iata_code: "AI", is_active: 1, contact_email: "bookings@airindia.test", phone: "+91 124 264 8888", hub_airports: "Mumbai (BOM), Delhi (DEL), Bangalore (BLR)", alliance: "Star Alliance", domestic: 1, international: 1, country: "India", city: "New Delhi", services: [{ service_name: "Economy Class", price: 15000 }, { service_name: "Business Class", price: 65000 }] } },
    { dt: "Airline Supplier", data: { airline_name: `Emirates (${TS})`, iata_code: "EK", is_active: 1, contact_email: "agents@emirates.test", hub_airports: "Dubai (DXB)", alliance: "None", domestic: 0, international: 1, country: "UAE", city: "Dubai", services: [{ service_name: "Economy", price: 35000 }, { service_name: "Business", price: 125000 }] } },
    { dt: "Hotel Supplier", data: { hotel_name: `Taj Palace Mumbai (${TS})`, star_rating: "5 Star", is_active: 1, contact_email: "reservations@tajhotels.test", property_type: "Hotel", total_rooms: 285, check_in_time: "14:00", check_out_time: "12:00", pool: 1, spa: 1, gym: 1, restaurant: 1, wifi: 1, parking: 1, country: "India", city: "Mumbai", services: [{ service_name: "Deluxe Room", price: 15000 }, { service_name: "Luxury Suite", price: 45000 }] } },
    { dt: "Hotel Supplier", data: { hotel_name: `Marriott Resort Bali (${TS})`, star_rating: "5 Star", is_active: 1, contact_email: "bali@marriott.test", property_type: "Resort", total_rooms: 400, pool: 1, spa: 1, gym: 1, restaurant: 1, wifi: 1, airport_shuttle: 1, country: "Indonesia", city: "Bali" } },
    { dt: "Tour Operator", data: { operator_name: `Thomas Cook India (${TS})`, is_active: 1, contact_email: "groups@thomascook.test", specialization: "General", destinations_covered: "Europe, Southeast Asia, Middle East, Africa", group_size_min: 2, group_size_max: 30, languages: "English, Hindi, Marathi, Gujarati", country: "India", city: "Mumbai" } },
    { dt: "Transport Supplier", data: { transport_name: `Ola Corporate (${TS})`, transport_type: "Car Rental", is_active: 1, contact_email: "corporate@ola.test", fleet_size: 150, vehicle_types: "Sedan, SUV, Luxury, Tempo Traveller", max_passengers: 12, ac_available: 1, country: "India", city: "Mumbai", services: [{ service_name: "Airport Transfer", price: 1500 }, { service_name: "Full-Day SUV", price: 5000 }] } },
    { dt: "Visa Agent", data: { agent_name: `VFS Global (${TS})`, is_active: 1, contact_email: "info@vfsglobal.test", countries_served: "USA, UK, Canada, Schengen (26 countries), Australia", visa_types: "Tourist, Business, Student, Transit, Work Permit", avg_processing_days: 12, success_rate: 95, express_available: 1, country: "India", city: "Mumbai" } },
    { dt: "Insurance Provider", data: { provider_name: `Travel Guard India (${TS})`, is_active: 1, contact_email: "claims@travelguard.test", insurance_types: "Trip Cancellation, Medical Emergency, Baggage Loss, Flight Delay", coverage_regions: "Worldwide including USA & Canada", max_coverage_amount: 5000000, claim_turnaround_days: 14, country: "India" } },
  ];
  for (const s of supplierDefs) {
    const r = await createDoc(page, s.dt, s.data);
    created.suppliers.push(`${s.dt}:::${r.data.name}`);
  }

  // ── Team ──
  {
    const staffResp = await page.request.get(
      `/api/resource/Travel Agency Staff?filters=${JSON.stringify({ staff_user: USERS.teamLead.email })}&fields=["name"]`,
    );
    const staffBody = await staffResp.json();
    const teamLeadStaff = staffBody.data?.[0]?.name;
    const r = await createDoc(page, "Travel Team", {
      team_name: `Sales Team (${TS})`, team_lead: teamLeadStaff || undefined,
      is_active: 1, description: "Primary sales team — handles new inquiries, bookings, and VIP clients",
    });
    created.teams.push(r.data.name);
  }

  await hideAnnotation(page);
  await logout(page);
  await context.clearCookies();
  await page.waitForTimeout(500);

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║  PHASE 2 — VISUAL WALKTHROUGH                                ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ── CHAPTER 1: TITLE & LOGIN ──────────────────────────────────────

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  await annotate(page, "Horizon CRM — Complete Feature Demonstration", "Multi-tenant Travel Agency CRM built on Frappe Framework", 6000);

  await chapterTitle(page, 1, "Login & Authentication", "Secure role-based access with Agency Admin, Team Lead, and Staff roles");

  const emailInput = page.getByPlaceholder("jane@example.com");
  const passwordInput = page.getByPlaceholder("•••••");
  await emailInput.waitFor({ timeout: 10000 });
  await emailInput.fill("");
  await emailInput.type(USERS.agencyAdmin.email, { delay: 45 });
  await pause(page, 600);
  await passwordInput.fill("");
  await passwordInput.type(USERS.agencyAdmin.password, { delay: 45 });
  await pause(page, 800);

  await showAnnotation(page, "Logging in as Agency Admin", `${USERS.agencyAdmin.email} — Full management access`);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForTimeout(4000);
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  let csrf = "";
  try {
    await page.waitForFunction(() => (window as any).frappe?.csrf_token, null, { timeout: 10000 });
    csrf = await page.evaluate(() => (window as any).frappe?.csrf_token || "");
  } catch { /* non-critical */ }

  await hideAnnotation(page);
  await annotate(page, "Logged In Successfully", "Welcome to the Horizon CRM desk", 3000);

  // ── CHAPTER 2: DASHBOARD ──────────────────────────────────────────

  await chapterTitle(page, 2, "Dashboard & Workspace", "Real-time KPIs, analytics charts, and organized sidebar navigation");

  await page.goto("/app/horizon-crm", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  await showAnnotation(page, "Agency Dashboard", "Number cards: Open Inquiries, Active Bookings, Customer Count, Outstanding Balance, Total Revenue, Won This Month");
  await pause(page, 7000);
  await hideAnnotation(page);

  await showAnnotation(page, "Analytics Charts", "Inquiry Pipeline funnel, Inquiry Sources, Monthly Bookings, Revenue Trend, Top Destinations");
  await slowScroll(page, 600, 3000);
  await pause(page, 6000);
  await hideAnnotation(page);

  await scrollToTop(page);
  await pause(page, 1000);

  await showAnnotation(page, "Sidebar Navigation", "Pipeline (Leads, Inquiries, Bookings) | Customers | Billing | Trip Planning | Suppliers (6 types) | Team | Settings");
  await pause(page, 7000);
  await hideAnnotation(page);

  // ── CHAPTER 3: AGENCY SETTINGS ────────────────────────────────────

  await chapterTitle(page, 3, "Agency Configuration", "Global tenant settings — name, logo, staff capacity, subscription plan");

  await page.request.post("/api/method/login", {
    form: { usr: USERS.admin.email, pwd: USERS.admin.password },
  });
  await page.goto("/app/travel-agency", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  await showAnnotation(page, "Travel Agency (Singleton)", "One per tenant site — agency name, code, status, admin user, max staff, subscription plan");
  await pause(page, 7000);
  await hideAnnotation(page);

  await showAnnotation(page, "Contact & Subscription Details", "Email, phone, website, address, city, country, established date, timezone");
  await slowScroll(page, 400, 2000);
  await pause(page, 5000);
  await hideAnnotation(page);
  await scrollToTop(page);

  await page.request.post("/api/method/login", {
    form: { usr: USERS.agencyAdmin.email, pwd: USERS.agencyAdmin.password },
  });
  csrf = await refreshCsrf(page);

  // ── CHAPTER 4: STAFF & TEAMS ──────────────────────────────────────

  await chapterTitle(page, 4, "Staff & Team Management", "Add employees, assign roles (Admin / Team Lead / Staff), organize into teams");

  await page.goto("/app/travel-agency-staff", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");

  await showAnnotation(page, "Staff Directory", "Each staff record links to a Frappe User — role in agency, team, designation, join date, active status");
  await pause(page, 6000);
  await hideAnnotation(page);

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Staff Profile", "Role in Agency (Admin / Team Lead / Staff), linked User account, team assignment, designation");
    await slowScroll(page, 200, 1000);
    await pause(page, 5000);
    await hideAnnotation(page);
    await scrollToTop(page);
  }

  await page.goto("/app/travel-team", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");

  await showAnnotation(page, "Travel Teams", "Group staff into teams — each has a team lead, description, and active flag");
  await pause(page, 5000);
  await hideAnnotation(page);

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Team Detail", "Team name, designated lead, status, and description");
    await pause(page, 4000);
    await hideAnnotation(page);
  }

  // ── CHAPTER 5: PUBLIC PORTAL ──────────────────────────────────────

  await chapterTitle(page, 5, "Public Lead-Capture Portal", "Guest-accessible inquiry form — no login needed, embeddable via iframe");

  await context.clearCookies();
  await page.goto("/portal/inquiry", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  await showAnnotation(page, "Public Inquiry Form", "Any website visitor can submit — creates a Travel Lead with source = Website");
  await pause(page, 6000);
  await hideAnnotation(page);

  await showAnnotation(page, "Filling the Inquiry Form", "10 fields: name, email, phone, destination, travel type, dates, travelers, budget, notes");
  await pause(page, 2000);

  const PORTAL_LEAD_NAME = `Portal Lead ${TS}`;
  await page.type("#full_name", PORTAL_LEAD_NAME, { delay: 35 });
  await pause(page, 500);
  await page.type("#email", `portal.lead.${TS}@example.com`, { delay: 28 });
  await pause(page, 500);
  await page.type("#phone", "+91 99887 76655", { delay: 28 });
  await pause(page, 500);
  await page.fill("#destination", "");
  await page.type("#destination", "Bali", { delay: 60 });
  await pause(page, 600);

  const typeSelect = page.locator("#travel_type");
  const typeOpts = await typeSelect.locator("option").allTextContents();
  if (typeOpts.length > 1) await typeSelect.selectOption({ index: 1 });
  await pause(page, 500);

  await page.fill("#num_travelers", "2");
  await pause(page, 400);
  await page.fill("#departure_date", futureDate(35));
  await pause(page, 400);
  await page.fill("#return_date", futureDate(42));
  await pause(page, 400);
  await page.fill("#budget_min", "80000");
  await pause(page, 300);
  await page.fill("#budget_max", "180000");
  await pause(page, 400);

  await slowScroll(page, 200, 800);
  await page.type("#notes", "Planning a honeymoon trip — looking for luxury reef villas with spa, private pool, and sunset dining.", { delay: 20 });
  await pause(page, 1000);
  await hideAnnotation(page);

  await showAnnotation(page, "Submitting the Inquiry", "POST to /api/method/horizon_crm.api.portal.submit_lead — rate-limited: 10/hr");
  await pause(page, 2000);
  await page.click("#btn-submit");
  try {
    await page.waitForURL("**/portal/thank-you**", { timeout: 15000 });
  } catch {
    await page.waitForTimeout(3000);
  }
  await page.waitForTimeout(2000);
  await hideAnnotation(page);

  await annotate(page, "Thank You Page", "Visitor sees confirmation — the lead is now in the CRM pipeline for staff follow-up", 5000);

  // Log back in
  await page.request.post("/api/method/login", {
    form: { usr: USERS.agencyAdmin.email, pwd: USERS.agencyAdmin.password },
  });
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  csrf = await refreshCsrf(page);

  // ── CHAPTER 6: LEAD PIPELINE ──────────────────────────────────────

  await chapterTitle(page, 6, "Lead Pipeline", "Pre-qualification: New → Contacted → Interested → Qualified → Converted");

  await page.goto("/app/travel-lead", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");

  await showAnnotation(page, "Travel Leads", "All leads including the portal submission. Filter by status, source, priority, destination.");
  await pause(page, 6000);
  await slowScroll(page, 300, 1500);
  await pause(page, 2000);
  await hideAnnotation(page);
  await scrollToTop(page);

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Lead Detail", "Contact info, company, assignment, priority, travel interest (destination, type, budget), follow-up date");
    await pause(page, 6000);
    await slowScroll(page, 400, 2000);
    await pause(page, 3000);
    await hideAnnotation(page);

    await scrollToTop(page);
    await showAnnotation(page, "Lead Pipeline Visualizer", "Custom CSS pipeline indicator shows current stage in the funnel");
    await pause(page, 5000);
    await hideAnnotation(page);
  }

  // Filtered view
  await page.goto("/app/travel-lead?status=New", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await annotate(page, "Filtered: New Leads Only", "URL param ?status=New — instantly filters the list", 4000);

  // ── CHAPTER 7: CUSTOMERS ──────────────────────────────────────────

  await chapterTitle(page, 7, "Customer Management", "Customer profiles with contact info, travel documents, loyalty tier, and preferences");

  await page.goto("/app/travel-customer", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");

  await showAnnotation(page, "Customer Directory", "4 demo customers — name, email, phone, loyalty tier. Auto-named CUST-XXXXX.");
  await pause(page, 5000);
  await hideAnnotation(page);

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Customer Profile", "Full name, email, phone, mobile, gender, loyalty tier (Bronze/Silver/Gold/Platinum), portal user link");
    await pause(page, 6000);
    await hideAnnotation(page);

    await showAnnotation(page, "Travel Documents & Address", "Date of birth, nationality, passport number, address, emergency contact");
    await slowScroll(page, 300, 1500);
    await pause(page, 5000);
    await hideAnnotation(page);

    await showAnnotation(page, "Customer Activity", "Custom sidebar shows inquiry/booking/feedback counts plus quick-action buttons (New Inquiry, WhatsApp)");
    await pause(page, 5000);
    await hideAnnotation(page);
    await scrollToTop(page);
  }

  // ── CHAPTER 8: INQUIRY WORKFLOW ───────────────────────────────────

  await chapterTitle(page, 8, "Inquiry Workflow", "Sales pipeline: New → Contacted → Quoted → Won → Lost");

  await page.goto("/app/travel-inquiry", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");

  await showAnnotation(page, "Inquiry List", "5 demo inquiries across all statuses — filter by status, customer, destination, priority");
  await pause(page, 5000);
  await slowScroll(page, 200, 1000);
  await pause(page, 2000);
  await hideAnnotation(page);
  await scrollToTop(page);

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Inquiry Detail", "Customer (auto-fills name/email/phone), destination, travel type, dates, travelers, budget range, source");
    await pause(page, 6000);
    await hideAnnotation(page);
    await showAnnotation(page, "Pipeline, Follow-up & Notes", "Assigned agent, priority, follow-up date/notes, lost reason (if Lost), travelers child table, rich-text notes");
    await slowScroll(page, 500, 2500);
    await pause(page, 5000);
    await hideAnnotation(page);
    await scrollToTop(page);
  }

  // Create a new inquiry visually
  await showAnnotation(page, "Creating a New Inquiry", "Walk-through of the inquiry creation form");
  await pause(page, 3000);
  await hideAnnotation(page);

  await page.goto("/app/travel-inquiry/new", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "form");
  await pause(page, 1500);
  await showAnnotation(page, "New Inquiry Form", "Filling customer, destination, dates, and travel details");

  // Customer link
  const inquiryCustomer = created.customers[3] || "Aisha Khan";
  const inqCust = page.locator('[data-fieldname="customer"] .control-input input');
  await inqCust.click();
  await inqCust.fill("");
  await inqCust.type(inquiryCustomer, { delay: 50 });
  await page.waitForTimeout(1200);
  const custSugg = page.locator(".awesomplete li").filter({ hasText: inquiryCustomer }).first();
  const fallbackCustSugg = page.locator(".awesomplete li").first();
  if (await custSugg.isVisible({ timeout: 3000 }).catch(() => false)) {
    await custSugg.click();
  } else if (await fallbackCustSugg.isVisible({ timeout: 3000 }).catch(() => false)) {
    await fallbackCustSugg.click();
  }
  await pause(page, 800);
  await page.waitForSelector('[data-fieldname="destination"] .control-input input', { timeout: 5000 });

  // Scroll down so destination field is not covered by the customer section header
  await slowScroll(page, 300, 800);

  // Destination link
  const inquiryDestination = "Bangkok";
  const inqDest = page.locator('[data-fieldname="destination"] .control-input input');
  await inqDest.scrollIntoViewIfNeeded();
  await pause(page, 500);
  await inqDest.click({ force: true });
  await inqDest.fill("");
  await inqDest.type(inquiryDestination, { delay: 50 });
  await page.waitForTimeout(1000);
  const dSugg = page.locator(".awesomplete li").filter({ hasText: inquiryDestination }).first();
  const fallbackDestSugg = page.locator(".awesomplete li").first();
  if (await dSugg.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dSugg.click();
  } else if (await fallbackDestSugg.isVisible({ timeout: 3000 }).catch(() => false)) {
    await fallbackDestSugg.click();
  }
  await pause(page, 600);
  // Dismiss any remaining awesomplete dropdown
  await page.keyboard.press("Escape");
  await pause(page, 300);

  // Travel type
  const ttInput = page.locator('[data-fieldname="travel_type"] .control-input input');
  await ttInput.scrollIntoViewIfNeeded();
  await pause(page, 300);
  if (await ttInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await ttInput.click({ force: true });
    await ttInput.fill("");
    await ttInput.type("Adventure", { delay: 50 });
    await page.waitForTimeout(800);
    const ttSugg = page.locator(".awesomplete li").first();
    if (await ttSugg.isVisible({ timeout: 2000 }).catch(() => false)) await ttSugg.click();
    await page.keyboard.press("Escape");
  }
  await pause(page, 400);

  // Dates & travelers — use force:true to avoid overlay issues
  const depDate = page.locator('[data-fieldname="departure_date"] .control-input input');
  await depDate.scrollIntoViewIfNeeded();
  await depDate.fill(futureDate(25));
  await pause(page, 300);
  const retDate = page.locator('[data-fieldname="return_date"] .control-input input');
  await retDate.scrollIntoViewIfNeeded();
  await retDate.fill(futureDate(32));
  await pause(page, 300);
  const numTrav = page.locator('[data-fieldname="num_travelers"] .control-input input');
  await numTrav.scrollIntoViewIfNeeded();
  await numTrav.fill("3");
  await pause(page, 400);

  // Source
  const srcSelect = page.locator('[data-fieldname="source"] .control-input select');
  if (await srcSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await srcSelect.selectOption("Walk-in");
  }
  await pause(page, 400);
  await hideAnnotation(page);

  await showAnnotation(page, "Saving the Inquiry", "Ctrl+S — auto-generates inquiry number INQ-XXXXX");
  await page.keyboard.press("Control+s");
  await page.waitForTimeout(3000);
  await hideAnnotation(page);

  // Capture name for cleanup
  const savedUrl = page.url();
  const newInqMatch = savedUrl.match(/INQ-\d+/);
  if (newInqMatch) created.inquiries.push(newInqMatch[0]);

  await annotate(page, "Inquiry Created!", "Status: New — ready for follow-up. Custom action buttons appear based on status.", 4000);

  // ── CHAPTER 9: BOOKINGS & PAYMENTS ────────────────────────────────

  await chapterTitle(page, 9, "Bookings & Payment Tracking", "Booking lifecycle with payment progress bar and financial summary");

  await page.goto("/app/travel-booking", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");

  await showAnnotation(page, "Booking List", "3 demo bookings: Confirmed, In Progress — customer, destination, amount, status");
  await pause(page, 5000);
  await hideAnnotation(page);

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Booking Detail", "Customer, source inquiry, destination, itinerary link, dates, travelers, assigned agent");
    await pause(page, 6000);
    await hideAnnotation(page);

    await showAnnotation(page, "Financial Summary & Payment Progress", "Total amount, paid amount, balance — custom color-coded progress bar");
    await slowScroll(page, 400, 2000);
    await pause(page, 7000);
    await hideAnnotation(page);

    await showAnnotation(page, "Payment Records (Child Table)", "Each payment: date, amount, method (Bank/Card/Online), status (Pending/Received/Refunded), reference");
    await slowScroll(page, 300, 1500);
    await pause(page, 6000);
    await hideAnnotation(page);
    await scrollToTop(page);
  }

  // ── CHAPTER 10: ITINERARY BUILDER ─────────────────────────────────

  await chapterTitle(page, 10, "Itinerary Builder", "Day-by-day travel plans with activities, accommodation, transport, meals, and cost tracking");

  await page.goto("/app/travel-itinerary", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");

  await showAnnotation(page, "Travel Itineraries", "Linked to bookings — status: Draft, Shared, Approved, Archived. Auto-calculated total cost.");
  await pause(page, 5000);
  await hideAnnotation(page);

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "7-Day Maldives Itinerary", "Name, linked booking, start/end dates, auto-calculated days, total cost (sum of day items)");
    await pause(page, 6000);
    await hideAnnotation(page);

    await showAnnotation(page, "Day-by-Day Plan (Child Table)", "Day number, title, description, accommodation, transport, meals included (None/Breakfast/Half/Full Board), cost");
    await slowScroll(page, 600, 3000);
    await pause(page, 7000);
    await hideAnnotation(page);

    await slowScroll(page, 400, 2000);
    await pause(page, 3000);
    await scrollToTop(page);
  }

  // ── CHAPTER 11: INVOICING ─────────────────────────────────────────

  await chapterTitle(page, 11, "Invoicing & Billing", "Professional invoices with line items, tax, discounts, and payment tracking");

  await page.goto("/app/travel-invoice", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");

  await showAnnotation(page, "Travel Invoices", "Status: Draft, Sent, Paid, Partially Paid, Overdue, Cancelled");
  await pause(page, 5000);
  await hideAnnotation(page);

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Invoice Detail", "Customer (auto-fetches name), linked booking, invoice date, due date, status, payment method");
    await pause(page, 6000);
    await hideAnnotation(page);

    await showAnnotation(page, "Line Items", "Description, quantity, rate — amount auto-calculated per row");
    await slowScroll(page, 400, 2000);
    await pause(page, 6000);
    await hideAnnotation(page);

    await showAnnotation(page, "Tax, Discount & Grand Total", "Subtotal auto-summed, tax % applied, discount deducted — grand total + outstanding amount calculated automatically");
    await slowScroll(page, 400, 2000);
    await pause(page, 7000);
    await hideAnnotation(page);
    await scrollToTop(page);
  }

  // ── CHAPTER 12: FEEDBACK ──────────────────────────────────────────

  await chapterTitle(page, 12, "Customer Feedback", "Post-trip star ratings, experience assessment, and comments");

  await page.goto("/app/travel-feedback", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");

  await showAnnotation(page, "Travel Feedback", "Linked to bookings & customers — rating, overall experience, would-recommend, comments");
  await pause(page, 5000);
  await hideAnnotation(page);

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Feedback Record", "Star rating (1-5), overall experience (Excellent/Good/Average/Poor/Terrible), Would Recommend, detailed comments");
    await slowScroll(page, 300, 1500);
    await pause(page, 6000);
    await hideAnnotation(page);
    await scrollToTop(page);
  }

  // ── CHAPTER 13: DESTINATIONS & TRAVEL TYPES ───────────────────────

  await chapterTitle(page, 13, "Destinations & Travel Types", "Master data powering dropdowns and filters across the CRM");

  await page.goto("/app/travel-destination", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");

  await showAnnotation(page, "Travel Destinations", "10 popular destinations: Paris, Bali, Maldives, New York, Tokyo, Dubai, London, Rome, Bangkok, Sydney");
  await pause(page, 6000);
  await hideAnnotation(page);

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Destination Detail", "Name, country, region, description, image, 'Is Popular' flag (controls portal dropdown)");
    await pause(page, 5000);
    await hideAnnotation(page);
  }

  await page.goto("/app/travel-type", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await annotate(page, "Travel Types", "Adventure, Beach, Business, Cultural, Honeymoon, Family, Group, Solo, Cruise, Luxury", 5000);

  await page.goto("/app/travel-lost-reason", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await annotate(page, "Lost Reasons", "Pre-configured: Competitor, Budget Too High, Bad Timing, No Response, and more", 4000);

  // ── CHAPTER 14: AIRLINE SUPPLIERS ─────────────────────────────────

  await chapterTitle(page, 14, "Supplier Management — Airlines", "Six category-specific supplier types. Starting with Airlines.");

  await showcaseList(page, "airline-supplier", "Airline Suppliers", "IATA code, alliance (Star/Oneworld/SkyTeam), hub airports, domestic & international flags");

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Airline Detail", "Name, IATA code, contact info, hub airports, alliance, flight types, service catalog with pricing");
    await slowScroll(page, 500, 2500);
    await pause(page, 5000);
    await hideAnnotation(page);
    await scrollToTop(page);
  }

  // ── CHAPTER 15: HOTEL SUPPLIERS ───────────────────────────────────

  await chapterTitle(page, 15, "Hotels & Resorts", "Property details, amenity tracking, and room rate catalog");

  await showcaseList(page, "hotel-supplier", "Hotel Suppliers", "Star rating, property type (Hotel/Resort/Villa/Boutique), rooms, amenity checkboxes, rates");

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Hotel Detail", "Star rating, property type, total rooms, check-in/out, amenities (pool, spa, gym, WiFi, parking, shuttle)");
    await slowScroll(page, 500, 2500);
    await pause(page, 5000);
    await hideAnnotation(page);
    await scrollToTop(page);
  }

  // ── CHAPTER 16: TOUR OPERATORS ────────────────────────────────────

  await chapterTitle(page, 16, "Tour Operators", "Specialization, destinations, group sizes, languages");

  await showcaseList(page, "tour-operator", "Tour Operators", "Specialization (Adventure/Cultural/Wildlife/Cruise/Luxury), destinations, group size range, languages");

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Operator Detail", "Specialization, destination coverage, group capacity, supported languages, tour package pricing");
    await slowScroll(page, 400, 2000);
    await pause(page, 4000);
    await hideAnnotation(page);
    await scrollToTop(page);
  }

  // ── CHAPTER 17: TRANSPORT SUPPLIERS ───────────────────────────────

  await chapterTitle(page, 17, "Transport Suppliers", "Cars, buses, taxis, limousines, boats, private transfers");

  await showcaseList(page, "transport-supplier", "Transport Suppliers", "Transport type, fleet size, vehicle types, max passengers, AC flag, service pricing");

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Transport Detail", "Company, type (Car/Bus/Taxi/Limo/Boat/Train), fleet size, vehicle types, capacity, transfers & rates");
    await slowScroll(page, 300, 1500);
    await pause(page, 4000);
    await hideAnnotation(page);
    await scrollToTop(page);
  }

  // ── CHAPTER 18: VISA AGENTS ───────────────────────────────────────

  await chapterTitle(page, 18, "Visa Agents", "Processing agents with success rates and turnaround times");

  await showcaseList(page, "visa-agent", "Visa Agents", "Countries served, visa types, avg processing days, success rate %, express available");

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Visa Agent Detail", "Countries & visa types, processing time, 95% success rate, express availability, service catalog");
    await slowScroll(page, 300, 1500);
    await pause(page, 4000);
    await hideAnnotation(page);
    await scrollToTop(page);
  }

  // ── CHAPTER 19: INSURANCE PROVIDERS ───────────────────────────────

  await chapterTitle(page, 19, "Insurance Providers", "Travel insurance with coverage types, regions, and claim turnaround");

  await showcaseList(page, "insurance-provider", "Insurance Providers", "Coverage types (Cancellation/Medical/Baggage/Delay), worldwide, max amount, claim days");

  if (await openFirstListItem(page)) {
    await showAnnotation(page, "Insurance Detail", "Insurance types, coverage regions, max coverage amount, claim turnaround days, plan catalog");
    await slowScroll(page, 300, 1500);
    await pause(page, 4000);
    await hideAnnotation(page);
    await scrollToTop(page);
  }

  // ── CHAPTER 20: KANBAN BOARDS ─────────────────────────────────────

  await chapterTitle(page, 20, "Kanban Boards", "Visual drag-and-drop pipeline management — three pre-built boards");

  await page.goto(`/app/travel-lead?view=Kanban&kanban_board=${encodeURIComponent("Lead Pipeline")}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await showAnnotation(page, "Lead Pipeline Kanban", "Columns: New, Contacted, Interested, Qualified, Converted, Do Not Contact — drag cards to update status");
  await pause(page, 7000);
  await slowScroll(page, 200, 1000);
  await pause(page, 3000);
  await hideAnnotation(page);
  await scrollToTop(page);

  await page.goto(`/app/travel-inquiry?view=Kanban&kanban_board=${encodeURIComponent("Inquiry Pipeline")}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await showAnnotation(page, "Inquiry Pipeline Kanban", "Columns: New, Contacted, Quoted, Won, Lost — visual sales pipeline");
  await pause(page, 7000);
  await hideAnnotation(page);

  await page.goto(`/app/travel-booking?view=Kanban&kanban_board=${encodeURIComponent("Booking Tracker")}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await showAnnotation(page, "Booking Tracker Kanban", "Columns: Confirmed, In Progress, Completed, Cancelled — track booking lifecycle");
  await pause(page, 7000);
  await hideAnnotation(page);

  // ── CHAPTER 21: ROLE-BASED ACCESS ─────────────────────────────────

  await chapterTitle(page, 21, "Role-Based Access Control", "Three agency roles: Admin (full), Team Lead (team oversight), Staff (operational)");

  // Switch to Staff
  await page.request.get("/api/method/logout");
  await page.waitForTimeout(800);
  await showAnnotation(page, "Switching to Staff User", `${USERS.staff.email} — limited operational access`);
  await page.request.post("/api/method/login", { form: { usr: USERS.staff.email, pwd: USERS.staff.password } });
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await hideAnnotation(page);

  await showAnnotation(page, "Staff View", "Can view/manage inquiries, bookings, customers — CANNOT access Agency Settings or Staff Management");
  await pause(page, 6000);
  await hideAnnotation(page);

  await page.goto("/app/travel-inquiry", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await annotate(page, "Staff — Inquiry Access", "Can create and manage inquiries assigned to them", 4000);

  await page.goto("/app/travel-booking", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await annotate(page, "Staff — Booking Access", "Can view and update booking details and payments", 4000);

  await page.goto("/app/travel-agency", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await annotate(page, "Staff — Agency Settings Restricted", "System settings require System Manager role — permission denied for Staff", 4000);

  // Switch to Team Lead
  await page.request.get("/api/method/logout");
  await page.waitForTimeout(500);
  await showAnnotation(page, "Switching to Team Lead", `${USERS.teamLead.email} — expanded permissions`);
  await page.request.post("/api/method/login", { form: { usr: USERS.teamLead.email, pwd: USERS.teamLead.password } });
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await hideAnnotation(page);

  await showAnnotation(page, "Team Lead View", "Broader access: can manage team members, view all team inquiries, reassign work");
  await pause(page, 5000);
  await hideAnnotation(page);

  await page.goto("/app/travel-inquiry", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await annotate(page, "Team Lead — Full Inquiry Access", "Can view all inquiries (not just assigned), reassign and update status", 4000);

  // Switch back to Admin
  await page.request.get("/api/method/logout");
  await page.waitForTimeout(500);
  await page.request.post("/api/method/login", { form: { usr: USERS.agencyAdmin.email, pwd: USERS.agencyAdmin.password } });
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  csrf = await refreshCsrf(page);
  await annotate(page, "Back to Agency Admin", "Full administrative access restored", 3000);

  // ── CHAPTER 22: SEARCH & FILTERING ────────────────────────────────

  await chapterTitle(page, 22, "Search & Filtering", "Find any record instantly with URL-based filters");

  await page.goto("/app/travel-inquiry?status=Won", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await annotate(page, "Filter: Won Inquiries", "URL param ?status=Won — shows only converted inquiries", 4000);

  await page.goto("/app/travel-inquiry?destination=Bali", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await annotate(page, "Filter: Bali Destination", "?destination=Bali — find all Bali inquiries instantly", 4000);

  await page.goto("/app/travel-booking?status=Confirmed", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await annotate(page, "Filter: Confirmed Bookings", "Combine any field as URL params for filtered views", 4000);

  await page.goto("/app/travel-customer?loyalty_tier=Gold", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await annotate(page, "Filter: Gold Loyalty Tier", "Filter customers by loyalty tier for targeted campaigns", 4000);

  // ── CHAPTER 23: DARK THEME ────────────────────────────────────────

  await chapterTitle(page, 23, "Dark Theme", "Full dark mode support across all UI elements");

  await page.evaluate(async (email: string) => {
    const f = (window as any).frappe;
    if (f) {
      await fetch(`/api/resource/User/${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Frappe-CSRF-Token": f.csrf_token },
        body: JSON.stringify({ desk_theme: "Dark" }),
      });
    }
  }, USERS.agencyAdmin.email);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  await page.goto("/app/horizon-crm", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await showAnnotation(page, "Dark Mode — Dashboard", "Complete dark theme: sidebar, number cards, charts, forms, lists");
  await pause(page, 6000);
  await slowScroll(page, 400, 2000);
  await pause(page, 4000);
  await hideAnnotation(page);
  await scrollToTop(page);

  await page.goto("/app/travel-inquiry", { waitUntil: "domcontentloaded" });
  await waitForPage(page, "list");
  await annotate(page, "Dark Mode — List View", "Clean contrast, readable text, styled status indicators", 4000);

  if (await openFirstListItem(page)) {
    await annotate(page, "Dark Mode — Form View", "Sections, fields, pipelines, and child tables all adapt to dark theme", 5000);
  }

  // Revert to light
  await page.evaluate(async (email: string) => {
    const f = (window as any).frappe;
    if (f) {
      await fetch(`/api/resource/User/${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Frappe-CSRF-Token": f.csrf_token },
        body: JSON.stringify({ desk_theme: "Light" }),
      });
    }
  }, USERS.agencyAdmin.email);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // ── CHAPTER 24: MULTI-TENANCY ─────────────────────────────────────

  await chapterTitle(page, 24, "Multi-Tenant Architecture", "Each agency runs on a separate Frappe site — complete database isolation");

  await page.goto("/app/horizon-crm", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await showAnnotation(page, "Site-Per-Tenant Model", "agency1.example.com, agency2.example.com — separate MariaDB databases, shared app code, zero cross-tenant leakage");
  await pause(page, 7000);
  await hideAnnotation(page);

  await showAnnotation(page, "Deployment Architecture", "bench new-site creates an isolated tenant. Each site has its own users, staff, customers, bookings, settings.");
  await pause(page, 7000);
  await hideAnnotation(page);

  // ── CHAPTER 25: CLOSING ───────────────────────────────────────────

  await page.goto("/app/horizon-crm", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await annotate(
    page,
    "Thank You for Watching!",
    "Horizon CRM — 25 DocTypes | 6 Supplier Types | Kanban | Portal | RBAC | Dark Theme | Built on Frappe Framework",
    8000,
  );
  await pause(page, 3000);

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║  PHASE 3 — CLEANUP                                          ║
  // ╚═══════════════════════════════════════════════════════════════╝

  await hideAnnotation(page);
  await login(page, USERS.admin.email, USERS.admin.password);

  // Delete in reverse dependency order
  for (const n of created.feedbacks) await deleteDoc(page, "Travel Feedback", n).catch(() => {});
  for (const n of created.invoices) await deleteDoc(page, "Travel Invoice", n).catch(() => {});
  for (const n of created.itineraries) await deleteDoc(page, "Travel Itinerary", n).catch(() => {});
  for (const n of created.bookings) await deleteDoc(page, "Travel Booking", n).catch(() => {});
  for (const n of created.inquiries) await deleteDoc(page, "Travel Inquiry", n).catch(() => {});
  for (const n of created.leads) await deleteDoc(page, "Travel Lead", n).catch(() => {});
  for (const n of created.customers) await deleteDoc(page, "Travel Customer", n).catch(() => {});
  for (const n of created.teams) await deleteDoc(page, "Travel Team", n).catch(() => {});
  for (const entry of created.suppliers) {
    const [dt, name] = entry.split(":::");
    await deleteDoc(page, dt, name).catch(() => {});
  }

  // Clean up portal-submitted lead
  const portalResp = await page.request.get(
    `/api/resource/Travel Lead?filters=${JSON.stringify({ lead_name: ["like", `%${TS}%`] })}&limit_page_length=100`,
  );
  if (portalResp.ok()) {
    const pLeads = (await portalResp.json()).data || [];
    for (const l of pLeads) await deleteDoc(page, "Travel Lead", l.name).catch(() => {});
  }
});
