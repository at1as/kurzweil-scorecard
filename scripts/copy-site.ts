import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import deployment from "../config/public-site.json";
import {
  checkDestination,
  copyBundle,
  verifyManifest,
  validateBundle,
} from "./lib/site-bundle";
const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--write") || args.length > 1)
  throw Error("Usage: npm run export:copy -- [--write]");
const destination = resolve(root, deployment.destination);
validateBundle("work/public-build", "public", deployment.basePath);
const files = verifyManifest("work/public-build", deployment.basePath);
checkDestination(destination, deployment.basePath);
if (!args.includes("--write")) {
  console.log(`Dry run: ${files.length} files would replace ${destination}`);
  console.log(
    "No files written. To copy this reviewed bundle: npm run export:copy -- --write",
  );
} else {
  copyBundle("work/public-build", destination, deployment.basePath);
  console.log(
    `Copied ${files.length} files to ${destination}. No Git operations or deployment performed.`,
  );
}
