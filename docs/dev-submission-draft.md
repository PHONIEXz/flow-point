*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19).*

## What I Built

**One school event. Four documents. The same details copied over and over.**

As a teacher, this is the kind of work I wanted to reduce. A rough event note becomes an invitation, a programme, a preparation checklist and a budget. Then somebody changes the time or the number of refreshments, and each document needs another check.

I built **Flow Point** to prepare that first draft and help me review what changes next.

Write your event in ordinary language. Choose **Gemma through Google** or **GPT-OSS through Groq**. Flow Point prepares the pack, keeps unanswered questions visible, calculates costs in code and lets you edit every section before exporting it.

The important boundary is simple: **a draft is not an approved plan, and an unknown price is not zero.**

![Flow Point home in its cream and burgundy theme](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/current/cover-20261025.png)

## Demo

**[Try Flow Point](https://flowpoint.phoenixreborn.tech/workspace)** · **[Judge guide and reproducible brief](https://flowpoint.phoenixreborn.tech/judge)** · **[Source code](https://github.com/PHONIEXz/flow-point)**

No account is required. If a provider is unavailable, the clearly labelled hand-authored sample lets you explore editing, review and PDF export without an AI call. It is never presented as generated output.

The workflow is:

1. **Write the notes.** Include the facts you know and leave unknowns explicit.
2. **Prepare the pack.** Generation runs in three steps: facts/checklist/budget, invitation, then run of show.
3. **Check the sources.** Source cards show exact note excerpts when available. A matching quote is evidence to inspect, not proof that the model understood it.
4. **Apply changes.** Update Pack preserves a previous version for comparison and restoration. Questions omitted by the model stay open until explicitly resolved.
5. **Review and export.** Download the complete pack or each document separately as PDF. Filenames begin with the event title and have a unique suffix. Markdown includes readable currency, review issues, open questions and source evidence; CSV supports the budget.

![Current provider selector](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/current/models-20261025.png)

### A small example you can check

The fictional Cedar School Reading Day screenshots show an edited sample, not a new model run. Fifty refreshments at NGN 300 and fifty programmes at NGN 100 give **NGN 20,000**. With a **NGN 30,000** limit, the remaining allowance is **NGN 10,000**. Missing task owners and due dates remain unresolved and block approval.

The invitation supports formal block-letter or informal layout. Optional sender/recipient details come from the user, while the letter date stays separate from the event date.

![Editable formal invitation from the fictional Cedar sample](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/current/invitation-20261025.png)

![Sample budget with NGN 20,000 total and NGN 10,000 allowance](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/current/budget-20261025.png)

### What happened in a real model run

A recorded Groq/GPT-OSS run used the fictional **Willow Skills Exchange**. Its update replaced Lara Chen with Nora Cole, changed eight kits to ten at CAD 12.50 each and changed room hire from CAD 0 to CAD 90. The updated cost became **CAD 215** against a **CAD 200** limit. The application blocked approval for the overspend.

Both Willow operations passed all **54 declared checks combined**. The same assistant authored the briefs and expectations; this is one recorded case, not an independent accuracy score. [Inspect the raw evidence and evaluation limits](https://github.com/PHONIEXz/flow-point/tree/main/docs/evidence/quality-v4-2026-10-24).

### Earlier walkthroughs

These published recordings show the earlier implementation and remain available while the new short clips are uploaded. Their interface and provider behavior are historical.

{% youtube xHEi4ybfHL0 %}

{% youtube m3PTH6_Rt2w %}

{% youtube p_Ob6AzwyVo %}

## How I Built It

The browser calls a **Node.js service on Render**. That service keeps API keys off the client, routes requests to the selected hosted model, validates the result and creates files with **PDFKit**. Budget arithmetic, approval checks and export filenames are handled by code.

The model handles varied language and draft wording. Code checks structure, dates, programme anchors, supplied budget details and unresolved review items. Neither replaces a person's source review.

Completed generation steps save in the browser when storage is available. Retrying the same input can reuse those steps. A failed replacement leaves the previous pack intact. Up to **12 named packs** can be saved in the same browser; there is no cross-device sync, so exported backups matter.

### Why I added Groq

During development, Google-hosted Gemma sometimes returned HTTP 500 or timed out. Groq gave users another open-weight model option, but it also reached quota limits. Adding a second provider did not remove the need for careful failure handling.

The current release uses **45-second attempt deadlines**, bounded retries and a short circuit pause after repeated failures. Optional automatic fallback asks for **fresh permission covering both Google and Groq**. Existing single-provider consent never expands silently. Each generation step records the actual provider and model used. Invalid content is rejected, and failures never create fake output.

![Optional combined consent for provider fallback](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/current/fallback-20261025.png)

## Why Open Innovation Matters

Gemma and GPT-OSS are open-weight models at the core of the event-drafting workflow. Their available weights make alternative hosting and model inspection possible; the MIT-licensed app exposes its prompts, adapters and validation boundary for others to examine and change.

**This deployment uses hosted inference. It does not run offline or keep consented event notes exclusively on the device.** The choice helps someone try the app without downloading a model, while leaving room for a future self-hosted adapter. No offline-performance claim is made.

## Tools and Partner Contributions

- **Gemma:** interprets event notes and proposes structured facts and wording through Google's hosted API. The adapter remains available alongside GPT-OSS.
- **Render:** hosts the Node web service, server-side provider calls and document exports.
- **.tech domain:** [flowpoint.phoenixreborn.tech](https://flowpoint.phoenixreborn.tech/) is the live project address under the domain claimed for this challenge.
- **GitHub Copilot Chat:** inspected the PDF filename changes in [PR #1](https://github.com/PHONIEXz/flow-point/pull/1). I evaluated its Unicode and decoded-filename findings and added regression coverage. [The contribution record](https://github.com/PHONIEXz/flow-point/blob/main/docs/copilot-review.md) distinguishes the actual Chat assistance from an unsuccessful formal review request. Partner-category eligibility is for the organizers to determine.
- **Groq, GitHub, Node.js and PDFKit:** provide the alternate hosted inference path, public source, server runtime and PDF generation. I am documenting their actual roles, not claiming every tool has a prize category.

## What I Tested, and What Remains

The current suite passes **145 software tests**, including simulated provider failures, consent boundaries, source handling, checklist completeness, exact arithmetic, exports and draft preservation. Those tests are not an AI accuracy percentage.

The broader frozen v4 evaluation completed 20 of 24 planned operations, with 13 completed operations passing all declared checks. Targeted v5 completed ten of eleven operations, with six passing all declared checks. Failures and mismatches are retained. Five subsequent complete-generation retests were blocked by quota and are deferred, not counted as passes.

I also completed a real-phone usability check and reported healthy fitting/layout and perceived speed. I did not record a timed manual-writing comparison, so I am not claiming a percentage time saved. Provider availability and arbitrary wording mistakes remain limitations.

**The payoff is fewer places to start from scratch:** one note becomes an editable set of drafts, and a later change has a reviewable trail. The organizer still makes the final call.

[Verification and release record](https://github.com/PHONIEXz/flow-point/blob/main/docs/final-readiness-2026-10-25.md)

Built by **Paul Ayoade David**. I directed the project and used AI assistance for code and this article draft. The application is MIT-licensed; model and hosted-service terms apply separately.
