# Flow Point quality evaluation v2
Started 2026-10-24T13:28:14.727Z. Frozen cases SHA-256: 775b29ea811444a91e9561437c982922f170c4d7795670e81275e5fea20f6312.

Ten paired fictional cases; four exposed and six fresh before first inference. Literal declared checks, not exhaustive semantic review or an independent blinded evaluation. One operation attempt each, with the existing server retry policy; skips and failures remain visible.

| Cohort | Planned operations | Attempted | Completed | Failed | Skipped | All declared checks passed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| exposed | 8 | 3 | 1 | 2 | 5 | 0 |
| fresh-before-first-inference | 12 | 9 | 6 | 3 | 3 | 4 |

These are operation and declared-check counts, not an overall reliability percentage. Raw model outputs, application question preservation, safe request receipts and failures are stored separately per operation. Manual review time and a timed human baseline are unmeasured.

| Case / action | Result | Non-passing declared checks |
| --- | --- | --- |
| fresh-school / prepare | Completed |  |
| fresh-school / update | Completed |  |
| fresh-church / prepare | Completed | Budget quantity: programme: wrong; Arithmetic: knownTotalMinor: wrong; Arithmetic: remainingAllowanceMinor: wrong; Responsibility: Musa Bello: missing |
| fresh-church / update | Completed | Budget line: programme: missing; Budget line: sound: missing; Budget line: flower: missing; Arithmetic: knownTotalMinor: wrong; Arithmetic: remainingAllowanceMinor: wrong; Responsibility: Musa Bello: missing |
| fresh-community / prepare | Failed | Unexpected token 'u', "upstream c"... is not valid JSON |
| fresh-community / update | Skipped | Prepare did not produce a pack; Update depends on it. |
| fresh-ambiguous-date / prepare | Failed | Google generation returned HTTP 500. Please retry when the provider is available. |
| fresh-ambiguous-date / update | Skipped | Prepare did not produce a pack; Update depends on it. |
| fresh-untrusted-quote / prepare | Completed |  |
| fresh-untrusted-quote / update | Completed |  |
| fresh-zero-and-overspend / prepare | Failed | Unexpected token 'u', "upstream c"... is not valid JSON |
| fresh-zero-and-overspend / update | Skipped | Prepare did not produce a pack; Update depends on it. |
| known-judge / prepare | Failed | Google generation returned HTTP 500. Please retry when the provider is available. |
| known-judge / update | Skipped | Prepare did not produce a pack; Update depends on it. |
| known-school / prepare | Completed | Fact: venue: missing |
| known-school / update | Failed | The model quota is temporarily exhausted. Please wait and retry. |
| known-community / prepare | Skipped | Stopped after quota response. |
| known-community / update | Skipped | Stopped after quota response. |
| known-maple / prepare | Skipped | Stopped after quota response. |
| known-maple / update | Skipped | Stopped after quota response. |
