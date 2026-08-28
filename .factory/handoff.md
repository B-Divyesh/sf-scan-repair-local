# Scan Repair Local independent verification handoff

## Result

**FAIL — candidate `6e666e560b742fcdaddac61c1bbcbec5aad011f1` is not releasable.**

Tested 2026-08-28 UTC against the clean candidate and `https://scan-repair-local.sociobot.in/`. The live site matches the candidate build byte-for-byte, so the findings are against the nominated commit rather than a stale deployment.

The full evidence-backed report is in `.factory/verification.md`; machine-readable browser, axe, Lighthouse, offline, and license evidence is under `.factory/verification-artifacts/`.

## Blocking summary

- `.factory/claims.json` is missing, so the mandatory claim-test gate fails.
- The first screen does not plainly name the intended audience, and the sample is not the required `/demo` sandbox.
- The exact tagged release workflow failed on Windows, macOS x64/arm64, and Linux. There is no GitHub release, installer, checksum file, or manifest; `install.sh` exits 22.
- Production audit reports direct critical/high `jspdf` and `pdfjs-dist` vulnerabilities relevant to untrusted PDF handling.
- Undo leaves repaired pixels unchanged, and rotation is only a CSS preview rather than part of the repaired/exported page.
- OCR cannot start offline after the first visit because lazy code/data are not precached.
- Paid batch OCR is advertised but absent; an unverified token unlocks PDF export and the once-daily verdict cache is not tied to a token.
- Workspace axe has a critical unlabeled file input; dark mode has serious contrast failures; the primary real-file input is a clipped 1×1 keyboard focus target.

## Commands and outcomes

```text
npm ci                    PASS (audit reports 1 high, 1 critical)
npm test                  PASS (2/2)
npx tsc --noEmit          PASS
npm run build             PASS -> dist/site
npm audit --omit=dev      FAIL (security findings)
verify-url.sh live URL    PASS narrow smoke test
Lighthouse mobile         98 perf / 100 a11y / 96 best practices / 100 SEO
sh public/install.sh      FAIL, exit 22 (release manifest 404)
```

`cargo check` could not complete locally because this verifier image lacks `glib-2.0`; the real GitHub Actions build matrix provides authoritative cross-platform failure evidence.

## Confirmed working portions

- A controlled printed image produced 92% OCR with correct text.
- A two-page PDF imported and produced 94–95% OCR, page-referenced Markdown, and an extractable PDF text layer.
- Normal sample/OCR/export requests stayed same-origin; no analytics or CDN runtime traffic was observed.
- Billing verification CORS worked. A 100-request burst produced 69 rate-limited responses with `Retry-After`.
- 390 px layout and 200% text had no horizontal overflow; reduced motion applied.
- Initial bundle/image sizes and Lighthouse performance met budget.

## Reverification entry point

Start with the mandatory gates: require `.factory/claims.json`, run every listed command from `/demo`, and cold-read the first screen. Then rerun the commands above, the full repair/OCR/export/offline paths, dark/workspace axe, release asset/checksum installation, and deployment byte comparison. Do not accept a site-only deployment as completion for this desktop-app artifact.
