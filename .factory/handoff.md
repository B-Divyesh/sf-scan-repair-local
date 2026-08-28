# Scan Repair Local — repair 5 handoff

## Result: repaired and ready for deployment

This repair resolves both release blockers in independent verification 5 for candidate `26a44b1d7a1ce774d5e42337ba90c65eb3961141`. The repaired desktop-app/site version is `0.1.4`.

## What changed

1. **Mobile demo performance:** `/demo` now mounts the bundled `sample-scan.svg` directly and uses its pre-measured diagnosis. It no longer fetches, decodes, redraws, encodes, and analyses the 1.9 MP sample raster synchronously at startup. Rasterisation still occurs only after an explicit repair or OCR action, where it is required.
2. **Keyboard focus:** Both hidden file inputs now have `tabindex="-1"`. The visible, labelled native buttons remain the keyboard-operable file triggers, so Tab no longer reaches an invisible 1px input.
3. **OCR compatibility:** Local OCR converts the SVG sample to a canvas only when the visitor explicitly runs OCR; imported raster documents retain their existing path.
4. **Cache/version:** The service-worker cache and all desktop/site package versions are `0.1.4` / `scan-repair-local-v7`, preventing repaired assets from being confused with the old demo implementation.
5. **Regression coverage:** Browser tests assert that both file inputs are skipped in sequential tab order at 390px and that demo startup produces no canvas data-URL rasterisation. The existing offline claim was updated for the new cache name.

## How to run and verify

```sh
npm ci
npm run lint
npm test
npm run build
CI=1 npm run test:browser
npm audit --omit=dev --audit-level=high
cargo test --manifest-path src-tauri/Cargo.toml --locked
```

## Evidence — 2026-08-28 UTC

- `npm ci`: passed; 0 audit vulnerabilities.
- `npm run lint`: passed.
- `npm test`: passed, 3/3 tests.
- `npm run build`: passed; writes `dist/site`.
- `CI=1 npm run test:browser`: passed, 17/17 tests. This includes the 11 declared claim tests, production 404/header coverage, light/dark axe scans, offline demo reload, 390px layout, the repaired Tab sequence, and the no-rasterisation regression.
- All 11 exact commands listed in `.factory/claims.json` were also rerun individually from their clean `/demo` production-preview entry points and passed.
- `npm audit --omit=dev --audit-level=high`: passed; 0 vulnerabilities.
- `cargo test --manifest-path src-tauri/Cargo.toml --locked`: passed after installing the same Linux WebKit/GTK prerequisites used by the release workflow (0 Rust tests defined; compile and doc-test targets passed).
- `/opt/fleet/lib/verify-url.sh http://localhost:4173/demo .factory/qa-artifacts/verify-url-repair`: passed. It recorded `Demo — Scan Repair Local`, `lang=en`, one `h1`, a `main` landmark, no missing image alt text, and no console errors.
- Mobile Lighthouse on the production preview: Performance **100**, FCP **0.2 s**, LCP **0.2 s**, TBT **0 ms**, CLS **0**. The report is `.factory/qa-artifacts/lighthouse-repair-mobile.json`.
- `npx @axe-core/cli` was attempted, but its Selenium launcher could not discover the preinstalled Playwright Chromium. The equivalent Playwright axe-core WCAG 2 A/AA tests passed with zero serious/critical violations on landing and light/dark demo workspaces.
- The release workflow remains the three-platform Tauri matrix. No desktop artifact is built locally by design.

## Live deployment and release evidence

- `/opt/fleet/lib/deploy-static.sh scan-repair-local dist/site` completed successfully. The live `/demo` SHA-256 is `0312cb0987fb7557d2e8ba54d10de3013826dc719c59e9bf36d93eacc4d86751`, exactly matching the deployed local build.
- Live `/demo` at 390px loaded the sample workspace with no console errors. The keyboard sequence focused **Choose a scan**, then skipped `#file-input` (`tabindex=-1`) to `#download-link`. The live route and static assets have the expected CSP, permissions policy, immutable hashed-asset caching, and a real styled 404.
- Live mobile Lighthouse: Performance **100**, FCP **0.2 s**, LCP **0.2 s**, TBT **0 ms**, CLS **0**.
- GitHub Actions run `33194925307` completed successfully for commit `cdd7991524a88cf2b1d4861af009e0ccf601082d`. Release `v0.1.4` contains both macOS DMGs, Windows MSI/EXE, Linux AppImage/deb, `SHA256SUMS`, and valid `latest.json`.
- Downloaded `Scan.Repair.Local_0.1.4_amd64.deb` matched its published SHA-256 and reports package `scan-repair-local`, version `0.1.4`, architecture `amd64`.

## Deployment and release

Push `main`, tag `v0.1.4`, and push the tag to run `.github/workflows/release.yml`. It publishes unsigned macOS arm64/x64 DMGs, Windows MSI/EXE, and Linux AppImage/deb plus `SHA256SUMS` and `latest.json`. Deploy the already-built `dist/site` with:

```sh
/opt/fleet/lib/deploy-static.sh scan-repair-local dist/site
```

## Needs operator action

Desktop artifacts are intentionally unsigned. macOS notarization and Windows Authenticode require the owner-provided `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` secrets. No secrets are stored in this repository.
