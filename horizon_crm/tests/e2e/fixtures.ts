import { test as base, expect, type Page, type APIRequestContext } from "@playwright/test";

/** CSRF token storage per context */
let csrfToken = "";

/** Get current CSRF token */
export function getCsrfToken(): string {
  return csrfToken;
}

/** Credentials for different roles used in tests */
export const USERS = {
  admin: { email: "Administrator", password: "admin" },
  agencyAdmin: {
    email: "admin@agency1.test",
    password: "Test@1234",
  },
  teamLead: {
    email: "lead@agency1.test",
    password: "Test@1234",
  },
  staff: {
    email: "staff@agency1.test",
    password: "Test@1234",
  },
};

/** Log in to Frappe desk via API */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const resp = await page.request.post("/api/method/login", {
    form: { usr: email, pwd: password },
  });
  if (!resp.ok()) {
    const body = await resp.text();
    throw new Error(`Login failed for ${email}: ${resp.status()} ${body}`);
  }
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  try {
    await page.waitForFunction(() => (window as any).frappe?.csrf_token, null, {
      timeout: 15_000,
    });
  } catch {
    // CSRF token should still be available even if redirected
  }
  csrfToken = await page.evaluate(() => {
    return (window as any).frappe?.csrf_token || "";
  });
  if (!csrfToken) {
    throw new Error(`Failed to extract CSRF token for ${email}`);
  }
}

/** Log out of current session */
export async function logout(page: Page) {
  await Promise.all([
    page.waitForURL(/\/login/, { timeout: 15_000 }),
    page.evaluate(() => {
      const app = (window as any).frappe?.app;
      if (!app?.logout) {
        throw new Error("frappe.app.logout is unavailable");
      }
      app.logout();
    }),
  ]);
  csrfToken = "";
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.context().clearCookies();
}

/** Navigate to a list view for a doctype */
export async function gotoList(page: Page, doctype: string) {
  const slug = doctype.toLowerCase().replace(/ /g, "-");
  await page.goto(`/app/${slug}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".frappe-list", { timeout: 15_000 });
}

/** Navigate to a new form for a doctype */
export async function gotoNew(page: Page, doctype: string) {
  const slug = doctype.toLowerCase().replace(/ /g, "-");
  await page.goto(`/app/${slug}/new`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".form-layout", { timeout: 15_000 });
}

/** Fill a Frappe form field using data-fieldname */
export async function fillField(
  page: Page,
  fieldname: string,
  value: string,
  fieldtype: "input" | "select" | "link" | "text" = "input"
) {
  const control = page.locator(
    `[data-fieldname="${fieldname}"] .control-input`
  );
  if (fieldtype === "link") {
    const input = control.locator("input");
    await input.fill("");
    await input.fill(value);
    await page.waitForTimeout(500);
    const suggestion = page.locator(".awesomplete li").first();
    if (await suggestion.isVisible()) {
      await suggestion.click();
    }
  } else if (fieldtype === "select") {
    await control.locator("select").selectOption(value);
  } else if (fieldtype === "text") {
    await control.locator("textarea").fill(value);
  } else {
    await control.locator("input").fill(value);
  }
}

/** Click primary action button (Save / Submit) */
export async function clickPrimaryAction(page: Page) {
  await page.locator(".primary-action").click();
  await page.waitForTimeout(1000);
}

/** Save the current form via Ctrl+S */
export async function saveForm(page: Page) {
  await page.keyboard.press("Control+s");
  await page.waitForTimeout(1500);
}

/** Wait for success indicator (green alert) */
export async function expectSuccess(page: Page) {
  await expect(
    page.locator(".indicator-pill.green, .msgprint.alert-success").first()
  ).toBeVisible({ timeout: 10_000 });
}

/** Create a user via API */
export async function createUser(
  page: Page,
  email: string,
  firstName: string,
  password: string,
  roles: string[] = []
) {
  const resp = await page.request.post("/api/resource/User", {
    headers: { "X-Frappe-CSRF-Token": csrfToken },
    data: {
      email,
      first_name: firstName,
      new_password: password,
      send_welcome_email: 0,
      roles: roles.map((r) => ({ role: r })),
    },
  });
  return resp;
}

/** Create a document via API */
export async function createDoc(
  page: Page,
  doctype: string,
  data: Record<string, unknown>
) {
  const resp = await page.request.post(`/api/resource/${doctype}`, {
    headers: { "X-Frappe-CSRF-Token": csrfToken },
    data,
  });
  if (!resp.ok()) {
    const body = await resp.text();
    throw new Error(`createDoc(${doctype}) failed: ${resp.status()} ${body}`);
  }
  return resp.json();
}

/** Get count of list results for a doctype, optionally filtered */
export async function getListCount(
  page: Page,
  doctype: string,
  filters?: Record<string, string>
) {
  const params = new URLSearchParams({ limit_page_length: "0" });
  if (filters) {
    params.set("filters", JSON.stringify(filters));
  }
  const resp = await page.request.get(
    `/api/resource/${doctype}?${params.toString()}`
  );
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  return body.data.length as number;
}

/** Delete a document via API */
export async function deleteDoc(
  page: Page,
  doctype: string,
  name: string
) {
  await page.request.delete(`/api/resource/${doctype}/${name}`, {
    headers: { "X-Frappe-CSRF-Token": csrfToken },
  });
}

/** Extended test fixture with login helpers */
export const test = base.extend<{
  adminPage: Page;
}>({
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, USERS.admin.email, USERS.admin.password);
    await use(page);
    await ctx.close();
  },
});

export { expect };
