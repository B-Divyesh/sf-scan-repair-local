# Scan repair and OCR review 1 — PASS

**Verdict: PASS.** There are zero findings at every severity and zero untested public claims.

## Scope

- Reviewed implementation candidate: `5ffe0ccbe5c1297869bc0e9584052edeeade8b07`.
- Functional release source: `c9b713921df92168e036c6839aa18fe69fbd8f89` (`v0.1.8`). The difference from the candidate is only `.factory/` evidence and handoff material.
- Documentation HEAD: `ac466d99450009b229bb2c85445f65790df5f131`.
- Live product: <https://scan-repair-local.sociobot.in>.
- Review date: 2026-09-05 UTC.

The job is to make scanned pages readable and searchable without uploading them. The audience is readers and researchers with scanned books or archival PDFs. The first action is **Try it with sample data**; it opens the named sample workspace in one click.

## Fresh live review

Fresh desktop and 390 px phone contexts loaded the landing and `/demo` without console or page errors. The first screen names the job, audience, and action. `/demo` immediately showed **Demo — sample data, nothing is saved**, with Reset demo and Start for real.

The realistic field-notes sample remained visibly labelled as a demo. It made no persistent browser storage entries. Live repair changed the page pixels, Undo restored the exact original source, the manual-review flag worked, and Markdown exported as `scan-repair-local.md` with `## Page 1` and an OCR-confidence note. Local OCR returned 272 characters and **High confidence · estimated 89% · recognised on this device**. A separate fresh context first loaded the OCR assets, went offline, ran OCR again, and returned the same 272 characters with no errors or failed requests.

The mobile workspace had no horizontal overflow at 390 px, kept its primary repair action at 48 px high, and remained usable at 200% text size. The designed keyboard focus ring was present; the skip link moved focus to `main`. Reduced motion set transitions to `1e-05s`. Axe WCAG 2 A/AA scans had no violations on landing or either demo theme. The factory URL checker passed both routes: each had HTTP 200, `lang=en`, one `h1`, a `main`, image alt text, labelled buttons, and no console errors.

Privacy logging for the full demo flow found only the product origin, blob URLs, and bundled OCR files. There were no document uploads, analytics, or third-party document requests. The worker was active, cached `/demo`, and an offline reload restored the sample without errors. The live `/privacy` and `/terms` pages each returned 200 with their route titles and one `h1`; an unknown route returned the designed page with the expected HTTP 404.

## Claims

`npm ci` was run before the checks. Every exact command declared by `.factory/claims.json` passed separately, then the complete browser suite passed 23/23. All 13 public claims are tested and passed:

| Claim IDs | Result |
| --- | --- |
| `demo-sandbox`, `in-memory-original`, `page-diagnosis`, `reversible-repair` | PASS |
| `local-ocr`, `review-flagging`, `markdown-export`, `local-processing` | PASS |
| `pro-searchable-pdf`, `no-subscription`, `offline-demo` | PASS |
| `daily-license-check`, `desktop-download` | PASS |

The landing page, demo, README, Privacy, and Terms were cross-checked against the claim ledger. No unlisted reliance claim was found. The landing copy audit remains within the plain-language limits.

## Local checks

| Command | Result |
| --- | --- |
| `npm ci` | PASS |
| 13 individual declared claim commands | PASS |
| `npm test` | PASS — 5 tests |
| `npm run lint` | PASS |
| `npm run test:release` | PASS — 2 tests |
| `npm run build` | PASS — `dist/site` produced |
| `npm audit --omit=dev --audit-level=high` | PASS — 0 production vulnerabilities |
| `CI=1 npm run test:browser` | PASS — 23 tests |
| `npx playwright test tests/a11y.spec.ts` | PASS — 10 tests |
| `cargo test --manifest-path src-tauri/Cargo.toml --locked` | PASS after the README-documented Linux Tauri packages |
| `npm run test:performance` | PASS — three cold mobile local runs: 99 Performance; LCP 1,561 ms, 1,572 ms, and 1,550 ms |

The initial landing JS is 9.72 kB gzip and CSS is 3.50 kB gzip. OCR, PDF, and export code are deferred.

## Deployment and desktop artifact

Fresh candidate build and live hashes match for `main-FUkdVPSg.js` (`a69a012021c0f4b7911b2b92648e1b6f57df2ce2b26e5f013b70d2cec0379a49`), `main-dIU-Thhm.css` (`4b8a8abb9a6fddf881acff128d565fedbb854addb5cac492bd9ea2dcc068476e`), and `/demo` HTML (`f35a6c4f5d9e2c4b6d7c96239f473f8debce18ddb115dae26308cb517e588d9e`). The live product therefore matches the candidate's functional source.

The release verifier passed for `v0.1.8`. `latest.json`, `SHA256SUMS`, macOS DMG, Windows setup EXE, and Linux AppImage were present and bound to `c9b…`. The downloaded Linux AppImage SHA-256 was `b692cbecf77f198696bfa91e0a8b931787487b422342c39e4d9d8e628fd32c13`, matching the manifest. It mounted only by extraction because this disposable container has no FUSE device; its extracted launcher stayed running for 20 seconds under Xvfb with no application error. That is a clean-environment limitation, not a product defect.

The live download control resolved the correct Linux asset. Live security headers included CSP with response-header `frame-ancestors 'none'`, HSTS, `nosniff`, and strict referrer policy. Navigation responses use a short cache policy; hashed assets and the sample scan are immutable.

The public license verification endpoint was checked with 45 concurrent invalid-license requests: 30 returned 200 and 15 returned 429. Sample 429 responses supplied `Retry-After` values of 3 or 4 seconds. This is observed behaviour, not a product promise.

## Earlier findings

Every prior finding was inspected. None remains open.

| Earlier report | Disposition |
| --- | --- |
| `verification.md` | Claims ledger, sandbox, desktop release, audit, pixel Undo, offline OCR, license isolation, accessibility, realistic sample, skew diagnosis, PWA/update, headers, desktop CSP, and error states are now covered by the passing current tests and live checks. |
| `verification-2.md` | The previously incomplete claim ledger and absent skew diagnosis are now covered by the 13-claim ledger and diagnosis test. |
| `verification-4.md` | Live OCR, candidate-matched installers, daily license caching, file-action semantics, 404 status, mobile targets, security metadata, and recovery all pass. |
| `verification-5.md` | Cold mobile performance now passes all three fresh local runs; the reachable native file action retains visible focus. |
| `verification-6.md` | Current download status, shared secondary-route shell, captioned walkthrough, social/touch art, and mobile controls are present and tested. |
| `verification-7.md` | `v0.1.8` is tied to the functional repair source; later candidate and documentation commits change only factory documentation. |
| `verification-8.md` | The pricing sentence fully states $19 once, searchable-PDF scope, and no subscription; its two claims are separately tested. Performance is stable in fresh cold runs. |
| `verification-9.md` | The former intermittent demo LCP regression is addressed by sample preloading and immutable cache policy; current cold runs are 1.55–1.57 s LCP. |
| `verification-10.md` | Rechecked independently in this review; functional parity, release checksum, claims, offline operation, live OCR, accessibility, and rate-limit behaviour agree with its PASS. |

## Findings

- Critical: 0
- High: 0
- Medium: 0
- Low: 0
- Informational: 0
- Untested public claims: 0

## Verdict

**PASS.** Scan Repair Local meets the acceptance contract for its local scan-repair, OCR, review, and export job.
