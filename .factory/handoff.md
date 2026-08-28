# Repair handoff — release 7

## Scope and result

This repair addresses the sole release blocker in independent verification 7 for candidate `89b973efea218d9e77e2cbce3925916f92e09162`. The static/PWA product behavior that passed verification is unchanged. The artifact remains a Tauri 2 desktop app with a static landing site in `dist/site`.

The verifier's failure was reproduced before repair: GitHub reported `v0.1.4` as latest, but the peeled tag resolved to `cdd7991524a88cf2b1d4861af009e0ccf601082d`, not candidate `89b973e`. Running the new verifier against those values exits 1 with that exact mismatch.

## Repair

- Version surfaces are aligned at `0.1.6` across npm, Cargo, Tauri, Vite fallback copy, and legal/404 footers.
- `.github/workflows/release.yml` still builds macOS arm64/x64, Windows x64, and Linux x64 with Tauri on GitHub-hosted runners.
- `latest.json` now records its exact `tag` and `source_sha`, in addition to version and per-platform download URLs.
- The release job now runs `scripts/verify-release.mjs` after publishing. It resolves the latest release and its tag through the GitHub API, requires the expected source SHA, checks macOS/Windows/Linux metadata against actual release assets, requires checksum entries, downloads one artifact per platform, and verifies each SHA-256.
- `scripts/verify-release.test.js` reproduces the stale-source failure even when assets and checksums are present, then proves an exact-source fixture passes.
- A package-consumer run against the first repaired release exposed that the POSIX installer could not parse pretty-printed `latest.json`. `public/install.sh` now accepts formatted JSON, and the workflow emits a compact manifest for shell portability. `SCAN_REPAIR_INSTALL_DIR` allows a safe isolated install test without changing the default user path.
- The landing artwork now provides a 600×400, 39,446-byte responsive source for mobile while preserving the original visual system.
- The service-worker cache moved to `scan-repair-local-v9` for a clean update to this release.

## Local verification

Run from a clean checkout:

```sh
npm ci
npm test
npm run lint
npm audit --omit=dev --audit-level=high
npm run build
CI=1 npm run test:browser
cargo test --manifest-path src-tauri/Cargo.toml --locked
```

Observed on 2026-08-28 UTC:

- Clean install: 287 packages, 0 vulnerabilities.
- Unit/regression: 5/5 passed, including 2 release-source identity tests.
- Browser/claims: 20/20 passed in production preview. Coverage includes every `.factory/claims.json` command, desktop and 390px mobile, keyboard focus/activation, light and dark axe checks, offline reload/update, error recovery, privacy request boundaries, release fallback, and legal/404 routes.
- `/opt/fleet/lib/verify-url.sh` passed `/` and `/demo`: HTTP 200, correct titles, `lang=en`, one `h1`, main landmark, complete alt/button names, and no console errors.
- TypeScript no-emit lint: passed.
- Production dependency audit: 0 vulnerabilities.
- Production build: passed and emitted `dist/site`; initial app JS is 9.57 KB gzip and CSS is 3.49 KB gzip.
- Locked Rust/Tauri tests: passed for library, binary, and doc-test targets after installing the workflow's GTK/WebKit prerequisites.
- Linux consumer install: the public script selected the latest AppImage, verified `db649362a18e881753769ea314363dc9ff2c521b6cb3b1c55709288b4e52db20`, and installed a valid x86-64 ELF into an isolated directory.
- Mobile Lighthouse on `/`: Performance 96, Accessibility 100, Best Practices 100, SEO 100, CLS 0, TBT 19 ms. The throttled local LCP sample was 2.8 s.

## Release and deployment verification

Release target: `v0.1.6`. The release workflow is required to pass its post-publish source identity and three-platform checksum download gate. After it publishes, rerun:

```sh
node scripts/verify-release.mjs --repo=B-Divyesh/sf-scan-repair-local --tag=v0.1.6 --sha="$(git rev-parse v0.1.6^{})"
```

The final handoff update records the release URL, exact source SHA, workflow run, asset hashes, live deployment identity, and any remaining operator action.

## Signing

Artifacts are intentionally unsigned. Production code signing remains optional operator work and requires `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX`; no signing secret is present in the repository.
