# Public repository review — 2026-10-20

No publication blocker was found in the reviewed repository content. The repository remains **private**; this review does not change visibility or deploy the website. The MIT License is present and recognized by GitHub, the repository name is corrected, and the maintainer has approved retaining the existing commit email.

## 2026-10-20 follow-up before the first hosting copy

Rescanned the source repository at `e4c188f`, plus the pending disclosure-label and copy-workflow documentation edits. The scan covered 11 reachable commits, 291 unique historical blobs and 187 publishable working files, including XML and properties inside the Office downloads. No credential, local-path, private contact, phone/SSN or other sensitive-pattern matches were found in file contents. The only findings were commit-metadata emails, and all commit identities match the history previously approved by the maintainer. Office checks again found no hidden sheets, comments, macros or embedded-object payloads.

GitHub still reports this source repository as private. The separate `at1as.github.io` repository is public. Only the generated Kurzweil site and its Sites-directory link are intended for the hosting branch; unrelated local work in that checkout is outside the export and must not be staged. The source remains authoritative, with periodic verified copies rather than a submodule. See [STATIC_EXPORT.md](STATIC_EXPORT.md) for that workflow.

Data integrity, TypeScript and all 78 unit tests passed. The previous full browser run passed 22 tests, and the simplified breakdown was checked at desktop, 390px and 320px widths. Export and hosting builds must be verified after the final source commit, before pushing the hosting branch. This follow-up is a privacy/content review; the dependency-advisory result below is explicitly dated to the earlier review.

## Earlier reviewed checkpoint — 2026-10-19

The time-chart checkpoint is `dd0ea53` in `at1as/kurzweil-scorecard`. At review time, local HEAD and GitHub's only advertised branch, `main`, matched that commit; there were no advertised tags. The scan covered all eight locally reachable commits, 264 unique historical file blobs, and all 185 tracked files at that checkpoint. The documentation and screenshot filename corrections accompanying this review were checked separately.

## Credentials, personal information and repository contents

- Pattern scans found no credentials, private contact records or user-specific absolute paths in the reviewed file contents. Checks covered common service tokens, private keys, JWTs, credential assignments, credentials in URLs, email addresses, phone/SSN patterns and local paths.
- Commit metadata contains the maintainer's name and approved personal email. The author's public name and website also appear intentionally in the interface and documentation.
- The eight tracked Office files, including duplicate downloads, were opened as ZIP containers and their XML and properties inspected. No comments, hidden-sheet declarations, macros or embedded-object payloads were found. Creator fields contain project/tool names; the Word documents retain generic template timestamps, which are not evidence of research dates. The research packages were not modified.
- No dependencies, build output, caches, credential files or local environment files are tracked. There are no tracked symlinks. The largest historical blob is about 2 MB; historical blobs total about 10.5 MB uncompressed, mostly research snapshots.
- GitHub returned no issues or pull requests, releases, or workflow runs. Wikis and discussions are disabled. These checks found no additional repository discussion or release material to review.

This is a pattern scan plus targeted manual review, including historical blobs and zipped Office XML. It is not a penetration test or proof that arbitrary encoded secrets cannot exist. Ignored local files and unrelated repositories are outside the audit. Detailed scanner output remains in ignored `work/public-audit/`; sensitive values are not reproduced here.

## Dependencies and application behavior

A refreshed `npm audit` completed successfully and reported **zero known vulnerabilities** across production and development dependencies. The first request timed out; the successful retry supplies this result. Advisory status is time-dependent. Every resolved dependency URL in the lockfile uses the public npm registry.

A targeted frontend review found no `dangerouslySetInnerHTML`, `eval`, cookie access, local/session storage, or added analytics service. Evidence summaries load from the site's own static files. Preview servers bind to loopback. This remains a static application without an API-key or backend-account requirement.

`npm run check` passed at the time-chart commit: data integrity, TypeScript and 76 unit tests. The preceding implementation verification also passed the production build, all 20 main browser tests, the prefixed static export and its three browser tests. No application code changed during this follow-up review.

## Public README and media

The README explains the question, shows the field comparison, gives sample sizes and limitations, and documents installation, checks, deployment and contributions. It includes a screenshot and links to the research trail without leading with maintainer-specific hosting details. It does not claim an undeployed demo URL is live.

The screenshot was visually checked and remains accurate for the field comparison. Its contents are JPEG data, so its former `.png` filename was corrected to `docs/images/field-comparison.jpg` without changing the image bytes. It is approximately 98 KB and contains no EXIF, XMP, IPTC or comment metadata. Relative links in the top-level and maintained documentation resolve. `PROMPT.md` is labeled as a historical brief.

`LICENSE`, package metadata, README and CONTRIBUTING agree on MIT. The public documentation distinguishes third-party quotations and original source works from the project license. The earlier audit's license, email and repository-name decisions are resolved; no history rewrite was needed.

## Remaining limitations

**Research completeness.** This is a selected collection with AI-assisted editorial judgments. Original book editions still need independent collation; coverage and category sizes are uneven. The README and interface state these limits. They must remain visible when sharing the project. See [the integration review](V03_INTEGRATION_REVIEW.md) for source gaps and [the time-view notes](TIME_VIEW.md) for why the chart does not extrapolate future accuracy.

**Public contents.** Making the repository public would expose its complete reachable history, historical build brief, research packages and prior assessments as well as the current application. The review includes those materials; the original research trail is intentionally preserved. Existing approval covers the commit email.

**Contribution checks.** Local checks and browser tests are documented, but there is no GitHub Actions CI workflow. CI would be useful before relying on outside contributions; its absence does not prevent readers from running or inspecting this project.

Changing repository visibility and publishing the website are separate actions. Neither was performed by this review.
