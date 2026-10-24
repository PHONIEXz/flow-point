# Flow Point targeted post-fix evaluation v5
Started 2026-10-24T18:31:31.823Z. Frozen cases SHA-256: 54716024ad642fc40b8dca6a9d296b6650fe47fd1d1f3633b9ba76d57e7eeb36.

Eleven targeted operations on seven exposed regression briefs, selected after v4 failures. Same assistant-authored expectations retained. This is a post-fix regression check, not fresh or independent validation. Accepted API output may include deterministic missing-price questions, with provenance. Frozen v4 scores remain unchanged.

| Cohort | Planned operations | Attempted | Completed | Failed | Skipped | All declared checks passed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| targeted-regression | 11 | 11 | 10 | 1 | 0 | 6 |

These are operation and declared-check counts, not an overall reliability percentage. Raw model outputs, application question preservation, safe request receipts and failures are stored separately per operation. Manual review time and a timed human baseline are unmeasured.

| Case / action | Result | Non-passing declared checks |
| --- | --- | --- |
| known-school / prepare | Completed |  |
| known-school / update | Completed | Fact: startTime: missing; invitation: confirmed start: missing-or-wrong |
| fresh-school / prepare | Completed | Fact: title: wrong |
| fresh-school / update | Completed | Fact: title: wrong |
| fresh-community / prepare | Completed |  |
| fresh-ambiguous-date / prepare | Completed | Fact: venue: missing; invitation: venue: missing-or-wrong; schedule: venue: missing-or-wrong |
| fresh-zero-and-overspend / prepare | Completed |  |
| fresh-zero-and-overspend / update | Completed |  |
| known-judge / prepare | Completed |  |
| known-community / prepare | Completed |  |
| known-community / update | Failed | Groq daily quota reached. Wait for the provider quota to reset; your saved pack is safe. |
