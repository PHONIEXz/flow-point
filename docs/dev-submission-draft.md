*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19).*

## What I Built

As a teacher, I know a school event can start with one rough note and turn into several jobs: write the invitation, make a schedule, list what needs doing, and work out the costs. The slow part is moving the same details between those documents while remembering what has not been confirmed.

I built **Flow Point** to do that first pass. You type the event in your own words. Your selected model, Gemma through Google or GPT-OSS through Groq, proposes a preparation pack with an invitation, run of show, checklist and budget. Then you check the facts, answer its questions, edit the drafts and download a PDF. The pack is deliberately a *draft* until a person reviews it.

I tested it with a fictional Community Repair Day in Abuja. My note named the venue, organizer, signatory, 50 printed programmes at NGN 180 each, 60 water bottles at NGN 250 each, and 40 volunteer snack packs with no agreed price. I left out the start time on purpose.

Gemma kept that time empty and asked for it. It kept the snack price unknown, while the budget showed a **NGN 24,000 known subtotal**, clearly marked incomplete. When I later confirmed a 09:30 start, Flow Point refreshed the invitation and run of show. The follow-up schedule put the welcome at 09:30 and labelled the later times as *suggestions to confirm*. The known prices stayed intact.

That distinction matters. A made-up price can travel from a draft into a real spending decision if the interface presents it as fact.

![Earlier Notes editor close-up with a fictional School Family Day brief](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/5iqtcmmy2rzi9dhsgwey.png)

*Earlier interface capture: School Family Day is a separate fictional, manually edited sample. [Open the full-size Notes image](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/5iqtcmmy2rzi9dhsgwey.png).*

## Demo

### A reproducible route through the work

[Open the judge guide](https://flowpoint.phoenixreborn.tech/judge), then load the fictional Community Reading Morning brief from Notes. The first budget should show NGN 4,000 known subtotal with an unknown programme price. After the published update, it should show NGN 6,000 and the multipurpose hall in both drafts. The guide links the exact inputs and lists what to inspect in the PDF and Saved Packs.

I split generation into three smaller steps: facts and budget, invitation, then run of show. Completed steps stay in the browser's workspace when storage is available. If a later request fails, retrying the same input reuses the earlier responses. My existing pack stays intact until the replacement is fully validated. This does not make either provider immune to outages or prove every sentence correct; review is still part of the product.

The [verification record](https://github.com/PHONIEXz/flow-point/blob/main/docs/verification.md) separates live measurements, automated simulated-provider tests and remaining limitations. I have not measured an equivalent manual-writing session, so I am not claiming a percentage time saved.

**[Try Flow Point](https://flowpoint.phoenixreborn.tech/workspace)**. It runs in the browser and needs no account. The Notes page gives you room for a rough brief; the Preparation Pack page puts the AI update form beside the editable pack. If you just want to explore the workflow, open the clearly labelled hand-authored sample. That sample makes no AI call.

### Watch: create and navigate (3:12)

This edited walkthrough shows navigation, notes, consent and pack preparation using fictional event data. Sample content and earlier successful live footage are labelled, and the provider failures encountered during recording are shown.

{% youtube xHEi4ybfHL0 %}

For a live run, enter a fictional event, choose a model and acknowledge its provider-specific processing notice, and select **Prepare my event pack**. Check the extracted details. Add a missing time using **Update pack with Gemma** or **Update pack with GPT-OSS**, look through the invitation, schedule, checklist and budget, then download the draft PDF. Your current work and up to 12 named packs save in this browser, on this device.

![Earlier sample schedule editor showing 09:30 and later timings labelled Suggested](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/sgt6tfsxxrmp8wcdl2jd.png)

*[Open the full-size schedule image](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/sgt6tfsxxrmp8wcdl2jd.png). This is a manually edited sample, not a new Gemma generation.*

![Earlier sample budget with an unknown refreshment price and NGN 9,000 incomplete subtotal](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/axdvc7sv2kp3vjmjxhnb.png)

*[Open the full-size budget image](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/axdvc7sv2kp3vjmjxhnb.png). A blank refreshment price keeps this sample subtotal incomplete.*

These earlier screenshots show the interface at capture time using a labelled School Family Day sample. Its NGN 9,000 known subtotal is separate from the NGN 24,000 Community Repair Day live test described above. The videos retain the earlier hosted Gemma evidence. A fresh generation attempt during the screenshot refresh returned Google HTTP 500, so no sample is presented as new inference. The sample has not been approved. No invitations were sent, supplies ordered, or venue booked.

## Code

**[Source and setup instructions](https://github.com/PHONIEXz/flow-point)** · **[Live verification record](https://github.com/PHONIEXz/flow-point/blob/main/docs/verification.md)**

The repository is MIT-licensed and was started during the Week 3 challenge. Run `npm test`, then `npm start` to explore locally. Without private provider keys, the labelled sample still supports editing, review and export. The current automated suite passes **130 tests**. Provider tests use simulated responses; live results are recorded separately.

## How I Built It

The browser sends the event note to a Node service on Render. The server routes it to the chosen provider: Google’s Gemini API with `gemma-4-26b-a4b-it`, or Groq with `openai/gpt-oss-120b`. Each key stays on the server and is used only for its own provider. The current browser workflow makes three smaller requests: facts, checklist and budget; invitation; then run of show. Each response is validated and saved before the next step. Later draft calls cannot change the structured facts. Retries with identical input reuse completed steps; changing the input starts fresh. The old complete pack stays intact until all steps and the final checks pass. Browser storage must be available to keep those checkpoints across reloads.

I kept the model's job focused on interpreting the rough note and writing draft language. Code handles the parts that should be predictable. A missing price stays `null`, separate from a confirmed zero. The UI only calls a sum a *known subtotal* while prices are missing. Date and weekday conflicts and unresolved questions block approval. Editing a reviewed pack invalidates its approval. PDF, Markdown and budget CSV exports remain available as clearly marked drafts.

There is a human boundary too: changing an event fact does not silently rewrite the invitation. You can edit that text yourself or explicitly ask the selected model to update it. Consent is required before the original note, current pack and follow-up instructions are sent to that provider. Google permission does not authorize Groq, or the reverse.

### Watch: update, review and export (3:12)

This walkthrough follows an earlier live Gemma update, an explicit invitation correction and the exported draft PDF. A separately labelled sample demonstrates the manual review controls, unknown prices and saved packs.

{% youtube m3PTH6_Rt2w %}

### What happened when I tested it

My first real generation failed with a Google HTTP 500. Flow Point reported the provider failure and kept the typed note. It did not pass off the sample as a live result. One retry produced the pack in **7.9 seconds**. A follow-up update took **7.7 seconds**. After I saw the run of show still contained `[Time]` placeholders, I changed the prompt and retested: a fresh update took **8.5 seconds** and produced clearly labelled proposed times.

The first PDF also split the invitation signatory's name and role across pages. I fixed the page break, deployed it and checked a second live export. These are small details, but they are the difference between a nice screenshot and a tool someone can use.

The current invitation is a starting draft, not polished copy. The later schedule times still need confirmation, and a human must check the facts and complete the unknown budget item. I checked the app on my phone, and the flow I tried worked. The saved pack also survived a desktop page reload. The [verification record](https://github.com/PHONIEXz/flow-point/blob/main/docs/verification.md) separates the live observations from tests that used simulated provider responses.

### Current measurements and what still fails

A fixed fictional Community Reading Morning test prepared in **16.452 seconds** and updated in **12.723 seconds**. The expanded checks passed the actual signer and named activity lead, activity durations, date, time, NGN 4,000 initial known subtotal, NGN 6,000 updated total and changed venue in both drafts. This is one Prepare/Update pair, not a reliability estimate. Earlier repeated attempts hit Google quota and stopped; those failures remain in the public measurement record.

A browser check also caught the model writing the field label “signatory” instead of the supplied person's name. I added rejection of that placeholder and expanded the checks to cover actual names. The smaller structured steps still encountered upstream errors with the long school brief, including a final attempt using smaller plain-JSON responses, so detailed-input reliability remains an open test gate. I am keeping failures and successful tests together in the [dated verification record](https://github.com/PHONIEXz/flow-point/blob/main/docs/verification.md).

### A second test with a detailed school event

I also tested a fictional Young Minds school event, first for 150 attendees and then for 180. I timed Flow Point myself: approximately **37 seconds to prepare** and **53 seconds to update** in that test. These are my own approximate operation timings, not a multi-user benchmark or a claim of percentage time saved. A full manual-writing baseline and review/export time are not included in those figures. The [exact initial brief, follow-up update and expected checks](https://github.com/PHONIEXz/flow-point/blob/main/docs/school-event-test.md) are public so the test can be repeated.

The uploaded result preserved the revised date, venue, 10:00 start, activity durations and **NGN 181,500 total**. It also exposed a real weakness: the rehearsal time was still awaiting approval, but its question disappeared; the named first-aid officer was missing from the checklist. Structural validation did not catch those semantic omissions. I tightened the prompt to retain pending approvals, named duties and the spending-limit explanation, and kept the original failure in the verification record. Early post-fix retests returned Google HTTP 500 and preserved the notes. On a later manual retest, preparation and update worked, and I confirmed the first-aid duty, pending rehearsal time, NGN 181,500 total and NGN 18,500 remaining allowance. This is a successful manual check, not a claim that every generation is reliable. A human must still compare each pack with the source brief.

I also removed repeated processing checkboxes. One explicit choice covers Prepare and Update, with an optional **Remember my choice on this browser** setting and a way to revoke it. PDF download filenames now preserve the event title’s capitalization, spaces and Unicode, replacing characters forbidden in filenames and retaining a timestamp and unique suffix. The PDF itself still shows its review status.

### Why I added Groq while keeping Gemma

Google-hosted Gemma had intermittent HTTP 500s, timeouts and quota interruptions during development. I added GPT-OSS through Groq so users could choose another model/provider rather than depend on Google alone. The **Drafting model** control is on Notes and Preparation pack. It remembers a browser preference and uses separate permission for each provider. Switching does not rewrite a pack, and failures never silently send notes to the other provider.

GPT-OSS is an OpenAI open-weight model served here by Groq, not the OpenAI API. This is an additional choice, not evidence that Groq is always faster or more accurate. Both providers can fail or omit details. A fresh Google test on 24 October still returned upstream HTTP 500; some other pack failures came from our validation code and needed separate fixes. The [provider-choice record](https://github.com/PHONIEXz/flow-point/blob/main/docs/model-choice.md) distinguishes those results. Earlier videos and timings below retain their original Google/Gemma context; replacement media is still queued.

## Why Does Open Innovation Matter?

Gemma's available weights give this project a path to other inference setups later. The current site offers Google-hosted Gemma and Groq-hosted GPT-OSS. Fresh generation needs an internet connection and sends consented notes to the selected provider. It does not run the model locally or promise zero inference cost. I chose hosted inference so someone can open the demo without downloading a model.

The application logic is open too. An organizer or developer can inspect the prompt, the model adapter, the validation rules and the approval checks. They can see which decisions come from the model and which come from code. That matters when a tool drafts real invitations and budgets: a smooth sentence is not proof that a date or price is correct.

Saved packs stay in this browser rather than on a server, but browser storage can be cleared. PDF and Markdown downloads provide a copy you can keep. The app has no accounts, email sending or calendar writes.

## The Lazy Payoff

One rough note produced four linked draft materials, and a follow-up answer updated the affected wording without retyping the whole pack. That removes a lot of copy-and-paste work. The operation timings show how quickly the drafts were returned in those tests. No manual-writing baseline duration is recorded here, so I am not claiming a percentage saving. Reading, correcting and exporting the pack also take time.

### Watch: the tools behind Flow Point (3:12)

See the roles of Render, hosted Gemma, the .tech domain, GitHub, Copilot Chat, Node.js and PDFKit, with the deployment, source and review evidence behind those contributions.

{% youtube p_Ob6AzwyVo %}

## Prize Categories

These are the challenge tools at the heart of Flow Point and the categories I am entering:

- **Gemma → Best Use of Gemma.** The open-weight `gemma-4-26b-a4b-it` model, accessed through Google's hosted Gemini API, reads the rough note and proposes structured event details, an invitation, run of show, checklist, budget entries and follow-up revisions. The [prompt and adapter](https://github.com/PHONIEXz/flow-point/blob/main/src/gemma.mjs) are public. Code and human review keep suggestions from becoming confirmed facts.
- **Render → Best Use of Render.** Render runs the [Node service](https://github.com/PHONIEXz/flow-point/blob/main/src/server.mjs) behind the public demo. It keeps both provider keys on the server, validates the selected model’s output, serves the workspace and produces PDF, Markdown and CSV downloads.
- **.tech domain → Best Use of a .tech Domain.** [flowpoint.phoenixreborn.tech](https://flowpoint.phoenixreborn.tech/workspace) is the public address for the live project, under the .tech domain claimed for this challenge.

- **GitHub Copilot → Best Use of GitHub Copilot.** I used Copilot Chat to inspect the PDF download changes in [pull request #1](https://github.com/PHONIEXz/flow-point/pull/1). It identified malformed Unicode handling and recommended independent checks for decoded browser filenames. I evaluated the findings, corrected its inaccurate HTTP-status claim, and added Unicode handling plus safe filename fallbacks. The [review record](https://github.com/PHONIEXz/flow-point/blob/main/docs/copilot-review.md) explains the fixes and the 38 passing automated tests at that review stage. Gemma remains available alongside GPT-OSS served by Groq.

The [MIT-licensed GitHub repository](https://github.com/PHONIEXz/flow-point) holds the application, tests, sample and verification notes. GitHub is how I share the work; the four entries above are the prize categories I am targeting.

Flow Point is built by Paul Ayoade David. I directed the project and used AI assistance for code and for a draft of this article. I checked the live workflow, failure path, exports and test results before this submission. Gemma is developed by Google and its model and hosted service terms apply separately from the app's MIT license.
