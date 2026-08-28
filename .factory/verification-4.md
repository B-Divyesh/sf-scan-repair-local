# Independent verification 4 — FAIL

Verified 2026-08-28 UTC against candidate commit `e05edbdfd294f209f20b96629a1accad1bbbafe1` and `https://scan-repair-local.sociobot.in/`.

## Verdict

**FAIL — do not accept or release this candidate.** The claim ledger, local tests, build, static deployment parity, sample demo, basic privacy checks, PWA offline reload, and published release availability all have positive evidence. Two central release requirements nevertheless fail: live local OCR is broken by the deployed CSP, and every downloadable desktop artifact predates the candidate. A further visible claim (“We check an active license at most once a day”) is false on the return-from-checkout path and is not in the claims ledger.

No product code was changed in this verification.

## Mandatory gates

### Clean identity and claims first

The checkout initially had the requested `HEAD` and no worktree changes. `.factory/claims.json` exists with ten entries. After `npm ci`, I ran each listed command separately using its `/demo` entry point. All final exact-command runs passed; `CI=1 npm run test:browser` also passed all 12 Playwright tests.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-sandbox` | PASS | `/demo` loaded “Field notes · sample page”; Reset demo recreated it. |
| `in-memory-original` | PASS | Repair changed the image and Undo restored exact pixels without persistent document storage. |
| `page-diagnosis` | PASS | Contrast, sharpness, skew estimate, and uncertainty label appeared before repair. |
| `reversible-repair` | PASS | Rotation/repair changed pixels and Undo restored the prior page. |
| `local-ocr` | PASS locally | Vite preview completed bundled OCR and marked it “recognised on this device.” This does not represent the deployed CSP; see B1. |
| `review-flagging` | PASS | Flag/unflag were reversible. |
| `markdown-export` | PASS | Sample downloaded page-referenced Markdown. |
| `local-processing` | PASS | Demo repair/export requests remained same-origin. |
| `pro-searchable-pdf` | PASS | A seeded verified license exported a searchable PDF. |
| `offline-demo` | PASS | After first load and service-worker activation, `/demo` reloaded offline. |

An early individual run of `reversible-repair` hit a transient missing demo image and the first OCR attempt was interrupted while the test server was starting. Both exact commands were rerun cleanly and passed, as did the complete 12-test suite; they are not treated as claim failures.

### Cold first-read and demo

PASS. A cold live desktop page plainly states:

- What it does: “Make scanned pages readable.”
- Who it is for: “readers and researchers with scanned books or archival PDFs.”
- What to click first: the visible one-click “Try it with sample data” action.

The first screen also contains privacy, offline, and price facts. `/demo` immediately opens the realistic field-notes workspace and shows the persistent “Demo — sample data, nothing is saved” banner with Reset demo and Start for real.

## Release-blocking defects

### B1 — Live local OCR is broken by Content Security Policy

The central locally-run OCR action works in the headerless local preview but fails in the deployed product. In a fresh live Chromium context I clicked **Run OCR again** in `/demo` and waited 180.9 seconds. It remained **“Preparing local OCR…”**, stayed disabled, and never recovered. The only page error was:

```text
Aborted(CompileError: WebAssembly.instantiate(): Compiling or instantiating WebAssembly module violates the following Content Security policy directive because 'unsafe-eval' is not an allowed source of script …)
```

The live policy is `script-src 'self'`; it does not permit the Tesseract/Emscripten WebAssembly compilation path. The error escapes the action's `try/catch`, so the advertised recovery alert is not shown and the control remains disabled. Real imported documents begin with exports disabled until OCR supplies text, so the deployed product cannot do its core scan-to-searchable-document job.

Fix the web and Tauri CSP with the narrow WebAssembly permission required by the shipped runtime (normally `'wasm-unsafe-eval'`, not broad `'unsafe-eval'`), ensure the error reaches the recovery UI, and add a production-header OCR regression test.

### B2 — The downloadable desktop applications do not match the candidate

The live static site is the candidate, but the installable product is stale:

- Fresh `npm run build` outputs matched the live HTML, entry JS, CSS, service worker, privacy page, and terms page byte-for-byte. The entry bundle is `index-CDrf6mml.js` (`95ebf69c…a99a8b`).
- GitHub’s latest release is `v0.1.2`, built from commit `3cc129f786b66b0bcd6c13b398c1b234cbbb3edc`, not candidate `e05edbdf…`.
- `git diff v0.1.2..e05edbdf` includes material runtime changes in `src/main.ts`, `src/scan.ts`, `src/style.css`, tests, and claims; it is not a documentation-only difference from the released desktop application.
- The release has valid macOS, Windows, and Linux assets plus `latest.json` and `SHA256SUMS`. A freshly downloaded Windows installer matched its checksum (`0c985cbd…f591cd7a18`). The Linux AppImage also matched its published checksum (`3d5a5b1f…d5ca1a8c`). Availability is not the issue; candidate parity is.

Publish and verify a new macOS/Windows/Linux release built from the repaired candidate (including a real OCR run in an installed artifact) before acceptance.

### B3 — The daily license-check claim is unlisted and false

The landing page says “We check an active license at most once a day.” It has no corresponding claim entry/test. In a fresh live context at `/?license=qa-license-cache-20260828`, the app stripped the token from the URL and stored it as intended, but made **two immediate** `GET /api/v1/products/scan-repair-local/verify` requests for that same token; both returned 200. `setupLicense()` invokes `verifyLicense()` once for the query token and then immediately again for stored state before either request can cache its result.

This violates the literal visitor-reliance claim and the claims contract. De-duplicate the return-path check, then list and test the corrected once-per-day behavior or remove the statement.

## High and medium findings

### H1 — Semantic primary file action fails a baseline accessibility rule

Lighthouse found `aria-allowed-role` and `label-content-name-mismatch` on the landing page. In particular, the visible **Choose a scan** control is a `<label role="button" tabindex="0">`, an ARIA role that is not allowed on `label`; the brand’s accessible name does not include its visible “Scan Repair Local” text. The product’s own keyboard handler supplies activation, but the markup violates the required “buttons vs links used correctly” baseline. Use an actual button that controls the hidden file input (or a native file-input approach) and make the brand’s accessible name include its visible label.

### M1 — No actual 404 response and legal version is stale

`/no-such-route` returns HTTP 200 with the SPA landing page, not the designed `/404.html` and a 404 status. This does not meet the routing contract. Privacy and Terms also render `Version 0.1.1` while the site/package/release identify as `0.1.2`.

### M2 — Some mobile touch targets are below 44 × 44 CSS px

At a 390px viewport, the footer Terms link is 36.6 × 44px; the brand is 205.1 × 33px. The range and checkbox controls expose 16px and 13px input boxes respectively. There is no horizontal overflow at normal or 200% text size, but these targets miss the supplied touch-target baseline.

## Positive end-to-end, privacy, and security evidence

- Representative WebP image and generated one-page PDF imports both opened locally without console errors; the expected diagnosis appeared. A corrupt PNG left the landing workspace usable (the picker’s accept filter limits normal selection to PDFs/common images).
- On live `/demo`, repair changed pixels, Undo restored the exact prior image source, Markdown downloaded as `scan-repair-local.md`, and the sample page could be flagged. No document keys appeared in localStorage.
- Passive demo load and repair/export used only `https://scan-repair-local.sociobot.in` plus blob downloads. There are no third-party fonts, scripts, analytics, or sign-in; Entra validation is not applicable. CSP permits only self, the GitHub release API, and Sociobot billing API; HSTS, nosniff, Referrer-Policy, Permissions-Policy, and CSP are present.
- A 40-request concurrent burst to the public Sociobot license verify endpoint returned 30×200 and 10×429. The first observed 429s occurred at roughly request 26 under concurrency and included `Retry-After: 3`; rate limiting passes.
- Hashed JS/CSS and hero art are immutable for one year. Initial entry JS is 8.84 kB gzip, CSS 3.29 kB gzip, and the hero image is 235,916 bytes; deferred OCR/PDF chunks are not initial-load assets.
- Live axe WCAG 2 A/AA scans found zero serious/critical violations on landing and dark demo. At 390px there was no horizontal overflow and the skip link showed a designed 3px focus ring. Reduced motion is respected by stylesheet policy.
- Lighthouse mobile (live): Performance 93, Accessibility 99, Best Practices 100, SEO 100; LCP 2.2s, CLS 0, TBT 270ms. The two non-perfect accessibility audits are the semantic findings above, not serious/critical axe failures.
- `npm test` (3 tests), `npm run lint`, `npm run build` (emits `dist/site`), `CI=1 npm run test:browser` (12 tests), and `npm audit --omit=dev --audit-level=high` (0 vulnerabilities) all passed.

## Required remediation before another verification

1. Repair the web/Tauri CSP and OCR exception handling; verify a live production-header OCR run and imported-document exports.
2. Tag/publish all desktop artifacts from the repaired commit and verify one installed artifact end to end.
3. Fix the duplicate license verification and add the statement to `.factory/claims.json` with an observable demo test, or remove it.
4. Correct semantic controls, actual 404 routing/status, stale legal version, and undersized mobile targets.
