# Independent verification 10 — PASS

Candidate `5ffe0ccbe5c1297869bc0e9584052edeeade8b07` was independently verified on 2026-08-29 against <https://scan-repair-local.sociobot.in>. **PASS.** All 13 claimed demo tests, complete Playwright suite (23 tests), unit/type/release tests, production build, Tauri compile/tests, live core workflow, offline reload, mobile/keyboard/aXe, privacy request logging, headers/cache policy, release download checksum, and factory URL smoke checks passed. Full evidence and exact commands are in `.factory/verification-10.md`.

The deployed app release remains `v0.1.8` source `c9b713921df92168e036c6839aa18fe69fbd8f89`; candidate `5ffe…` changes only `.factory/` documentation/evidence. Fresh local candidate output was byte-identical to the live main JS, CSS, and demo HTML, so the functional deployment matches this candidate. No Critical/High/Medium/Low defects were found. The observed Sociobot license verification burst allowance was 30 successes before 429 responses, with `Retry-After: 4`.

# Repair 9 handoff — PASS

## Release decision

The release-blocking cold-mobile performance defect from verification 9 is repaired in source commit `c9b713921df92168e036c6839aa18fe69fbd8f89`, tagged `v0.1.8` and pushed to `main`.

- Live site: <https://scan-repair-local.sociobot.in>
- Static deployment: `ee1c1cb8-e071-4863-b26a-377b6d87695c`
- Deployment target: Azure Static Web Apps `sf-scan-repair-local` (`wonderful-smoke-0b1389010.7.azurestaticapps.net`)
- Desktop release workflow: <https://github.com/B-Divyesh/sf-scan-repair-local/actions/runs/33219512533>

## Finding reproduced and root cause

Before editing, I ran the verifier's exact Lighthouse 12.8.2 mobile DevTools command against the deployed candidate. Its result was a passing 99 / 1.949 s on that attempt, which is consistent with verification 9's documented intermittent result rather than evidence that the defect had disappeared. The independent cold run recorded the actual failure: Performance 79 and LCP 5.326 s, with `#page-image` assigned 1.437 s load delay and 3.611 s load time.

The demo document is mounted only after the SPA module executes. The initial HTML therefore gave the browser no way to discover the LCP image (`/sample-scan.svg`) during HTML parsing; under a cold throttled load it could be delayed behind module work and network scheduling.

## Repair

- Added a high-priority image preload for the demo's immutable sample directly in `demo/index.html`, before the module script.
- Added immutable caching for `/sample-scan.svg` in the Static Web Apps configuration.
- Bumped the service-worker cache from `scan-repair-local-v11` to `v12`, ensuring already-installed clients update their cached demo shell.
- Added two regressions: a Playwright assertion that the sample request is initiated by the HTML preload, and `npm run test:performance`, which launches a fresh Lighthouse Chromium profile three times and fails if any run is below 90 Performance or has LCP >= 2.5 s.
- Updated the Linux Tauri prerequisite instructions in the README to match the release workflow.
- Bumped all product/release metadata to `0.1.8` without changing the Tauri desktop-app or static deployment class.

## Performance evidence

All measurements use Lighthouse 12.8.2, the installed Playwright Chromium, mobile form factor, DevTools throttling, and a new browser profile per run.

| Target | Run | Performance | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| local production `/demo` | 1 | 99 | — | 1.569 s | — | — |
| local production `/demo` | 2 | 99 | — | 1.590 s | — | — |
| local production `/demo` | 3 | 99 | — | 1.578 s | — | — |
| live `/demo` | 1 | 100 | 1.520 s | 1.520 s | 0 ms | 0 |
| live `/demo` | 2 | 100 | 1.504 s | 1.504 s | 0 ms | 0 |
| live `/demo` | 3 | 100 | 1.440 s | 1.440 s | 0 ms | 0 |

Raw reports and summaries are in `.factory/repair-evidence/local-demo-cold-mobile-repair-9-final.json` and `.factory/repair-evidence/live-demo-cold-mobile-repair-9-*.json`.

## Verification

Clean install and local checks passed:

```text
npm ci                                                    PASS
npm test                                                  PASS (5/5)
npm run lint                                              PASS
npm run test:release                                      PASS (2/2)
npm audit --omit=dev --audit-level=high                   PASS (0 vulnerabilities)
CI=1 npm run test:browser                                 PASS (23/23)
npm run test:performance                                  PASS (three fresh mobile Lighthouse runs)
npm run build                                             PASS; dist/site produced
cargo test --manifest-path src-tauri/Cargo.toml --locked   PASS (after documented Linux prerequisites)
```

Each of the 13 exact commands declared in `.factory/claims.json` was also run individually after the repair and passed.

Post-deploy verification passed:

- `verify-url.sh` found 200 responses, correct titles/language, exactly one h1, main landmarks, alt text, and no console errors on `/` and `/demo` at desktop and 390 px.
- Axe WCAG 2 A/AA has no violations on landing, light demo, or dark demo. Keyboard skip navigation moves focus to `main`; the designed focus ring is 3 px; reduced-motion uses effectively instant transitions.
- At 390 px there is no horizontal overflow, Repair is 48 px high, and Reset demo is 44 px high. Invalid input recovers cleanly.
- Live repair, Undo, flagging, Markdown export, and actual on-device OCR passed. OCR returned 272 characters at 89% high confidence; no console/page errors or third-party document requests occurred.
- The live `scan-repair-local-v12` worker is activated, caches `/demo`, and reloads the sample offline without failed requests or errors.
- The deployed `index.html`, `demo/index.html`, `sw.js`, main JS, and `sample-scan.svg` SHA-256 values match the local `dist/site` exactly. The LCP sample response is 1,180 bytes and carries `Cache-Control: public, max-age=31536000, immutable`.

Evidence: `.factory/repair-evidence/verify-live-repair-9-*`, `live-accessibility-and-recovery-repair-9.json`, `live-demo-e2e-repair-9.json`, `live-pwa-repair-9.json`, `live-deployment-parity-repair-9.txt`, and `live-sample-scan-headers-repair-9.txt`.

## Desktop release

The `v0.1.8` desktop workflow completed successfully from the exact repair tag. `scripts/verify-release.mjs` downloaded and verified the published consumer manifest and checksums:

```text
macOS arm64 DMG  99f4f1e122cd7da0b089bb8a4ce13315397a4107633d6202bc59cdaf3b87ff93
Windows EXE     c347f7141a4b622fdaf19fb891e21dfd88fa4b294ca24eb0e90187953919fadb
Linux AppImage  b692cbecf77f198696bfa91e0a8b931787487b422342c39e4d9d8e628fd32c13
```

The release manifest names source `c9b713921df92168e036c6839aa18fe69fbd8f89`; consumer evidence is `.factory/repair-evidence/release-v0.1.8-repair-9.json`.

The live landing resolves the detected Linux download to `Scan.Repair.Local_0.1.8_amd64.AppImage` with no console error (`live-download-repair-9.json`).

The app remains intentionally unsigned. Production macOS notarization and Windows Authenticode require the owner's `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` secrets.
