# Verification 9 handoff — FAIL

## Current release decision

**FAIL — candidate `3f77cab1140f8106a145b064ff019a26bb4ad4ff` must not be accepted.** Fresh live mobile Lighthouse evidence at <https://scan-repair-local.sociobot.in/demo> scored Performance **79** and LCP **5.326 s** on a cold run, missing the required >=90 score and <2.5 s LCP. An immediate repeat passed (96 / 2.215 s), which demonstrates unstable rather than reliably conforming deployment performance.

See `.factory/verification-9.md` for exact commands, complete evidence, tested claim list, passing functional/privacy/accessibility/offline checks, and repair requirements. The candidate otherwise matches the live `v0.1.7` deployment byte-for-byte for the shipped web assets.

---

# Repair 8 handoff — historical PASS superseded by verification 9 FAIL

## Result

Every release blocker reported for candidate `9e324ba102a5f5f06705a20cd8bc9d0318e363af` in verifier commit `b17343bf7ae32b44a7072dccae762bc5ffdc954b` is repaired.

- Repair source commit and release tag: `87c2376ba9c5e3a4e07557ead4a67cd51d0373ab` / `v0.1.7`
- Live site: <https://scan-repair-local.sociobot.in>
- Static deployment ID: `fd40f8f3-9108-4207-947b-ae6b28419ca5`
- Desktop release: <https://github.com/B-Divyesh/sf-scan-repair-local/releases/tag/v0.1.7>
- Release workflow: <https://github.com/B-Divyesh/sf-scan-repair-local/actions/runs/33214689385> (`success`)

## Reproduction and root cause

The verifier's mobile failure was reproduced before editing. The fresh live `/demo` baseline had CLS `0.1889963929849123`; Lighthouse identified the preview image and inspector as the shifting elements. The demo image had no intrinsic dimensions during first paint. The landing illustration also rendered at `380 × 800` on a 390 px viewport because a more-specific CSS rule overrode its intrinsic aspect ratio, inflating its LCP cost.

The claims review was also reproduced: “No subscription” had no claim entry, and `@claim:pro-searchable-pdf` did not assert the displayed `$19 once` price or checkout target.

Baseline evidence is in `.factory/repair-evidence/baseline-live-demo-mobile-devtools.json` and the original independent evidence remains in `.factory/verification-8.md` and `.factory/evidence-8/`.

## Repairs

- Page state now records image width and height. Demo, import, repair, and Undo paths keep those dimensions correct.
- `/demo` seeds and renders the bundled sample synchronously. Preview and thumbnail dimensions are set before first paint, eliminating the layout shift.
- The landing illustration keeps its `3:2` aspect ratio and uses new 480 px and 800 px WebP variants. Mobile downloads only the 24 KB 480 px asset.
- Service-worker cache `scan-repair-local-v11` precaches the responsive assets.
- Added the measured 390 px CLS regression (`< 0.1`) and assertions for the sample image's `1200 × 1600` intrinsic size.
- Added declared claim `no-subscription` with exactly one tagged browser test.
- Strengthened `pro-searchable-pdf` coverage to assert the full displayed price sentence, the `$19 once` checkout link, and the downloaded searchable PDF.
- Bumped the product and release surfaces to `0.1.7` without changing the desktop or deployment class.

## Clean local verification

Run from `/work/repo`:

```text
npm ci                                                    PASS (287 packages, 0 vulnerabilities)
npm test                                                  PASS (5/5)
npm run lint                                              PASS
npm run test:release                                      PASS (2/2)
npm audit --omit=dev --audit-level=high                   PASS (0 vulnerabilities)
CI=1 npm run test:browser                                 PASS (22/22)
cargo test --manifest-path src-tauri/Cargo.toml --locked   PASS
npm run build                                             PASS; dist/site produced
```

All 13 commands listed in `.factory/claims.json` were also run individually from clean browser state and passed. Initial built JavaScript is 9.72 KB gzip and CSS is 3.50 KB gzip.

Local `verify-url.sh` checks passed on `/` and `/demo`, including desktop and 390 px screenshots, title, language, one H1, main landmark, alt text, links, controls, and console. Evidence is under `.factory/repair-evidence/verify-local-*`.

## Mobile performance evidence

Lighthouse 12.8.2 used the preinstalled Chromium with the same mobile profile as the reproduction (`--form-factor=mobile`, devtools throttling, 5.25 s load pause and quiet thresholds).

| URL | Environment | Performance | FCP | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `/demo` | local production build | 99 | 1.522 s | 2.082 s | 0 ms | 0 |
| `/` | local production build | 98 | 1.549 s | 2.337 s | 0 ms | 0 |
| `/demo` | live deployment | 99 | 1.474 s | 1.968 s | 0 ms | 0 |
| `/` | live deployment | 98 | 1.440 s | 2.223 s | 0 ms | 0 |

Live `/demo` also scored Accessibility 100, Best Practices 100, and SEO 100. Lighthouse reported no unsized-image findings. Reports are `.factory/repair-evidence/local-*-mobile.json` and `.factory/repair-evidence/live-*-mobile.json`.

## Live browser, accessibility, privacy, and offline checks

- `verify-url.sh` passed on live `/` and `/demo`; screenshots and results are under `.factory/repair-evidence/verify-live-*`.
- Axe WCAG 2 A/AA found zero serious or critical issues on the landing page and both light and dark demo themes.
- Keyboard skip-link focus reached `main`; interactive keyboard flows passed in the browser suite.
- At 390 px, body width and scroll width were both 390 px, the primary repair control measured 48 px high, and the preview reserved `1200 × 1600` space.
- At 200% text size, the demo had no horizontal overflow and export remained visible.
- Reduced motion reduced image transitions to an effectively instant duration.
- The exact live price copy is: “The free app repairs pages and exports Markdown. Local Pro costs $19 once and adds searchable-PDF export. No subscription.”
- The live buy link resolves to the Sociobot checkout endpoint. No payment provider is embedded.
- Demo flows made no third-party document requests and logged no console or page errors.
- The PWA installed service worker cache `scan-repair-local-v11`, became controlled, and reloaded `/demo` offline with no failures.
- Security headers, CSP, HSTS, rate limiting, legal routes, 404 behavior, and live identity checks passed. The rate-limit burst returned 30 successful responses followed by 10 HTTP 429 responses with retry metadata.

## Deployment identity

The deployed files match `dist/site`:

```text
index.html             74ce52359d817798b62e78f9e2452ed59ca2cb727a553a6d41f7db29d754240c
demo/index.html        e810089aa1a011bc253debf424642119808b2af5a108d750abce0312ca547ffa
sw.js                  1181e3e6edb009a2e77e76217706f666e12d8672add0acc2104b4e7af8bae93b
main JavaScript        cec289225285aa51dc0c11f351799e23a03e9c177ce30d5da6ff7c7d037a162d
reading-room-480.webp  770f97dacb1c8adafe9b2ed5f97c9206997b8986d9a36b41542addb4c738801c
```

## Desktop release and consumer verification

GitHub Actions built and published Linux, Windows, macOS x64, and macOS arm64 assets from the exact tagged repair commit. `scripts/verify-release.mjs` verified tag/source identity, platform URLs, manifest entries, and downloaded checksums:

```text
macOS arm64 DMG  dd13bae533ec79ef9a7634327a575e38ed7d76f373c2efd803b071f21c690d57
Windows EXE     1ca1c49b9910545876781731dd6aa984a0e5e2f0a32401523fa7dc98a84a41c8
Linux AppImage  cdae1018aca6f6cbed4a46ee87dd3d2d3a0255b51d1fcf7925649f9c859ea058
```

The live landing page resolved the Linux button to `Scan.Repair.Local_0.1.7_amd64.AppImage`. `public/install.sh` downloaded it, matched `SHA256SUMS`, installed it into an isolated directory, and `file` confirmed a stripped x86-64 ELF AppImage.

## Known operator action

The release is intentionally unsigned, as disclosed on the download page. Production macOS notarization and Windows Authenticode still require the owner's `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` secrets. This does not block the documented unsigned release flow.
