# Flow Point

**From a messy event request to a reviewed preparation pack.**

Flow Point helps organizers at schools, churches and community groups prepare an invitation, run of show, checklist and budget. Built by Paul Ayoade David ([PHONIEXz](https://github.com/PHONIEXz)) for Hacktoberfest 2026 Week 3, Slow and Steady.

**[Judge guide and fixed example](https://flowpoint.phoenixreborn.tech/judge)** · **[Live workspace](https://flowpoint.phoenixreborn.tech/workspace)** · **[Published DEV entry](https://dev.to/phoniexcryptz001/flow-point-one-messy-event-note-four-useful-drafts-and-the-questions-we-still-need-to-answer-3if8)**

![Current Flow Point Home page](docs/media/current/cover.png)

## Watch the walkthroughs

| Video | Focus | Length |
| --- | --- | --- |
| [1. Create and navigate](https://youtu.be/xHEi4ybfHL0) | Home, Notes, consent and preparing a pack | 3:12 |
| [2. Update, review and export](https://youtu.be/m3PTH6_Rt2w) | Live update evidence, manual corrections, PDF and saved packs | 3:12 |
| [3. Tools and build evidence](https://youtu.be/p_Ob6AzwyVo) | Render, Gemma, .tech, GitHub, Copilot Chat, Node.js and PDFKit | 3:12 |

The three videos are embedded in different sections of the published entry. They combine edited interface motion, original instrumental music, captions and cursor emphasis. Earlier successful live runs and hand-authored sample sections are explicitly labelled; video pacing is not a speed benchmark. See [the media record](docs/media/README.md) and [demo guide](docs/demo-shot-list.md).

## Current status

**24 October reliability status:** resumable three-step generation and the [judge guide](https://flowpoint.phoenixreborn.tech/judge) are deployed. The short fixed brief passed the expanded Prepare/Update checks in 16.452 / 12.723 seconds on the bounded-attempt release. Detailed-school replays still failed, including the final simpler JSON path. The current 72-test automated suite passes, but detailed live reliability remains an open limitation. [All attempts and references](docs/verification.md).

The event workspace uses a full-page notes editor at `/workspace` and a preparation pack editor at `/workspace/pack`, with the Gemma update form beside the pack. A Node HTTP server and server-only hosted Gemma adapter support editing, open questions, deterministic checks, named browser-local Saved Packs, version approval, and PDF/Markdown/CSV downloads. There are no accounts, database, email sending or calendar writes.

**Earlier live inference and production deployment were verified on 23 October 2026.** A fictional event pack and a follow-up update were generated with `gemma-4-26b-a4b-it` on the deployed site. One provider HTTP 500 preceded the successful retry; the request was preserved. No API key is bundled. Without a configured server key the workspace explicitly disables live generation and offers a labelled, hand-authored sample. Provider errors never substitute sample output. Automated model tests use simulated HTTP responses; see the separate [live verification record](docs/verification.md).

## Run

Requires Node.js 22.19.0 or newer (Node 24 recommended). Run `npm ci` to install the locked dependencies, including PDFKit and DejaVu fonts for PDF export. Hosted inference does not require a model download.

```sh
cp .env.example .env
# Add GEMINI_API_KEY to .env using your editor, for live generation.
npm ci
npm test
npm run build
npm start
```

Open `http://localhost:3000/workspace`. Without a key, the sample still supports the full manual editing/review/export flow. `npm run demo` prints a hand-authored fixture; it is not inference evidence. `npm run dev -- --port 4173` supports preview supervisors after a build.

## Workflow

1. Describe your event and acknowledge that live requests are sent to Google.
2. Generate the pack with Gemma, or explicitly open the sample.
3. Compare extracted facts with the original request. Fill missing details, resolve questions and edit both drafts, tasks and prices. Refine with Gemma when you want the draft wording updated from new confirmations.
4. Review all sections and approve the exact version. Date/weekday conflicts, missing date, venue, start time, organizer, signatory, unresolved questions, confirmation placeholders and unknown prices block approval.
5. Download the preparation pack or budget worksheet. Draft downloads are allowed and marked as draft. The sample pack is labelled as sample data.

The current pack saves automatically in browser local storage. Name a pack in Saved Packs to keep it when starting another. Up to 12 named packs can be reopened, renamed and removed, and the previous single-draft format is migrated on first load. Named packs also save edits automatically. These browser copies are not synced across devices, encrypted by the app or backed up on a server. Browser storage may be cleared or fill up, so download a PDF or Markdown copy for backup. Editing a plan or its original request clears approval. Changing event facts does not silently rewrite the invitation: update the wording yourself or refine with Gemma.

Approval is a human review state, not authentication, permission to act externally or a guarantee of factual correctness. The server remembers approval fingerprints in a bounded in-memory cache. A restart or cache eviction may require renewed approval, while the browser-local draft remains. Export rechecks the fingerprint; a changed pack cannot inherit the previous approval.

## AI and validation boundary

Gemma interprets the request and proposes draft wording. It is instructed to keep unknown facts null and use confirmation placeholders. Code validates the returned structure, dates, quantities, integer money arithmetic and export safety before accepting a result. Those checks cannot prove that extracted facts match the original text; human review is essential. Suggested checklist items and run-of-show entries are proposals, not completed work.

Budget editing currently uses currencies with 100 minor units (for example NGN, USD, GBP and EUR). Enter main units in the UI; the core stores integer minor units, such as kobo. Unknown prices remain blank, distinct from a confirmed zero. Currency conversions and currencies with other minor-unit scales are not implemented.

Server safeguards include JSON/body limits, fixed static routes, same-origin browser checks, a restrictive CSP, model timeout and cancellation, sanitized provider errors, output validation and per-process concurrency/quota caps. The key is sent upstream in a header and never returned to the browser. Quota caps are per instance, not distributed rate limiting; this MVP is not a multi-user production security architecture. Do not paste private attendee data into live requests.

## Deploy on Render

`render.yaml` now describes a **Node Web Service** called `flow-point-app`, with `npm ci && npm test && npm run build`, `npm start` and `/healthz` declared in the Blueprint. The server binds `0.0.0.0` and honors `PORT`. A Static Site alone cannot run the API.

The Node service runs on Render with `GEMINI_API_KEY` set privately in its environment. The free service may sleep between visits. The live custom domain was opened over HTTPS during verification.

Live address: [flowpoint.phoenixreborn.tech](https://flowpoint.phoenixreborn.tech/). See [domain setup](docs/domain-setup.md).

## Verification

`npm test` covers date conflicts and invalid dates, exact budget arithmetic and overflow, missing facts, placeholders, approval invalidation, CSV escaping, and HTTP routes through generation, review, approval and export. Provider tests simulate valid, truncated, malformed, quota and network-failure responses. See [verification record](docs/verification.md) for remaining gates.

The HTTP service uses Node.js; PDF export uses PDFKit with bundled DejaVu fonts. eve was considered in the initial design but is not installed or claimed as part of the running app.

## Competition evidence

Challenge: https://dev.to/challenges/hacktoberfest-week3-2026-10-19

The [published DEV entry](https://dev.to/phoniexcryptz001/flow-point-one-messy-event-note-four-useful-drafts-and-the-questions-we-still-need-to-answer-3if8) contains three video embeds and fresh UI captures. Original PNGs are in [`docs/media/current/`](docs/media/current/). Its [Markdown source](docs/dev-submission-draft.md), [media provenance](docs/media/README.md) and [winner comparison](docs/submission-review.md) record the evidence and presentation choices.

Entry categories: Gemma, Render, .tech Domain and GitHub Copilot, subject to eligibility. [Copilot Chat's evaluated contribution](docs/copilot-review.md) covers PDF download filenames; it was not a registered formal PR review.

Earlier live generation, refinement and draft PDF export were checked. Later recording and screenshot attempts also encountered timeouts and Google HTTP 500, so inference availability is not consistently verified. The latest UI screenshots use a labelled, manually edited School Family Day sample; they are not new model-output evidence. The author reported successful phone use and a successful later school-event retest; see the chronological [verification record](docs/verification.md).

The 72-test automated suite passed in the latest app verification. Remaining measurement work: a timed manual-writing baseline plus review/export effort. The author's approximately 37-second preparation and 53-second update timings are operation timings, not a measured time-saving percentage. Record any changes made after the deadline.

## License

MIT. Copyright (c) 2026 Paul Ayoade David. Upstream models and services retain their own licenses and terms.

The [23 October repository review](docs/repo-review.md) records the latest fixes, automated checks and remaining limits.


Latest reliability check (24 October): the native structured-response path completed short Prepare/Update requests in 5.9/6.1 seconds on the first attempt. The detailed school-event replay still failed after upstream 503/500 errors and a fallback timeout. The 61 automated tests pass, but successful completion of detailed briefs remains an open limitation; see [the complete incident and live results](docs/verification.md#invalid-json-recovery-24-october-2026).


## Smaller generation steps and recovery (24 October)

The browser now prepares the pack through three separately validated calls: facts/checklist/budget, invitation, and run of show. Draft calls cannot change the checkpoint's structured facts. Completed responses are stored in the existing browser workspace; retries with identical notes, update text and previous plan reuse the successful prefix. Any input change starts fresh. The old pack is replaced only after all steps and a final server validation complete.

Each model step has a seven-minute server deadline shared by its bounded retries. The browser allows seven minutes and 15 seconds per step for transport overhead. With three sequential steps, a full pack can take up to about 21 minutes; you can cancel at any time. Three requests can use more provider quota than a single call. Checkpoints require available browser storage and do not recover responses lost before receipt. This is browser-local recovery, not a durable server queue or an exactly-once billing guarantee. Model/provider failures remain possible.

The [judge guide](docs/judge-guide.md) includes a small repeatable brief and expected initial NGN 4,000 subtotal / updated NGN 6,000 total. The original detailed school brief remains a separate regression case. `node scripts/benchmark-live.mjs --live --site https://flowpoint.phoenixreborn.tech --repeats 2` records every attempted hosted run, per-step references, timings and fact checks. It is excluded from tests and builds. Live results are recorded separately from the 72 simulated-provider/unit/UI tests. Human review and a manual-writing baseline remain unmeasured.

First staged live measurement: the fixed judge brief prepared in 18.606 seconds and updated in 13.394 seconds, passing the listed budget/date/venue checks. The next attempt hit Google quota at its invitation step, and the runner stopped. Two completed out of three attempted operations is an interrupted small sample, not proof of overall reliability. [Raw measurement record](docs/evidence/staged-live-2026-10-24.json). The detailed-school staged regression was not reached in that batch.

Home now provides separate sample PDF and Markdown downloads. The two-page sample PDF is built from the same hand-authored fixture, clearly marked SAMPLE DATA / DRAFT, with unique download names. No model call is needed.
