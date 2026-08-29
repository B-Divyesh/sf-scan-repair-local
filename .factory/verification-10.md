# Independent verification 10 — PASS

## Scope

- Candidate: `5ffe0ccbe5c1297869bc0e9584052edeeade8b07`
- Live URL: <https://scan-repair-local.sociobot.in>
- Date: 2026-08-29 UTC
- Method: clean `npm ci`, local production build/test, fresh live Chromium/Playwright contexts, and one downloaded release asset. Product source was not modified.

## Cold first read

**Pass.** A cold desktop visit returned 200 with no browser errors. The first screen says the tool **“Make[s] scanned pages readable”**, identifies **readers and researchers with scanned books or archival PDFs**, and presents **“Try it with sample data”** beside the real file action. The sample action is one click; `/demo` immediately opens the named sample workspace and persistent **“Demo — sample data, nothing is saved”** banner.

## Required claims

`.factory/claims.json` exists and contains 13 claims. Every listed command was run from the clean checkout against the configured `/demo` entry point; all passed. A final `npm run test:claims` pass reported `23` Playwright tests and `test-results/.last-run.json` recorded `{"status":"passed","failedTests":[]}`.

| Claim | Result |
| --- | --- |
| demo-sandbox | PASS |
| in-memory-original | PASS |
| page-diagnosis | PASS |
| reversible-repair | PASS |
| local-ocr | PASS |
| review-flagging | PASS |
| markdown-export | PASS |
| local-processing | PASS |
| pro-searchable-pdf | PASS |
| no-subscription | PASS |
| offline-demo | PASS |
| daily-license-check | PASS |
| desktop-download | PASS |

## Local quality gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS |
| `npm test` | PASS — 5 tests |
| `npm run lint` | PASS |
| `npm run test:release` | PASS — 2 tests |
| `npm run build` | PASS — generated `dist/site` |
| `npx playwright test tests/a11y.spec.ts` | PASS — 10 tests |
| `npm run test:claims` | PASS — 23 tests |
| `cargo test --manifest-path src-tauri/Cargo.toml` | PASS — after installing the README-documented Linux Tauri prerequisites; 0 Rust tests, compile succeeds |

The initial web bundle is `main-FUkdVPSg.js` at 9.72 kB gzip and CSS is 3.50 kB gzip. Dynamic PDF/OCR/export chunks are not initial-page JavaScript. A fresh local mobile Lighthouse run on `/demo` scored Performance 99, Accessibility 100, Best Practices 100, SEO 100, LCP 1,710 ms, and CLS 0.

## Live product and recovery paths

- `verify-url.sh` passed on `/` and `/demo`: HTTP 200, title, `lang=en`, one `h1`, `main`, image alt text, and no console errors.
- On live `/demo`, repair changed page pixels; Undo restored the exact prior source; manual-review flagging worked; Markdown downloaded as `scan-repair-local.md` containing `## Page 1`; actual bundled OCR produced 272 characters, 89% high confidence, and “recognised on this device.”
- An invalid text file showed “Could not open this file. Unsupported image” and left the landing page usable. A valid PNG then opened, and Close document returned to the landing page.
- At 390×844 there was no horizontal overflow. Keyboard Tab reached the file action; its focused outline was `rgb(0, 95, 204) solid 3px`. The live axe WCAG 2 A/AA scan had no serious or critical findings (indeed no findings). Reduced motion matched and reduced transition duration to `1e-05s`.
- The worker was activated and controlling the page. After `registration.update()`, an offline reload of `/demo` retained the sample workspace with no failed requests or console/page errors.

## Privacy, headers, and limits

During the complete live demo flow (repair, export, OCR), all document-processing requests were same-origin. The cold landing additionally made only the documented GitHub Releases API request; no third-party document resource or telemetry request occurred.

Live documents supplied CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS, and restrictive Permissions-Policy. Hashed JS and the sample scan have `Cache-Control: public, max-age=31536000, immutable`; navigation and service-worker responses use `max-age=30`.

The Sociobot license verification endpoint was independently rate-tested from one client with 45 concurrent invalid-license requests: **30 returned 200 and 15 returned 429**. Every sampled 429 carried `Retry-After: 4`; CORS allowed the product origin. No published numeric allowance was found in the product documentation, so 30 is the observed burst capacity, not a promised public limit.

## Deployment and desktop release

The candidate differs from release source `c9b713921df92168e036c6839aa18fe69fbd8f89` only under `.factory/` (post-release handoff/evidence). The functional source tree is identical. A fresh candidate build was byte-identical to live for main JS (`a69a012021c0f4b7911b2b92648e1b6f57df2ce2b26e5f013b70d2cec0379a49`), CSS (`4b8a8abb9a6fddf881acff128d565fedbb854addb5cac492bd9ea2dcc068476e`), and demo HTML (`f35a6c4f5d9e2c4b6d7c96239f473f8debce18ddb115dae26308cb517e588d9e`), so the deployed product matches the candidate’s functional contents.

Live release `v0.1.8` lists macOS, Windows, and Linux assets plus `SHA256SUMS` and `latest.json`. I downloaded `Scan.Repair.Local_0.1.8_amd64.AppImage`; its SHA-256 was `b692cbecf77f198696bfa91e0a8b931787487b422342c39e4d9d8e628fd32c13`, exactly matching `SHA256SUMS`. The live Linux download button resolves to that asset.

## Defects by severity

- Critical: none.
- High: none.
- Medium: none.
- Low: none.
- Informational: release `latest.json` truthfully identifies the tagged app release source as `c9b…`, rather than the later documentation-only candidate `5ffe…`; functional parity above resolves the deployment comparison.

## Verdict

**PASS.** The candidate satisfies the researched brief’s local scan-repair/OCR/export workflow and the supplied release acceptance contract.
