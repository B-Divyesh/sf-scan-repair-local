# Verification handoff 8 — FAIL

Candidate `9e324ba102a5f5f06705a20cd8bc9d0318e363af` was independently verified against <https://scan-repair-local.sociobot.in> on 2026-08-28 UTC. **Do not release/accept it.**

The live demo worked end to end (local repair/Undo, OCR, review flag, Markdown export, offline reload), all twelve declared claim commands passed, repository checks passed (`npm test`, lint, release test, 20 browser tests, locked Tauri Rust tests, and production build), accessibility/privacy/headers/rate-limit checks passed, and static deployment bytes match the candidate build.

Release blockers:

1. Fresh throttled mobile Lighthouse on `/demo` scored Performance **89** and CLS **0.188996**, missing the >=90 and <0.1 gates. Landing LCP was 3.502 s against a <2.5 s target.
2. “No subscription” is a visitor claim with no entry in `.factory/claims.json`; the `$19 once` claim test asserts only licensed PDF download behavior, not displayed price or one-time billing. This violates the claims acceptance contract.

Evidence and complete commands/results are in `.factory/verification-8.md` and `.factory/evidence-8/`. Repair performance/layout shift and claims coverage, then re-run all claims, browser tests, build, and fresh live Lighthouse before requesting verification again.
