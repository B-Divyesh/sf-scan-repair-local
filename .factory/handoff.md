# Scan Repair Local — independent verification 6 handoff

## Result: FAIL

Candidate `d0254841c521e5f188200f5ab0d1d141ae0f2f47` at <https://scan-repair-local.sociobot.in/> is **not accepted**. Full evidence and findings are in `.factory/verification-6.md`. No product code was changed.

## Release blockers

1. The landing page falsely says “Downloads are being published” although v0.1.4 is live. This visitor-reliance statement is absent from `.factory/claims.json`; release metadata is fetched only after the click.
2. `/privacy` and `/terms` lack the required skip link. The 404 also lacks the standard header/footer and skip link.
3. The desktop-app landing page lacks the required captioned 3–5-frame product walkthrough.
4. Social metadata uses a 1200×800 image instead of 1200×630, and the Apple touch icon is an SVG rather than the required 180px asset.

## Verification summary

- Clean identity: requested commit, initially clean, matching `origin/main`.
- `npm ci`: PASS.
- All 11 exact `.factory/claims.json` commands: PASS.
- `npm test`: PASS, 3/3.
- `npm run lint`: PASS.
- `npm run build`: PASS; `dist/site` produced.
- `CI=1 npm run test:browser`: PASS, 17/17.
- `npm audit --omit=dev --audit-level=high`: PASS, 0 vulnerabilities.
- `cargo test --manifest-path src-tauri/Cargo.toml --locked`: PASS after installing the release workflow's Linux prerequisites; no Rust tests are defined.
- Live real PNG and two-page PDF repair/OCR/Markdown flows: PASS; invalid input recovery and 1×1 boundary input: PASS.
- Live axe serious/critical: 0 on landing and both demo themes. 390px keyboard, visible controls, reduced motion, and 200% text checks passed, apart from the route-level skip-link blocker above.
- Lighthouse mobile: home 93/100/100/100; demo 100/100/100/100. Home LCP 2.2 s, demo LCP 0.9 s; CLS 0 on both.
- Privacy: real document processing remained same-origin; no analytics/CDN/font/upload requests or browser errors observed.
- PWA: offline reload and real offline OCR passed; old cache migration passed.
- Headers/caching: CSP, HSTS, nosniff, referrer/permissions policies and immutable hashed assets passed.
- Rate limit: 30 successful license checks in the observed window, then 429 with `Retry-After: 4`.
- Deployment: the fresh build matches all live product files byte-for-byte.
- Desktop: the v0.1.4 four-platform workflow is green; release assets/checksums/manifest exist; the downloaded Debian package checksum and metadata passed; extracted binary launched.

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build
CI=1 npm run test:browser
npm audit --omit=dev --audit-level=high
cargo test --manifest-path src-tauri/Cargo.toml --locked
```

## Next steps

Fix the four blockers above without weakening the working local-first scan flow. Add the release-status claim/test, redeploy, and run independent verification again.
