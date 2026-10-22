# Contest readiness: work chunks

These are acceptance gates, not a probability of winning.

## 1. Reliability and difficult requests

Status: first stress-test and correction pass completed on 21 October 2026. Broader repeated evaluation remains necessary.

| Case | Observed result |
| --- | --- |
| Missing date, time, venue, organizer and signatory | Kept essential facts null, asked questions and blocked approval. |
| Friday 14 November 2026 | Preserved the supplied weekday; deterministic review flagged Saturday/Friday conflict. Live approval rejected it. |
| 4,788-character request with three budget items | Returned all three items with exact total NGN 22,000. Model initially asked to reconfirm NGN; a post-fix complete NGN request returned no questions. |
| Refine venue and start time | Updated both drafts, preserved a manually edited accessibility task and its owner, preserved NGN 22,000 budget, cleared resolved questions. |
| Ambiguous numeric date/time plus untrusted quoted instructions | Left date/time null, asked for clarification, did not invent the quoted price or claim invitations were sent. Initially omitted the known-quantity notebook item; follow-up instructions retained the 12 notebooks with null price; retest correctly reported an incomplete budget. |
| Browser cancellation | Cancelled a real refinement; retained edited draft, sample provenance and clarification text; controls recovered. |
| Provider HTTP 500 | One browser refinement failed upstream; the UI displayed the sanitized error and preserved the previous draft and clarifications. |
| Unresolved draft placeholders | Fixed approval checking for ordinary placeholders such as [Date], [Time], [Venue], [Signatory] and [Activity], even after facts are filled. Bracketed draft content now requires review except for the exact plain [Proposed Run of Show] heading. Public API review flagged the saved sparse case and approval rejected it. |
| Cancellation/timeout during provider body reading | Added regression coverage, reproduced failure, then fixed classification and rejection before accepting a pack. |
| Disconnect and capacity | Local HTTP test filled both generation slots, confirmed the third request was rejected, disconnected both clients, confirmed both upstream signals aborted and the next generation succeeded. |

All 25 automated tests pass. Simulated provider tests are distinct from the live cases above. Small-sample success does not establish a production success rate or prompt-injection immunity. Generation latency is not measured user-effort savings. Initial successful provider timings in this pass were 5.7–7.4 seconds, excluding network overhead and human review.

Remaining reliability limits: provider failures and free-host cold starts; arbitrary draft factual inconsistencies still need human review; no claim of exhaustive model-quality coverage. Browser cancellation evidence was captured before the server-body interruption patch; server-body handling is covered separately by regression tests.

## 2. Measured usefulness

In progress: [the three-task pilot](evaluation.md) now defines school, church and community briefs, matching output requirements, a quality gate, stopwatch rules, alternating method order and a blank result sheet. Dates and reference budget totals have been checked. Human attempts and timing results have not been collected. Complete all pairs, retain failures and calculate only from measured values. Disclose that the participant is the project owner and that repeated briefs introduce learning bias.

## 3. Mobile usability

Pending: verify narrow screens, readable type, horizontal overflow, all editing tabs, approval and downloads on a phone. Distinguish responsive viewport checks from actual-device testing.

## 4. Demo and evidence

Pending: record a concise complete task, including a missing fact or conflict caught before approval. Show live model generation, human corrections and usable exports. Preserve a backup recording for free-host cold starts/provider outages.

## 5. Submission writing and eligibility

Pending: explain the real problem, intended user, why open-weight AI matters, implementation decisions, limitations and measured results. Follow the official template and identify only meaningfully used partner categories. Verify current rules before final submission. Publication remains a separate user instruction.
