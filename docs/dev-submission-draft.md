*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19).*

## What I Built

**One school event. Four documents. The same details copied over and over.**

As a teacher, this is the kind of work I wanted to reduce. A rough event note becomes an invitation, a programme, a preparation checklist and a budget. Then somebody changes the time or the number of refreshments, and each document needs another check.

I built **Flow Point** to prepare that first draft and help me review what changes next.

Write your event in ordinary language. Choose **Gemma through Google** or **GPT-OSS through Groq**. Flow Point prepares the pack, keeps unanswered questions visible, calculates costs in code and lets you edit every section before exporting it.

The important boundary is simple: **a draft is not an approved plan, and an unknown price is not zero.**

![Full-page Notes editor containing a fictional event brief](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/submission-20261025/notes.png)

*An edited fictional sample. No AI request was made for this capture.*

## Demo

**[Try Flow Point](https://flowpoint.phoenixreborn.tech/workspace)** · **[Judge guide and reproducible brief](https://flowpoint.phoenixreborn.tech/judge)** · **[Source code](https://github.com/PHONIEXz/flow-point)**

No account is required. If a provider is unavailable, the clearly labelled hand-authored sample lets you explore editing, review and PDF export without an AI call. It is never presented as generated output.

### Watch: notes to preparation pack, 48 seconds

A quick tour of Notes, model choice, the four documents and the review boundary. The sample sections are labelled; this is not a fresh AI-generation recording.

{% youtube x_cZCxtVlFA %}

The workflow is:

1. **Write the notes.** Include the facts you know and leave unknowns explicit.
2. **Prepare the pack.** Generation runs in three steps: facts/checklist/budget, invitation, then run of show.
3. **Check the sources.** Source cards show exact note excerpts when available. A matching quote is evidence to inspect, not proof that the model understood it.
4. **Apply changes.** Update Pack preserves a previous version for comparison and restoration. Questions omitted by the model stay open until explicitly resolved.
5. **Review and export.** Download the complete pack or each document separately as PDF. Filenames begin with the event title and have a unique suffix. Markdown includes readable currency, review issues, open questions and source evidence; CSV supports the budget.

![Current provider selector](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/submission-20261025/models.png)

### A small example you can check

The fictional Cedar School Reading Day screenshots show an edited sample, not a new model run. Fifty refreshments at NGN 300 and fifty programmes at NGN 100 give **NGN 20,000**. With a **NGN 30,000** limit, the remaining allowance is **NGN 10,000**. Missing task owners and due dates remain unresolved and block approval.

The invitation supports formal block-letter or informal layout. Optional sender/recipient details come from the user, while the letter date stays separate from the event date.

![Actual invitation PDF with a formal address block, subject, paragraphs and one signatory](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/submission-20261025/invitation-pdf.png)

*An excerpt from an actual local app export of the fictional Cedar sample. It remains a draft requiring review.*

![Sample budget with NGN 20,000 total and NGN 10,000 allowance](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/submission-20261025/budget.png)

### What happened in a real model run

A recorded Groq/GPT-OSS run used the fictional **Willow Skills Exchange**. Its update replaced Lara Chen with Nora Cole, changed eight kits to ten at CAD 12.50 each and changed room hire from CAD 0 to CAD 90. The updated cost became **CAD 215** against a **CAD 200** limit. The application blocked approval for the overspend.

Both Willow operations passed all **54 declared checks combined**. The same assistant authored the briefs and expectations; this is one recorded case, not an independent accuracy score. [Inspect the raw evidence and evaluation limits](https://github.com/PHONIEXz/flow-point/tree/main/docs/evidence/quality-v4-2026-10-24).

### Watch: update and review, 48 seconds

This clip explains the recorded Willow update and overspend, then distinguishes it from the current sample interface and software-tested recovery controls.

{% youtube MtRfONnSB9U %}

## How I Built It

The browser calls a **Node.js service on Render**. That service keeps API keys off the client, routes requests to the selected hosted model, validates the result and creates files with **PDFKit**. Budget arithmetic, approval checks and export filenames are handled by code.

The model handles varied language and draft wording. Code checks structure, dates, programme anchors, supplied budget details and unresolved review items. Neither replaces a person's source review.

Completed generation steps save in the browser when storage is available. Retrying the same input can reuse those steps. A failed replacement leaves the previous pack intact. Up to **12 named packs** can be saved in the same browser; there is no cross-device sync, so exported backups matter.

### Code: money calculations stay outside the model

The model proposes budget entries; JavaScript calculates the totals. This excerpt from [`src/plan.mjs`](https://github.com/PHONIEXz/flow-point/blob/main/src/plan.mjs) counts missing prices separately from the known subtotal:

```javascript
const unknownPrices = plan.budget.filter(
  (item) => item.unitCostMinor === null
).length;

const knownTotalMinor = plan.budget.reduce(
  (total, item) =>
    total + item.quantity * (item.unitCostMinor ?? 0),
  0
);
```

Prices are stored as integer minor units. NGN 300 is stored as 30,000 kobo, avoiding floating-point money arithmetic. The zero in this sum means an unpriced item adds nothing to the **known subtotal**. Its actual price stays `null`, and the missing-price flag keeps the budget incomplete. A confirmed zero-priced item is different.

### Code: approval is earned by this exact version

The approval function in the same file runs the review again before issuing a fingerprint:

```javascript
export function approvePlan(input) {
  const review = reviewPlan(input);
  if (review.issues.length) {
    throw new Error('Resolve review issues before approval');
  }
  return {
    fingerprint: fingerprint(review.plan),
    approvedAt: new Date().toISOString()
  };
}
```

Unassigned tasks, missing due dates, unpriced items, overspending and other recorded review issues block approval. The fingerprint binds approval to the checked content. Editing that content requires another review. This does not establish that every sentence is true; the organizer must still compare it with the source.

![Manual source-review panel showing facts still awaiting review](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/submission-20261025/source-review.png)

*The sample has manual facts still to review. A Source card is a place to inspect evidence, not an automatic correctness stamp.*

### Why I added Groq

During development, Google-hosted Gemma sometimes returned HTTP 500 or timed out. Groq gave users another open-weight model option, but it also reached quota limits. Adding a second provider did not remove the need for careful failure handling.

The current release uses **45-second attempt deadlines**, bounded retries and a short circuit pause after repeated failures. Optional automatic fallback asks for **fresh permission covering both Google and Groq**. Existing single-provider consent never expands silently. Each generation step records the actual provider and model used. Invalid content is rejected, and failures never create fake output.

![Optional combined consent for provider fallback](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/submission-20261025/fallback.png)

### Code: fallback requires permission, not just another key

In [`src/resilience.mjs`](https://github.com/PHONIEXz/flow-point/blob/main/src/resilience.mjs), the alternate provider only enters the attempt list when fallback was explicitly allowed and its server key exists:

```javascript
const alternate = selected.provider === 'google'
  ? 'groq'
  : 'google';

const choices = [
  selected,
  ...(allowFallback && providers[alternate]?.apiKey
    ? [providers[alternate]]
    : [])
];
```

With fallback off, only the selected provider is tried. With it on, the alternate can handle an eligible provider failure. The surrounding code stops on cancellation or invalid model content and records the provider/model actually used. It never substitutes a sample or invents a result to make the request look successful.

### Code update: a model refusal is not a provider outage

The latest [merged fix](https://github.com/PHONIEXz/flow-point/pull/2) gives non-success candidate finishes an explicit error code in [`src/gemma.mjs`](https://github.com/PHONIEXz/flow-point/blob/main/src/gemma.mjs):

```javascript
if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
  throw new AppError(
    502,
    'The model did not finish a usable pack. ' +
      'Review the request before retrying.',
    'MODEL_BLOCKED'
  );
}
```

This guard follows the separate malformed-response and staged token-limit checks. The fallback runner excludes `MODEL_BLOCKED`, so a refusal stops instead of being passed to another provider as though it were a temporary outage. A regression test covers seven non-success finish reasons. The five live retests below ran before this small correction; the correction itself is covered by the software suite.

## Why Open Innovation Matters

Gemma and GPT-OSS are open-weight models at the core of the event-drafting workflow. Their available weights make alternative hosting and model inspection possible; the MIT-licensed app exposes its prompts, adapters and validation boundary for others to examine and change.

**This deployment uses hosted inference. It does not run offline or keep consented event notes exclusively on the device.** The choice helps someone try the app without downloading a model, while leaving room for a future self-hosted adapter. No offline-performance claim is made.

### Watch: PDFs and the build, 54 seconds

See a real exported letter and the jobs of Render, Gemma, Groq, the .tech address, Copilot, Node.js and PDFKit. Deployment/evidence cards are labelled records, not fabricated provider dashboards.

{% youtube -6ep1lx5ANI %}

## Tools and Partner Contributions

- **Gemma:** interprets event notes and proposes structured facts and wording through Google's hosted API. The adapter remains available alongside GPT-OSS.
- **Render:** hosts the Node web service, server-side provider calls and document exports.
- **.tech domain:** [flowpoint.phoenixreborn.tech](https://flowpoint.phoenixreborn.tech/) is the live project address under the domain claimed for this challenge.
- **GitHub Copilot Chat:** inspected the PDF filename changes in [PR #1](https://github.com/PHONIEXz/flow-point/pull/1). I evaluated its Unicode and decoded-filename findings and added regression coverage. [The contribution record](https://github.com/PHONIEXz/flow-point/blob/main/docs/copilot-review.md) distinguishes the actual Chat assistance from an unsuccessful formal review request. Partner-category eligibility is for the organizers to determine.
- **Groq, GitHub, Node.js and PDFKit:** provide the alternate hosted inference path, public source, server runtime and PDF generation. I am documenting their actual roles, not claiming every tool has a prize category.

## What I Tested, and What Remains

The current suite passes **146 software tests**, including simulated provider failures, consent boundaries, source handling, checklist completeness, exact arithmetic, exports and draft preservation. Those tests are not an AI accuracy percentage.

The broader frozen v4 evaluation completed 20 of 24 planned operations, with 13 completed operations passing all declared checks. Targeted v5 completed ten of eleven operations, with six passing all declared checks. Failures and mismatches are retained. Those earlier outcomes remain in the repository. On 25 October, I reran the five previously quota-blocked operations through Groq. **All five completed, with all 166 declared content checks passing and no quota failures in that run.**

| Retested operation | Declared content checks passed |
| --- | ---: |
| Detailed school Update | 53 |
| Riverside Prepare | 29 |
| Riverside Update | 28 |
| Ambiguous-date Oak Prepare | 28 |
| Community Update | 28 |

All **20 standalone PDF response checks** passed, along with the five application/approval checks. The PDF checks verify successful responses and valid PDF headers, not visual layout. These are exposed regression cases with unchanged expectations, not an independent model-accuracy score or an uptime guarantee. [Read the scorecard and preserved evidence](https://github.com/PHONIEXz/flow-point/tree/main/docs/evidence/quality-v8-2026-10-25).

I also completed a real-phone usability check and reported healthy fitting/layout and perceived speed. Provider availability and arbitrary wording mistakes remain limitations. Google availability was not retested in this latest run.

**The payoff is fewer places to start from scratch:** one note becomes an editable set of drafts, and a later change has a reviewable trail. The organizer still makes the final call.

[Verification and release record](https://github.com/PHONIEXz/flow-point/blob/main/docs/final-readiness-2026-10-25.md)

Built by **Paul Ayoade David**. I directed the project and used AI assistance for code and this article draft. The application is MIT-licensed; model and hosted-service terms apply separately.
