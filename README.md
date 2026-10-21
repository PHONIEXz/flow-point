# Flow Point

**From a messy event request to a reviewed preparation pack.**

Flow Point helps organizers at schools, churches and community groups prepare an invitation, run of show, checklist and budget. Built by Paul Ayoade David ([PHONIEXz](https://github.com/PHONIEXz)) for Hacktoberfest 2026 Week 3, Slow and Steady.

## Current status

Version 0.2 adds an actual event workspace at `/workspace`, a Node HTTP server, and a server-only hosted Gemma adapter. The workspace supports editing, open questions, deterministic checks, browser-local draft restoration, version approval and Markdown/CSV downloads. There are no accounts, database, email sending or calendar writes.

**The app is deployed at https://flow-point-app.onrender.com/workspace.** Health, workspace, configuration and sample endpoints respond successfully. Live inference and browser/phone interaction are not verified yet. No API key is bundled. Without a configured server key the workspace explicitly disables live generation and offers a labelled, hand-authored sample. Provider errors never substitute sample output. Automated model tests use simulated HTTP responses, not live Gemma output. The configured model is `gemma-4-26b-a4b-it`, hosted through Google's Gemini API.

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

Edits are saved in browser local storage. They are not synced across devices, encrypted by the app or backed up on a server. The browser reports when storage is unavailable; download a copy before clearing browser data or the workspace. Editing a plan or its original request clears approval. Changing event facts does not silently rewrite the invitation: update the wording yourself or refine with Gemma.

Approval is a human review state, not authentication, permission to act externally or a guarantee of factual correctness. The server remembers approval fingerprints in a bounded in-memory cache. A restart or cache eviction may require renewed approval, while the browser-local draft remains. Export rechecks the fingerprint; a changed pack cannot inherit the previous approval.

## AI and validation boundary

Gemma interprets the request and proposes draft wording. It is instructed to keep unknown facts null and use confirmation placeholders. Code validates the returned structure, dates, quantities, integer money arithmetic and export safety before accepting a result. Those checks cannot prove that extracted facts match the original text; human review is essential. Suggested checklist items and run-of-show entries are proposals, not completed work.

Budget editing currently uses currencies with 100 minor units (for example NGN, USD, GBP and EUR). Enter main units in the UI; the core stores integer minor units, such as kobo. Unknown prices remain blank, distinct from a confirmed zero. Currency conversions and currencies with other minor-unit scales are not implemented.

Server safeguards include JSON/body limits, fixed static routes, same-origin browser checks, a restrictive CSP, model timeout and cancellation, sanitized provider errors, output validation and per-process concurrency/quota caps. The key is sent upstream in a header and never returned to the browser. Quota caps are per instance, not distributed rate limiting; this MVP is not a multi-user production security architecture. Do not paste private attendee data into live requests.

## Deploy on Render

`render.yaml` now describes a **Node Web Service** called `flow-point-app`, with `npm test && npm run build`, `npm start` and `/healthz`. The server binds `0.0.0.0` and honors `PORT`. A Static Site alone cannot run the API.

If an older static preview exists, keep it until the new app has been verified. Do not assume changing the Blueprint converts an existing Static Site. Create/confirm the separate Node service, set `GEMINI_API_KEY` in Render's secret environment settings, and verify a real request before moving the domain. The free service may sleep between visits. The free Node service is deployed in Ayoade Paul's Workspace (Frankfurt), with Render-managed HTTPS at https://flow-point-app.onrender.com. Custom-domain DNS and live inference are still pending. This service was created through MCP; the optional `/healthz` HTTP health-check setting must still be applied in the Dashboard (the service currently uses Render's default port check).

Planned address: `flowpoint.phoenixreborn.tech`. See [domain setup](docs/domain-setup.md).

## Verification

`npm test` covers date conflicts and invalid dates, exact budget arithmetic and overflow, missing facts, placeholders, approval invalidation, CSV escaping, and HTTP routes through generation, review, approval and export. Provider tests simulate valid, truncated, malformed, quota and network-failure responses. See [verification record](docs/verification.md) for remaining gates.

This version retains the established dependency-free Node stack. eve was considered in the initial design but is not installed or claimed as part of the running app.

## Competition evidence

Challenge: https://dev.to/challenges/hacktoberfest-week3-2026-10-19

Intended categories: Gemma, Render and .tech Domain, subject to actual implementation and eligibility. Outstanding: novel live Gemma runs, deployed end-to-end verification, phone layout checks, timed user-effort measurements, screenshots/demo and DEV submission. Do not claim category completion or savings without that evidence. Record any changes made after the deadline.

## License

MIT. Copyright (c) 2026 Paul Ayoade David. Upstream models and services retain their own licenses and terms.
