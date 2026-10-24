# Flow Point: project update chunks

Created 24 October 2026 from the [competitor review](competitor-review-2026-10-24.md). This is the active sequence for the next updates. Historical work and observations remain in [contest readiness](contest-readiness.md) and [verification](verification.md).

These are planned changes, not completed features or winning probabilities. Finish and verify each chunk; explicitly record any gate deferred by the owner. On 24 October the owner authorized starting Chunk 2 while Chunk 1’s provider-blocked live gate remains open. Keep Prepare, Update, review and exports usable throughout. At the start of Chunk 1, freeze the current fixtures and results before changing prompts or behavior; reserve fresh cases for Chunk 4.

## Delivered foundation

Three-stage generation, browser-local checkpoints, seven-minute model-step deadlines, generation receipts, a judge guide, and separate sample PDF/Markdown downloads are deployed. The latest automated suite has 133 passing tests. Provider quota and semantic omissions remain open; this does not mean the application is fully complete.

## Chunk 1: fix known content omissions

**Status:** implemented; final paired live verification blocked by provider 500/503. **Priority:** critical. **Lessons:** Second Look, TwoToe, SlothSpec.

**Goal:** a returned structure must not conceal missing essential content.

Deliverables:
- Check that confirmed start times appear in the invitation and that the run of show anchors its first activity correctly. Preserve supplied activity order and durations.
- Represent an explicitly supplied spending limit as structured data. Compute the remaining allowance from validated budget arithmetic. Distinguish unknown prices from zero and explain when only a provisional balance can be shown.
- Preserve named responsibilities and genuinely pending approvals through Update, including rehearsal time. Keep the existing human review boundary.
- Report detected omissions as actionable review issues, or reject/regenerate the affected model step within the existing retry limits. Never invent missing facts to satisfy a check.

**Completion checks:** replay the existing school brief and update; verify invitation/schedule times, NGN 200,000 limit, NGN 181,500 total, NGN 18,500 remaining allowance, Mr Samuel Eze and the pending rehearsal-time question. Also check a different event with different figures. Missing or unknown values remain unresolved. Record failures and inspect exported output. These existing examples are regression cases, not unseen evaluation.

## Chunk 2: show the source behind important facts

**Status:** implemented, deployed and verified on desktop. Physical-phone verification remains in Chunk 5. Chunk 1’s semantic/provider limitations are still open. **Lessons:** Availazy, Ditto, TwoToe, BioFlow, LazyShelf.

**Goal:** let the organizer check an extracted fact without searching the entire brief.

Deliverables:
- Show supporting source text beside date, venue, organizer, signatory, owner assignments, quantities, prices and spending limit.
- Verify that any model-proposed quote actually occurs in the corresponding original note or update. A matching quote is evidence to inspect, not proof of its interpretation.
- Clearly distinguish extracted/unreviewed, manually entered or confirmed, unsupported, and unknown values. Avoid invented confidence percentages.
- Invalidate stale evidence and approval when the relevant value or source changes. Older packs without source records remain editable and visibly need review; do not fabricate historical evidence.

**Completion checks:** a fake quote cannot receive a sourced label; an updated venue points to the new statement; an unsupported price remains unresolved; a manual correction does not inherit the old quote. Review remains usable on a narrow screen.

## Chunk 3: make updates easy to compare and undo

**Status:** complete for implementation and desktop verification. Deployed release `bb2c5a77b51ad97f02cef48fac9488c4204b1dd6`; live Prepare/Update, failure/resume, Restore and switch-back were checked. Physical-phone verification remains in Chunk 5. **Lessons:** Availazy, VOX, Dropzone Zero, Receipts.

**Goal:** make changes and omissions visible while protecting the previous complete pack.

Deliverables:
- Provide a before/after view for changed facts, responsibilities, budget lines and open questions, with access to the affected draft text.
- Make retained, resolved and newly introduced questions distinguishable. A missing question is not automatically a resolved question.
- Keep a bounded previous-version snapshot and a Restore previous version action, with clear browser-local storage limits.
- Restoring or editing requires fresh review. Preserve current cancellation, failed-update protection and stale-tab warnings.

**Completion checks:** a venue change and quantity increase are obvious; a rehearsal question survives unless answered; a failed or cancelled Update leaves the previous complete pack intact; Restore brings back the prior data and wording without reusing its approval. Storage failure is reported without silently erasing work.

## Individual document PDFs

Owner-requested addition before Chunk 4: each Invitation, Run of show, Preparation checklist and Budget has a standalone PDF download, with event-title/document-name filenames and a unique suffix. Full-pack downloads remain available. See [verification](individual-pdfs-2026-10-24.md).

## Chunk 4: evaluate quality on a frozen set

**Status:** verification open. Frozen v4 recorded 24 planned operations: 22 attempted, 20 complete, two failed and two skipped; 13 complete operations passed all declared checks. Targeted v5 completed ten of eleven operations, six passing all declared checks; its final Update hit Groq daily quota. Five post-fix v6 operations are frozen but unexecuted. All 133 software tests pass. See [current results, corrections and pending gate](chunk-4-current-run.md). **Lessons:** Recall Sloth, Ditto, Leave It, SlothSpec, Night Guard.

**Goal:** measure the quality of the returned pack separately from valid JSON and response speed.

Deliverables:
- Prepare a small fixed set, approximately 8–12 varied fictional event briefs with paired updates and expected facts. Include school, church and community events, missing prices, ambiguous dates, changed owners, exact durations, pending approvals and untrusted quoted instructions.
- Keep current tuning/regression cases separate from fresh unseen cases. Freeze expected answers before generating the evaluation outputs; document who wrote and reviewed them.
- Score correct, missing, invented and silently wrong facts; retained questions; draft consistency; and approval behavior. Record provider failures separately without excluding them from operation totals.
- Compare useful outputs with a simple manual/template baseline where meaningful. Preserve raw accepted results and failed attempts; use a new unseen set after tuning on an exposed set.

**Completion checks:** a reproducible command produces a dated scorecard with denominators, request references, failures and limitations. Do not call post-hoc fixes independent evaluation or infer an overall reliability percentage from a few cases.

## Chunk 5: measure the organizer's actual effort

**Status:** queued after Chunk 4. **Lessons:** Availazy, Second Look, Mimu, Recall Sloth.

**Goal:** understand whether reviewing and correcting the pack is easier than doing the work manually.

Deliverables:
- Use the existing [evaluation pilot](evaluation.md) to record generation wait, reading/review time, corrections and export effort separately.
- Exercise the complete flow on desktop and a real phone, including file opening, readable source text, update comparison and restoration.
- If a manual-writing comparison is actually timed, record task equivalence, participant identity and learning/order effects. If it is not measured, keep the result explicitly unmeasured.
- Address observed usability problems rather than adding decorative features.

**Completion checks:** publish actual observed effort and device results with remaining gaps. No invented hours saved, presumed mobile success or unmeasured percentage savings. Physical-device or human timing evidence may require the owner's participation; that work is not being requested in this planning step.

## Chunk 6: package the evidence for judges

**Status:** queued after the relevant gates above. **Lessons:** VOX, Second Look, Receipts, BioFlow, Leave It.

**Goal:** make the project's value and evidence easy to inspect in a short visit.

Deliverables:
- Update the judge guide around one complete representative brief, update, review and PDF export. Keep exact inputs and expected checks accessible.
- If adding a recorded replay, capture an actual model run, label it recorded, and disclose corrections. Keep it separate from the hand-authored sample and fresh live inference. Do not present the current captured flawed update as a passing demonstration.
- Refresh affected screenshots, video sections/captions, README and submission draft to reflect the final behavior. Publishing external article changes is a separate action from saving its source.
- Owner update on 24 October: after the remaining chunks and fixes, replace the three earlier long videos with three distinct videos **each less than one minute**. Use the supplied [31.816-second InstaDemo reference](https://instademo.app/share/49d92bf1-436b-47fd-b3b3-20933138a9f2) for its introduction, staged reveals and moving website framing. Follow the [short-video brief](short-video-brief-2026-10-24.md). Keep background music, visible cursor interaction, readable close-ups and actual tool evidence. Keep the current videos available until replacements are ready; no uploads or embeds were removed in this step.
- Explain the actual jobs of Gemma, Render, .tech and Copilot, and the current hosted-processing boundary. Link the evaluation, failures, exports and source.

**Completion checks:** someone can follow the evidence path without accounts, API keys or guessing which result a screenshot represents. Claims match dated artifacts and known limitations. Verify the deployed release and downloads; distinguish repository updates from published article updates.

## Deferred scope

Voice capture, mascots, additional sponsor integrations, accounts, collaboration and a tested local-inference adapter are future options. Revisit them after the core gates, not as substitutes for correctness or evidence. Do not promise offline generation or local-model performance on the owner's current laptop.

## Tracking rule

Each chunk moves through **Queued → Implementing → Verification → Complete**, with its code commit, deployed release where applicable, observed result and remaining limits recorded. A blocked provider request or unperformed manual check is not a passed gate. Chunk 1’s deferred live gate remains open. Chunks 2 and 3 were separately authorized and implemented. Chunk 4 is in verification. Chunk 1’s detailed school Update lost its confirmed start in v5; its correction passes software tests but the live retest remains quota-blocked. Chunk 5 has not started.
