# Scan Repair Local repair handoff

## Result

This repair addresses both release blockers in independent verification 2 for candidate `52b46d9c6dd9f901fcce265e1291bc7d6b1fa7be` (report commit `9aa4f140019f0c1534dcaa434c0532b0864b0a1d`). The artifact remains a Tauri 2 desktop app with its static companion site in `dist/site`.

## Repairs

- Replaced the unusable left/right brightness calculation with a bounded, sampled projection-profile estimate of the text-line angle. The workspace now shows contrast, sharpness, a signed skew estimate, a clockwise/counter-clockwise correction recommendation, and an explicit confidence label. It uses the estimate in the repair recommendation.
- Added controlled-fixture unit coverage for +3° and -2.5° skew estimates.
- Completed the claim ledger with exact demo tests for in-memory originals/Undo, before-repair diagnosis, actual bundled local OCR, manual review flags, and no-third-party-resource processing. Existing demo, repair, export, Pro, and offline claims remain covered.
- The local OCR regression deliberately invokes the shipped Tesseract worker without routes or fixture responses and waits for the user-visible “recognised on this device” result.
- Narrowed README wording to the observable storage and request boundaries. It no longer makes untested installer-release assertions.

## Verification

From a clean install:

```sh
npm ci
npm test
npm run lint
npm run build
CI=1 npm run test:browser
npm audit --omit=dev --audit-level=high
```

Evidence from this repair:

- `npm ci` — pass; 0 audit vulnerabilities.
- `npm test` — pass; 3 tests, including controlled skew fixtures.
- `npm run lint` — pass.
- `npm run build` — pass; writes `dist/site`. Initial entry JS is 8.84 kB gzip and CSS is 3.29 kB gzip; OCR/PDF dependencies remain deferred.
- `CI=1 npm run test:browser` — pass; 12 browser tests: ten independently runnable `@claim:` tests plus landing/dark-workspace axe, keyboard, 390 px mobile layout, reduced motion, and offline reload.
- Every command listed in `.factory/claims.json` was also run separately and passed. The local OCR claim completed against the bundled worker.
- `npm audit --omit=dev --audit-level=high` — pass; 0 vulnerabilities.
- The Playwright axe integration reports no serious or critical WCAG 2 A/AA findings on the landing or dark demo workspace.
- `cargo check --manifest-path src-tauri/Cargo.toml` is blocked only by this disposable container missing the host `glib-2.0` development package (`glib-2.0.pc`). The release workflow installs its Linux GTK/WebKit prerequisites before building desktop artifacts.

## Deployment

The static deployment target is `sf-scan-repair-local` in Azure resource group `sociobot`. Deployment and post-deploy live checks are recorded after the repair commit is pushed.

## Needs operator action

No signing credentials are configured. Optional signing requires `APPLE_CERTIFICATE` for notarized macOS and `WINDOWS_CERT_PFX` for Authenticode Windows builds. Until then the desktop installers remain unsigned.
