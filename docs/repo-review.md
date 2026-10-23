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
