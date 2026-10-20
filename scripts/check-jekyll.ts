import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import deployment from "../config/public-site.json";
import { digest, verifyManifest } from "./lib/site-bundle";

process.chdir(fileURLToPath(new URL("../", import.meta.url)));
if (process.argv.length > 2) throw Error("test:jekyll takes no arguments");
const bundle = resolve("work/public-build");
const files = verifyManifest(bundle, deployment.basePath);
mkdirSync("work", { recursive: true });
const fixture = mkdtempSync(resolve("work/jekyll-check-"));
const source = join(fixture, "source");
const output = join(fixture, "output");
cpSync(bundle, join(source, deployment.basePath.slice(1)), { recursive: true });
// Match the hosting repo's relevant include rules. No host files are read or written.
writeFileSync(
  join(source, "_config.yml"),
  `
url: ${JSON.stringify(deployment.origin)}
baseurl: ""
include:
  - _next
  - _not-found
  - "__next*.txt"
  - _buildManifest.js
  - _clientMiddlewareManifest.js
  - _ssgManifest.js
`,
);
const result = spawnSync(
  process.env.JEKYLL_BIN || "jekyll",
  [
    "build",
    "--source",
    source,
    "--destination",
    output,
    "--disable-disk-cache",
  ],
  {
    cwd: source,
    stdio: "inherit",
    env: { ...process.env, JEKYLL_ENV: "production" },
  },
);
if (result.error)
  throw Error(
    "Jekyll was not found. Install it or set JEKYLL_BIN to its executable.",
    { cause: result.error },
  );
if (result.status !== 0) throw Error(`Jekyll failed; inspect ${fixture}`);
for (const file of [...files, "export-manifest.json"]) {
  const rendered = join(output, deployment.basePath.slice(1), file);
  if (
    digest(readFileSync(rendered)) !== digest(readFileSync(join(bundle, file)))
  )
    throw Error(`Jekyll changed ${file}; inspect ${fixture}`);
}
console.log(
  `Jekyll preserved all ${files.length} exported files and their manifest. Fixture: ${fixture}`,
);
