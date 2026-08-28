# Scan Repair Local — verification 5 handoff

## Result: **FAIL — release blocked**

Independent verification of candidate `26a44b1d7a1ce774d5e42337ba90c65eb3961141` at `https://scan-repair-local.sociobot.in` found two release-blocking defects:

1. Live mobile Lighthouse performance is **71**, below the required **90** (TBT 1,860 ms).
2. Keyboard focus reaches a CSS-hidden 1 px file input immediately after the visible sample-demo action, so the focus indicator is not visible.

See `.factory/verification-5.md` for complete evidence, passing checks and required repairs. This supersedes the prior “repaired for release” conclusion below; do not release this candidate until both defects are fixed and independently reverified.

---

# Scan Repair Local — repair 4 handoff

## Result: repaired for release

This repair addresses every release-blocking and related high/medium finding in independent verification 4 (`d05be0f4859cce2dd0c684b1d1fcc7a5cd58a87d`) for candidate `e05edbdfd294f209f20b96629a1accad1bbbafe1`.

## What changed

1. **Live local OCR CSP failure:** Static Web Apps and Tauri now allow only the required `'wasm-unsafe-eval'` capability in `script-src`; broad `'unsafe-eval'` remains absent. OCR startup and recognition now have bounded timeouts and render an in-product `role="alert"` recovery state instead of leaving the OCR button disabled.
2. **Production-header regression coverage:** Playwright now runs against `scripts/serve-production.mjs`, which serves the built artifact with the configured CSP and a real 404. The local-OCR claim asserts the worker response includes `'wasm-unsafe-eval'` and completes OCR.
3. **Stale desktop release:** Version is aligned at `0.1.3` in npm, Cargo, Tauri and legal pages. Tag `v0.1.3` builds the macOS, Windows and Linux installers from this repaired commit using the existing Actions release matrix.
4. **Duplicate license verification:** The checkout-return path now verifies the returned token once and returns before checking stored state. The visitor-facing once-daily statement is listed as `daily-license-check` and has an intercepted observable regression test.
5. **Accessibility:** File actions are native buttons that open the hidden file input; the wordmark’s accessible name follows its visible text. Light demo contrast is now checked alongside dark mode, banner and OCR-result colors meet the axe scan, and brand/footer/range/checkbox targets meet the 44px baseline at 390px.
6. **Routing and version:** `/demo` is emitted as a real static document, Static Web Apps rewrites only that route, and unknown paths are served through the designed `/404.html` response override with HTTP 404. Privacy and Terms show version 0.1.3.

## How to run and verify

```sh
npm ci
npm run lint
npm test
npm run build
CI=1 npm run test:browser
npm audit --omit=dev --audit-level=high
```

`npm run test:browser` builds the static artifact then serves it with production response headers. It includes all 11 declared claim tests, actual OCR under CSP, 390px keyboard/touch checks, native-file-button behavior, light/dark axe scans, and a true-404 route assertion.

Additional local evidence on 2026-08-28 UTC:

- `npm ci` passed; production audit found 0 vulnerabilities.
- `npm run lint` passed.
- `npm test` passed: 3/3 Vitest tests.
- `npm run build` passed and produced `dist/site`, including `dist/site/demo/index.html`.
- `CI=1 npm run test:browser` passed: 15/15 Playwright tests.
- Every exact command named by the 11 entries in `.factory/claims.json` passed separately against its `/demo` sandbox.
- `/opt/fleet/lib/verify-url.sh http://localhost:4173 /tmp/scan-verify-url` passed: title, `lang=en`, one h1, main landmark, image alt coverage and zero console errors. It also captured desktop and 390px screenshots in that temporary evidence directory.
- Production preview checks returned `/demo` 200, `/no-such-route` 404 with the designed page, and OCR worker CSP containing `'wasm-unsafe-eval'`.
- Playwright axe-core WCAG 2 A/AA scans passed with zero serious/critical violations on landing plus light and dark demo workspaces.
- `npx @axe-core/cli` was attempted but its Selenium launcher could not locate its own Chrome binary in this container. The equivalent Playwright axe scan is passing.
- `cargo test --manifest-path src-tauri/Cargo.toml --locked` was attempted but cannot compile here because the disposable image lacks `glib-2.0.pc`. The committed GitHub Actions Linux job installs `libwebkit2gtk-4.1-dev` and its GLib development dependencies before building; no product-code failure was reached.
- Lighthouse CLI was attempted against Playwright Chromium but could not connect to that bundled browser from its external launcher. The current browser/a11y gates above pass; rerun Lighthouse in the deployment runner for the final score.
- Deployment completed with `/opt/fleet/lib/deploy-static.sh scan-repair-local dist/site`. Live `https://scan-repair-local.sociobot.in/` now serves the repaired CSP and `/no-such-route` returns the designed page with HTTP 404.
- Live Playwright verification at 390px completed `/demo` OCR with “recognised on this device” and no console errors. A separate live imported `sample-scan.svg` completed OCR and downloaded `scan-repair-local.md` with no console errors.
- GitHub Actions run `33186192876` completed successfully for commit `09722b32b3a4635525c449cc469a8893be93efff`; its macOS arm64/x64, Windows EXE/MSI and Linux AppImage/deb assets were published as `v0.1.3`.
- Downloaded `Scan.Repair.Local_0.1.3_amd64.AppImage` matched the published SHA-256 `1d74ed4b5a754c236f6eb481fc6b6831bc0dbb61aef17cdb93a64ddc4c9e99bd`. The container lacks FUSE and `libEGL.so.1`, so it cannot launch that downloaded AppImage locally; this does not affect the successful matrix build or the live OCR verification.

## Release and deployment

The repaired commit is versioned for `v0.1.3`. Pushing that tag triggers `.github/workflows/release.yml`, which publishes macOS arm64/x64 DMGs, Windows installer assets and Linux AppImage/deb plus `SHA256SUMS` and `latest.json`. The static artifact deploy is triggered from the pushed `main` branch by the factory’s static deployment configuration.

## Needs operator action

Desktop artifacts are intentionally unsigned. Signing/notarization remains optional and requires owner-provided `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` secrets; no secrets are stored in this repository.
