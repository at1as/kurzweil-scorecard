# Public repository review — 2026-10-19

The review found no exposed credentials in the scanned repository content. The original review identified the commit email and project license as maintainer decisions; both are resolved in the follow-up below. The README has been revised for public readers.

The audit itself changed no visibility settings, Git history, remote name, or license. Nothing was published or pushed during that review.

## Scope and results

- Reviewed all six locally reachable commits and 214 unique historical file blobs, plus publishable working files (tracked files and non-ignored additions).
- Confirmed that GitHub's only advertised branch, `main`, points to the same `2d83eec` checkpoint as local HEAD. The remote had no advertised tags. GitHub reported the repository as private.
- Scanned for common service tokens, private keys, JWTs, credential assignments, credentials in URLs, email addresses, phone/SSN patterns and user-specific local paths. No credential, private-contact-record or personal-path matches were found in the files.
- Commit author and committer metadata contain the maintainer's name and personal email in every commit. The project intentionally includes the author's public name and website in its UI and documentation.
- Inspected the XML contents and metadata of the eight Office files in the working tree, including duplicate release downloads. No comments, hidden-sheet declarations, macros or embedded-object payloads were found. Creator fields contain project/tool names; the Word files retain generic template timestamps. The immutable research packages were not altered.
- No build output, caches, dependencies, `.env` files or credential files are tracked. The largest historical blob is about 2 MB; all historical blobs total about 9.8 MB uncompressed. The retained research snapshots account for most of that size.
- `npm audit` reported zero known vulnerabilities across production and development dependencies on the review date. This is a dated advisory result, not a guarantee about future vulnerabilities.
- A targeted frontend review found no `dangerouslySetInnerHTML`, `eval`, cookie access or local/session storage. The checked canonical data uses HTTPS source URLs.

This was a pattern scan plus targeted manual review, including zipped Office XML. It is not a penetration test or a proof that arbitrary encoded secrets cannot exist. Ignored local working files and unrelated repositories are outside the public-file audit. Detailed scanner output is kept in ignored `work/public-audit/`; no sensitive values are reproduced here.

## README and documentation

The README now introduces the question, shows the field comparison, states the collection's limitations, and gives a short path to running and checking the site. Detailed population, timing and URL documentation moved to `REFERENCE.md`. Maintainer-specific hosting instructions remain in `STATIC_EXPORT.md` rather than leading the public introduction.

The screenshot is a local PNG of the application, approximately 98 KB, with no embedded text/EXIF metadata. Relative documentation/image links were checked. The README does not claim an undeployed public URL is live. `PROMPT.md` is labeled as a historical brief so it is not mistaken for the current specification.

`CONTRIBUTING.md` explains how to propose evidence corrections and preserve assessment history. It does not describe the project as open source while its license remains undecided.

## Choices before sharing

**Commit email.** Keep the existing attribution if the maintainer is comfortable with that email being visible. Using a GitHub-provided noreply address for future work does not change old commits. Removing the address from existing commits is a separate history rewrite and should be planned explicitly; no rewrite was performed. See [GitHub's commit-email documentation](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address).

**License.** There is no project `LICENSE` file and GitHub reports no detected license. A public repository can be viewable without being offered under an open-source license. If reuse is intended, choose an explicit license for the code and state separately how research data and third-party quotations are treated. No rights to original source works should be implied by a code license. See [GitHub's licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).

**Repository name.** The GitHub slug is `at1as/kurtzweil-scorecard`, with an extra “t” compared with Kurzweil's name. Consider correcting it before sharing links. The site title and planned public URL use the correct spelling. The remote was not renamed.

**Research framing.** Keep the selected-subset and AI-assisted-assessment disclosures. The corpus is incomplete and category samples are uneven; this project does not establish lifetime accuracy. Original editions and some attribution details still need independent checking. Existing research gaps are documented in `V03_INTEGRATION_REVIEW.md`.

**Automation.** The repository has local checks and browser tests but no GitHub Actions CI workflow. CI would be useful when accepting outside changes; its absence does not prevent readers from running the documented checks.

The export/CTA work and this documentation pass were uncommitted at review time. Review and commit the intended changes before making the repository public. Publishing the website is a separate operation.

## Follow-up — license and repository checkpoint

Jason approved retaining the existing commit email and selected the MIT License. `LICENSE`, package metadata and public documentation now reflect that choice; third-party source rights remain separate. GitHub confirmed the renamed repository is `at1as/kurzweil-scorecard`, and the local remote was updated to that URL. The repository remains private. No history rewrite or website deployment is part of this checkpoint.
