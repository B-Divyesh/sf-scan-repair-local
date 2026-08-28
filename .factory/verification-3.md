# Independent verification 3 — FAIL

Verified 2026-08-28 UTC against candidate `1e5e0101ce48c57f3d47965586c130ad3d5290eb` and `https://scan-repair-local.sociobot.in/`.

## Verdict

**FAIL — do not release this candidate.** The mandatory claim commands and cold first-read gate pass, and the static deployment byte-matches the candidate build. The real deployed OCR path does not work because the production Content Security Policy blocks WebAssembly compilation. The downloadable desktop release predates the candidate's skew/OCR repair, the light demo has a serious axe contrast violation, and user-facing claims remain unlisted or broader than their tests.

No product code was changed during this verification.

## Mandatory gates run first

### Claims gate — PASS for all listed commands

The starting tree was clean on the requested commit. After `npm ci`, every command in `.factory/claims.json` was run separately and exactly as listed against the repository's `/demo` entry point:

| Claim | Result | Evidence |
| --- | --- | --- |
| `demo-sandbox` | PASS | `/demo` loaded the named sample and Reset demo recreated it. |
| `in-memory-original` | PASS | No document/OCR storage keys; repair changed pixels; Undo restored the exact source. |
| `page-diagnosis` | PASS | Contrast, sharpness, skew estimate, and uncertainty label appeared before repair. |
| `reversible-repair` | PASS | Applied repair changed the page source and Undo restored it. |
| `local-ocr` | PASS locally | Bundled OCR worker completed under Vite preview and displayed “recognised on this device.” The production deployment fails this same action; see B1. |
| `review-flagging` | PASS | Flag and unflag states were reversible. |
| `markdown-export` | PASS | Download contained `## Page 1`. |
| `local-processing` | PASS locally | Tested demo repair/export requests stayed on `http://localhost:4173`. |
| `pro-searchable-pdf` | PASS | Seeded verified verdict downloaded a searchable PDF. |
| `offline-demo` | PASS | The cached demo reloaded offline. |

All ten individual commands exited 0. The complete `CI=1 npm run test:browser` run also passed all 12 tests.

### Cold first-read gate — PASS

Cold desktop evidence: `qa-artifacts/first-read-live.png`. Mobile evidence: `qa-artifacts/live-landing-390.png`.

- What it does: “Make scanned pages readable,” followed by inspect, repair, and extract text on-device.
- Who it is for: readers and researchers with scanned books or archival PDFs.
- What to click first: “Try it with sample data” is visible on the first screen and opens `/demo` in one click.
- The demo immediately shows a realistic field-notes page and a persistent “Demo — sample data, nothing is saved” banner with Reset demo and Start for real.
- The first screen includes privacy, offline, and price facts.

## Release-blocking findings

### B1 — Production CSP breaks the core OCR job

The actual local OCR claim passes only on the headerless local Vite preview. On the live deployment, a fresh Chromium context remained at **“Preparing local OCR…” for 180 seconds** and never produced text. It emitted:

```text
WebAssembly.instantiate(): Compiling or instantiating WebAssembly module
violates the following Content Security policy directive because
'unsafe-eval' is not an allowed source of script
```

The page then raised an uncaught `RuntimeError: Aborted(CompileError...)`. Requests for the worker, JavaScript loader, and WASM loader all returned 200; the failure is the response policy, not a missing file. The deployed CSP is:

```text
script-src 'self'
```

It does not permit WebAssembly evaluation. `src-tauri/tauri.conf.json` has the same omission. The action never rejects into the product's recovery alert, so the OCR button stays disabled indefinitely. Because a real imported page starts with both exports disabled until OCR provides text, the deployed product cannot complete its central scan-to-searchable-document job.

This is also an environment gap in the claim test: the claim suite does not serve production headers and therefore cannot catch the failure.

### B2 — Downloadable desktop apps do not match the candidate

The latest release is `v0.1.2`, built successfully by Actions run `33165942888` from commit `3cc129f786b66b0bcd6c13b398c1b234cbbb3edc`. The candidate is `1e5e0101ce48c57f3d47965586c130ad3d5290eb`.

`git diff v0.1.2..HEAD` includes material runtime changes in `src/main.ts`, `src/scan.ts`, and `src/style.css`, including the required line-angle skew estimator and user-visible skew diagnosis. There has been no later desktop release.

Direct artifact evidence confirms the mismatch:

- The 82 MiB Linux AppImage downloaded and matched `SHA256SUMS`: `3d5a5b1fca6cbf6701702ba165febd402f1d37584f80919f2b7ee223d5ca1a8c`.
- It launched under Xvfb after installing its ordinary runtime libraries.
- Its demo workspace still shows only **“Rotation / None”** and has no candidate **“Skew estimate”** field. See `qa-artifacts/released-appimage-demo.png`.
- Its OCR remained at **“Preparing local OCR…” after 35 seconds**. See `qa-artifacts/released-appimage-ocr-after-35s.png`.

The release contains macOS arm64/x64 DMGs, Windows EXE/MSI, Linux AppImage/deb, `SHA256SUMS`, and `latest.json`, and all five release workflow jobs passed. Availability is not the problem: the published binaries are stale and omit the candidate's required core repair.

### B3 — Serious accessibility contrast failure in the primary demo

A fresh axe-core WCAG 2 A/AA/2.1 A/AA scan found one **serious** `color-contrast` violation affecting four light-demo nodes:

- Demo banner `<strong>`: `#17261f` on `#9a6510`, 3.18:1.
- Reset demo button: the same 3.18:1 pair.
- OCR confidence paragraph and bold label: `#9a6510` on `#f7f0e3`, 4.36:1.

The dark demo, light landing, privacy, terms, and explicit 404 page had no serious/critical axe findings. The repository test checks the light landing and dark demo, but never scans the failing light demo. The supplied accessibility contract makes any serious/critical finding release-blocking.

### B4 — The claims ledger is still incomplete and one omitted claim is false

Cross-checking the live copy and README found reliance statements that do not have corresponding entries/tests:

- Landing license help: **“We check an active license at most once a day.”** Opening `/?license=qa-invalid-license-3` made two immediate verify requests for the same token. One returned 200 and the duplicate hit rate limiting with 429. `setupLicense()` calls `verifyLicense()` once inside the query-token branch and again through the stored-token branch. The statement is both unlisted and false for the purchase-return path.
- Landing: **“Use it offline after the app has loaded.”** The listed claim proves only that the seeded sample page reloads offline. It does not prove the broader app/OCR statement, and production OCR fails even while online.
- README: tagging `v*` “builds unsigned macOS DMGs, Windows installers, and Linux AppImage/deb artifacts.” No release/build claim exists, and the available release does not represent this candidate.

The privacy/local-processing test covers the seeded repair and Markdown flow, not the production OCR action. The production OCR action remains same-origin up to the CSP failure, but the broader live behavior is not proven by the declared test.

## High- and medium-severity findings

### H1 — Keyboard focus is lost after workspace actions

Flagging, applying a repair, and resetting the demo each replace the application DOM through `render()`. After keyboard activation, `document.activeElement` became `<body>` in all three cases. A keyboard or screen-reader user must restart navigation from the top after common actions. Controls are otherwise reachable and Enter/Space activation works for the file chooser; the range responds to arrow keys and visible focus rings are present.

### M1 — Rotation feedback says “None” while the page is rotated

Thirty right turns correctly clamp the preview at +8° and thirty additional left turns clamp it at −8° (computed transform matrices matched ±8°). However, the visible “Rotation preview” value remained **“None”** throughout because `turn()` changes only the image style and does not update the `<dd>`. Applied pixels and exact Undo otherwise worked.

### M2 — Touch-size and 200% text details miss the accessibility baseline

At 390 px, several rendered interactive boxes are under the required 44×44 CSS px target: the brand link is 33 px high, the range is 16 px high, and the checkbox itself is 13×13 px. At 200% root text there was no horizontal page overflow, but the narrow page rail visibly merged/clipped its page number and “repair” status (`01rep…`). Evidence: `qa-artifacts/live-demo-390-text-200.png`.

### M3 — Route and version polish is incomplete

- `/does-not-exist-qa` returns status 200 and the landing page instead of the designed `/404.html` with a 404 status.
- Privacy, terms, and 404 pages have no skip link.
- Privacy and terms footers say version `0.1.1`; the application/package/release say `0.1.2`.
- The manifest is served as `application/octet-stream`, although Chromium parsed it without errors.

### M4 — Secondary packaging metadata is stale/incomplete

`scoop-bucket/scan-repair-local.json` still points to `v0.1.0` and contains `REPLACE_WITH_RELEASE_SHA256`. `winget/ScanRepairLocal.yaml` is only a `defaultLocale` document and contains no installer URL or hash. These are not advertised in the current README, but they are not usable package-manager manifests.

## End-to-end and boundary evidence

Fresh live checks apart from the blockers above:

- Real 900×600 PNG import: PASS; diagnosis rendered and export was disabled until text existed.
- Controlled +3° text fixture: PASS; reported `3.0° · turn counter-clockwise · high confidence` and “Repair recommended.”
- Repair boundaries: contrast accepted −20 and +55; rotation clamped at ±8°.
- Reversible repair: PASS; source pixels changed and Undo restored the exact prior data URL.
- Review flag: PASS; flag/unflag reversed correctly.
- Markdown: PASS; downloaded page-referenced edited text with confidence warning.
- Searchable PDF: PASS with a locally seeded verified verdict; PDF.js extracted `Archive shelf B-14 The river road was repaired in 1912.` from the text layer.
- Two-page PDF: PASS; both pages imported.
- Invalid PDF: PASS recovery; alert said `Could not open this file. Invalid PDF structure.` and the landing remained usable.
- Demo storage: document data produced no localStorage, sessionStorage, or IndexedDB entries. Only deliberately seeded license keys appeared in the license-export check.
- Demo repair/Markdown/PDF/import requests were same-origin only. There are no analytics, external fonts, or sign-in. Microsoft Entra validation is not applicable.
- Invalid license return: token was stored under the namespaced key, removed from the URL, and a visible “License no longer active” message appeared. Blank restore input produced an actionable visible error.
- Checkout: PASS; Sociobot returned 303 to hosted Dodo checkout.

## PWA, security, and server behavior

- Offline demo reload: PASS with no console, page, failed-request, or 404 errors.
- Service-worker update: PASS after activation; a seeded old cache was removed, `scan-repair-local-v6` remained, and the new worker controlled the page.
- Cache contains the shell, `/demo`, sample, OCR worker/language/WASM, and deferred PDF/OCR bundles.
- Manifest: Chromium reported no parse errors and standalone display metadata was present.
- Security headers: HSTS, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, Permissions-Policy, and a restrictive CSP are present. The CSP's WebAssembly omission causes B1.
- Hashed JS/CSS use `public, max-age=31536000, immutable`; HTML and the service worker use 30-second revalidation.
- Cold landing and passive demo load had no console/page errors. The OCR action produces the B1 page error.
- Product unlock rate limit: a 60-request concurrent burst produced **30×200 and 30×429** in 782 ms. Sampled 429 responses included `Retry-After: 4`, and CORS allowed the live product origin. Observed burst capacity was 30 successful requests before half the burst was rejected.

## Build, test, performance, and deployment evidence

| Check | Result |
| --- | --- |
| Starting identity | PASS; clean `main`, exact requested HEAD |
| `npm ci` | PASS; 287 packages, 0 audit findings |
| Ten individual claim commands | PASS |
| `npm test` | PASS; 3 tests |
| `npm run lint` | PASS; TypeScript no-emit check |
| `CI=1 npm run test:browser` | PASS; 12 tests |
| `npm audit --omit=dev --audit-level=high` | PASS; 0 vulnerabilities |
| `npm run build` | PASS; exact production site in `dist/site` |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked` | PASS after installing workflow prerequisites; 0 Rust tests |
| Factory `verify-url.sh` | PASS; 200, title/lang/main/one h1/alt/console smoke checks |
| Lighthouse mobile | Performance 99, Accessibility 99, Best Practices 100, SEO 100 |

Lighthouse lab metrics: FCP 1.1 s, LCP 2.0 s, TBT 50 ms, CLS 0, Speed Index 1.1 s. Initial transfer was 245 KiB total: 8,925 B script, 3,397 B CSS, and 236,141 B image. Built entry sizes were 22,617 B raw / 8,838 B gzip JS and 10,872 B raw / 3,308 B gzip CSS; the 235,916 B hero is below the 300 KB budget. INP is not available from this non-interactive lab run; TBT is the available proxy.

The local build and live deployment matched byte-for-byte for `index.html`, `sw.js`, `manifest.webmanifest`, privacy, terms, the entry JS, and CSS. Representative SHA-256 pairs:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `d13ccc16d803df33f27b10c6b732a13fe7c43314e62652193ff9f7df54e1fa29` |
| entry JS | `95ebf69cd02a13f4ce8832e81135a84363c8011d5141f2c31d1225dd6aa99a8b` |
| CSS | `cda36a69a28e35dfc7251b736217059e40bf1398e133acabfdaf98ce363bfa1b` |
| `sw.js` | `bbe1204c4342a812ff8498ff0da27328b77784ce4c709b2de64e6f99655a8e6b` |

This proves the static live site corresponds to the candidate runtime. It does not cure the stale desktop release in B2.

## Evidence files

- `qa-artifacts/first-read-live.png` — cold desktop first screen.
- `qa-artifacts/live-landing-390.png` and `live-demo-390.png` — mobile landing and demo.
- `qa-artifacts/live-demo-390-text-200.png` — 200% text rendering.
- `qa-artifacts/released-appimage-demo.png` — released desktop workspace missing candidate skew diagnosis.
- `qa-artifacts/released-appimage-ocr-after-35s.png` — released desktop OCR still preparing.
- `qa-artifacts/lighthouse-live-mobile.json` — complete fresh Lighthouse report.
- `qa-artifacts/verify-url/verify.json` — factory URL smoke output.

## Required remediation before re-verification

1. Permit the minimum CSP capability needed for bundled Tesseract WebAssembly on both SWA and Tauri, add a production-header OCR test, and ensure initialization failures reject into a recoverable UI state.
2. Tag and publish a new desktop release from the repaired candidate; verify the released workspace contains the skew diagnosis and complete an OCR/export flow in an installed artifact.
3. Fix all serious light-demo contrast nodes and expand the automated axe coverage to both themes on the demo.
4. Add or narrow every unmatched claim. Remove the duplicate purchase-return license verification so “at most once a day” is true, then add its claim test.
5. Preserve or intentionally move focus after actions that rerender the workspace; fix touch targets and the 200% page-rail collision.
6. Update rotation feedback while turning, return the designed 404 with an actual 404 status, align legal/native versions, and repair or remove stale package-manager manifests.
