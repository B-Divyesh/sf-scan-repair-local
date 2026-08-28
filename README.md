# Scan Repair Local

Live: https://scan-repair-local.sociobot.in — built by the Param Factory (`desktop-app`).

Scan Repair Local is a local-first desktop utility for readers and researchers working with difficult scanned books and archival PDFs. It diagnoses blur/contrast/skew, previews reversible pixel repairs, runs OCR locally, highlights uncertainty and exports Markdown with page references. Local Pro is a one-time license for searchable PDF export and batch OCR.

No page image or recognised text is uploaded by the product. OCR is best for printed material and is not archival certification: inspect flagged passages against the original.

## Develop

```
npm install
npm run dev
npm test
npm run build   # -> dist/
```

The static landing/workspace build is exactly `dist/site` (with `index.html` at that directory root). For the Tauri desktop shell, run `npm run tauri dev` after installing Rust.

## Test and release

```
npm test
npm run build:site
```

Tag `v0.1.0` to trigger the GitHub Actions release workflow. It builds unsigned DMG installers (macOS arm64 and x64), an unsigned Windows installer, and Linux AppImage/deb packages. Users may need to explicitly confirm opening unsigned builds. Release checksums are published in `SHA256SUMS`; the landing page resolves a platform download from `latest.json`.

On macOS: download, move to Applications, then right-click → Open on first run. On Windows: use the downloaded unsigned installer. Linux users can make the AppImage executable or install the `.deb`.

`/install.sh` and `/install.ps1` download a release asset and verify its SHA-256 before starting/placing it; only use them once release asset names have been checked.
