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
  await expect(
    page
      .locator(".metric-grid")
      .getByText("Not yet available", { exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByText("88 records await verification.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /AI & software: 21 of 88/ }).click();
  await expect(page).toHaveURL(/category=AI/);
  await expect(page.locator(".results-toolbar")).toContainText(
    "21 of 88 records",
  );
  expect(errors).toEqual([]);
});
test("search, combined filters, sort, pagination, and reload preserve URL state", async ({
  page,
}) => {
  await page.goto("/predictions/");
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
  await page.getByRole("button", { name: "Show all candidates" }).click();
  await expect(page.locator(".results-toolbar")).toContainText(
    "88 of 88 records",
  );
});
test("exports every filtered row and copies the current view", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/predictions/?category=AI+%26+software");
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
  await page.getByText("Inspect original imported fields").click();
  await expect(page.locator(".raw-data")).toContainText(
    "Legacy quote says 2000",
  );
  await expect(page.locator(".assessment-panel")).toContainText(
    "Not yet reviewed",
  );
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("chess");
  expect((await page.request.get("/predictions/NOT-A-RECORD/")).status()).toBe(
    404,
  );
});
test("category controls switch dimensions and keep empty accuracy honest", async ({
  page,
}) => {
  await page.goto("/categories/");
  await expect(page.locator(".analysis-table tbody tr")).toHaveCount(13);
  await page.getByLabel("Group by").selectOption("type");
  await expect(page.locator(".analysis-table")).toContainText("Not classified");
  await expect(page.locator(".analysis-table tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Accuracy", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No eligible forecasts yet." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Verdicts", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No verified verdicts yet." }),
  ).toBeVisible();
  await page.getByLabel("Group by").selectOption("horizon");
  await page.getByRole("button", { name: "Collection", exact: true }).click();
  await expect(page.locator(".analysis-table")).toContainText("Unresolved");
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
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/predictions/",
    "/categories/",
    "/methodology/",
    "/sources/",
    "/predictions/AUD-001/",
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
