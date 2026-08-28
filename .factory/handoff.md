# Scan Repair Local repair handoff

## Result

Repair release `0.1.1` addresses every release-blocking finding in the independent report for candidate `6e666e5`.

## Repairs

- Added the required claim ledger, isolated `/demo` workspace, shipped realistic field-notes sample, reset/start-for-real controls, and exact Playwright regression coverage.
- Made repairs per-page. Applied rotation now redraws the bitmap used by OCR/export; Undo restores the exact prior pixels and diagnosis.
- Updated `pdfjs-dist` to `6.2.108` and `jspdf` to `4.2.1`; production audit is clean.
- Rebuilt service-worker caching around the Vite asset manifest, versioned cache cleanup, immediate activation, and an offline reload regression.
- Repaired the paid flow: price is visible, unverified tokens cannot export PDF, verdict/cache data is tied to each token, and invalid status is persistent and visible. Removed the nonexistent batch-OCR claim.
- Fixed accessible file triggers, labels, 44px controls, dark-mode contrast, focus contrast, keyboard coverage, metadata, manifest, robots/sitemap, security headers, and shared legal-page chrome.
- Added the missing Tauri entrypoint and removed the dangling Rust library target that caused the release matrix to have no application binary. The release workflow now also installs `libfuse2`; the Tauri CSP permits the GitHub API.

## Verification

Run from a clean clone:

```sh
npm ci
npm run lint
npm test
CI=1 npm run test:browser
npm audit --omit=dev --audit-level=high
npm run build
```

Results in this worker:

- `npm ci` — pass; 0 audit vulnerabilities.
- `npm run lint` — pass.
- `npm test` — pass, 2 Vitest tests.
- `CI=1 npm run test:browser` — pass, 8 tests: all six `@claim:` flows, light landing axe, dark workspace axe, desktop keyboard, 390px mobile layout, and offline reload.
- `npm audit --omit=dev --audit-level=high` — pass; 0 vulnerabilities.
- `npm run build` — pass; `dist/site` emitted. Entry JS is 8.31 kB gzip, CSS 3.28 kB gzip, and hero art remains 235,916 B.
- `cargo check --manifest-path src-tauri/Cargo.toml` reaches Tauri dependency compilation but cannot finish in this container because host `glib-2.0` development files are absent. The GitHub Linux workflow installs the required WebKit/GTK prerequisites and is the release authority.

The claims ledger is `.factory/claims.json`; the sample sandbox is documented in `.factory/demo.md`; plain-language audit is `.factory/copy-audit.md`.

## Deployment and release

Push this commit and tag `v0.1.1`. The GitHub Actions matrix will build unsigned macOS x64/arm64 DMGs, Windows installer, and Linux AppImage/deb, then publish `SHA256SUMS` and `latest.json`. Verify the GitHub Release assets and one SHA-256 before accepting the desktop release. The static deployment class remains unchanged and publishes `dist/site`.

## Needs operator action

No signing credentials are configured. Optional signing requires `APPLE_CERTIFICATE` for notarized macOS and `WINDOWS_CERT_PFX` for Authenticode Windows builds. Until then all installers are clearly described as unsigned.
