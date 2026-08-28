# Independent verification 6 — FAIL

**Candidate:** `d0254841c521e5f188200f5ab0d1d141ae0f2f47`  
**Live URL:** <https://scan-repair-local.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Decision:** **FAIL — do not mark this candidate accepted.**

The scan-repair workflow, deployment, PWA, paid-license integration, and desktop release all work in fresh testing. The candidate still fails explicit acceptance requirements: the live download status is false and absent from the claim ledger, required keyboard/shell elements are missing on secondary routes, and the desktop landing/metadata deliverables are incomplete.

No product code was changed during this verification.

## Mandatory first gates

### Claims manifest and exact commands

The clean checkout was exactly the requested commit and matched `origin/main`. `.factory/claims.json` exists with 11 entries. After `npm ci`, every listed command was run separately and exactly as written against the production-preview `/demo` entry point.

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

All 11 commands exited 0. The later complete browser run also passed 17/17.

### Cold first read

**PASS.** In fresh desktop and 390px contexts, the first viewport says:

- What it does: “Make scanned pages readable.”
- For whom: readers and researchers with scanned books or archival PDFs.
- What to do: “Choose a scan” and “Try it with sample data.”

The sample action is visible without scrolling. One click opens `/demo`, which immediately shows a populated repair/OCR workspace and the persistent “Demo — sample data, nothing is saved” banner with Reset demo and Start for real. There were no console or page errors. Evidence: `evidence-6/first-read.json` and the four `first-read-*`/`demo-*` screenshots.

## Release-blocking findings

### High — live download status is false and is not in the claims ledger

The landing page tells every visitor **“Downloads are being published”**, but release `v0.1.4` is already published with macOS, Windows, and Linux assets. The label is the initial permanent state; the app does not check GitHub until the visitor clicks it. On click, the Linux control successfully resolved to `Scan.Repair.Local_0.1.4_amd64.AppImage`, so the defect is the visible status and claim, not asset availability.

No `.factory/claims.json` entry covers the desktop-download availability/status claim. The claims contract makes an unlisted visitor-reliance statement release-blocking. The installer contract also requires an OS-detected download action that represents the real available asset, with the publishing fallback reserved for an unavailable release.

Evidence: `evidence-6/download-license.json`; the GitHub latest release API returned `v0.1.4` with seven installer/manifest/checksum assets.

### High — required keyboard and standard route shell are incomplete

The non-negotiable accessibility baseline requires a skip link to `main`. Both `/privacy` and `/terms` have a header and main landmark but no skip link. The designed 404 has a main landmark but no skip link, standard header, or footer. The site-structure contract requires the shared header and footer on every route.

Axe does not flag a missing bypass link, so the zero-violation axe result does not negate this manual finding.

### High — desktop landing walkthrough is missing

For a desktop-app artifact, the installer contract requires a captioned 3–5-frame screenshot walkthrough on the landing page. The page contains one generated reading-room illustration and four text-only steps, but no product screenshots or walkthrough frames. The one-click live demo is useful but does not replace this separate desktop landing requirement.

### Medium — required social/touch artwork is incomplete

The Open Graph and Twitter image is `reading-room.webp`, which is 1200×800. The site-structure contract requires a real 1200×630 social image. The Apple touch icon also points to the SVG favicon instead of providing the required 180px touch asset. These do not break the core workflow, but they are explicit release metadata requirements.

## Core product exercise

Fresh live-browser checks succeeded without console/page errors:

- Imported a representative 1000×600 printed scan; diagnosis showed contrast, sharpness, and qualified skew before repair.
- Twenty right-turn clicks clamped at 8°. Apply changed page pixels; Undo restored the exact prior source.
- Bundled OCR returned the expected archival text at 94% and labelled it “recognised on this device.”
- Markdown downloaded as `scan-repair-local.md` with `## Page 1` and an OCR-confidence warning.
- Imported a generated two-page PDF, navigated both pages, ran local OCR at 95% on each, and exported Markdown with both page references.
- Invalid bytes named as a PNG produced “Could not open this file. Unsupported image”; the landing remained usable. A 1×1 PNG boundary input opened without a crash.
- Flag/unflag, demo reset, repair/Undo, searchable-PDF entitlement, and daily license caching also passed the automated suite.

Evidence: `evidence-6/live-e2e.json`, `live-normal-ocr.png`, and `live-two-page.png`.

## Build and automated checks

| Check | Result |
| --- | --- |
| `npm ci` | PASS; lockfile install, 0 audit vulnerabilities reported |
| 11 exact claim commands | PASS; 11/11 |
| `npm test` | PASS; 3/3 Vitest tests |
| `npm run lint` | PASS; TypeScript no-emit check |
| `npm run build` | PASS; exact production build emitted `dist/site` |
| `CI=1 npm run test:browser` | PASS; 17/17 Playwright tests |
| `npm audit --omit=dev --audit-level=high` | PASS; 0 vulnerabilities |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked` | PASS after installing the same Linux native prerequisites used by the release workflow; 0 Rust tests are defined |
| Factory `verify-url.sh` on `/` and `/demo` | PASS; 200, title/lang/one h1/main/alt/labels, no errors |

Production build sizes: entry JS 23,125 B raw / 8.94 kB gzip; CSS 11,344 B raw / 3.38 kB gzip; no webfonts; hero WebP 235,916 B. These pass the supplied initial budgets. PDF/OCR code is split into deferred chunks.

Fresh mobile Lighthouse scores:

| Route | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 93 | 100 | 100 | 100 | 1.0 s | 2.2 s | 280 ms | 0 |
| `/demo` | 100 | 100 | 100 | 100 | 0.8 s | 0.9 s | 40 ms | 0 |

Lab INP is not emitted by a navigation-only Lighthouse run; TBT is recorded as the available lab interaction proxy. Full reports are in `evidence-6/lighthouse-live-*.json`.

## Accessibility, keyboard, and mobile

- Axe WCAG 2 A/AA: zero serious/critical violations on the live landing page and light/dark demo workspaces.
- One h1, one main landmark, ordered headings, labelled controls, and useful image alt text were present in the rendered main routes.
- At 390px, the keyboard sequence reached the skip link, brand, theme switch, visible Choose a scan button, and sample link; both hidden file inputs were skipped.
- Enter on the sample link opened `/demo`; Tab from Add pages moved to Close document rather than the hidden input.
- All visible tested demo controls met 44px sizing. The only 1×1 element returned by the size probe was the intentionally hidden, non-tabbable file input.
- At 200% root text size, document/body width remained 390px. Reduced-motion transition duration was `0.01ms`.

Evidence: `evidence-6/live-a11y.json` and `live-mobile-200.png`.

## Privacy, PWA, headers, and rate limiting

- The live real-file repair/OCR/export request log contained only the product origin and a same-origin blob URL. No analytics, third-party font/script, upload, console error, or page error was observed.
- CSP allows self plus the documented GitHub release and Sociobot license APIs; HSTS, nosniff, strict-origin referrer policy, and restrictive permissions policy are present.
- Hashed JS/CSS use `public, max-age=31536000, immutable`; HTML/service worker use 30-second revalidation.
- The live service worker controlled `/demo`, cached the shell plus PDF/OCR dependencies, reloaded offline, and completed real OCR offline without failed requests. A cold installation with an injected `scan-repair-local-v1` cache left only `scan-repair-local-v7`, confirming old-cache cleanup. Chromium reported no PWA installability errors.
- A single-client burst of 40 invalid license-verification calls returned 30×200 followed by 10×429. Every observed 429 had `Retry-After: 4`; the observed allowance was 30 requests in that window.
- A returned invalid license was stored under the documented namespaced key, removed from the URL, visibly reported as inactive, and was not rechecked on reload within one day.
- Checkout returned 303 to the hosted Dodo checkout. The product has no sign-in flow.

Evidence: `evidence-6/live-e2e.json`, `pwa-offline-update.json`, `pwa-cache-migration.json`, `parity-headers.json`, `rate-limit.json`, and `download-license.json`.

## Deployment and desktop release identity

- The fresh local build and live deployment match across all 33 served product files. The only excluded build file is `staticwebapp.config.json`, correctly consumed rather than publicly served. The OCR language file also byte-matched when requested with identity encoding; normal HTTP clients transparently decode its gzip representation.
- `index.html`, `/demo`, `asset-manifest.json`, `sw.js`, artwork, legal pages, manifest, robots, sitemap, and installer scripts all matched byte-for-byte.
- Release `v0.1.4` was built from `cdd7991524a88cf2b1d4861af009e0ccf601082d`; that commit is an ancestor of this candidate, whose only later difference is `.factory/handoff.md` documentation.
- GitHub Actions run `33194925307` passed macOS arm64/x64, Windows x64, Linux x64, and release jobs.
- Release assets include both macOS DMGs, Windows MSI/EXE, Linux AppImage/deb, `SHA256SUMS`, and valid `latest.json`.
- `Scan.Repair.Local_0.1.4_amd64.deb` matched its published checksum and reports package/version/architecture `scan-repair-local`/`0.1.4`/`amd64`. Its extracted desktop binary remained running until the 12-second headless-display timeout; only expected virtual-display EGL warnings appeared.

Evidence: `evidence-6/full-parity.json`, `parity-headers.json`, and `download-license.json`.

## Required remediation

1. Add and test a real desktop-download availability claim. Fetch release metadata on page load and label the detected platform/asset; show “Downloads are being published” only on actual failure or absence.
2. Add a visible-on-focus skip link to `/privacy`, `/terms`, and the 404; give the 404 the standard header/footer and keep route navigation consistent.
3. Add the required 3–5-frame captioned desktop walkthrough using real product screenshots.
4. Supply a 1200×630 social image and a 180px Apple touch icon, then point the metadata at them.
5. Re-run every claim command and the full verification after deployment.
