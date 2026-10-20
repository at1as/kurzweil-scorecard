import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import deployment from "../config/public-site.json";
import dataConfig from "../data/config.json";
import {
  createManifest,
  filesIn,
  validateBasePath,
  validateBundle,
} from "./lib/site-bundle";
const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const basePath = validateBasePath(deployment.basePath);
if (process.argv.length > 2)
  throw Error(
    "export:site takes no arguments and never copies to the Pages repository",
  );
function run(args: string[], env = process.env) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`Export stopped: ${args[0]} failed`);
}
// Build from the preserved local packages; this does not research or refresh data.
const npm = process.env.npm_execpath;
if (!npm) throw Error("Run this tool with npm run export:site");
run([npm, "run", "data:import"]);
run([npm, "run", "data:validate"]);
const hash = createHash("sha256").update(basePath);
for (const directory of ["src", "public", "data", "config"])
  for (const file of filesIn(directory))
    hash
      .update(`${directory}/${file}`)
      .update(readFileSync(`${directory}/${file}`));
for (const file of ["next.config.ts", "package-lock.json"])
  hash.update(file).update(readFileSync(file));
run(["node_modules/next/dist/bin/next", "build"], {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_SITE_BASE_PATH: basePath,
  PUBLIC_SITE_EXPORT: "1",
  PUBLIC_SITE_BUILD_ID: hash.digest("hex").slice(0, 24),
});
const files = validateBundle("work/public-build", "public", basePath);
createManifest("work/public-build", basePath, dataConfig.asOf);
console.log(
  `Prepared ${files.length} files in work/public-build for ${deployment.origin}${basePath}/`,
);
console.log(
  "No files were copied to the Pages checkout. Review with npm run export:preview.",
);
