import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import deployment from "../../config/public-site.json";
const base = deployment.basePath;
test("every exported file is served intact under the configured subpath", async ({
  request,
}) => {
  const manifest = JSON.parse(
    await fs.readFile("work/public-build/export-manifest.json", "utf8"),
  );
  for (const [file, hash] of Object.entries(manifest.files)) {
    const response = await request.get(`${base}/${file}`);
    expect(response.status(), file).toBe(200);
    expect(
      createHash("sha256")
        .update(await response.body())
        .digest("hex"),
      file,
    ).toBe(hash);
  }
  expect((await request.get("/predictions/")).status()).toBe(404);
});
test("Story HTML stays compact without the full research payload", async ({
  request,
}) => {
  const response = await request.get(`${base}/`);
  expect(response.status()).toBe(200);
  expect((await response.body()).byteLength).toBeLessThan(500_000);
});
test("author CTAs, navigation, filters, evidence and downloads work at the production path", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("pageerror", (e) => failures.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(`${base}/`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${deployment.origin}${base}/`,
  );
  await expect(
    page.getByRole("link", { name: "More from Jason", exact: true }),
  ).toHaveAttribute("href", "https://www.jasonwillems.com/blog/");
  await expect(
    page.getByRole("link", { name: "Read my blog", exact: true }),
  ).toHaveAttribute("href", "https://www.jasonwillems.com/blog/");
  await expect(
    page.getByRole("link", { name: "The story", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page
    .getByRole("button", {
      name: "Computing hardware predictions",
      exact: true,
    })
    .click();
  const trigger = page
    .locator(".category-expanded:visible")
    .getByRole("link", { name: /K002/ });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { level: 2 })).toContainText(
    "Portable computers",
  );
  await expect(
    dialog.getByRole("link", { name: /Full record & history/ }),
  ).toHaveAttribute("href", `${base}/predictions/K002/`);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByRole("link", { name: "Predictions", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${base}/predictions/`));
  await page.getByRole("searchbox").fill("K036");
  await page
    .getByLabel("Interpretation", { exact: true })
    .selectOption("strict");
  await expect(page.locator(".prediction-cell")).toHaveCount(1);
  expect(new URL(page.url()).pathname).toBe(`${base}/predictions/`);
  await page.locator(".prediction-cell").click();
  await expect(page.getByLabel("Evidence interpretation")).toHaveValue(
    "strict",
  );
  await expect(dialog.locator(".evidence-facts")).toContainText("2026");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole("searchbox")).toHaveValue("K036");
  await page.goto(`${base}/sources/`);
  const download = page.getByRole("link", { name: /Current canonical JSON/ });
  await expect(download).toHaveAttribute(
    "href",
    `${base}/data/predictions.json`,
  );
  const data = await (
    await page.request.get((await download.getAttribute("href"))!)
  ).json();
  expect(data.predictions.length).toBe(84);
  await page.goto(`${base}/categories/?reading=strict&cohort=common`);
  await expect(page).toHaveURL(
    new RegExp(`${base}/\\?reading=strict#by-field$`),
  );
  await expect(page.getByLabel("Interpretation", { exact: true })).toHaveValue(
    "strict",
  );
  const breakdown = page.locator("#more-breakdowns");
  await breakdown.locator("summary").click();
  await expect(breakdown.locator(".analysis-controls")).toContainText(
    "67 with deadlines passed",
  );
  await breakdown.getByLabel("Group by").selectOption("category");
  const due = breakdown.getByRole("link", {
    name: "Neuroscience & human augmentation: 1 due predictions",
    exact: true,
  });
  await expect(due).toHaveAttribute(
    "href",
    new RegExp(`^${base}/predictions/`),
  );
  await due.click();
  await expect(page).toHaveURL(
    new RegExp(`${base}/predictions/.*reading=strict`),
  );
  await expect(page.locator(".results-toolbar")).toContainText(
    "1 of 84 records",
  );
  await page.goto(`${base}/predictions/K002/`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${deployment.origin}${base}/predictions/K002/`,
  );
  expect(failures).toEqual([]);
});
test("export header and footer stay accessible on desktop and mobile", async ({
  page,
}) => {
  await fs.mkdir("work/screenshots", { recursive: true });
  await page.goto(`${base}/`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "work/screenshots/export-home-desktop.png" });
  await page
    .locator(".site-footer")
    .screenshot({ path: "work/screenshots/export-footer.png" });
  for (const width of [1440, 780, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(
      page.getByRole("link", { name: "More from Jason", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  }
  await page
    .getByRole("link", { name: "Kurzweil Scorecard home" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: "work/screenshots/export-home-mobile.png" });
});

test("social cards are in crawler HTML and the exported PNG is 1200 by 630", async ({
  request,
}) => {
  for (const path of [
    "/",
    "/predictions/",
    "/predictions/K002/",
    "/methodology/",
  ]) {
    const response = await request.get(`${base}${path}`, {
      headers: { "User-Agent": "Twitterbot/1.0" },
    });
    const html = await response.text();
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain(
      `property="og:image" content="${deployment.origin}${base}/share-card.png?v=`,
    );
    expect(html).toContain(
      `name="twitter:image" content="${deployment.origin}${base}/share-card.png?v=`,
    );
  }
  const response = await request.get(`${base}/share-card.png`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  const png = await response.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});
