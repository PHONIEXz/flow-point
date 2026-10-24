# Flow Point quality evaluation v4
Started 2026-10-24T17:58:37.785Z. Frozen cases SHA-256: a5f9a8253147d2fd3cceb3cfbf2dc170a7e5ca38ae6a9d0d7caa747763da10ac.

Twelve paired fictional cases: eleven exposed regressions and one not yet executed, run first. The v3 first attempt stopped on Groq schedule throttling; those failures are preserved. Assistant-authored answer keys with no independent reviewer. Literal declared checks are not exhaustive semantic review or blinded evaluation. One operation attempt each, with existing bounded server retries; failures/skips remain visible. Proposed unconfirmed school venue may be null under the documented v3 adjudication.

| Cohort | Planned operations | Attempted | Completed | Failed | Skipped | All declared checks passed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| exposed | 22 | 20 | 18 | 2 | 2 | 11 |
| fresh-before-first-inference | 2 | 2 | 2 | 0 | 0 | 2 |

These are operation and declared-check counts, not an overall reliability percentage. Raw model outputs, application question preservation, safe request receipts and failures are stored separately per operation. Manual review time and a timed human baseline are unmeasured.

| Case / action | Result | Non-passing declared checks |
| --- | --- | --- |
| unseen-willow / prepare | Completed |  |
| unseen-willow / update | Completed |  |
| unseen-seabreeze / prepare | Completed |  |
| unseen-seabreeze / update | Completed |  |
| known-school / prepare | Failed | The model missed or changed a supplied budget detail, responsibility or rehearsal detail. Your saved pack is safe. Please retry. |
| known-school / update | Skipped | Prepare did not produce a pack; Update depends on it. |
| fresh-school / prepare | Failed | The model missed or changed a supplied budget detail, responsibility or rehearsal detail. Your saved pack is safe. Please retry. |
| fresh-school / update | Skipped | Prepare did not produce a pack; Update depends on it. |
| fresh-church / prepare | Completed |  |
| fresh-church / update | Completed |  |
| fresh-community / prepare | Completed | Pending question: poster price: missing |
| fresh-community / update | Completed |  |
| fresh-ambiguous-date / prepare | Completed | Fact: venue: missing |
| fresh-ambiguous-date / update | Completed |  |
| fresh-untrusted-quote / prepare | Completed |  |
| fresh-untrusted-quote / update | Completed |  |
| fresh-zero-and-overspend / prepare | Completed | Responsibility: Kemi Wale: wrong |
| fresh-zero-and-overspend / update | Completed | Responsibility: Kemi Wale: wrong |
| known-judge / prepare | Completed | Fact: venue: missing; invitation: venue: missing-or-wrong; schedule: venue: missing-or-wrong |
| known-judge / update | Completed |  |
| known-community / prepare | Completed | Budget line: banner: missing; Unknown price count: wrong; Task date: rehears: missing-or-wrong |
| known-community / update | Completed | Task date: rehears: missing-or-wrong |
| known-maple / prepare | Completed |  |
| known-maple / update | Completed |  |
