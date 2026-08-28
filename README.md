# Scan Repair Local

Scan Repair Local helps readers and researchers make scanned books and archival PDFs readable without sending page data to a service.

Open the one-click [sample demo](/demo) to inspect a realistic field-notes page, apply a reversible pixel repair, and export its page-referenced Markdown. The demo is in memory only and is discarded when you leave it.

## Run and verify

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:claims
```

`npm run build` writes the static site to `dist/site`. Run `npm run dev` for the web workspace, or `npm run tauri dev` after installing the Rust toolchain for the Tauri desktop shell.

On Linux, Tauri also needs the native packages used by WebKit and the desktop shell. On Debian or Ubuntu install them before `cargo test` or `npm run tauri dev`:

```sh
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev libfuse2
```

This is the same prerequisite set used by the release workflow.

## What is stored

Document pages and recognised text remain in browser/app memory while the workspace is open. The demo makes no third-party requests.

## Local Pro and installers

Local Pro is a $19 one-time license for searchable-PDF export. The checkout and license verification use Sociobot/Dodo. Markdown export remains free.

Tag a `v*` version to run the GitHub Actions desktop matrix. It builds unsigned macOS DMGs (arm64 and x64), Windows installers, and Linux AppImage/deb artifacts.
The release job records the tagged source SHA in `latest.json`, then downloads and checksum-verifies one installer for each platform before it succeeds.

## Documentation

- [.factory/demo.md](.factory/demo.md) describes the isolated sample workspace.
- [.factory/claims.json](.factory/claims.json) maps each reliance claim to an observable browser test.
- [Privacy](/privacy) and [Terms](/terms) describe data and licensing practices.
