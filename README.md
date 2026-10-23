# Flow Point

**From a messy event request to a reviewed preparation pack.**

Flow Point helps organizers at schools, churches and community groups prepare an invitation, run of show, checklist and budget. Built by Paul Ayoade David ([PHONIEXz](https://github.com/PHONIEXz)) for Hacktoberfest 2026 Week 3, Slow and Steady.

## Current status

The event workspace uses a full-page notes editor at `/workspace` and a preparation pack editor at `/workspace/pack`, with the Gemma update form beside the pack. A Node HTTP server and server-only hosted Gemma adapter support editing, open questions, deterministic checks, named browser-local Saved Packs, version approval, and PDF/Markdown/CSV downloads. There are no accounts, database, email sending or calendar writes.

**Live inference and production deployment were verified on 23 October 2026.** A fictional event pack and a follow-up update were generated with `gemma-4-26b-a4b-it` on the deployed site. One provider HTTP 500 preceded the successful retry; the request was preserved. No API key is bundled. Without a configured server key the workspace explicitly disables live generation and offers a labelled, hand-authored sample. Provider errors never substitute sample output. Automated model tests use simulated HTTP responses; see the separate [live verification record](docs/verification.md).

## Run

Requires Node.js 22.9 or newer (Node 24 recommended). No third-party packages are required.

```sh
cp .env.example .env
# Add GEMINI_API_KEY to .env using your editor, for live generation.
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

`render.yaml` now describes a **Node Web Service** called `flow-point-app`, with `npm test && npm run build`, `npm start` and `/healthz`. The server binds `0.0.0.0` and honors `PORT`. A Static Site alone cannot run the API.

The Node service runs on Render with `GEMINI_API_KEY` set privately in its environment. The free service may sleep between visits. The live custom domain was opened over HTTPS during verification.

Planned address: `flowpoint.phoenixreborn.tech`. See [domain setup](docs/domain-setup.md).

## Verification

`npm test` covers date conflicts and invalid dates, exact budget arithmetic and overflow, missing facts, placeholders, approval invalidation, CSV escaping, and HTTP routes through generation, review, approval and export. Provider tests simulate valid, truncated, malformed, quota and network-failure responses. See [verification record](docs/verification.md) for remaining gates.

This version retains the established dependency-free Node stack. eve was considered in the initial design but is not installed or claimed as part of the running app.

## Competition evidence

Challenge: https://dev.to/challenges/hacktoberfest-week3-2026-10-19

The [submission draft](docs/dev-submission-draft.md) uses live screenshots in `docs/media/`; the [winner comparison](docs/submission-review.md) records the presentation choices and remaining gates. This draft is not a published DEV entry.

Intended categories: Gemma, Render and .tech Domain, subject to eligibility. A novel live generation, refinement and draft PDF export have been checked. The user reported that the phone experience worked perfectly. Outstanding: timed user-effort measurement, recording and DEV submission. Do not claim savings without evidence. Record any changes made after the deadline.

## License

MIT. Copyright (c) 2026 Paul Ayoade David. Upstream models and services retain their own licenses and terms.
