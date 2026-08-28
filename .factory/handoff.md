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
- Linux consumer install: the public script selected the latest AppImage, verified `ae6e0858bc0e05867171e66cb6c311772e3b2398baae55f3e13ef1b5a29a27c0`, and installed a valid x86-64 ELF into an isolated directory.
- Mobile Lighthouse on `/`: Performance 96, Accessibility 100, Best Practices 100, SEO 100, CLS 0, TBT 19 ms. The throttled local LCP sample was 2.8 s.

## Release and deployment verification

Release `v0.1.6` is published at <https://github.com/B-Divyesh/sf-scan-repair-local/releases/tag/v0.1.6>. Tag and `latest.json` both resolve to exact source `a53d2889c8878f874f5b63a23461ab116763aef2`. GitHub Actions run `33208648244` passed macOS arm64, macOS x64, Windows x64, Linux x64, release publication, and the post-publish identity/download gate.

The public release contains DMG arm64/x64, EXE, MSI, AppImage, deb, `SHA256SUMS`, and `latest.json`. Independent rerun:

```sh
node scripts/verify-release.mjs --repo=B-Divyesh/sf-scan-repair-local --tag=v0.1.6 --sha=a53d2889c8878f874f5b63a23461ab116763aef2
```

It passed after downloading all three manifest-selected assets. Their published and measured hashes are:

- macOS arm64 DMG: `d98ea4d1d626a989ae087ec2a58b5c3639edfc9ec14ad36160866fc96ceec662`
- Windows x64 EXE: `7953688f53f72a920f004bb17cae387fccec04ee3519dac48744222048a344cd`
- Linux x64 AppImage: `ae6e0858bc0e05867171e66cb6c311772e3b2398baae55f3e13ef1b5a29a27c0`

Azure Static Web Apps production deployment completed for resource `sf-scan-repair-local`. Live and local SHA-256 values match for `/` (`6ce87173f9b08aa45e5832bdf55d2031544ba369a0ffc76b877696752295cf20`), `/demo` (`904d05db03f3aa98593a984851ebbc1f18237e3963ac91727e7bf1db5cb020f8`), `sw.js` (`ac16cb83d400e44fa68e6ee5a7c3da344d818fb08d030223405e5125070ec323`), and `install.sh` (`f5d76e22a75e49f562385feae5ce48bc792744b88aeaaafc570c079a749c785d`).

Fresh live browser evidence at desktop and 390 px found no console errors, no horizontal overflow, zero serious/critical axe violations, working skip-link and demo keyboard activation, and a real `v0.1.6` Linux AppImage link before interaction. The demo made no third-party request, completed local OCR in 1,987 ms, and reloaded offline from `scan-repair-local-v10`. Live routes returned 200 for `/`, `/demo`, `/privacy`, `/terms`, install scripts, robots, and sitemap; an unknown route returned the designed 404. Mobile Lighthouse scored Performance 100, Accessibility 100, Best Practices 100, and SEO 100 on retry, with LCP 0.95 s, CLS 0, and TBT 5.5 ms.

No functional gap remains from verification 7. The post-release handoff commit changes documentation only; `git diff v0.1.6..HEAD` confirms no shipped source difference.

## Signing

Artifacts are intentionally unsigned. Production code signing remains optional operator work and requires `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX`; no signing secret is present in the repository.
