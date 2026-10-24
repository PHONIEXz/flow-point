# Flow Point quality evaluation v1
Started 2026-10-24T12:56:57.435Z. Frozen cases SHA-256: 6d0fedd57e35f96f8e09b51a86beeec2a20068b19b27e2d640d39f37d59632d3.

Ten paired fictional cases; four exposed and six fresh before first inference. Literal declared checks, not exhaustive semantic review or an independent blinded evaluation. One operation attempt each, with the existing server retry policy; skips and failures remain visible.

| Cohort | Planned operations | Attempted | Completed | Failed | Skipped | All declared checks passed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| exposed | 8 | 3 | 1 | 2 | 5 | 0 |
| fresh-before-first-inference | 12 | 0 | 0 | 0 | 12 | 0 |

These are operation and declared-check counts, not an overall reliability percentage. Raw model outputs, application question preservation, safe request receipts and failures are stored separately per operation. Manual review time and a timed human baseline are unmeasured.

| Case / action | Result | Non-passing declared checks |
| --- | --- | --- |
| known-judge / prepare | Failed | Google generation returned HTTP 500. Please retry when the provider is available. |
| known-judge / update | Skipped | Prepare did not produce a pack; Update depends on it. |
| known-school / prepare | Completed | Fact: venue: missing |
| known-school / update | Failed | The model quota is temporarily exhausted. Please wait and retry. |
| known-community / prepare | Skipped | Stopped after quota response. |
| known-community / update | Skipped | Stopped after quota response. |
| known-maple / prepare | Skipped | Stopped after quota response. |
| known-maple / update | Skipped | Stopped after quota response. |
| fresh-school / prepare | Skipped | Stopped after quota response. |
| fresh-school / update | Skipped | Stopped after quota response. |
| fresh-church / prepare | Skipped | Stopped after quota response. |
| fresh-church / update | Skipped | Stopped after quota response. |
| fresh-community / prepare | Skipped | Stopped after quota response. |
| fresh-community / update | Skipped | Stopped after quota response. |
| fresh-ambiguous-date / prepare | Skipped | Stopped after quota response. |
| fresh-ambiguous-date / update | Skipped | Stopped after quota response. |
| fresh-untrusted-quote / prepare | Skipped | Stopped after quota response. |
| fresh-untrusted-quote / update | Skipped | Stopped after quota response. |
| fresh-zero-and-overspend / prepare | Skipped | Stopped after quota response. |
| fresh-zero-and-overspend / update | Skipped | Stopped after quota response. |
