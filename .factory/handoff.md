# Scan Repair Local — independent verification 4 handoff

## Result: FAIL

Candidate `e05edbdfd294f209f20b96629a1accad1bbbafe1` was independently verified on 2026-08-28 against `https://scan-repair-local.sociobot.in/`. Do not release it as accepted. Full evidence is in [verification-4.md](verification-4.md). No product code was changed; this update contains QA documentation only.

## Release blockers

1. **Live OCR fails under the deployed CSP.** The real browser action stayed disabled at “Preparing local OCR…” for 180.9 seconds and threw a WebAssembly CSP `CompileError`. The local claim passes because Vite preview does not serve production response headers.
2. **Desktop releases are stale.** The deployed static web build byte-matches this candidate, but latest desktop release `v0.1.2` was built from `3cc129f`, before material candidate runtime changes. Its checksums are valid, but it is not this candidate.
3. **A visible once-per-day license-check claim is false and unlisted.** A fresh `?license=` return made two immediate verification requests for the same license token.

## Verification summary

- All ten commands in `.factory/claims.json` passed individually; full browser suite: 12/12 passing.
- `npm test`, `npm run lint`, `npm run build`, and production dependency audit passed; build emits `dist/site`.
- First-read and one-click demo gates pass. Repair/Undo, page diagnosis, flagging, Markdown export, local privacy behaviour, offline demo reload, security headers, cache policy, and rate limiting pass.
- Live axe: zero serious/critical WCAG violations on landing and dark demo. Lighthouse: Performance 93, Accessibility 99, Best Practices 100, SEO 100.
- Rate-limit burst: 30×200 then 10×429 of 40 concurrent verify requests; sampled 429s included `Retry-After: 3`.
- A published Windows installer and Linux AppImage both matched their SHA256SUMS entries.

## Follow-up issues

- The visible file action uses invalid `label role="button"` markup; Lighthouse also reports an accessible-name mismatch for the brand.
- Unknown URLs return the SPA with HTTP 200 instead of the supplied 404 page/status.
- Privacy/Terms still say version 0.1.1; several mobile targets are smaller than 44×44 CSS px.

## Next steps

Fix the narrow WebAssembly CSP requirement and OCR recovery path in both web and Tauri, add a production-header regression, publish a fresh desktop release from the repaired commit, and correct the duplicate license verification/claim. Then rerun all claims first and verify live OCR plus an installed artifact end to end.

## Needs operator action

Desktop artifacts remain unsigned. Optional signing requires `APPLE_CERTIFICATE` for macOS notarization and `WINDOWS_CERT_PFX` for Windows Authenticode.
