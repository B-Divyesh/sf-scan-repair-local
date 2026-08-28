# Scan Repair Local — independent verification 3 handoff

## Result: FAIL

Candidate `1e5e0101ce48c57f3d47965586c130ad3d5290eb` was independently tested on 2026-08-28 against `https://scan-repair-local.sociobot.in/`. Do not release it as accepted.

The full evidence and defect list are in [verification-3.md](verification-3.md). No product code was changed; this verification adds only QA documentation and evidence.

## Release blockers

1. **Live OCR is broken by CSP.** The live action remained at “Preparing local OCR…” for 180 seconds and raised a WebAssembly CSP `CompileError`. The local claim test passes because Vite preview does not serve production headers. Real imported pages cannot reach either export because OCR never supplies text.
2. **Desktop downloads are stale.** The latest `v0.1.2` artifacts were built from `3cc129f`, before the candidate's skew/OCR changes. The checksum-valid AppImage launches but visibly lacks “Skew estimate”; it still shows “Rotation / None.”
3. **The light demo has a serious axe color-contrast violation** on four nodes. The current test checks dark demo only.
4. **Claims remain incomplete.** “We check an active license at most once a day” is unlisted and false on the `?license=` return path, which makes two immediate verify calls. The broad offline and README release claims are not proven by their listed tests.

## Other defects

- Flag, repair, and reset rerenders move keyboard focus to `<body>`.
- Rotation clamps correctly at ±8°, but its visible value remains “None” while turning.
- Some mobile controls are under 44×44 px; the page number/status collide at 200% text.
- Unknown routes return the landing page with HTTP 200 instead of the designed 404.
- Legal pages omit skip links and show version 0.1.1 while the app is 0.1.2.
- Scoop metadata points to v0.1.0 with a placeholder checksum; the winget file has no installer URL/hash.

## Commands and results

```sh
npm ci                                             # pass
# every command in .factory/claims.json separately # 10/10 pass
npm test                                           # pass, 3 tests
npm run lint                                       # pass
CI=1 npm run test:browser                          # pass, 12 tests
npm audit --omit=dev --audit-level=high            # pass, 0 vulnerabilities
npm run build                                      # pass, dist/site
cargo test --manifest-path src-tauri/Cargo.toml --locked # pass, 0 Rust tests
```

Factory `verify-url.sh` passed its cold-load smoke test. Lighthouse mobile scored 99 performance, 99 accessibility, 100 best practices, and 100 SEO; FCP 1.1 s, LCP 2.0 s, TBT 50 ms, CLS 0. Initial JS/CSS/hero budgets pass.

The local static build byte-matches the live HTML, entry JS, CSS, service worker, manifest, privacy, and terms files. Passive loads have no console errors; invoking OCR produces the blocking CSP error.

The Sociobot verify endpoint rate limit passed: a 60-request burst returned 30×200 and 30×429; 429 responses included `Retry-After: 4`.

## Verified positive behavior

- First-read and one-click demo gates pass.
- Repair changes pixels and Undo restores them exactly.
- Controlled +3° input reports a high-confidence 3.0° correction.
- Markdown and seeded-license searchable-PDF exports work and include searchable page text.
- Real PNG and two-page PDF imports work; invalid PDF recovery is clear.
- Demo document data stays out of localStorage, sessionStorage, and IndexedDB.
- Service-worker update cleanup and offline demo reload work.
- Security headers and immutable hashed-asset caching are present.
- Release matrix has macOS, Windows, and Linux assets; the downloaded Linux AppImage matched `SHA256SUMS` and launched under Xvfb.
- No sign-in is present, so Entra tenant validation is not applicable.

## Next steps

Fix CSP for bundled WASM in both web and Tauri, add a live-header OCR regression, publish a new release from the repaired commit, correct light-demo contrast, and close the claim/focus/mobile issues. Then rerun every claim command first and repeat live OCR plus installed-artifact OCR/export before acceptance.

## Needs operator action

Desktop releases remain unsigned. Optional signing requires `APPLE_CERTIFICATE` for macOS notarization and `WINDOWS_CERT_PFX` for Windows Authenticode.
