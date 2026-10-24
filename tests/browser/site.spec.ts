import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";

test("overview distinguishes collection from scoring and links charts to records", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Ray Kurzweil",
  );
  await expect(page.locator(".story-deck")).toContainText("84");
  await expect(page.locator("#state")).toContainText("68");
  await expect(page.locator(".outcome-summary")).toContainText("25");
  await expect(page.locator(".outcome-summary")).toContainText("11");
  await expect(page.locator(".scope-caption")).toContainText(
    "not a lifetime accuracy score",
  );
  await expect(page.locator(".category-rows > li")).toHaveCount(13);
  const hardware = page.locator(".category-result").filter({
    has: page.getByRole("button", {
      name: "Computing hardware predictions",
      exact: true,
    }),
  });
  await expect(hardware.locator(".category-realized")).toContainText("62.5%");
  await expect(hardware.locator(".category-ratio small")).toContainText(
    "31.3%",
  );
  await expect(
    page.locator(".category-result.no-due .category-rate"),
  ).toHaveCount(0);
  await page
    .locator(".category-name")
    .filter({ hasText: "AI & software" })
    .click();
  await expect(
    page.getByRole("button", { name: "AI & software predictions" }),
  ).toHaveAttribute("aria-expanded", "true");
  const expanded = page.locator(".category-expanded:visible");
  await expect(expanded.locator("tbody tr")).toHaveCount(12);
  await expect(expanded.locator(".outside-comparison")).toHaveCount(3);
  await expanded
    .getByRole("link", { name: "Open in the prediction ledger" })
    .click();
  await expect(page).toHaveURL(/category=AI/);
  await expect(page.locator(".results-toolbar")).toContainText(
    "9 of 84 records",
  );
  await expect(page.locator(".scorecard-table thead th")).toHaveCount(4);
  await page.getByRole("button", { name: "Show research columns" }).click();
  await expect(page.locator(".scorecard-table thead th")).toHaveCount(9);
  expect(errors).toEqual([]);
});
test("search, combined filters, sort, pagination, and reload preserve URL state", async ({
  page,
}) => {
  await page.goto("/predictions/?view=intake");
  await page
    .getByLabel("Categories", { exact: true })
    .selectOption("AI & software");
  await expect(page.locator(".results-toolbar")).toContainText(
    "21 of 88 records",
  );
  await page.getByRole("button", { name: "Target year", exact: true }).click();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator(".scorecard-table tbody tr")).toHaveCount(6);
  await page.reload();
  await expect(page.getByLabel("Categories", { exact: true })).toHaveValue(
    "AI & software",
  );
  await expect(page.locator(".scorecard-table tbody tr")).toHaveCount(6);
  const search = page.getByRole("searchbox", { name: "Search predictions" });
  await search.pressSequentially("chess", { delay: 60 });
  await expect(search).toHaveValue("chess");
  await expect(page).toHaveURL(/q=chess/);
  await expect(page).not.toHaveURL(/page=2/);
  const rows = await page.locator(".scorecard-table tbody tr").count();
  expect(rows).toBeGreaterThan(0);
  expect(rows).toBeLessThan(21);
  await page.getByRole("button", { name: /Filters/ }).click();
  await page
    .getByLabel("Verification states", { exact: true })
    .selectOption("VERIFIED");
  await expect(
    page.getByRole("heading", { name: "No matching records." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show curated records" }).click();
  await expect(page.locator(".results-toolbar")).toContainText(
    "84 of 84 records",
  );
});
test("exports every filtered row and copies the current view", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/predictions/?category=AI+%26+software&view=intake");
  await expect(page.locator(".results-toolbar")).toContainText(
    "21 of 88 records",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  const filename = await download.path();
  const csv = await fs.readFile(filename!, "utf8");
  const rows = parse(csv, { columns: true, bom: true }) as Record<
    string,
    string
  >[];
  expect(rows).toHaveLength(21);
  expect(
    rows.every(
      (r) => r.Category === "AI & software" && r.Verdict === "UNREVIEWED",
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Share view" }).click();
  await expect(page.getByText("View link copied")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    page.url(),
  );
});
test("detail URLs are stable and expose unchanged provenance", async ({
  page,
}) => {
  await page.goto("/predictions/AUD-001/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("chess");
  await expect(
    page.getByText("IMPORTED PARAPHRASE · NOT A VERIFIED QUOTATION"),
  ).toBeVisible();
  await page.getByText("Inspect preserved source fields").click();
  await expect(page.locator(".raw-data")).toContainText(
    "Legacy quote says 2000",
  );
  await expect(page.locator(".assessment-panel")).toContainText(
    "Not yet reviewed",
  );
  await expect(page.locator(".reconciliation-panel")).toContainText(
    "HOLD ATTRIBUTION CONFLICT",
  );
  await expect(
    page.locator(
      ".reconciliation-panel .related-row[href='/predictions/K001/']",
    ),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("chess");
  expect((await page.request.get("/predictions/NOT-A-RECORD/")).status()).toBe(
    404,
  );
});
test("optional breakdowns default to prediction type after the target-year chart", async ({
  page,
}) => {
  await page.goto("/categories/");
  await expect(page.locator(".category-rows > li")).toHaveCount(13);
  const section = page.locator("#more-breakdowns");
  await expect(section).not.toHaveAttribute("open");
  await expect(page.locator("#by-target-year + #more-breakdowns")).toHaveCount(
    1,
  );
  await section.locator("summary").click();
  await expect(section.getByLabel("Group by")).toHaveValue("type");
  await expect(section.locator("select option")).toHaveText([
    "Prediction type",
    "Target decade",
    "Publication decade",
    "Field",
  ]);
  await expect(section.locator("tbody tr")).toHaveCount(6);
  await expect(section.locator("thead th")).toHaveText([
    "Prediction type",
    "Due",
    "✓ On time",
    "↗ Late",
    "◐ Partial",
    "× Missed",
  ]);
  await expect(section.getByRole("button")).toHaveCount(0);
  await expect(section).not.toContainText("Unreviewed");
  await section.getByLabel("Group by").selectOption("category");
  await expect(section.locator("tbody tr")).toHaveCount(13);
  await expect(
    section
      .locator("tbody tr")
      .filter({ hasText: "Manufacturing & materials" }),
  ).toContainText("No records");
  await expect(
    section.locator("tbody tr").filter({ hasText: "Energy & environment" }),
  ).toContainText("2 future");
});

test("breakdown counts and ledger links follow the shared interpretation", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#more-breakdowns");
  await section.locator("summary").click();
  await expect(section.locator(".analysis-controls")).toContainText(
    "68 with deadlines passed · Our judgment",
  );
  await section.getByLabel("Group by").selectOption("category");
  const neuroscience = section
    .locator("tbody tr")
    .filter({ hasText: "Neuroscience & human augmentation" });
  await expect(
    neuroscience.getByRole("link", { name: /2 due predictions/ }),
  ).toBeVisible();
  await page.getByLabel("Target-year interpretation").selectOption("strict");
  await expect(section.locator(".analysis-controls")).toContainText(
    "67 with deadlines passed · Stricter / alternative",
  );
  await expect(
    neuroscience.getByRole("link", { name: /1 due predictions/ }),
  ).toBeVisible();
  await expect(
    neuroscience.getByRole("link", { name: "4 future", exact: true }),
  ).toHaveAttribute("href", /reading=strict.*view=future/);
  for (const href of await section
    .locator("a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    expect(new URL(href!, "http://localhost").searchParams.get("reading")).toBe(
      "strict",
    );
  }
  await neuroscience.getByRole("link", { name: /1 due predictions/ }).click();
  await expect(page).toHaveURL(/reading=strict/);
  await expect(page.locator(".results-toolbar")).toContainText(
    "1 of 84 records",
  );
  await expect(page.locator(".prediction-cell")).toContainText("K073");
  await page.goBack();
  await expect(page.getByLabel("Target-year interpretation")).toHaveValue(
    "strict",
  );
  await page.reload();
  await section.locator("summary").click();
  await expect(section.getByLabel("Group by")).toHaveValue("type");
  await expect(section.locator(".analysis-controls")).toContainText(
    "67 with deadlines passed",
  );
  await page
    .getByLabel("Interpretation", { exact: true })
    .selectOption("broader");
  await expect(section.locator(".analysis-controls")).toContainText(
    "68 with deadlines passed · Broader / directional",
  );
});

test("expanded collection breakdown remains accessible on desktop and mobile", async ({
  page,
}) => {
  await fs.mkdir("work/screenshots", { recursive: true });
  await page.goto("/#more-breakdowns");
  const section = page.locator("#more-breakdowns");
  await section.locator("summary").click();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const tableSize = await section
      .locator(".table-scroll")
      .evaluate((element) => ({
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
    expect(
      tableSize.scrollWidth,
      JSON.stringify({ viewport: width, ...tableSize }),
    ).toBeLessThanOrEqual(tableSize.width);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .include("#more-breakdowns")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await section.screenshot({
      path: `work/screenshots/collection-breakdown-${width}.png`,
    });
  }
});

test("curated evidence preserves source limits, interval timing, and related versions", async ({
  page,
}) => {
  await page.goto("/predictions/K002/");
  await expect(page.locator(".release-context")).toContainText(
    "Editorial paraphrase",
  );
  await expect(page.locator(".timeline")).toContainText("By 2008");
  await expect(page.locator(".timeline")).toContainText(
    "not first achievement year",
  );
  await expect(page.locator(".source-list")).toContainText(
    "AUTHOR RETROSPECTIVE REPRINT",
  );
  await page.goto("/predictions/K033/");
  await expect(page.locator(".assessment-panel")).toContainText(
    "LATE".toLowerCase(),
    { ignoreCase: true },
  );
  await expect(page.locator(".timing-note")).toContainText("2013");
  await expect(
    page.locator(".interpretations .outcome-comparison"),
  ).toContainText("FULFILLED");
  await page.goto("/predictions/AUD-025/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("2019");
  await page
    .locator(".reconciliation-panel a[href='/predictions/K024/']")
    .click();
  await expect(page.locator(".timeline")).toContainText("2029");
  await expect(page.locator(".history-links")).toContainText("AUD-025");
  await page.goto("/predictions/K003/");
  await expect(page.locator(".assessment-panel")).toContainText(
    "EDITORIAL ASSESSMENT COMPLETE",
  );
  await expect(page.locator(".release-context")).toContainText(
    "Attribution confidence",
  );
  await page.goto("/sources/");
  await expect(page.locator("#P01")).toContainText(
    "Original book editions were not inspected",
  );
  await expect(page.locator("#P01 a[target='_blank']")).toHaveAttribute(
    "href",
    "https://www.thekurzweillibrary.com/images/How-My-Predictions-Are-Faring.pdf",
  );
  const canonical = await page.request.get(
    "/data/releases/v0.2/predictions.canonical.v0.2.json",
  );
  expect((await canonical.json()).records).toHaveLength(50);
  const history = await page.request.get(
    "/data/releases/v0.1/predictions.json",
  );
  expect((await history.json()).predictions).toHaveLength(88);
});
test("all primary pages and representative details pass automated accessibility checks", async ({
  page,
}) => {
  const issues: unknown[] = [];
  for (const route of [
    "/",
    "/predictions/",
    "/categories/",
    "/methodology/",
    "/sources/",
    "/predictions/AUD-001/",
    "/predictions/K033/",
  ]) {
    await page.goto(route);
    if (route === "/categories/") await expect(page).toHaveURL(/\/#by-field$/);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    if (results.violations.length)
      issues.push({
        route,
        violations: results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            html: n.html,
            summary: n.failureSummary,
          })),
        })),
      });
  }
  expect(issues).toEqual([]);
});
test("desktop and mobile layouts stay in the viewport", async ({ page }) => {
  await fs.mkdir("work/screenshots", { recursive: true });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "work/screenshots/overview-desktop-top.png",
    fullPage: false,
  });
  await page.screenshot({
    path: "work/screenshots/overview-desktop.png",
    fullPage: true,
  });
  await page
    .locator("#by-field")
    .screenshot({ path: "work/screenshots/publication-category-chart.png" });
  await page
    .locator(".explanation-area")
    .screenshot({ path: "work/screenshots/judgments-and-sources.png" });
  await page.goto("/categories/");
  await expect(page).toHaveURL(/\/#by-field$/);
  await page.screenshot({
    path: "work/screenshots/categories-desktop.png",
    fullPage: true,
  });
  await page.goto("/predictions/");
  await page.getByRole("searchbox").waitFor();
  await page.screenshot({
    path: "work/screenshots/scorecard-desktop.png",
    fullPage: true,
  });
  const maxRowHeight = await page
    .locator(".scorecard-table tbody tr")
    .evaluateAll((rows) =>
      Math.max(...rows.map((row) => row.getBoundingClientRect().height)),
    );
  expect(maxRowHeight).toBeLessThan(210);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/predictions/",
    "/categories/",
    "/methodology/",
    "/sources/",
    "/predictions/AUD-001/",
    "/predictions/K033/",
  ]) {
    await page.goto(route);
    if (route === "/categories/") await expect(page).toHaveURL(/\/#by-field$/);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      route,
    ).toBe(true);
  }
  await page.goto("/");
  await page.screenshot({
    path: "work/screenshots/overview-mobile.png",
    fullPage: true,
  });
  await page.goto("/predictions/");
  await page.getByRole("searchbox").waitFor();
  await page.screenshot({
    path: "work/screenshots/scorecard-mobile.png",
    fullPage: true,
  });
});

test("reading controls preserve boundary dates, expose scope changes and drill down by exact cohort", async ({
  page,
}) => {
  await page.goto("/predictions/?q=K036");
  await expect(page.locator(".results-toolbar")).toContainText("1 of 84");
  await page
    .getByLabel("Interpretation", { exact: true })
    .selectOption("strict");
  await expect(page).toHaveURL(/reading=strict/);
  await expect(page.locator(".scorecard-table tbody")).toContainText("2026");
  await expect(page.locator(".scorecard-table tbody")).toContainText("Pending");
  await page.getByRole("button", { name: "Show research columns" }).click();
  await expect(page.locator(".scorecard-table thead")).toContainText(
    "At original deadline",
  );
  await expect(page.locator(".scorecard-table thead")).toContainText(
    "By review date",
  );
  await page.reload();
  await expect(page.getByLabel("Interpretation", { exact: true })).toHaveValue(
    "strict",
  );
  await page.goto("/predictions/K036/");
  await page
    .getByRole("button", { name: "Strict / alternative reading", exact: true })
    .click();
  await expect(page.locator(".interpretations")).toContainText("2026");
  await expect(page.locator(".interpretations")).toContainText("NOT DUE");
  await page.goto("/predictions/K004/");
  await page
    .getByRole("button", { name: "Broader / directional reading", exact: true })
    .click();
  await expect(page.locator(".interpretations")).toContainText(
    "Changed conditions",
  );
  await page.goto("/predictions/K041/");
  await page
    .getByRole("button", { name: "Broader / directional reading", exact: true })
    .click();
  await expect(page.locator(".interpretations")).toContainText(
    "Broader / directional reading",
  );
  await expect(page.locator(".interpretations")).toContainText(
    "Non-scoring comparator",
  );
  await page.goto("/");
  await page
    .getByText("How much do the judgments change the score?", { exact: true })
    .click();
  const modeRows = page.locator(".mode-comparison tbody tr");
  await expect(modeRows).toHaveCount(3);
  await modeRows.nth(1).getByRole("link", { name: "67", exact: true }).click();
  await expect(page.locator(".results-toolbar")).toContainText("67 of 84");
  await expect(page.getByLabel("Interpretation", { exact: true })).toHaveValue(
    "strict",
  );
});
test("legacy conditional dispositions stay outside metrics and all record URLs survive", async ({
  page,
}) => {
  await page.goto("/predictions/DEC-003/");
  await expect(page.locator(".conditional-outcomes")).toContainText("outcome");
  const raw = await (await page.request.get("/data/predictions.json")).json();
  for (const p of raw.predictions)
    expect((await page.request.get(`/predictions/${p.id}/`)).status()).toBe(
      200,
    );
  const reconciliation = await (
    await page.request.get(
      "/data/releases/v0.3/legacy-reconciliation.v0.3.json",
    )
  ).json();
  for (const m of reconciliation.mapping)
    expect(
      (await page.request.get(`/predictions/${m.legacy_id}/`)).status(),
    ).toBe(200);
  const metrics = await (await page.request.get("/data/metrics.json")).json();
  expect(metrics.views.reference.eligible).toBe(68);
  expect(metrics.views.reference.onTime).toBe(25);
  expect(metrics.views.reference.realized).toBe(36);
});

test("researched citation additions render with source limits and preserved assessment dates", async ({
  page,
}) => {
  await page.goto("/predictions/K005/");
  await expect(page.locator(".evidence-list")).toContainText(
    "does not establish storage technology",
  );
  await expect(page.locator(".evidence-list")).toContainText(
    "USB flash-drive paragraph",
  );
  await expect(page.locator(".evidence-list")).toContainText("2026-10-18");
  await expect(page.locator(".assessment-panel")).toContainText("2026-10-15");
  await page.goto("/predictions/K002/");
  await expect(page.locator(".evidence-list")).toContainText(
    "three-pound MacBook Air",
  );
  await expect(
    page
      .locator(".source-provenance")
      .filter({ hasText: "Catalogue entry SUP005" }),
  ).toBeVisible();
  await page.goto("/sources/");
  await expect(
    page.getByText("Research supplement · 2026-10-18.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#SUP003")).toContainText("home-local server");
  const supplement = await (
    await page.request.get("/data/research/citation-supplement-2026-10-18.json")
  ).json();
  expect(supplement.sources).toHaveLength(5);
  expect(supplement.citations).toHaveLength(24);
});

test("category interpretations use their eligible records and preserve reading on drill-down", async ({
  page,
}) => {
  await page.goto("/?cohort=common#by-field");
  await expect(page).toHaveURL(/\/#by-field$/);
  await expect(
    page.getByText("Which predictions are counted?", { exact: true }),
  ).toHaveCount(0);
  const chart = page.locator(".domain-explorer");
  await expect(chart.locator("a.forecast-dot")).toHaveCount(68);
  await page
    .getByLabel("Interpretation", { exact: true })
    .selectOption("strict");
  await expect(chart.locator("a.forecast-dot")).toHaveCount(67);
  await page
    .getByLabel("Interpretation", { exact: true })
    .selectOption("broader");
  await expect(chart.locator("a.forecast-dot")).toHaveCount(68);
  await expect(chart.locator("a.forecast-dot.dot-correct")).toHaveCount(37);
  await page.reload();
  await expect(page.getByLabel("Interpretation", { exact: true })).toHaveValue(
    "broader",
  );
  await expect(chart.locator("a.forecast-dot")).toHaveCount(68);
  await chart.getByRole("link", { name: /K004:/ }).click();
  await expect(page).toHaveURL(/evidence=K004&evidenceReading=broader/);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Evidence interpretation")).toHaveValue(
    "broader",
  );
  await expect(page.getByRole("dialog")).toContainText("Changed conditions");
});

test("field rows expand with keyboard access and previews reveal claims without navigating", async ({
  page,
}) => {
  await page.goto("/#by-field");
  const hardware = page.getByRole("button", {
    name: "Computing hardware predictions",
    exact: true,
  });
  await hardware.press("Enter");
  await expect(hardware).toHaveAttribute("aria-expanded", "true");
  const panel = page.locator(".category-expanded:visible");
  await expect(panel.locator("tbody tr")).toHaveCount(17);
  await expect(panel.locator(".outside-comparison")).toHaveCount(1);
  await panel.getByRole("button", { name: "Collapse field" }).click();
  await expect(hardware).toBeFocused();
  await expect(hardware).toHaveAttribute("aria-expanded", "false");

  for (const id of ["K009", "K033", "K080", "K004"]) {
    const tile = page.locator(`a.forecast-dot[href='/predictions/${id}/']`);
    await tile.hover();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    const heading = await tooltip.locator("strong").innerText();
    expect(heading.length).toBeGreaterThan(10);
    await expect(tile).toHaveAttribute(
      "aria-label",
      new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).not.toBeVisible();
  }
  await hardware.press("Tab");
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).not.toBeVisible();

  await page
    .getByRole("button", { name: "Networks & communications predictions" })
    .click();
  await expect(page.locator(".category-expanded:visible tbody tr")).toHaveCount(
    4,
  );
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page
    .locator("#by-field")
    .screenshot({ path: "work/screenshots/fields-expanded.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Networks & communications predictions" }),
  ).toHaveAttribute("aria-expanded", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".category-result.is-expanded")
    .screenshot({ path: "work/screenshots/field-mobile-expanded.png" });
  await page
    .getByRole("button", { name: "Energy & environment predictions" })
    .click();
  await expect(page.locator(".category-expanded:visible tbody tr")).toHaveCount(
    2,
  );
  await expect(
    page.locator(".category-expanded:visible .outside-comparison"),
  ).toHaveCount(2);
  await expect(
    page.locator(".category-result.is-expanded a.forecast-dot"),
  ).toHaveCount(0);
});

test("old category links preserve interpretation and discard the retired cohort setting", async ({
  page,
}) => {
  await page.goto("/categories/?reading=strict&cohort=common");
  await expect(page).toHaveURL(/\/\?reading=strict#by-field$/);
  await expect(page.getByLabel("Interpretation", { exact: true })).toHaveValue(
    "strict",
  );
  await expect(page.locator("a.forecast-dot")).toHaveCount(67);
  await page
    .getByRole("button", {
      name: "Neuroscience & human augmentation predictions",
    })
    .click();
  const excluded = page
    .locator(".category-expanded:visible tr")
    .filter({ hasText: "K036" });
  await expect(excluded).toContainText("2026");
  await expect(excluded).toContainText("Not counted");
});

test("story evidence stays in place and restores focus, expansion, scroll, and history", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#by-field");
  const hardware = page.getByRole("button", {
    name: "Computing hardware predictions",
    exact: true,
  });
  await hardware.click();
  const trigger = page
    .locator(".category-expanded:visible")
    .getByRole("link", { name: /K002/ });
  await trigger.scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => window.scrollY);
  const originalUrl = page.url();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(
    "Portable computers become markedly lighter and thinner.",
  );
  await expect(dialog).toContainText("The 2008 MacBook Air");
  await expect(
    dialog.getByRole("link", { name: /Apple introduces MacBook Air/ }),
  ).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/");
  await expect(
    dialog.getByRole("button", { name: "Close evidence" }),
  ).toBeFocused();
  // Native modal focus containment keeps the underlying page out of the tab order.
  await page.keyboard.press("Shift+Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Close evidence" }),
  ).toBeFocused();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await dialog.getByRole("button", { name: "Copy record link" }).click();
  await expect(dialog.getByRole("status")).toHaveText("Link copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "http://127.0.0.1:4100/predictions/K002/",
  );
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({
    path: "work/screenshots/evidence-panel-desktop.png",
  });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(originalUrl);
  await expect(hardware).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toBeFocused();
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
  ).toBeLessThan(3);
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.goBack();
  await expect(dialog).not.toBeVisible();
  await page.goForward();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close evidence" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(20, 500);
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test("ledger evidence retains filters, ordering, pagination, and the table interpretation", async ({
  page,
}) => {
  await page.goto(
    "/predictions/?category=Computing+hardware&sort=target&order=desc&size=15&page=2&reading=strict",
  );
  await expect(page.locator(".scorecard-table tbody tr")).toHaveCount(2);
  const originalUrl = page.url();
  const first = page.locator(".prediction-cell").first();
  const label = await first.innerText();
  await first.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("Evidence interpretation")).toHaveValue(
    "strict",
  );
  await page.getByLabel("Evidence interpretation").selectOption("broader");
  await expect(page).toHaveURL(/evidenceReading=broader/);
  await dialog.getByRole("button", { name: "Close evidence" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(originalUrl);
  await expect(page.getByLabel("Interpretation", { exact: true })).toHaveValue(
    "strict",
  );
  expect(await first.innerText()).toBe(label);
  await expect(first).toBeFocused();
  await expect(page.locator(".scorecard-table tbody tr")).toHaveCount(2);
});

test("mobile evidence supports direct panel links, source disclosures, and recovery from load failure", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?evidence=K009&evidenceReading=strict");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("Evidence interpretation")).toHaveValue(
    "strict",
  );
  const bounds = await dialog.boundingBox();
  expect(bounds?.width).toBe(390);
  expect(bounds?.height).toBeCloseTo(844 * 0.9, 0);
  expect(bounds!.y + bounds!.height).toBeCloseTo(844, 0);
  await dialog
    .getByText("The original claim & source", { exact: true })
    .click();
  await expect(dialog.locator(".evidence-attribution")).toContainText(
    "printed p. 20",
  );
  await dialog
    .locator(".evidence-drawer-content")
    .evaluate((el) => (el.scrollTop = 0));
  await page.screenshot({ path: "work/screenshots/evidence-panel-mobile.png" });
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await dialog.getByRole("button", { name: "Close evidence" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL("http://127.0.0.1:4100/");
  await page.route("**/evidence/K033/summary.json", (route) => route.abort());
  await page
    .locator(".editorial-examples article")
    .filter({ hasText: "Brain-scale supercomputing" })
    .getByRole("link", { name: "Read the evidence" })
    .click();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(
    "Evidence couldn’t load",
  );
  await expect(
    dialog.getByRole("link", { name: /Full record & history/ }),
  ).toHaveAttribute("href", "/predictions/K033/");
  await page.unroute("**/evidence/K033/summary.json");
  await dialog.getByRole("button", { name: "Try again" }).click();
  await expect(dialog.getByRole("heading", { level: 2 })).toContainText(
    "Supercomputers reach",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("original intake opens reviewed versions in the same panel without losing the original row", async ({
  page,
}) => {
  await page.goto("/predictions/?view=intake&q=AUD-001");
  const trigger = page.locator(".prediction-cell").first();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".evidence-legacy")).toContainText(
    "Original intake · not scored",
  );
  const reviewed = dialog.locator(".evidence-legacy").getByRole("link").first();
  const id = await reviewed.innerText();
  await reviewed.click();
  await expect(dialog.locator(".evidence-kicker")).toContainText(id);
  await expect(dialog.locator(".evidence-legacy")).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "Close evidence" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(
    "http://127.0.0.1:4100/predictions/?view=intake&q=AUD-001",
  );
  await expect(trigger).toBeFocused();
});

test("target-year columns share the comparison population and keep evidence in place", async ({
  page,
}) => {
  await page.goto("/#by-target-year");
  const chart = page.locator("#by-target-year");
  await expect(chart).toContainText("61 of these 68 forecasts");
  await expect(chart.locator(".time-year")).toHaveCount(6);
  const year = chart.getByRole("button", { name: /^2009: 38 predictions;/ });
  await year.click();
  await expect(year).toHaveAttribute("aria-expanded", "true");
  await expect(chart.locator(".time-records tbody tr")).toHaveCount(38);
  const trigger = chart
    .locator(".time-records")
    .getByRole("link", { name: /K002/ });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(year).toHaveAttribute("aria-expanded", "true");
  await chart
    .getByRole("button", { name: "Close target-year predictions" })
    .click();
  await expect(year).toBeFocused();
  await expect(year).toHaveAttribute("aria-expanded", "false");
  await chart
    .getByRole("button", { name: "Share of each group", exact: true })
    .click();
  await expect(chart.locator(".time-axis-title")).toContainText(
    "% of predictions",
  );
  await expect(
    chart.getByRole("button", { name: /^2019: 23 predictions;/ }),
  ).toContainText("43%");
  await page.getByLabel("Target-year interpretation").selectOption("strict");
  await expect(page.getByLabel("Interpretation", { exact: true })).toHaveValue(
    "strict",
  );
  await expect(chart.locator(".time-year")).toHaveCount(5);
  await expect(chart).toContainText("61 of these 67 forecasts");
  await expect(
    chart.getByRole("button", { name: /^2009: 38 predictions;/ }),
  ).toHaveAccessibleName(/11 on time, 8 late, 13 partial, 6 missed/);
  await page.reload();
  await expect(page.getByLabel("Target-year interpretation")).toHaveValue(
    "strict",
  );
  await page
    .getByLabel("Interpretation", { exact: true })
    .selectOption("broader");
  await expect(page.getByLabel("Target-year interpretation")).toHaveValue(
    "broader",
  );
  await expect(chart.locator(".time-year")).toHaveCount(6);
  await expect(chart).toContainText("68 predictions with deadlines passed");
  await expect(
    chart.getByRole("button", { name: /^2025: 1 predictions;/ }),
  ).toBeVisible();
});

test("target-year visualization is readable and accessible on desktop and mobile", async ({
  page,
}) => {
  await page.goto("/#by-target-year");
  const chart = page.locator("#by-target-year");
  await chart.screenshot({ path: "work/screenshots/target-years-desktop.png" });
  await chart
    .getByRole("button", { name: "Share of each group", exact: true })
    .click();
  await chart.screenshot({ path: "work/screenshots/target-years-share.png" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const year = chart.getByRole("button", { name: /^2019: 23 predictions;/ });
    if ((await year.getAttribute("aria-expanded")) !== "true")
      await year.click();
    await expect(chart.locator(".time-records tbody tr")).toHaveCount(23);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await chart
      .getByRole("button", { name: "Close target-year predictions" })
      .click();
  }
  await chart
    .getByRole("button", { name: "Number of predictions", exact: true })
    .click();
  await chart.screenshot({ path: "work/screenshots/target-years-mobile.png" });
});
