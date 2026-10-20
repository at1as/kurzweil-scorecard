# Static export for jasonwillems.com

The deployment target is `https://www.jasonwillems.com/sites/kurzweil/`. Export preparation happens entirely in this repository. Copying into the personal-site repository is a separate command; publishing remains that repository's deployment step.

## Build and inspect

From this repository, with Node 22+ and Python 3 installed:

```sh
npm ci
npm run check
npm run export:site
npm run export:preview
```

Open **http://127.0.0.1:3100/sites/kurzweil/**. Use `PORT=3101 npm run export:preview` if needed. The prefix matters: a root-only preview can hide broken asset paths.

`export:site` imports and validates the preserved research packages, builds all static routes, checks the output, and writes `work/public-build/export-manifest.json`. It does not copy files to another repository, run Git, or deploy. The output and intermediate files are ignored by Git. The ordinary `out/` root preview stays intact.

The manifest records the base path, research snapshot, and SHA-256 of each exported file. The validator checks the page/asset inventory, all curated and original record pages and evidence summaries, native URL prefixes, public-download hashes, and common credential/local-path patterns. It does not fetch citations or conduct new research. Build time never changes the research cutoff.

Test the actual subpath bundle:

```sh
npx playwright install chromium    # once, unless using an installed browser
npm run test:export
```

The suite starts a server on port 4101 and checks every manifest file by hash, header/footer links, navigation, evidence, filters, downloads, category redirects, canonical URLs, accessibility, and responsive layout. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium executable. Reports and screenshots are under `work/`.

## Configuration and paths

`config/public-site.json` is the deployment configuration:

```json
{
  "basePath": "/sites/kurzweil",
  "origin": "https://www.jasonwillems.com",
  "destination": "../at1as.github.io/sites/kurzweil"
}
```

`destination` is resolved relative to this repository, not the shell's working directory. The copy tool requires it to end with the configured `/sites/<slug>` and requires its parent `sites` directory to exist. Changing the slug or origin requires a new export. Changing the destination alone changes where a reviewed bundle is copied.

Next.js `basePath` is baked into the build. `next/link` and Next router navigation add it automatically. Native anchors, `fetch`, redirects and History API URLs use `src/lib/site-path.ts`. Do not prefix Next links a second time. Author links are defined in that helper too. Canonical and social URLs use `src/lib/site-meta.ts` and always point to the configured public location, including in local previews.

## Copy into the hosting checkout

This repository is the source of truth. The personal-site repository receives a generated copy under `sites/kurzweil/`; it is not currently a submodule. Make application and research changes here, commit them, then rebuild and copy the export. Do not edit the generated copy in the hosting repository.

Create or switch to a dedicated branch in the hosting checkout before copying:

```sh
npm run export:copy               # inspect destination; write nothing
npm run export:copy -- --write    # explicitly copy the reviewed bundle
```

After copying, review and commit only `sites/kurzweil/` and any intentional Sites-directory entry changes. Record the source commit SHA in the hosting commit message, then push that hosting branch for review. Merging into `master` is the separate publication step. Do not include unrelated untracked files or local work.

The second command writes only the configured `sites/kurzweil` directory. It does not edit the parent site's configuration, index, posts, navigation, or other projects. It performs no Git operations.

An empty or absent destination is accepted. For later exports, the destination must have this exporter's manifest, with every file still matching it. Added, removed or edited files stop the copy. Symlinks and overlapping source/destination paths are rejected. The new bundle is staged beside the destination, validated, and installed by rename; the previous directory is restored if installation fails. There is no force-overwrite flag. Preserve destination edits and reconcile them in the source before replacing an export.

Review the resulting diff in the personal-site repository before committing or publishing. That repository can contain unrelated work; do not include it in a site-only commit by accident. Its deployment workflow, inspected on 2026-10-19, builds Jekyll and deploys on pushes to `master`. Recheck the workflow at publication time.

## Jekyll compatibility

The parent site uses Jekyll. Do **not** add `.nojekyll` to it. Exported HTML has no YAML front matter and should be copied unchanged. Keep the full bundle, including Next's route payloads, evidence JSON, fonts and research downloads. No server, API keys, database, or SPA catch-all rewrite is required.

The following include rules were already present in the parent `_config.yml` when inspected:

```yaml
include:
  - _next
  - _not-found
  - "__next*.txt"
  - _buildManifest.js
  - _clientMiddlewareManifest.js
  - _ssgManifest.js
```

An optional check builds an isolated Jekyll fixture with those rules, then verifies that every exported file survives byte for byte:

```sh
npm run test:jekyll
```

It needs an installed `jekyll` command; `JEKYLL_BIN=/absolute/path/to/executable npm run test:jekyll` selects another executable or wrapper. Its source and output stay under `work/jekyll-check-*`. The check neither reads nor writes the parent checkout. It checks static-file preservation; it does not replace a full build of the parent site when actually integrating there.

Jekyll 4.2.2 was used for the initial compatibility check. Keep directory-index/trailing-slash support and correct JavaScript, CSS, JSON, and font MIME types on any replacement host. A nested `404.html` is included; the parent host determines which 404 page is served for unknown URLs.

## Recovery and repeatability

- Only a successful export creates a new reviewed manifest. After any failure, fix it and rerun `export:site` before copying.
- A stale or edited bundle fails manifest verification. Rebuild instead of editing generated files.
- If the raw public downloads change after export, the copy check asks for a new build. Source edits also require rebuilding; the copy command does not compile them.
- For a rollback, check out the desired source revision, regenerate its export, review it, then copy through the same guarded path. Git history in the hosting repository offers a second rollback point after publication.
- Root development remains `npm run dev`; a production root preview is `npm run build` then `npm run preview`. Never use `next start` with this export configuration.
