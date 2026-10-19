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
  for (const value of ["88", "84", "68"])
    await expect(page.locator(".metric-grid")).toContainText(value);
  await expect(page.locator(".metric-grid")).not.toContainText("%");
  await expect(
    page.getByText("Selected reviewed subset only.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#state")).toContainText("36.8%");
  await expect(page.locator("#state")).toContainText("52.9%");
  await expect(page.locator(".mode-comparison")).toContainText(
    "Same 67 forecast versions",
  );
  await page.getByRole("link", { name: /AI & software: 12 of 84/ }).click();
  await expect(page).toHaveURL(/category=AI/);
  await expect(page.locator(".results-toolbar")).toContainText(
    "12 of 84 records",
  );
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
test("category comparisons retain zero categories and show outcome counts without rankings", async ({
  page,
}) => {
  await page.goto("/categories/");
  await expect(page.locator(".analysis-table tbody tr")).toHaveCount(13);
  await expect(
    page
      .locator(".analysis-table tbody tr")
      .filter({ hasText: "Manufacturing & materials" }),
  ).toContainText("0");
  await page.getByRole("button", { name: "Due outcomes", exact: true }).click();
  await expect(page.locator(".analysis-table")).toContainText(
    "Current outcome unknown",
  );
  await expect(page.locator(".analysis-table")).not.toContainText("%");
  await page.getByRole("button", { name: "Verdicts", exact: true }).click();
  await expect(page.locator(".analysis-table")).toContainText("Pending");
  await page.getByLabel("Group by").selectOption("horizon");
  await page.getByRole("button", { name: "Collection", exact: true }).click();
  await expect(page.locator(".analysis-table")).toContainText("Unresolved");
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
