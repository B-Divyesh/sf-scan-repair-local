# Independent verification 9 — FAIL

Tested candidate: `3f77cab1140f8106a145b064ff019a26bb4ad4ff`  
Live URL: <https://scan-repair-local.sociobot.in>  
Date: 2026-08-28 UTC

## Verdict

**FAIL — do not accept this candidate.** The deployed `/demo` does not reliably meet the required live mobile performance budget. A fresh cold Lighthouse run scored **79 Performance** with **5.326 s LCP**, exceeding both the required performance score (>=90) and LCP budget (<2.5 s). An immediate repeat happened to pass (96 / 2.215 s), so the deployment has an unacceptable cold-load performance regression rather than a stable passing result.

## Release-blocking defect

### P1 — live demo mobile performance is unstable and can miss the budget badly

Using Lighthouse 12.8.2, the installed Playwright Chromium, mobile form factor, and DevTools throttling against the live site:

| Route | Run | Performance | FCP | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `/demo` | cold | **79** | 1.907 s | **5.326 s** | 0 ms | 0 |
| `/demo` | immediate repeat | 96 | 1.618 s | 2.215 s | 156 ms | 0 |
| `/` | cold | 98 | 1.671 s | 2.188 s | 56 ms | 0 |

On the failing demo trace the LCP element is the initial sample page image (`#page-image`). Lighthouse assigns 1.437 s to load delay and 3.611 s to its load time, although the response is only 1,180 bytes. A candidate cannot rely on a subsequent warm or lucky repeat to meet a stated live performance gate. Reproduce with:

```sh
CHROME_PATH=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome \
  npx --yes lighthouse@12.8.2 https://scan-repair-local.sociobot.in/demo \
  --quiet --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage' \
  --form-factor=mobile --throttling-method=devtools \
  --only-categories=performance,accessibility,best-practices,seo
```

The cold-run report was written to `/tmp/scan-demo-lh.json` in the verifier container; the repeat is `/tmp/scan-demo-lh-repeat.json`.

## Mandatory claim gate — PASS

`.factory/claims.json` exists and contains 13 claims. After `npm ci` from the clean checkout, I ran every exact declared command individually through the browser demo entry point. All passed:

`demo-sandbox`, `in-memory-original`, `page-diagnosis`, `reversible-repair`, `local-ocr`, `review-flagging`, `markdown-export`, `local-processing`, `pro-searchable-pdf`, `no-subscription`, `offline-demo`, `daily-license-check`, and `desktop-download`.

The complete browser suite also passed: `CI=1 npm run test:browser` — **22/22**, with `test-results/.last-run.json` reporting `{"status":"passed","failedTests":[]}`.

## What passed

- **First read:** a new cold browser visit answers the three required questions in plain words: “Make scanned pages readable”; “For readers and researchers with scanned books or archival PDFs”; and one-click **Try it with sample data**. No console or page error occurred. The demo link opens `/demo` directly.
- **Build/test gates:** `npm ci`, `npm test` (5/5), `npm run lint`, `npm run test:release` (2/2), `npm audit --omit=dev --audit-level=high`, `CI=1 npm run test:browser` (22/22), `npm run build`, and `cargo test --manifest-path src-tauri/Cargo.toml --locked` (after the workflow's Linux prerequisites; library, binary, and doc targets, 0 tests) all passed. `dist/site` was produced. Main initial app JS is 9,722 gzip bytes and CSS 3,513 gzip bytes.
- **Live end-to-end:** in the live demo, rotation plus Apply changes the image from `/sample-scan.svg` to a JPEG data URL; Undo restores the original. Flagging, Markdown export with `## Page 1`, and actual local OCR passed; OCR returned 272 characters, and no third-party document request or console/page error occurred.
- **Invalid input/recovery:** an invalid text upload produces the native browser message “Could not open this file. Unsupported image”; after dismissing it, **Try it with sample data** opens the demo normally.
- **Mobile, keyboard, accessibility:** at 390px the demo body and viewport are both 390px wide and the image reserves 1200x1600 dimensions. Axe WCAG 2 A/AA found no violations on `/` or `/demo`; skip link focus moves to `main`; reduced motion yields `scroll-behavior: auto`; no console errors occurred.
- **Privacy and offline:** the live document flow made only same-origin document requests (and a same-origin blob URL); it stored no document in persistent browser storage. The active `scan-repair-local-v11` service worker cached `/demo` and reloaded the sample while offline with no failed requests or errors.
- **Headers/routing/caching:** `/`, `/demo`, `/privacy`, and `/terms` return 200; an unknown route returns a styled 404. CSP has `default-src 'self'`, narrowly permits GitHub release metadata and Sociobot licensing in `connect-src`, and has HSTS, nosniff, referrer, and permissions policies. The hashed app bundle is `public, max-age=31536000, immutable`.
- **Rate limit:** a single client made 40 invalid verify requests to the documented Sociobot product endpoint. Requests 1–30 returned 200; request 31 onward returned **429** with `Retry-After: 1`. Observed allowance: 30 requests per burst/window.
- **Desktop release:** GitHub’s latest release is `v0.1.7`, its `latest.json` names source `87c2376ba9c5e3a4e07557ead4a67cd51d0373ab`, and the Linux AppImage SHA-256 is `cdae1018aca6f6cbed4a46ee87dd3d2d3a0255b51d1fcf7925649f9c859ea058`, matching `SHA256SUMS`.
- **Deployment identity:** local candidate build and live deployment match exactly for `index.html`, `demo/index.html`, `sw.js`, the manifest, main JS, CSS, and `sample-scan.svg`. The `v0.1.7` source is an ancestor of this candidate; changes after it are only handoff/verification evidence.

## Additional QA note

Before installing the Linux Tauri prerequisites from the repository’s release workflow, `cargo test --manifest-path src-tauri/Cargo.toml --locked` could not start because `glib-2.0.pc` was absent from this otherwise clean container. The README says only to install Rust before running Tauri and does not document the Linux system packages. This is a documentation/clean-environment gap, not the P1 verdict above; the workflow itself does install those prerequisites.

## Repair required

1. Make the demo’s first sample image consistently satisfy the cold mobile LCP/performance budget, then repeat independent cold live Lighthouse runs until all are >=90 and <2.5s LCP.
2. Record the repeatable evidence in the handoff and request verification again. Also document the Linux Tauri system prerequisites in the README so local desktop verification is reproducible.
