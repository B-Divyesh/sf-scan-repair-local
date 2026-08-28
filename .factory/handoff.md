# Scan Repair Local handoff

## What shipped

- Local-first Vite/TypeScript workspace with image and PDF ingestion, page thumbnails, contrast/sharpness/skew diagnosis, reversible contrast/sharpen preview, page review flags, local Tesseract English OCR, confidence labels, Markdown export with page references, and Local Pro gated searchable-PDF export.
- Tauri 2 shell configuration for the same UI. The release workflow builds macOS arm64/x64, Windows x64, and Linux x64 bundles, publishes checksums plus a generated `latest.json`, and provides platform-aware downloads.
- Privacy/terms pages, license restore/once-a-day verification flow, offline service-worker shell, self-hosted local OCR assets, and no analytics or third-party runtime OCR/font/script CDNs.
- Product-specific dithered reading-room visual system in `.factory/design.md`. Original generated artwork source and prompt sidecar are in `assets/src/`; the shipped `public/reading-room.webp` is 231 KB.

## Run and verify

```sh
npm install
npm test
npx tsc --noEmit
npm run build:site       # emits dist/site/index.html
npm run preview
```

Verified in Chromium at 390px and desktop:

- `npm test`: 2/2 passing.
- `npx tsc --noEmit`: passing.
- `npm run build:site`: passing; initial app JS is 18.4 KB raw / 7.3 KB gzip and CSS 9.4 KB raw / 3.0 KB gzip. Heavy PDF, searchable-PDF and OCR code/data are deferred until used.
- Axe WCAG 2A/2AA: 0 violations on the landing page; title, `lang`, one `h1`, main landmark and no initial console errors confirmed.
- Real local OCR smoke test: open the included sample, run **Recognise page text**; it completed with an intentionally low 24% confidence result and no console errors.

Lighthouse CLI could not complete in this container: the supplied Chromium exited/crashed when Lighthouse attached (Playwright itself worked). Re-run mobile Lighthouse in CI/release before public launch; expected budget-sensitive assets are stated above rather than claiming an unavailable score.

## Known gaps / next steps

- OCR currently bundles English only; add `@tesseract.js-data/<language>` packages and list them in `scripts/prepare-ocr.mjs` for additional languages.
- The quality signals are conservative image heuristics, not archival-grade measurements. Searchable PDF embeds an OCR text layer and should be checked against the original for scholarly use.
- No release has been published from this container, so download buttons fall back to the releases page until the tag workflow completes. Tag `v0.1.0`, push it, and verify one release asset against `SHA256SUMS` before publishing.

## Needs operator action

- Push `main` and tag `v0.1.0` to start `.github/workflows/release.yml`; confirm the actual release assets and `latest.json` links before announcement.
- Builds are intentionally unsigned. For signed distribution, provide `APPLE_CERTIFICATE` (plus matching certificate password/keychain inputs if using a signing step) and `WINDOWS_CERT_PFX`/password, then add the signing configuration to the release workflow. macOS users otherwise use right-click → Open; Windows shows the unsigned-app warning.
- Submit/update the placeholder Scoop and winget metadata once real release SHA-256 values are available. A Homebrew tap is not created because it needs the owner’s GitHub authority; document the tap formula against the final macOS archive if desired.
