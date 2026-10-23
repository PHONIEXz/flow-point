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

The original pass had 30 automated tests. The 23 October repository audit and follow-up app pass run 49 tests, including PDF export and asynchronous workspace regression checks. Simulated provider tests are distinct from the live cases above. Small-sample success does not establish a production success rate or prompt-injection immunity. Generation latency is not measured user-effort savings. Initial successful provider timings in this pass were 5.7–7.4 seconds, excluding network overhead and human review.

Remaining reliability limits: provider failures and free-host cold starts; arbitrary draft factual inconsistencies still need human review; no claim of exhaustive model-quality coverage. Browser cancellation evidence was captured before the server-body interruption patch; server-body handling is covered separately by regression tests.

## 2. Measured usefulness

In progress: [the three-task pilot](evaluation.md) now defines school, church and community briefs, matching output requirements, a quality gate, stopwatch rules, alternating method order and a blank result sheet. Dates and reference budget totals have been checked. Human attempts and timing results have not been collected. Complete all pairs, retain failures and calculate only from measured values. Disclose that the participant is the project owner and that repeated briefs introduce learning bias.

## 3. Mobile usability

Responsive browser-frame pass completed on 22 October 2026. At 320, 390, 768 and 1280 CSS pixels, all five editor panels and the page remained within the frame width; the five tabs fit without horizontal scrolling. Before the change, the 320px tab strip held 442px of content in a 267px strip, and the two budget price inputs were about 110px wide. Afterward the tabs occupy 267px and the budget inputs use the full 231px content width. Narrow layouts now expose header navigation and request/pack jump links, wrap stage labels and notices, stack budget fields, keep 16px input text, and use larger, labeled controls.

In the 320px browser frame, a sample pack was edited across the details, invitation, run of show, checklist and budget tabs. Entered prices recalculated an exact NGN 102,525.00 total; review issues cleared, the sample was approved, and both state and total persisted through reload. An edit invalidated approval. PDF, Markdown and CSV controls reported that downloads started. The PDF export endpoint and output are separately covered by automated/local PDF checks; the cloud browser did not surface a download event for the iframe, so this check does not prove a physical-phone download. Actual Android/iOS touch, native date/time pickers, keyboard behavior and file handling still need device testing.

Saved Packs now keeps up to 12 named browser-local packs, migrates the previous single draft, and allows reopening and automatic edits. Two sample packs were saved and switched in the live browser, and the first pack's edited title persisted after reload. Browser storage is still device-local, so PDF/Markdown backups remain important.

## 4. Demo and evidence

Completed: three distinct 3:12 videos are published and embedded in the DEV article. They cover preparation, updates/review, and tools/build evidence. See [the delivered video list](demo-shot-list.md) and [media provenance](media/README.md). Earlier live footage, human corrections and labelled samples are distinguished; provider failures remain documented.

## 5. Submission writing and eligibility

Published: the [DEV submission](https://dev.to/phoniexcryptz001/flow-point-one-messy-event-note-four-useful-drafts-and-the-questions-we-still-need-to-answer-3if8) describes the problem, implementation, evidence and limitations, with Render, Gemma, .tech and Copilot contributions. Videos and refreshed pictures are embedded. The [source draft](dev-submission-draft.md) is retained. Publication and category selection do not guarantee eligibility or a prize. The measured usefulness pilot above remains incomplete.
