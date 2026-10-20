import { test, expect } from "@playwright/test";

const BASE = "/sites/kurzweil";
const ORIGIN = "https://www.jasonwillems.com";

// Exercise the deployed-host guard without sending test traffic to Google.
test("analytics initializes once on the public origin and never receives input state", async ({
  page,
  request,
}) => {
  const tagRequests: string[] = [];
  await page.route(`${ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    const response = await request.get(
      `http://127.0.0.1:4101${url.pathname}${url.search}`,
    );
    await route.fulfill({ response });
  });
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    tagRequests.push(route.request().url());
    await route.fulfill({
      contentType: "application/javascript",
      body: "/* collection disabled in tests */",
    });
  });
  await page.goto(`${ORIGIN}${BASE}/?q=private-search#private-fragment`);
  await expect.poll(() => tagRequests.length).toBe(1);
  const commands = () =>
    page.evaluate(() =>
      Array.from(
        (window as Window & { dataLayer?: ArrayLike<unknown>[] }).dataLayer ??
          [],
        (entry) => Array.from(entry),
      ),
    );
  const initial = await commands();
  const config = initial.find((entry) => entry[0] === "config")!;
  expect(config[1]).toBe("G-Q5N6H3PVG2");
  expect(config[2]).toMatchObject({
    allow_google_signals: false,
    allow_enhanced_conversions: false,
  });
  // Fixed URL overrides break native Enhanced Measurement navigation attribution.
  expect(config[2]).not.toHaveProperty("page_location");
  expect(config[2]).not.toHaveProperty("send_page_view", false);
  expect(JSON.stringify(initial)).not.toContain("private-search");
  expect(JSON.stringify(initial)).not.toContain("private-fragment");
  await page
    .getByRole("button", {
      name: "Computing hardware predictions",
      exact: true,
    })
    .click();
  await page
    .locator(".category-expanded:visible")
    .getByRole("link", { name: /K002/ })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  const after = await commands();
  expect(after.filter((entry) => entry[0] === "config")).toHaveLength(1);
  expect(after.filter((entry) => entry[0] === "event")).toEqual([]);
  expect(tagRequests).toHaveLength(1);
  await page
    .getByRole("link", { name: "Methodology", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(`${ORIGIN}${BASE}/methodology/`);
  // Enhanced Measurement owns history events; our app adds no competing manual ones.
  expect((await commands()).filter((entry) => entry[0] === "event")).toEqual(
    [],
  );
});

test("local exports do not load analytics", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (req) => {
    if (/google/.test(req.url())) external.push(req.url());
  });
  await page.goto(`${BASE}/`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.locator('script[src*="googletagmanager"]').count()).toBe(0);
  expect(external).toEqual([]);
});
