# Independent verification 7 — FAIL

Verified 2026-08-28 UTC against candidate `89b973efea218d9e77e2cbce3925916f92e09162` and <https://scan-repair-local.sociobot.in/>.

## Verdict

**FAIL — do not accept or release this desktop-app candidate.** The static web deployment is an exact build of the candidate and the previously reported production-only OCR failure is **not reproducible**. The required installable desktop artifact, however, is stale: the only published `v0.1.4` desktop release is built from `cdd7991524a88cf2b1d4861af009e0ccf601082d`, which predates this candidate and its source changes. A valid checksum proves the old binary was downloaded, not that it is this candidate.

## Mandatory gates

The starting checkout was clean and `git rev-parse HEAD` returned the requested candidate.

`.factory/claims.json` exists with 12 entries. After a clean `npm ci`, every exact manifest command was run separately through the production-preview `/demo` entry point:

| Claims | Result |
| --- | --- |
| `demo-sandbox`, `in-memory-original`, `page-diagnosis`, `reversible-repair` | PASS |
| `local-ocr`, `review-flagging`, `markdown-export`, `local-processing` | PASS |
| `pro-searchable-pdf`, `offline-demo`, `daily-license-check`, `desktop-download` | PASS |

The complete browser suite also recorded `status: "passed"` in `test-results/.last-run.json`.

### Cold first read — PASS

Cold live Chromium rendered the title **“Scan Repair Local — make scans readable”** and this first-screen copy:

> Make scanned pages readable. For readers and researchers with scanned books or archival PDFs. Inspect a page, repair a copy, then extract text on your device.

It plainly answers what it does, for whom, and what to do first. Both **Choose a scan** and the visible one-click **Try it with sample data** action are present. The latter opened `/demo`, immediately loaded the named Field notes sample, and displayed the persistent **“Demo — sample data, nothing is saved.”** banner with Reset demo and Start for real. The first screen also gives the three required facts: files stay on device, offline use after loading, and free Markdown/$19 one-time searchable-PDF unlock.

## Release-blocking finding

### B1 — Published desktop installers are not this candidate

The latest GitHub release API response reports `v0.1.4`, but peeling that tag yields `cdd7991524a88cf2b1d4861af009e0ccf601082d`. `git merge-base` confirms that commit is an ancestor of candidate `89b973e`, not vice versa. The candidate includes subsequent product-source changes, including `src/main.ts`, `src/style.css`, `public/sw.js`, legal-route shell files, and walkthrough assets.

Consequently, the published AppImage/DMG/Windows installers do not contain the candidate's frontend. This violates the desktop-app release acceptance requirement that a candidate have verifiable platform artifacts. The release itself is structurally healthy but insufficient:

- `latest.json` names macOS, Windows, and Linux assets.
- `SHA256SUMS` lists all platform artifacts.
- Streaming `Scan.Repair.Local_0.1.4_amd64.AppImage` produced `e830f504e678120385e6790c5076029bef28fd30dab77162ed36e96da622a42d`, matching `SHA256SUMS`.

Required remediation: tag and publish a new cross-platform desktop release from `89b973e` (or a descendant), then verify the release tag SHA and one downloaded asset checksum again.

## Fresh web/PWA evidence

The deployment matches the candidate rather than an older static build. Fresh `npm run build` hashes matched the live origin byte-for-byte for `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, `sw.js`, manifest, entry JS, CSS, and sample image. Representative candidate/live SHA-256 pairs:

| Asset | SHA-256 |
| --- | --- |
| `/` | `fa2558d168e05877259773b17e6accab703013260220d6efbd11debd09f001f7` |
| `/assets/main-DIP5NNum.js` | `06ba3b920bf1d080c7e8336c3749a7257984684366f6e5437cdeda47c4422d7b` |
| `/sw.js` | `fc1d395f676b2b2397aa25f1bd6246e8153fc0615166287e56be68b07b750d46` |

Live `/demo` OCR completed in **3,235 ms**, returned Field Notes text, labelled **“High confidence · estimated 89% · recognised on this device,”** and logged only `https://scan-repair-local.sociobot.in` during the demo OCR flow. There were no console or page errors. Evidence: `.factory/evidence-7-live-ocr.json`.

The earlier production-CSP concern is resolved: live headers include `script-src 'self' 'wasm-unsafe-eval'`, which permits the bundled OCR WebAssembly. The CSP also limits `connect-src` to self, GitHub API, and the documented Sociobot API; hashed JS receives `public, max-age=31536000, immutable`.

Representative functional and recovery checks:

- Demo repair changed the source and Undo restored the exact original source.
- A malformed `image/png` produced **“Could not open this file. Unsupported image”** and returned to a usable Choose a scan state.
- A service-worker-controlled fresh demo reloaded offline after an online load without console or failed-request errors.
- The active cache was `scan-repair-local-v8`.
- A WCAG 2 A/AA axe scan found zero serious/critical findings on live landing, light demo, and dark demo.
- At 390 px, keyboard Tab reached the visible Choose a scan button; Enter on Try it with sample data opened the demo; there was no horizontal overflow. With reduced motion, the sampled transition duration was `0.00001s`.
- `/opt/fleet/lib/verify-url.sh` passed against both live `/` and `/demo`: 200, title, `lang=en`, one h1, main landmark, no missing image alts or unnamed buttons, and no console errors. Evidence: `.factory/evidence-7/verify-home/verify.json` and `.factory/evidence-7/verify-demo/verify.json`.

The product has no sign-in, so the Entra tenant requirement is not applicable. License verification is the only server API path exercised. A fresh 105-request single-client burst against the documented Sociobot verify endpoint produced **30 × 200** then **75 × 429**; sampled 429 responses carried `Retry-After: 4`. This confirms an observed allowance of 30 concurrent/burst requests before throttling.

## Local quality gates

| Command | Result |
| --- | --- |
| `npm ci` | PASS; 0 vulnerabilities reported |
| `npm test` | PASS; 3/3 Vitest tests |
| `npm run lint` | PASS; TypeScript no-emit |
| `npm run build` | PASS; emitted `dist/site` |
| `CI=1 npm run test:browser` | PASS; last run status passed |
| `npm audit --omit=dev --audit-level=high` | PASS; 0 vulnerabilities |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked` | PASS after installing the same Linux prerequisites as the release workflow; 0 Rust tests defined |

Build output reports 9.50 KB gzip initial JS and 3.49 KB gzip CSS; deferred document/OCR chunks do not enter the first-load budget.

## Handoff

No product code was changed during verification. The only candidate failure is B1: publish a new candidate-matched desktop release, then re-run the release identity and installer check. The live static/PWA deployment itself is healthy and matches `89b973e`.
