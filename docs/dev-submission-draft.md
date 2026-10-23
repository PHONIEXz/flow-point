---
title: "Flow Point: one messy event note, four useful drafts, and the questions we still need to answer"
published: true
tags: devchallenge, hf26challenge, gemma, hacktoberfest
---

Published on DEV: https://dev.to/phoniexcryptz001/flow-point-one-messy-event-note-four-useful-drafts-and-the-questions-we-still-need-to-answer-3if8

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19).*

## What I Built

As a teacher, I know a school event can start with one rough note and turn into several jobs: write the invitation, make a schedule, list what needs doing, and work out the costs. The slow part is moving the same details between those documents while remembering what has not been confirmed.

I built **Flow Point** to do that first pass. You type the event in your own words. Gemma proposes a preparation pack with an invitation, run of show, checklist and budget. Then you check the facts, answer its questions, edit the drafts and download a PDF. The pack is deliberately a *draft* until a person reviews it.

I tested it with a fictional Community Repair Day in Abuja. My note named the venue, organizer, signatory, 50 printed programmes at NGN 180 each, 60 water bottles at NGN 250 each, and 40 volunteer snack packs with no agreed price. I left out the start time on purpose.

Gemma kept that time empty and asked for it. It kept the snack price unknown, while the budget showed a **NGN 24,000 known subtotal**, clearly marked incomplete. When I later confirmed a 09:30 start, Flow Point refreshed the invitation and run of show. The follow-up schedule put the welcome at 09:30 and labelled the later times as *suggestions to confirm*. The known prices stayed intact.

That distinction matters. A made-up price can travel from a draft into a real spending decision if the interface presents it as fact.

![The full-page notes editor with the fictional repair-day brief](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/notes.jpg)

## Demo

**[Try Flow Point](https://flowpoint.phoenixreborn.tech/workspace)**. It runs in the browser and needs no account. The Notes page gives you room for a rough brief; the Preparation Pack page puts the Gemma update form beside the editable pack. If you just want to explore the workflow, open the clearly labelled hand-authored sample. That sample makes no AI call.

For a live run, enter a fictional event, acknowledge the Google processing notice, and select **Prepare my event pack**. Check the extracted details. Add a missing time using **Update pack with Gemma**, look through the invitation, schedule, checklist and budget, then download the draft PDF. Your current work and up to 12 named packs save in this browser, on this device.

![Gemma's proposed run of show, with later times labelled as suggestions](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/schedule.jpg)

![The budget keeps the snack price blank and labels the subtotal incomplete](https://raw.githubusercontent.com/PHONIEXz/flow-point/main/docs/media/budget.jpg)

The screenshots show a real hosted Gemma run using fictional data. The pack has not been approved. No invitations were sent, supplies ordered, or venue booked.

## Code

**[Source and setup instructions](https://github.com/PHONIEXz/flow-point)** · **[Live verification record](https://github.com/PHONIEXz/flow-point/blob/main/docs/verification.md)**

The repository is MIT-licensed and was started during the Week 3 challenge. Run `npm test`, then `npm start` to explore locally. Without a private Google key, the labelled sample still supports editing, review and export. The current test suite passes **30 tests**.

## How I Built It

The browser sends the event note to a Node service on Render. The server sends it to Google's Gemini API using the open-weight `gemma-4-26b-a4b-it` model. The key stays on the server. Gemma proposes structured event facts, two text drafts, tasks, budget items and open questions. The application validates the returned shape and checks dates, quantities and exact money arithmetic before accepting a pack.

I kept the model's job focused on interpreting the rough note and writing draft language. Code handles the parts that should be predictable. A missing price stays `null`, separate from a confirmed zero. The UI only calls a sum a *known subtotal* while prices are missing. Date and weekday conflicts and unresolved questions block approval. Editing a reviewed pack invalidates its approval. PDF, Markdown and budget CSV exports remain available as clearly marked drafts.

There is a human boundary too: changing an event fact does not silently rewrite the invitation. You can edit that text yourself or explicitly ask Gemma to update it. Consent is required before the original note, current pack and follow-up instructions are sent to Google.

### What happened when I tested it

My first real generation failed with a Google HTTP 500. Flow Point reported the provider failure and kept the typed note. It did not pass off the sample as a live result. One retry produced the pack in **7.9 seconds**. A follow-up update took **7.7 seconds**. After I saw the run of show still contained `[Time]` placeholders, I changed the prompt and retested: a fresh update took **8.5 seconds** and produced clearly labelled proposed times.

The first PDF also split the invitation signatory's name and role across pages. I fixed the page break, deployed it and checked a second live export. These are small details, but they are the difference between a nice screenshot and a tool someone can use.

The current invitation is a starting draft, not polished copy. The later schedule times still need confirmation, and a human must check the facts and complete the unknown budget item. I checked the app on my phone, and the flow I tried worked. The saved pack also survived a desktop page reload. The [verification record](https://github.com/PHONIEXz/flow-point/blob/main/docs/verification.md) separates the live observations from tests that used simulated provider responses.

## Why Does Open Innovation Matter?

Gemma's available weights give this project a path to other inference setups later. The **current** site uses Google's hosted API, needs an internet connection for fresh generation, and sends consented notes to Google. It does not run the model locally or promise zero inference cost. I chose hosted inference so someone can open the demo without downloading a model.

The application logic is open too. An organizer or developer can inspect the prompt, the model adapter, the validation rules and the approval checks. They can see which decisions come from the model and which come from code. That matters when a tool drafts real invitations and budgets: a smooth sentence is not proof that a date or price is correct.

Saved packs stay in this browser rather than on a server, but browser storage can be cleared. PDF and Markdown downloads provide a copy you can keep. The app has no accounts, email sending or calendar writes.

## The Lazy Payoff

One rough note produced four linked draft materials, and a follow-up answer updated the affected wording without retyping the whole pack. That removes a lot of copy-and-paste work. I have **not** measured a fair manual-versus-assisted time saving yet, so I am not claiming a percentage. The live timings above are model response times, not the time it takes a human to review the pack.

## Prize Categories

- **Best Use of Gemma:** Gemma interprets the event note and prepares the invitation, schedule, checklist, budget entries and follow-up updates. The model's open weights are the open AI component at the core of the project.
- **Best Use of Render:** Render hosts the Node service that keeps the Google key private, validates generated packs, serves the app and produces exports.
- **Best Use of a .tech Domain:** The live project runs at [flowpoint.phoenixreborn.tech](https://flowpoint.phoenixreborn.tech/workspace), under a .tech domain claimed for this challenge.

Flow Point is built by Paul Ayoade David. I directed the project and used AI assistance for code and for a draft of this article. I checked the live workflow, failure path, exports and test results before this submission. Gemma is developed by Google and its model and hosted service terms apply separately from the app's MIT license.
