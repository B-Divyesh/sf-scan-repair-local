# Independent verification 2 — FAIL

Verified 2026-08-28 UTC against commit `52b46d9c6dd9f901fcce265e1291bc7d6b1fa7be` and https://scan-repair-local.sociobot.in/.

## Verdict

**FAIL — do not release this candidate as accepted.** The prior deployment-only diagnosis is no longer true: the live site byte-matches this candidate and the desktop release is present and checksum-valid. However, the candidate still fails the factory claims contract and misses a required part of the researched job: it does not present a skew diagnosis to the user.

## Mandatory gates

### Claims first

`.factory/claims.json` exists with six entries. After the clean `npm ci`, before the general repository test suite, I ran every listed command against the `/demo` entry point. All passed; a final `npm run test:claims` also passed all 8 browser tests (the six claim tests plus two accessibility/mobile tests):

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-sandbox` | PASS | `/demo` loaded “Field notes · sample page”; reset retained a fresh named sample. |
| `reversible-repair` | PASS | rotation changed bitmap source; Undo restored its original `src` and identity transform. |
| `markdown-export` | PASS | download was `scan-repair-local.md` and contained `## Page 1`. |
| `local-processing` | PASS | demo repair/export requests were same-origin only. |
| `pro-searchable-pdf` | PASS | a seeded, verified demo verdict downloaded `scan-repair-local-searchable.pdf`. |
| `offline-demo` | PASS | after SW activation, `/demo` reloaded offline with no errors, missing responses, or failed requests. |

### Cold first read

PASS. A fresh desktop visit says “Make scanned pages readable,” explicitly names “readers and researchers with scanned books or archival PDFs,” and puts “Try it with sample data” beside the upload action. The sample link opens `/demo` in one click and shows the persistent “Demo — sample data, nothing is saved” banner, Reset demo, and Start for real.

## Release-blocking defects

### B1 — Claim ledger remains incomplete

The claim ledger does not cover all visitor-reliance statements on the landing page and README. The acceptance contract requires every such statement to have a demo-observable test. Examples currently unlisted include:

- “The original is retained in memory.”
- “See contrast and sharpness before you change a copy.”
- “Apply rotation, contrast and sharpening, then recognise text locally.”
- “Flag uncertain pages and export your reading copy with references.”
- README: document pages/recognised text remain in memory, and no analytics/third-party font/CDN dependency.

`local-processing` only observes the seeded demo repair/Markdown flow; it does not exercise local OCR or prove the broader README storage/third-party assertions. Add claim entries and observable demo tests, or remove/narrow the copy. Per the supplied claims contract, this is a release blocker.

### B2 — Required skew diagnosis is not delivered to the user

The researched smallest useful product requires detection of **skew, blur, and contrast**. The workspace renders contrast and sharpness but not a skew value or skew recommendation. `src/scan.ts` calculates `Diagnosis.skew`, yet `rg -n skew src README.md .factory public` finds no presentation/use outside that calculation and the brief. The “Rotation” field only reflects the manual repair preview (`None` before a user turns the page); it is not a diagnosis. The user must guess whether/how far to rotate a scan, so the core diagnostic workflow is incomplete.

Additionally, the current `skew` calculation is based on left/right total luminance, not observed text/page angle, making it unsuitable to expose as a skew measurement without replacing/validating it. Implement a clearly labelled, per-page skew estimate with an appropriate method and test it on controlled rotated fixtures.

## Fresh positive evidence

- Clean identity: `HEAD` was the requested commit and the starting worktree was clean.
- `npm ci` passed with 0 audit vulnerabilities; `npm test` passed (2); `npm run lint` passed; exact `npm run build` passed and emitted `dist/site`.
- Live cold-page helper passed: HTTPS 200, 611 ms navigation, title/lang/one h1/main, no missing image alt, no unlabeled buttons, and no console/page errors.
- Live demo end-to-end: rotation clamps at 8°; after waiting for the asynchronous repair, pixels changed and Undo restored the original; Markdown had the page reference. An invalid PDF showed “Could not open this file. Invalid PDF structure.” and returned to a usable landing state.
- Live normal OCR was not independently completed within the runner because the local Tesseract worker did not return before the runner command cutoff. The shipped demo intentionally includes seeded recognised text; this is not counted as proof of the actual OCR path.
- Live desktop axe scans found no serious/critical violations on the landing or dark demo workspace. At 390 px the real-file action was keyboard focusable, page width was exactly 390 px, and reduced-motion transition duration was `0.01ms`.
- Privacy: demo repair/export made only `https://scan-repair-local.sociobot.in` requests. No sign-in is used. CSP permits only self plus the declared GitHub release and Sociobot license APIs; live headers include HSTS, nosniff, Referrer-Policy, Permissions-Policy, and CSP. Hashed JS has `Cache-Control: public, max-age=31536000, immutable`.
- Initial budgets pass: entry JS 8.31 kB gzip, CSS 3.28 kB gzip, hero art 235,916 B. OCR/PDF libraries are deferred chunks.
- PWA offline demo claim passed; SW `scan-repair-local-v6` precaches shell, sample, OCR assets and build assets, calls `skipWaiting`, removes old caches, and claims clients.
- Rate limiting: a 60-request concurrent burst to the public Sociobot license verify endpoint returned 30×200 and 30×429. A follow-up 429 included `Retry-After: 1` (and `x-ratelimit-after: 1`).
- Deployment parity: local and live `index.html`, entry JS, CSS, and `sw.js` had identical SHA-256 hashes. The release tag `v0.1.2` is an ancestor of this docs-only candidate; `git diff v0.1.2..HEAD` changes only `.factory/handoff.md`.
- Desktop release: GitHub API lists macOS arm64/x64 DMGs, Windows EXE/MSI, Linux AppImage/deb, `SHA256SUMS`, and valid `latest.json`. Downloaded `Scan.Repair.Local_0.1.2_amd64.AppImage` (82 MiB) verified `OK` against published SHA256SUMS.

## Limits / non-product environment result

`cargo check --manifest-path src-tauri/Cargo.toml` could not finish because this disposable container lacks `glib-2.0` development headers. The published Linux artifact and successful release assets provide the available release evidence; the local Rust failure is not counted as a product defect. The `Cargo.toml` package version is `0.1.1` while Tauri config/release are `0.1.2`; align them in a future repair.

## Required remediation before re-verification

1. Add claim entries and demonstration tests for every remaining user-reliance statement, particularly actual local OCR, retention/storage boundaries, diagnosis, and confidence/flagging flow; otherwise remove/narrow those statements.
2. Surface a valid per-page skew diagnosis alongside contrast and sharpness, with controlled-fixture tests and a clear uncertainty label where appropriate.
3. Re-run the full claim ledger and independent local OCR import after the repair.
