# Independent verification 5 — FAIL

**Candidate:** `26a44b1d7a1ce774d5e42337ba90c65eb3961141`  
**Live URL:** <https://scan-repair-local.sociobot.in>  
**Verified:** 2026-08-28 UTC  
**Decision:** **FAIL — do not release this candidate.**

The live static application is the candidate build: locally rebuilding the candidate produced an `index.html` whose SHA-256 is `6a1b2be1bf049eef647a97dc4f80ec7e1f78be62d7c76cc92ed62b635946781a`, identical to the live response. Its complete `asset-manifest.json` is also byte-for-byte identical to live.

## Release blockers

### High — mobile performance misses the required gate

Fresh mobile Lighthouse against live `/demo` scored **71 performance** (required: at least 90), with **1,860 ms total blocking time**. FCP was 0.9 s, LCP 2.2 s and CLS 0. The audit attributes a 1,012 ms long task and 2,189 ms boot-up work to `assets/main-CUAjLZWP.js`; synchronous sample SVG-to-canvas work during demo startup is the likely cause. Accessibility, best practices and SEO were each 100, but this does not satisfy the performance acceptance gate.

### High — keyboard focus lands on an invisible file input

At 390 px on the live landing page, the Tab sequence is: skip link, wordmark, theme toggle, **Choose a scan**, **Try it with sample data**, then the CSS-hidden `#file-input`. The input is 1 px, transparent and has `pointer-events:none`, but is not removed from the tab order. Computed focus has an outline, yet no focus indicator is visible to the keyboard user. This violates the required visible-focus/keyboard baseline. The same pattern is used for the workspace’s add-pages input.

## First-read result

**Pass.** Cold live page says it “Make[s] scanned pages readable,” names “readers and researchers with scanned books or archival PDFs,” and presents the one-click **Try it with sample data** link on the first screen. Clicking it opens `/demo` directly into a named sample workspace with the persistent “Demo — sample data, nothing is saved.” banner, Reset demo, and Start for real.

## Required claim-test gate

`.factory/claims.json` exists and declares 11 claim IDs. After `npm ci`, every exact listed Playwright command was run from the `/demo` entry point; all passed. A full clean production browser run also passed **15/15** (`test-results/.last-run.json`: `passed`). The pre-install attempt could not resolve the expected local Playwright package; that setup-only failure was resolved by the required lockfile install and did not recur.

| Claim ID | Result |
| --- | --- |
| `demo-sandbox` | PASS |
| `in-memory-original` | PASS |
| `page-diagnosis` | PASS |
| `reversible-repair` | PASS |
| `local-ocr` | PASS |
| `review-flagging` | PASS |
| `markdown-export` | PASS |
| `local-processing` | PASS |
| `pro-searchable-pdf` | PASS |
| `offline-demo` | PASS |
| `daily-license-check` | PASS |

## Build and automated checks

- `npm ci`: PASS (0 production vulnerabilities reported by `npm audit --omit=dev --audit-level=high`).
- `npm run lint`: PASS.
- `npm test`: PASS, 3/3 Vitest tests.
- `npm run build`: PASS; emits `dist/site`.
- `CI=1 npm run test:browser`: PASS, 15/15 Playwright tests, including all claims, production 404, 390 px reachability and axe checks.
- Live axe-core WCAG 2 A/AA scan: no serious or critical violations in the sample workspace in either theme. This automated result does **not** detect the manual hidden-focus failure above.
- Lighthouse live `/demo`: desktop 100/100/100/100 (performance/accessibility/best-practices/SEO); mobile 71/100/100/100.
- `cargo test --manifest-path src-tauri/Cargo.toml --locked`: could not compile in this disposable image because system `glib-2.0.pc` is absent. This is an environment dependency failure before product tests; it is not used as a product defect finding.

## Live product exercise

All of the following were performed on a fresh live browser context without console/page errors:

- Demo loads its realistic field-notes page; diagnosis exposed contrast, sharpness and qualified skew (`Level · low confidence`).
- Rotation plus Apply reversible repair changed the page and made Undo available; Undo restored it.
- Markdown download was `scan-repair-local.md` and contained `## Page 1`.
- Actual bundled local OCR completed and returned “recognised on this device”; OCR text began `FIELD NOTES — RIVER ROAD`.
- A generated two-page PDF imported successfully, yielding two page chips and the heading `two-page-qa.pdf · 2`.
- Invalid `text/plain` input raised `Could not open this file. Unsupported image`; the landing remained usable and the visitor could enter the demo afterward.
- The demo made no external document requests. Observed requests were only same-origin assets, sample, OCR worker/core/language data and a blob URL. Local and session storage were empty before demo work.
- After first load the live service worker controlled the page and cached 21 entries; offline reload of `/demo` restored the sample workspace with no errors or failed requests.

## Deployment, privacy, response policy and installers

- Live `/`, `/demo`, `/privacy` and `/terms` return 200; `/no-such-route` returns designed HTML with real 404.
- Production responses set CSP, HSTS, `X-Content-Type-Options: nosniff`, strict-origin referrer policy and restrictive permissions policy. CSP permits only self plus the documented GitHub release API and Sociobot licensing origin. Hashed JS has `Cache-Control: public, max-age=31536000, immutable`.
- No analytics, third-party scripts, fonts or document-upload requests were observed in the normal demo flow.
- The license verification endpoint was burst with 40 simultaneous invalid-token requests: 30 returned 200 and 10 returned **429** with `Retry-After: 4`; rate limiting is present at or below that concurrent burst level.
- The landing’s release lookup returned GitHub API 200 and selected the real Linux AppImage URL with no console error.
- GitHub release `v0.1.3` has macOS arm64/x64 DMGs, Windows EXE/MSI, Linux AppImage/deb, `latest.json`, and `SHA256SUMS`. Downloaded `Scan.Repair.Local_0.1.3_amd64.deb` SHA-256 was `cdfb780c626c81160593111edecbf1f32675bc488a01e5f0f4fc2d3d79b84341`, matching `SHA256SUMS`; package metadata is version 0.1.3 and depends on WebKit/GTK as expected.
- `v0.1.3` is tagged at parent `09722b32b3a4635525c449cc469a8893be93efff`; the candidate differs only by four lines in `.factory/handoff.md`, so the released executable source is functionally identical to this candidate’s product code.

## Required next steps

1. Remove both hidden file inputs from sequential keyboard focus (for example, use `tabindex="-1"` while retaining the visible native-button trigger), then manually retest the full tab order.
2. Move or defer expensive demo sample rasterization so the mobile Lighthouse performance score is at least 90 and total blocking work is within the product’s performance budget.
3. Rerun the claim suite, mobile Lighthouse, keyboard test and live deployment identity check after the fix; issue a new verification report for the new candidate.
