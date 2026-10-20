import { afterEach, describe, expect, it } from "vitest";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkDestination,
  copyBundle,
  createManifest,
  validateBasePath,
  verifyManifest,
} from "../scripts/lib/site-bundle";
import { sitePath } from "../src/lib/site-path";
const base = "/sites/kurzweil";
const temporary: string[] = [];
function fixture() {
  const root = mkdtempSync(
    join(realpathSync(tmpdir()), "kurzweil-export-test-"),
  );
  temporary.push(root);
  const source = join(root, "build"),
    destination = join(root, "sites/kurzweil");
  mkdirSync(source);
  mkdirSync(join(root, "sites"));
  writeFileSync(join(source, "index.html"), "<h1>Test export</h1>");
  createManifest(source, base, "2026-10-15");
  return { root, source, destination };
}
afterEach(() => {
  for (const path of temporary.splice(0))
    rmSync(path, { recursive: true, force: true });
});
describe("subpath links", () => {
  it("prefixes native links once, preserving query strings and fragments", () => {
    expect(sitePath("/", base)).toBe("/sites/kurzweil/");
    expect(sitePath("/predictions/?q=K002#main", base)).toBe(
      "/sites/kurzweil/predictions/?q=K002#main",
    );
    expect(sitePath("/sites/kurzweil/predictions/", base)).toBe(
      "/sites/kurzweil/predictions/",
    );
    expect(sitePath("/predictions/", "")).toBe("/predictions/");
    expect(() => sitePath("//external.example", base)).toThrow();
    for (const value of [
      "/",
      "/sites",
      "/sites/kurzweil/",
      "/sites/../",
      "https://example.com",
    ])
      expect(() => validateBasePath(value)).toThrow();
  });
});
describe("manifest-guarded copy", () => {
  it("dry-run checks create nothing, then installs and replaces only its own intact export", () => {
    const { root, source, destination } = fixture();
    writeFileSync(join(root, "sites/other.html"), "Leave this alone");
    checkDestination(destination, base);
    expect(existsSync(destination)).toBe(false);
    copyBundle(source, destination, base);
    expect(verifyManifest(destination, base)).toEqual(["index.html"]);
    writeFileSync(join(source, "index.html"), "Updated export");
    createManifest(source, base, "2026-10-15");
    copyBundle(source, destination, base);
    expect(readFileSync(join(destination, "index.html"), "utf8")).toBe(
      "Updated export",
    );
    expect(readFileSync(join(root, "sites/other.html"), "utf8")).toBe(
      "Leave this alone",
    );
  });
  it("preserves manual edits and added files instead of overwriting them", () => {
    const { source, destination } = fixture();
    copyBundle(source, destination, base);
    writeFileSync(join(destination, "index.html"), "Manual edit");
    expect(() => copyBundle(source, destination, base)).toThrow(/edited/);
    expect(readFileSync(join(destination, "index.html"), "utf8")).toBe(
      "Manual edit",
    );
  });
  it("rejects added destination files, unrelated folders, symlinks, and traversal manifests", () => {
    const { root, source, destination } = fixture();
    copyBundle(source, destination, base);
    writeFileSync(join(destination, "notes.txt"), "User notes");
    expect(() => copyBundle(source, destination, base)).toThrow(
      /added or missing/,
    );
    expect(() => checkDestination(join(root, "sites"), base)).toThrow(
      /Destination must end/,
    );
    expect(() => copyBundle(source, source, base)).toThrow(/separate/);
    rmSync(destination, { recursive: true });
    mkdirSync(destination);
    writeFileSync(join(destination, "index.html"), "Unrelated site");
    expect(() => checkDestination(destination, base)).toThrow(
      /without.*manifest/,
    );
    rmSync(destination, { recursive: true });
    symlinkSync(source, destination);
    expect(() => checkDestination(destination, base)).toThrow(/symlinks/);
    const manifest = join(source, "export-manifest.json");
    writeFileSync(
      manifest,
      JSON.stringify({
        owner: "kurzweil-scorecard",
        version: 1,
        basePath: base,
        files: { "../secret": "hash" },
      }),
    );
    expect(() => verifyManifest(source, base)).toThrow(/added or missing/);
  });
});
