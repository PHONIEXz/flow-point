# Submission review against Week 1 winners

Reviewed on 23 October 2026. This is a working editorial comparison, not a claim about the judges' private reasoning. The Week 3 rules weight writing quality most heavily. The entry must use the official template and challenge tag, link a demo and code, and explain why open innovation matters. Only one entry per person is considered.

## Patterns worth copying in our own words

| Example | What the public post and repository make easy to judge | Application to Flow Point |
| --- | --- | --- |
| [Paper Trail](https://dev.to/mikek/paper-trail-gemma-writes-your-walk-a-field-card-then-the-screen-goes-away-3mf4), [repo](https://github.com/mikey92/paper-trail) | One precise example, a live demo, prompt variants with counts, a hand-review log, and a clear account of the model's wrong claims. No video is necessary to understand it. | Show one event from raw note through missing fact, update, budget and PDF. State actual failures and limits. |
| [Golden Hour](https://dev.to/tanay_singh_1005/golden-hour-an-open-model-that-finds-your-40-minutes-outside-and-where-to-spend-them-5fe8), [repo](https://github.com/Tanay3484/golden-hour) | A real outcome, deterministic scoring outside the model, fallback behavior, and deployment surprises. Repo has tests and a deployment spec. | Explain that Gemma drafts while code validates dates and integer money. Show what happens on provider failure. |
| [Turnaround](https://dev.to/code_neuron58/turnaround-an-open-source-hiking-buddy-that-knows-when-you-should-turn-back-and-tells-someone-if-1pha), [repo](https://github.com/CodeNeuron58/Turnaround) | A video, quantitative holdout test, failure drills and evidence files backing consequential claims. | Keep the demo and verification record aligned; no invented productivity percentage. |
| [Grow a Song](https://dev.to/anshsaini/grow-a-song-my-run-wrote-its-own-soundtrack-with-gemma-running-on-my-phone-44ml), [repo](https://github.com/ansh-saini/grow-a-song) | Actual field run, audio artifact, video and measured device output. | Use a real hosted Gemma run with screenshots, not a sample presented as live. |
| [Forking Paths](https://dev.to/asiboy6789/your-photo-picks-the-next-street-a-walking-mystery-on-open-weight-gemma-33od), [repo](https://github.com/asi-mir/forking-paths) | A short desk demo, labeled stored case, mobile browser checks and live-versus-local model comparison. | Keep sample labels and hosted-model disclosure explicit. |

Other winner posts used mixes of live links, videos, GIFs, screenshots, audio and written examples. There is no universal media count. A clear, verifiable story matters more than decorating the post with assets. The [winners announcement](https://dev.to/devteam/congrats-to-the-hacktoberfest-open-source-ai-challenge-touch-grass-winners-152c) links all 17 submissions.

## Flow Point changes from this review

- Added three real screenshots under `docs/media/` for the full-page notes, suggested schedule and incomplete budget.
- Refined Gemma's run-of-show instruction. With a confirmed start, later times are proposals labelled for confirmation. A live update produced 09:30, suggested 10:00, 11:30 and 12:30 instead of `[Time]` placeholders.
- Prepared a Week 3 submission in `docs/dev-submission-draft.md`, following the official headings and centering one fictional event. It reports the first provider HTTP 500, retry timing, PDF fix, 30 tests and limits without inventing manual savings.

## Remaining before publishing

1. Read the draft in the DEV editor and verify all three image embeds load at full size.
2. Record a short, real screen walkthrough if feasible: rough note, missing time, Gemma update, incomplete budget, draft PDF. The live link and screenshots already meet the demo requirement, so do not delay the post solely for a video.
3. If measuring effort, time a comparable manual preparation and a full Flow Point run including review. State tester count, input and corrections. Otherwise keep the draft's honest no-percentage wording.
4. Verify the exact final code commit, posted screenshots and links. Publish one Week 3 entry before the deadline. The entry should include only the Gemma, Render and .tech categories actually used.

Sources: [Week 3 challenge](https://dev.to/challenges/hacktoberfest-week3-2026-10-19), [Week 3 contest rules](https://dev.to/page/hacktoberfest-week3-2026-10-19-contest-rules), and the participant posts and repositories linked above.
