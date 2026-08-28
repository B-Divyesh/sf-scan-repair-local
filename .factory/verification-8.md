# Independent verification 8 — FAIL

Tested candidate: `9e324ba102a5f5f06705a20cd8bc9d0318e363af`  
Live URL: <https://scan-repair-local.sociobot.in>  
Date: 2026-08-28 UTC

## Verdict

**FAIL — do not accept or release this candidate.** The production demo misses the stated mobile performance/CLS gate, and the pricing copy does not meet the claims contract. This is fresh live evidence, not the earlier deployment-only failure.

## Release-blocking defects

### P1 — `/demo` misses mobile performance and CLS budgets

An independent, throttled mobile Lighthouse rerun on the live demo completed without a runtime error and scored Performance **89**, Accessibility 100, Best Practices 100, SEO 100. It measured FCP 1,600 ms, LCP 2,143 ms, TBT 3.23 ms, and **CLS 0.188996**. The product contract requires mobile Lighthouse performance >=90 and CLS <0.1. The prior independent run also scored Performance 88 with the same CLS value (its final screenshot artifact crashed after audit collection). The landing route scored Performance 90 but measured LCP 3,502 ms, also beyond the stated <2.5 s LCP target.

Evidence: `evidence-8/lighthouse-live-demo-mobile-repeat.json`, `evidence-8/lighthouse-live-demo-mobile.json`, and `evidence-8/lighthouse-live-home-mobile.json`.

### P1 — pricing claim is not fully listed and proved by its declared sandbox test

The landing says “Local Pro costs $19 once … **No subscription.**” The latter promise has no claim entry. The nearest claim, `pro-searchable-pdf`, says “Local Pro costs $19 once and adds searchable-PDF export,” but its only test seeds a local license state and asserts a searchable-PDF download filename; it does not assert the displayed price or any one-time/no-subscription property. The claims contract requires every visitor-reliance claim to have a test asserting the observable result; it explicitly makes unlisted claims release-blocking.

Evidence: `.factory/claims.json`, `tests/claims.spec.ts`, and the live landing copy.

## Mandatory claims gate

The repository began clean (no `node_modules`). After `npm ci`, every exact command in `.factory/claims.json` was run through the production demo entry point and passed:

`demo-sandbox`, `in-memory-original`, `page-diagnosis`, `reversible-repair`, `local-ocr`, `review-flagging`, `markdown-export`, `local-processing`, `pro-searchable-pdf`, `offline-demo`, `daily-license-check`, and `desktop-download`.

The final Playwright result was `{"status":"passed","failedTests":[]}`. Passing commands do not cure the pricing-test coverage defect above.

## What passed

- First-read, cold live landing: “Make scanned pages readable” says it repairs and extracts text from scans, names readers/researchers with scanned books or archival PDFs, and presents one-click **Try it with sample data**. It meets the plain-words/demo gate.
- Repository gates: `npm test` 5/5, `npm run lint`, `npm run test:release` 2/2, `npm run test:browser` 20/20, `cargo test --manifest-path src-tauri/Cargo.toml --locked` (library, binary, and doc targets; 0 tests), and `npm run build` all passed. The build emitted `dist/site`.
- Live end-to-end demo: repair changed pixels; Undo restored the original; manual review flagging worked; Markdown export contained `## Page 1` and OCR confidence; actual local OCR returned 272 characters at estimated 89% confidence. No console/page errors occurred.
- Recovery: an invalid text upload showed “Could not open this file. Unsupported image”; a subsequent two-PNG import opened both pages. Boundary/mobile: 390 px had no horizontal overflow; sampled primary and reset targets measured 48 px and 44 px tall.
- Accessibility: fresh axe scans of landing, light demo, and dark demo had no violations; skip link moved focus to `<main>`; visible focus is a 3 px solid ring; reduced-motion transition duration is 0.01 ms. `verify-url.sh` passed both `/` and `/demo` with title, `lang=en`, exactly one `h1`, main landmark, alt coverage, and no console errors.
- Privacy: the live document flow (demo load, repair, Markdown export, actual OCR) made only `scan-repair-local.sociobot.in` requests plus a same-origin blob URL; it made no third-party document request and persisted no document state in local/session storage. Browser CSP permits only self plus GitHub release metadata and Sociobot licensing API as documented.
- PWA: the active `scan-repair-local-v10` worker controlled the page; `/demo` was cached; `registration.update()` retained an activated worker; offline reload showed the sample with no errors or failed requests.
- Headers/routing/caching: `/`, `/demo`, `/privacy`, and `/terms` returned 200; unknown route returned styled 404. HTML has CSP, HSTS, nosniff, referrer and permissions policies. The hashed app JS has `Cache-Control: public, max-age=31536000, immutable`. Initial built app JS is 9,564 gzip bytes and CSS 3,493 gzip bytes.
- Rate limit: using one client and an invalid verify token, `GET /api/v1/products/scan-repair-local/verify` returned 429 after the burst (31st request in the initial run; 30 successful loop requests after one earlier probe) with `Retry-After: 3` and `X-RateLimit-After: 3`. A second immediate window had only two accepted requests before 429, consistent with a rolling/bucket limit. Exact allowance cannot be inferred beyond the observed burst; enforcement and retry header are present.
- Desktop release: live download metadata identifies `v0.1.6`; the Linux AppImage download SHA-256 was `ae6e0858bc0e05867171e66cb6c311772e3b2398baae55f3e13ef1b5a29a27c0`, matching `SHA256SUMS`. Its extracted desktop entry names Scan Repair Local.
- Deployment parity: local candidate build and live SHA-256 matched for `index.html`, `demo/index.html`, main JS, CSS, service worker, and manifest. The desktop release manifest records tag source `a53d2889c8878f874f5b63a23461ab116763aef2`; it is an ancestor of the tested candidate, and `git diff` shows the candidate changes only `.factory/handoff.md`.

## Evidence

All new artifacts are under `.factory/evidence-8/`:

- `live-demo-e2e.json` — live functional, OCR, privacy, storage, and worker evidence.
- `live-accessibility-and-recovery.json` plus desktop/390 px screenshots — axe, keyboard/focus, reduced motion, input recovery, and mobile measurements.
- `live-pwa.json`, `live-headers.txt`, `rate-limit.txt`, and `deployment-parity.txt` — offline/update, headers, rate limit, and byte parity.
- `lighthouse-live-*.json` — the blocking performance measurements.
- `verify-url-home/` and `verify-url-demo/` — required URL verifier artifacts.

## Repair required

1. Reduce `/demo` layout shift below 0.1 and make repeated throttled mobile Lighthouse performance at least 90; ensure landing LCP is below 2.5 s.
2. Either remove “No subscription” or add a dedicated listed claim/test; amend the Local Pro claim test to assert the exact $19-once copy as well as its gated PDF behavior.
3. Re-run every claim command, full browser suite, production build, and fresh live mobile Lighthouse before requesting verification again.
