# Repository review, 23 October 2026

Reviewed from a clean checkout of `63e7ad3f27733c4d410203f0dfa1881eca1498bf`, leaving the earlier working directory intact.

The user flow is Notes → server-side Gemma → validated editable pack → human review → PDF, Markdown or CSV export. Storage is browser-local; no server database or user accounts are involved.

## Verified fixes

| Issue | Correction and evidence |
| --- | --- |
| Sample and saved-pack loads did not set the busy state. A second action or edits could be replaced by a late response. | Lock editing and competing loads during the request; unlock after success or failure. Startup uses the same protection. Regression tests exercise deferred loads and failure recovery. |
| Startup waited for server validation before displaying locally saved notes. A failed review hid the original notes and follow-up text. | Restore note fields before the request; preserve the stored data on failure. Regression test returns HTTP 503 and checks both fields and storage. |
| Malformed upstream envelopes could throw TypeErrors and appear as client HTTP 400 validation errors. | Check candidate and parts arrays, ignore unusable parts, and safely inspect null error envelopes. HTTP tests check six malformed response shapes return 502; a null 403 body remains an access error. |
| URL parsing was outside the server error boundary. `GET http://[` reproduced an unhandled `ERR_INVALID_URL` rejection. | Parse within the boundary and return HTTP 400. A raw HTTP regression test confirms the same server subsequently returns healthy status. |
| Package engines allowed Node versions older than the documented startup flag requirement. | Match package and lockfile engines to Node >=22.9. |
| Planning documents still described delivered media and submission work as pending; one contained literal newline escape sequences. | Refresh readiness, MVP and domain instructions while preserving dated verification history. |

## Checks

- `npm ci` succeeded from the clean checkout.
- `npm test` builds client assets and passes all 43 tests.
- Tests cover validation, money arithmetic, CSV formula handling, approval invalidation, PDF attachments/names, origin checks, cancellation, bounded retry behavior, storage and the new regressions.
- `npm audit --omit=dev` returned zero known vulnerabilities at review time. This is not an exhaustive security guarantee.
- JavaScript syntax, whitespace, HTML ID uniqueness, workspace control references and relative Markdown file links were checked.
- Client regressions execute the actual workspace module in a small simulated DOM with deferred fetch responses. They are not physical-device or full browser tests.

## Deployment and remaining limits

Render discovery confirmed service `flow-point-app` on the expected repository and `main`, with automatic deploys on commit. Its existing build command is `npm test && npm run build`; the build script installs missing locked dependencies. The Blueprint declares `npm ci && npm test && npm run build`. The live service has an empty HTTP health-check path and therefore defaults to TCP readiness. `/healthz` exists but the Blueprint’s HTTP path has not been applied to that existing service. No service settings, plan or secret was changed by this review.

Google HTTP 500/timeouts and semantically incomplete output remain possible. The audit uses mocked provider responses and does not establish a new live generation success rate. Earlier successful live and owner-reported checks remain in `verification.md`.

The measured manual-writing comparison and complete human review/export timings remain uncollected. Real Android/iOS keyboard, picker and download behavior still needs device testing. Published videos and screenshots distinguish live footage from hand-authored samples. Contest eligibility and winning are not guaranteed.

## Follow-up app pass

The next pass found and reproduced an older tab replacing newer stored notes. Writes now compare the saved snapshot before replacing it, warn on a changed snapshot and retain the current in-memory edits for copying or exporting. This is a conflict guard, not collaborative editing or an atomic multi-tab transaction; avoid editing the same workspace simultaneously in several tabs.

Browser money formatting now keeps the integer remainder, fixing the demonstrated case where `9007199254740990` minor units displayed as `.91` instead of `.90`. Currency edits also refresh the budget field labels. Invalid edit values remain editable and still fail server validation.

Client JSON requests now have a deadline: 15 seconds for review/configuration/sample actions and 75 seconds for generation, allowing the server's original 60-second generation budget. Cancellation forwards to fetch and timers/listeners are cleaned up. Regression checks cover timeout recovery, cancellation, storage quota failure and preservation after a failed AI update. The suite now passes 49 tests.

The existing Render build command was corrected in the dashboard to `npm ci && npm test && npm run build`; saving it started deployment `dep-dbdrrpfavr4c7396lps0` from `28dd071`. Final rollout and HTTP health-check verification are recorded separately after deployment; the earlier TCP-only observation above remains a historical finding.


## Final deployed verification

Application commit `470e47a1722d545e97bba26fac4d99c87803900e` is live in deployment `dep-dbdrtknavr4c7396s4ug` (23 October 2026, 20:09:30 UTC). The existing service now has the explicit `npm ci && npm test && npm run build` command and `/healthz` HTTP health-check path. Settings were corrected through the dashboard; no plan or secret was changed. This supersedes the baseline configuration findings above.

| Live boundary | Observed result |
| --- | --- |
| Public routes | `/healthz` and `/api/config` returned 200; `/money.mjs` served the new module; `/.env` returned 404. |
| Home | Example tabs and both theme directions worked; inspected desktop document width stayed within the viewport. |
| Notes and storage | Named saving worked. A second tab with an older snapshot showed the conflict warning; reloading that tab recovered the newer brief rather than overwriting it. |
| Live preparation | Fictional Library Reading Afternoon succeeded in 36.1 seconds. Primary returned two HTTP 500s; the 31b fallback succeeded on attempt 3. Request `08eba01d-ab4a-4f1d-8ef7-fd72692b1742`. It unnecessarily asked to confirm NGN despite the brief; the subsequent explicit update resolved that question. |
| Live update | Primary 26b succeeded on attempt 1 in 5.5 seconds. Request `34e27b74-47f6-4661-81ff-7bdfc9a514ed`. The new venue and 14:30 start appeared in the invitation; the run of show started at 14:30 with later times labelled suggested. Chidi remained the chair-task owner. The budget changed from NGN 9,000 to 11,000. |
| Currency labels | Switching NGN to USD updated the budget input labels; switching back restored NGN. No price conversion is performed. |
| Approval and persistence | The fictional pack could be approved. Editing its venue cleared approval; restoring the text did not automatically restore approval. Reopening another named pack, then the live pack, and reloading retained the updated facts and NGN 11,000 total in draft state. |
| Export API | A separately labelled synthetic sample returned PDF, Markdown and CSV with 200 responses, safe filenames and correct NGN 4,000 arithmetic. UTF-8 PDF title and metadata matched. Both PDF pages were rendered and inspected. Editing the plan invalidated approval; unrelated-origin POST returned 403. |
| Browser downloads | PDF, Markdown and CSV each emitted a download event. The browser returned file paths, but those paths were not accessible in the shared filesystem, so those exact browser-downloaded bytes were not inspected. The separate live API exports above were inspected. |

[Live audit screenshot](media/audit/live-budget.jpg) shows the actual updated Gemma pack after reopening and reload. This is distinct from the hand-authored screenshot set in `media/current/`.

All 49 automated checks and the build pass. The production dependency audit reports zero known vulnerabilities. These checks do not establish exhaustive security, all-device compatibility or a provider success-rate guarantee. The free Render instance can still cold-start; upstream Google failures remain real, although the fallback recovered in this live run. The manual-writing benchmark and physical-device review were excluded from this pass.


## Subsequent malformed-output fix (24 October 2026)

The author reproduced a failure after the clean key-change checks: `84d0884f-b86c-4cce-b2f6-3254b7dfb6f8` was an HTTP 200 model reply rejected as `MODEL_JSON_INVALID`, after 23.1 seconds. This exposed a recovery gap: transient HTTP errors retried, while invalid output immediately failed. The adapter now regenerates invalid output from the unchanged original input and tries the existing fallback, sharing the original three-call cap and 60-second deadline. It does not loosen validation, patch JSON or forward broken output. Safety blocks and truncation remain explicit failures. The suite passes 55 tests; see the [verification history](verification.md#invalid-json-recovery-24-october-2026). Earlier successful live checks remain small-sample observations.


The longer replay still timed out after the malformed-text retry, so the follow-up uses Gemma 4's native data-only pack function and system instructions. Function arguments must pass the existing validator; no tool is executed and unknown/multiple calls are rejected. The suite now passes 59 tests. `responseFormat` in provenance and safe success logs distinguishes native function results from validated text compatibility replies. See the [follow-up record](verification.md#native-pack-response-follow-up) for the failed intermediate test and the deployed retest status.


A short live test confirmed native function arguments on the primary model in 6.3 seconds. The detailed native run reached the prior 60-second cutoff. The subsequent generation deadline is 90 seconds total, with a 105-second client deadline, an explicit progress notice, concise draft guidance, the same three-attempt cap and cancellation. This supersedes the earlier 60-second budget descriptions for the final implementation.


The 90-second detailed run still failed, so detailed inputs above 5,000 serialized characters now start on the existing 31b model while short inputs retain 26b. Safe finish-reason and token-count diagnostics were added because the previous run did not expose its stop category. The exact prior non-success category remains unknown. Provenance records configured, primary and actual models; 61 tests pass. The final deployed detailed replay is recorded in the verification history.


## Current limitation after the format incident

The final native short Prepare/Update pair succeeded on the first primary attempt in 5.9/6.1 seconds, with correct NGN 4,000/6,000 totals. The detailed school-event replay still failed: 31b returned 503 and 500, then the fallback timed out at the shared 90-second deadline. No detailed quality checks were passed in that replay. The exact user's failing brief is not available. The deployed format handling and bounded recovery are improved, but the app must not be described as fully reliable or this original report as conclusively resolved. See the [final live results](verification.md#final-deployed-checks-for-this-pass).
