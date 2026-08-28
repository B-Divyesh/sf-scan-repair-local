# Independent verification — FAIL

Verified 2026-08-28 UTC against candidate `6e666e560b742fcdaddac61c1bbcbec5aad011f1` and `https://scan-repair-local.sociobot.in/`.

## Verdict

**FAIL — do not release.** The candidate fails the mandatory claims and first-read/demo gates, has no downloadable desktop release, ships vulnerable document-processing dependencies, does not actually undo or apply rotation to exported page pixels, cannot start OCR offline after the first visit, and has serious/critical accessibility failures.

The earlier description of the release problem as deployment-only is not supported by fresh evidence. The tag workflow for this exact commit completed with failure on Windows, both macOS targets, and Linux. The GitHub Releases API still returned 404 and the repository had no release assets at verification time.

## Mandatory gate run first

### Claims gate — FAIL

Before dependency installation or other repository inspection:

- `git rev-parse HEAD` returned the requested commit.
- `git status --short --branch` was clean (`main...origin/main`).
- `.factory/claims.json` was absent. Therefore there were no listed claim commands to run. Per the acceptance contract, the missing file is itself release-blocking.
- `.factory/demo.md` is also absent.

Every substantive claim on the live page and in the README is consequently unlisted. These include local/no-upload processing, reversible repairs, blur/skew/contrast diagnosis, local OCR, Markdown with page references, searchable PDF, batch OCR, handwriting review marking, retention of originals, and desktop downloads. Behavioral spot checks found some true, several false, and none backed by a required `@claim:<id>` test.

### Cold first read — FAIL

Cold desktop capture: `verification-artifacts/live-landing-1440.png`. Mobile capture: `verification-artifacts/live-mobile-390.png`.

- What it does: clear — “Turn a difficult scan into a usable page” plus scan diagnosis, repair, OCR, and export copy.
- For whom: unclear — “A private reading-room tool” does not plainly name readers or researchers with scanned books/archival PDFs.
- What to click first: clear — “Choose a scan” is visually primary, with “Try a sample page” next to it.
- One-click sample: a click does load one sample page, but this is **not the required demo sandbox**. It remains on `/`, has no “Demo — sample data, nothing is saved” banner, no Reset demo, and no Start for real. `/demo` renders the ordinary landing page and does not load sample data. No separate demo namespace or demo documentation exists.
- The first screen has no three plain facts covering privacy, offline use, and price. It has privacy and OCR caveats only.

## Release-blocking findings

### B1 — No claims ledger or claim tests

`.factory/claims.json` is missing. The two Vitest unit tests are not tagged claim tests and do not exercise the demo entry point. All user-reliance claims are unlisted.

### B2 — No compliant demo or plain audience statement

The sample action is not a sandbox, `/demo` does not enter sample mode, and the first screen does not name the intended audience. This independently fails the explicit acceptance gate.

### B3 — No installable desktop product

- GitHub Actions run `33157233113` targets this exact commit and finished `failure`.
- All four matrix jobs failed in `tauri-apps/tauri-action`: Windows x64, macOS x64, macOS arm64, and Linux x64. The release job was skipped.
- `GET https://api.github.com/repos/B-Divyesh/sf-scan-repair-local/releases/latest` returned 404.
- The GitHub Releases page said “There aren’t any releases here.” There are no installers, `SHA256SUMS`, or `latest.json` to verify.
- `sh public/install.sh` exited 22 because release `latest.json` returned 404. PowerShell was unavailable locally, but it targets the same absent manifest.
- The live platform button falls back to a releases page with no downloads.

This is an artifact-class failure: the product contract is a desktop app, not only a hosted page.

### B4 — Production dependency audit has critical/high findings

`npm audit --omit=dev` exited 1 with one critical and one high direct dependency finding:

- `jspdf@3.0.4`: critical, including GHSA-f8cm-6447-x5h2 and additional injection/DoS advisories.
- `pdfjs-dist@5.7.284`: high, GHSA-hq66-cqwq-w95j, arbitrary JavaScript execution on a malicious PDF.

The PDF.js issue is directly relevant because opening untrusted scanned PDFs is the primary workflow.

## High-severity product defects

### H1 — “Undo” does not undo and rotation is not applied to output

Behavioral test at both local preview and live:

- Applying a maximum contrast/rotation repair changed the page source.
- Clicking “Undo last repair” left the repaired source byte-for-byte unchanged (`undoRestoredOriginal: false`, `sourceUnchangedByUndo: true`).
- The image remained styled at `rotate(8deg)` after undo.

Source confirms the defect: `src/main.ts:57` only restores the settings object, not `p.source` or diagnosis. `applyRepair` at line 74 redraws contrast/sharpening but ignores `repair.rotate`; rotation remains a CSS-only preview and is absent from repaired/exported page pixels. This contradicts “reversible repairs” and breaks skew repair in the real export workflow.

### H2 — Offline OCR fails after the first visit

The already-loaded landing shell and sample page were available offline. Starting OCR offline then failed to load the lazy JS chunks:

- `/assets/index-DdBV6pZW.js` → `net::ERR_FAILED`
- `/assets/_commonjsHelpers-Cpj98o6Y.js` → `net::ERR_FAILED`
- User received “Local OCR could not start.”

`public/sw.js` precaches only `/` and `/reading-room.webp`; OCR code/data and PDF code are not available until previously fetched online. Thus the smallest useful offline job does not work after the first visit.

### H3 — Paid features are misstated and license enforcement is inconsistent

- Landing/terms claim Local Pro adds batch OCR. No batch OCR action exists; OCR only runs for the active page.
- The exact one-time price is absent.
- `hasLicense()` treats any stored token as licensed unless a separate verdict equals `invalid`. Seeding an arbitrary, never-verified token produced a downloadable two-page searchable PDF; its text layer contained both OCR pages.
- Verification time is global rather than associated with a token. After verifying one invalid token, restoring a different token caused no second request and retained the first `invalid` verdict for up to 24 hours (`verifyRequestCount: 1`). The inverse can retain a previous valid verdict for a different token.
- An invalid-license message is placed only in the visually hidden announcer; there is no persistent visible “license no longer active” notice.

The checkout link itself is correctly routed through Sociobot and returned 303 to hosted Dodo checkout.

### H4 — Accessibility has critical/serious failures outside the initial light landing scan

- Workspace axe scan: one **critical** `label` violation; hidden `#add-input` has no accessible label.
- Dark-mode axe scan: one **serious** contrast rule affecting three nodes. White on dark-mode moss is 1.71:1 for “Choose a scan” and “Download”; the SR mark is 2.11:1.
- The focus color is 2.63:1 against the dark background, below the 3:1 focus-indicator requirement.
- Keyboard tab order reaches the real initial file input only as a clipped 1×1 target at `x=-1`; the visible “Choose a scan” label itself is not focusable. Keyboard users have no visible focus location for the real-file primary action.
- Multiple mobile targets are under 44 CSS px, including the 25.6 px-wide theme control, 39–40 px repair/flag controls, and 14–16 px-tall footer/license links.

The light landing page alone had no axe violations, which explains why the builder’s narrower check missed these failures.

## Other findings

### H5 — The shipped sample does not demonstrate the promised result

The one-click sample is the decorative hero art rather than a realistic scanned text page. Diagnosis says “Looks usable,” while OCR returns 17% confidence and mostly gibberish. There is no sample searchable document outcome. This is poor demo evidence and shows that diagnosis status is not aligned with OCR usability.

### M1 — Skew “diagnosis” is not a geometric skew measurement

`src/scan.ts` derives the reported degrees from left-versus-right luminance, not text/page angle. A controlled page rotated about 1° was reported as `≤ 7.8°`; the sample art reported `≤ 8°`. The copy presents this as a conservative skew estimate without validation.

### M2 — PWA/update contract is incomplete

- There is no web app manifest; `/manifest.webmanifest` returns the HTML fallback.
- The service worker uses a permanent `srl-v1` cache name, no old-cache deletion, and no `skipWaiting`, so update behavior is not managed.
- `/demo` and unknown routes both return the landing app with status 200; there is no designed 404 route.

### M3 — Response policy, caching, and metadata gaps

- Live responses include HSTS, `Referrer-Policy`, and `X-Content-Type-Options`.
- No Content-Security-Policy or Permissions-Policy is served.
- Hashed JS/CSS and artwork receive only `public, must-revalidate, max-age=30`, not long-lived immutable caching.
- `robots.txt` and `sitemap.xml` return 404.
- Canonical, Open Graph, Twitter card, favicon, Apple touch icon, and social preview metadata are absent. Lighthouse logs a 404 console/network error for `/favicon.ico`.
- Privacy and terms pages have valid title/lang/h1/main basics, but do not use the required shared header/footer; the site footer also lacks version/build identity.
- `staticwebapp.config.json`, `.factory/copy-audit.md`, and `.factory/demo.md` are absent.

### M4 — Desktop CSP does not allow the release API actually used

The Tauri CSP permits `https://github.com`, but the UI fetches `https://api.github.com/repos/.../releases/latest`. In the desktop shell that request is expected to violate `connect-src`, forcing the fallback even if a release later exists.

### M5 — Error and state quality gaps

- Restoring an empty license silently does nothing.
- Invalid license state has no persistent visible notice.
- Repair settings and undo state are global and survive closing one document, so a new document can inherit previous settings/state.
- An invalid payload named as an accepted TIFF was rejected with “Unsupported image,” and the app recovered to the landing state. Real TIFF decoding was not established by this test despite TIFF being advertised in the picker.

## Successful checks and useful behavior

These passes do not change the FAIL verdict:

| Check | Result |
| --- | --- |
| Clean identity | HEAD and tag dereference to `6e666e560b742fcdaddac61c1bbcbec5aad011f1`; starting tree clean |
| `npm ci` | PASS; 287 packages installed; audit warning noted above |
| `npm test` | PASS; 1 file, 2 tests |
| `npx tsc --noEmit` | PASS |
| Lint | No lint script/config exposed; not runnable |
| `npm run build` | PASS; exact production site emitted under `dist/site` |
| Local Rust check | Inconclusive in this container: missing system `glib-2.0`; actual GitHub build matrix is the authoritative failure evidence |
| Factory `verify-url.sh` | PASS: HTTPS 200, title/lang/main, one h1, alt text, no errors in that smoke path |
| Normal printed image | OCR 92%, expected text recovered |
| Two-page PDF | Imported 2 pages; OCR 94%/95%; Markdown had page 1/2 references; searchable PDF text layer was extractable |
| Invalid input recovery | Invalid TIFF-named payload produced an “Unsupported image” alert; landing remained usable |
| Privacy network flow | Sample → repair → OCR → Markdown used only same-origin requests plus a blob URL; no analytics/CDN requests |
| License endpoint CORS | Allowed live Sociobot origin; invalid token returned `{valid:false, reason:"invalid"}` |
| Rate limiting | PASS: 100-request burst produced 31×200 and 69×429; sampled 429s had `Retry-After` (1–4 seconds); first numbered 429 was request 23 under concurrency |
| Mobile layout | No horizontal overflow at 390 px; 200% root text test also had no horizontal overflow |
| Reduced motion | Transition duration reduced to `0.01ms` |
| Light landing axe | 0 violations |
| Lighthouse mobile | Performance 98, Accessibility 100, Best Practices 96, SEO 100; FCP 1.0 s, LCP 2.2 s, TBT 100 ms, CLS 0 |
| Initial budgets | Entry JS 18,356 B raw / 7.34 kB gzip; CSS 9,347 B raw / 2.97 kB gzip; hero 235,916 B; Lighthouse total 244 KiB |

The Lighthouse accessibility score applies only to the initial light landing state; the separate workspace and dark-mode scans above found blocking issues. INP is not available as a lab measurement; TBT/max potential FID were used as the available interaction proxies.

## Deployment identity and live response evidence

Fresh local `npm run build` artifacts matched live byte-for-byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `fab67e7fdcf7c44a2604042188b688de334b744d8e61f1d5e442b6fceff9eeae` |
| entry JS | `a4846299fe2b760a2a3d0ebfeb25250395c4855baff3b486f3bd809a8c5db2cb` |
| CSS | `16e036fd0dbaf1db1e3467d46dc88faf8c5b960ddd3961cb83d8b8622913a42e` |
| artwork | `d971cce2ad64caa88ca4368be8082bd0d2212acf21da2279ece579ed39918877` |
| service worker | `368f41f89e955b638f5762bf0a1fd1ad909ba036e1bcaa52683918417414ac19` |
| privacy page | `e33c8bacaced623fe0a3372a5a40dc5a4b1bc41e3118c0cc8e129a046dd61cfe` |
| terms page | `8bd98ae5d6e3c98a68a2ba7a131d67f233e3baf79f7df7fa541da8aa61f32549` |

## Evidence files

- `verification-artifacts/browser-qa.json` — local/live parity workflow, first-screen, requests, keyboard sequence.
- `verification-artifacts/more-browser-qa.json` — offline failure, representative image, two-page PDF, demo route.
- `verification-artifacts/workspace-a11y.json` — critical workspace axe result and touch sizes.
- `verification-artifacts/dark-contrast.json` — serious dark-mode axe result.
- `verification-artifacts/license-qa.json` — URL stripping and second-token verification-cache defect.
- `verification-artifacts/offline-qa.json` — offline reload behavior.
- `verification-artifacts/lighthouse-mobile.report.json` — full Lighthouse result.
- `verification-artifacts/npm-audit-production.json` — production audit details.
- `verification-artifacts/github-actions.json` and `github-jobs.json` — exact candidate release run and matrix results.
- `verification-artifacts/rate-limit.txt` and `build-gates.txt` — concise command evidence.
- Screenshots in `verification-artifacts/` show cold desktop/mobile, sample workspace, OCR result, and 200% mobile text.

## Required remediation before reverification

1. Add `.factory/claims.json`, one observable demo test per claim, and remove or correct every unsupported claim.
2. Implement `/demo` sandbox behavior and `.factory/demo.md`; make the first screen plainly name readers/researchers.
3. Fix repair state: apply rotation to pixels/exports and make Undo restore source plus diagnosis.
4. Ship OCR/PDF assets for offline first-use or narrow the offline claim; implement service-worker update/cache cleanup and a manifest.
5. Replace vulnerable PDF dependencies and add security/audit gating.
6. Fix the full accessibility set, including dark contrast, labeled file inputs, visible keyboard operation, focus contrast, and touch targets.
7. Remove the batch-OCR claim or implement it; display the exact price and bind license verdicts/check timestamps to the token.
8. Make all Tauri targets build, publish the required release/checksums/manifest, and verify one artifact checksum and install path.
9. Add the required metadata, real 404, security headers, immutable asset caching, copy audit, and route skeletons.
