# Scan Repair Local — repair 6 handoff

## Result: repaired and ready for static deployment

This repair addresses every release blocker in independent verification 6 for candidate `d0254841c521e5f188200f5ab0d1d141ae0f2f47`. It preserves the Tauri 2 desktop application and static landing-site deployment class.

## What changed

1. **Truthful desktop download state:** the landing page now requests GitHub’s current release metadata as it loads, detects Windows, macOS, or Linux, and immediately labels and links the matching real asset. Release metadata is cached locally for one hour. The “Downloads are being published” state appears only if the request or matching asset is unavailable. Demo mode never makes this external request.
2. **Claim coverage:** `.factory/claims.json` now declares `desktop-download`; its exact Playwright regression intercepts recorded release metadata and proves the Linux action is visible before a click, names `v0.1.4`, and uses the AppImage asset URL.
3. **Complete secondary-route shell:** `/privacy`, `/terms`, and the 404 have a visible-on-focus skip link, focusable `main`, consistent product navigation, and the shared footer. Regression coverage tabs through the skip link and verifies the shell on all three routes.
4. **Desktop walkthrough:** the landing now has four captioned frames from the shipped sample workspace: open, inspect, repair, and review/export. The captures are real UI states, not mockups.
5. **Metadata artwork:** Open Graph and Twitter now use an original, reviewed `1200×630` social image; an exact `180×180` PNG Apple touch icon is supplied and linked. Asset provenance and prompts are in `.factory/design.md` and `assets/src/social-reading-room.png.json`.
6. **Safe update:** the service-worker cache moved from `scan-repair-local-v7` to `scan-repair-local-v8`, so visitors receive the repaired landing shell rather than a stale cached page.

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

Run the browser claim commands exactly as declared in `.factory/claims.json`; all twelve use `npm run test:claims -- --grep @claim:<id>`.

## Verification evidence — 2026-08-28 UTC

- Clean install: `npm ci` passed; npm reported 0 vulnerabilities.
- Unit tests: `npm test` passed, 3/3.
- Type/lint: `npm run lint` passed.
- Production build: `npm run build` passed and produced `dist/site` with 9.50 KB gzip initial JavaScript and 3.49 KB gzip CSS.
- Browser integration: `CI=1 npm run test:browser` passed, 20/20. This includes desktop and 390px mobile keyboard coverage, light/dark axe checks, offline demo reload, skip-link focus on legal/404 routes, walkthrough/metadata checks, and the new release-state regression.
- Claims: all 12 manifest commands were rerun separately and passed, including `@claim:desktop-download`.
- Production dependencies: `npm audit --omit=dev --audit-level=high` passed with 0 vulnerabilities.
- Desktop core: after installing the same Linux GTK/WebKit prerequisites as `.github/workflows/release.yml`, `cargo test --manifest-path src-tauri/Cargo.toml --locked` passed (0 Rust tests are defined; library, binary, and doc-test targets compile).
- Factory URL checks: `/opt/fleet/lib/verify-url.sh` passed on local production `/` and `/demo`, then again on the deployed custom domain: 200, title/lang, one h1, main landmark, no missing image alt text, no unnamed buttons, and no console errors. Evidence: `.factory/qa-artifacts/verify-url-repair-6*/` and `.factory/qa-artifacts/live-repair-6*/`.
- Accessibility: the repository Playwright axe WCAG 2 A/AA scan passed with no serious/critical issues on landing plus light and dark demo. The standalone `@axe-core/cli` was also attempted but could not locate a system Chrome binary; it cannot consume the preinstalled Playwright Chromium. The Playwright axe scan is the recorded equivalent.
- Lighthouse production-preview mobile audit: Performance 96, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 2.8 s, TBT 20 ms, CLS 0. The previous deployed audit measured LCP 2.2 s; this local disposable-container run was slower but remains over the 90 performance gate. Report: `.factory/qa-artifacts/lighthouse-repair-6.json`.
- Privacy and offline: the local-processing claim records only the product origin during repair/export, and the offline claim reloads `/demo` after first visit with the new `v8` cache.

## Deployment and release

Build the static site with `npm run build`, then deploy exactly with:

```sh
/opt/fleet/lib/deploy-static.sh scan-repair-local dist/site
```

Deployment completed successfully on 2026-08-28 UTC from repair commit `6ee90ba58b83c865fd233494a482f89379d4b48f`. Live identity checks at `https://scan-repair-local.sociobot.in/` confirmed the real `Download for Linux` action before interaction, the v0.1.4 AppImage release URL, four walkthrough frames, the new social image, and the 180px touch icon. No browser console errors were observed. Identity SHA-256 values match the deployed build for `index.html` (`fa2558d168e05877259773b17e6accab703013260220d6efbd11debd09f001f7`), social image (`b7cacae7a6aa2af813f28d1911891dbf548d38997684b980884ec05125d9ece7`), touch icon (`d17dfe3a63824cb3cd2e788e7fe9f457449314444b5d61c24aef549cc6cd562a`), walkthrough frame (`1f50d1dba89c1a5fdf90dfd92b07d0d3019f3190e3906b51f98a6590ee1a5d6f`), and service worker (`fc1d395f676b2b2397aa25f1bd6246e8153fc0615166287e56be68b07b750d46`).

The existing `v0.1.4` cross-platform Tauri release remains valid because this repair changes the static landing/PWA shell, not the shipped desktop binary. The release workflow remains the required macOS arm64/x64, Windows x64, and Linux x64 matrix.

## Needs operator action

Desktop artifacts remain intentionally unsigned. macOS notarization and Windows Authenticode require the owner-provided `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` secrets. No secrets are stored in this repository.
