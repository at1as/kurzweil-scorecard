import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";

export const MANIFEST = "export-manifest.json";
const OWNER = "kurzweil-scorecard";
export const digest = (data: Buffer | string) =>
  createHash("sha256").update(data).digest("hex");
export function validateBasePath(basePath: string) {
  if (!/^\/sites\/[a-z0-9-]+$/.test(basePath))
    throw Error("Expected /sites/<slug> with no trailing slash");
  return basePath;
}
export function filesIn(root: string): string[] {
  if (lstatSync(root).isSymbolicLink())
    throw Error("Symlinks are not allowed in a site bundle");
  return readdirSync(root, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      if (entry.isSymbolicLink())
        throw Error("Symlinks are not allowed in a site bundle");
      if (entry.isDirectory())
        return filesIn(join(root, entry.name)).map(
          (name) => `${entry.name}/${name}`,
        );
      if (!entry.isFile())
        throw Error("Only regular files are allowed in a site bundle");
      return [entry.name];
    });
}
export function validateBundle(
  root: string,
  publicRoot: string,
  basePath: string,
) {
  validateBasePath(basePath);
  const files = filesIn(root).filter((f) => f !== MANIFEST);
  const publicFiles = new Set(filesIn(publicRoot));
  const page =
    /^(?:(?:predictions\/[A-Z0-9-]+|predictions|methodology|sources|categories|404|_not-found)\/)?(?:index\.(?:html|txt)|__next[\w.$-]*\.txt)$|^404\.html$/;
  const asset =
    /^_next\/static\/(?:[\w.-]+\/)+[\w.-]+\.(?:js|css|woff2?|ttf|svg)$/;
  const summary = /^evidence\/[A-Z0-9-]+\/summary\.json$/;
  for (const file of files) {
    const data = readFileSync(join(root, file));
    if (publicFiles.has(file)) {
      if (digest(data) !== digest(readFileSync(join(publicRoot, file))))
        throw Error(`Public download changed in export: ${file}`);
    } else if (
      !page.test(file) &&
      !asset.test(file) &&
      !summary.test(file) &&
      file !== "icon.svg"
    ) {
      throw Error(`Unexpected export file: ${file}`);
    }
    if (/\.(?:html|js|css|json|txt|md)$/.test(file)) {
      const text = data.toString("utf8");
      if (
        /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|ghp_[a-zA-Z0-9]{30,}|\/Users\/[a-zA-Z0-9_-]+\//.test(
          text,
        )
      )
        throw Error(`Private credential or local path pattern in ${file}`);
      if (file.endsWith(".html")) {
        // Next emits an origin preconnect; it is not a site navigation or asset URL.
        const links = text.replace(/<link\b[^>]*\brel="preconnect"[^>]*>/g, "");
        for (const match of links.matchAll(/(?:href|src)="(\/(?!\/)[^"]*)"/g)) {
          if (!match[1].startsWith(`${basePath}/`))
            throw Error(`Unprefixed URL ${match[1]} in ${file}`);
        }
        if (text.startsWith("---"))
          throw Error(`Jekyll front matter is not allowed in ${file}`);
      }
    }
  }
  for (const required of [
    "index.html",
    "predictions/index.html",
    "methodology/index.html",
    "sources/index.html",
    "categories/index.html",
    "404.html",
    ...publicFiles,
  ]) {
    if (!files.includes(required))
      throw Error(`Missing export file: ${required}`);
  }
  const records = JSON.parse(
    readFileSync(join(publicRoot, "data/predictions.json"), "utf8"),
  );
  if (!Array.isArray(records.predictions) || !records.predictions.length)
    throw Error("Missing exported record inventory");
  const intake = JSON.parse(
    readFileSync(
      join(publicRoot, "data/releases/v0.1/predictions.json"),
      "utf8",
    ),
  );
  if (!Array.isArray(intake.predictions) || !intake.predictions.length)
    throw Error("Missing original intake inventory");
  const ids = [...records.predictions, ...intake.predictions].map(
    (r: { id: string }) => r.id,
  );
  for (const id of ids)
    for (const file of [
      `predictions/${id}/index.html`,
      `evidence/${id}/summary.json`,
    ]) {
      if (!files.includes(file)) throw Error(`Missing record output: ${file}`);
    }
  if (
    !files.some((f) => f.endsWith(".js")) ||
    !files.some((f) => f.endsWith(".css"))
  )
    throw Error("Missing scripts or styles");
  return files;
}
export function createManifest(root: string, basePath: string, asOf: string) {
  const files = Object.fromEntries(
    filesIn(root)
      .filter((f) => f !== MANIFEST)
      .map((f) => [f, digest(readFileSync(join(root, f)))]),
  );
  writeFileSync(
    join(root, MANIFEST),
    JSON.stringify(
      {
        owner: OWNER,
        version: 1,
        basePath: validateBasePath(basePath),
        researchSnapshot: asOf,
        files,
      },
      null,
      2,
    ) + "\n",
  );
}
function noSymlinkAncestors(path: string) {
  for (let p = resolve(path); ; p = dirname(p)) {
    if (existsSync(p) && lstatSync(p).isSymbolicLink())
      throw Error("Copy paths must not contain symlinks");
    if (p === dirname(p)) return;
  }
}
export function verifyManifest(root: string, basePath: string) {
  const files = filesIn(root);
  if (!files.includes(MANIFEST))
    throw Error(
      "Refusing to replace a directory without this exporter's manifest",
    );
  const manifest = JSON.parse(readFileSync(join(root, MANIFEST), "utf8"));
  if (
    manifest.owner !== OWNER ||
    manifest.version !== 1 ||
    manifest.basePath !== basePath ||
    !manifest.files ||
    typeof manifest.files !== "object"
  )
    throw Error("Unrecognized export manifest or base path");
  const recorded = Object.keys(manifest.files).sort();
  if (
    JSON.stringify(recorded) !==
    JSON.stringify(files.filter((f) => f !== MANIFEST).sort())
  )
    throw Error(
      "Export has added or missing files; preserve those changes before replacing it",
    );
  for (const file of recorded)
    if (digest(readFileSync(join(root, file))) !== manifest.files[file])
      throw Error(
        `Export file was edited: ${file}. Preserve it before replacing the export`,
      );
  return recorded;
}
export function checkDestination(destination: string, basePath: string) {
  validateBasePath(basePath);
  noSymlinkAncestors(destination);
  if (!resolve(destination).endsWith(basePath.split("/").join(sep)))
    throw Error(
      `Destination must end in ${basePath}; never target the repository or sites directory itself`,
    );
  if (!existsSync(dirname(destination)))
    throw Error("Destination's sites directory must already exist");
  if (existsSync(destination) && filesIn(destination).length)
    verifyManifest(destination, basePath);
}
/** Copy only a verified bundle, using a sibling staging directory and rollback. */
export function copyBundle(
  source: string,
  destination: string,
  basePath: string,
) {
  source = resolve(source);
  destination = resolve(destination);
  noSymlinkAncestors(source);
  if (
    source === destination ||
    source.startsWith(`${destination}${sep}`) ||
    destination.startsWith(`${source}${sep}`)
  )
    throw Error("Source and destination must be separate directories");
  verifyManifest(source, basePath);
  checkDestination(destination, basePath);
  const stage = mkdtempSync(
    join(dirname(destination), `.${basename(destination)}-stage-`),
  );
  const backup = `${stage}-previous`;
  try {
    for (const file of filesIn(source)) {
      const target = join(stage, file);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(join(source, file), target);
    }
    verifyManifest(stage, basePath);
    checkDestination(destination, basePath);
    if (existsSync(destination)) renameSync(destination, backup);
    try {
      renameSync(stage, destination);
    } catch (error) {
      if (existsSync(backup)) renameSync(backup, destination);
      throw error;
    }
    if (existsSync(backup)) rmSync(backup, { recursive: true });
  } finally {
    if (existsSync(stage)) rmSync(stage, { recursive: true });
  }
}
