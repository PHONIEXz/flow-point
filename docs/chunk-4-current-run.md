# Chunk 4: quality evaluation status, 24 October 2026

**Current letter-template release:** `f6b6a2f5bf1d3bba98e18451b911db1b36b39f5f`, with 139 passing software tests and local PDF visual checks. The [v7 attempt](evidence/quality-v7-2026-10-24/README.md) superseded unexecuted v6. On retry, its school facts step succeeded, but invitation hit Groq daily quota: one attempted, zero complete, one failed, four skipped. Five complete-operation checks remain outstanding. v7 includes the browser’s deterministic letter formatter before application scoring/export; that point was not reached.

**Status: provider-limit handling verified; successful-generation retests deferred by the owner on 25 October.** The model selector and post-run fixes are implemented, but the last live operation exhausted Groq daily quota. No further inference was attempted. Proceeding to presentation does not turn blocked/skipped generation checks into passes. Raw outcomes remain unchanged.

| Run | Planned operations | Attempted | Completed | Failed | Skipped | Completed operations passing all declared checks |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Frozen v4 | 24 | 22 | 20 | 2 | 2 | 13 |
| Exposed post-fix v5 | 11 | 11 | 10 | 1 | 0 | 6 |
| Superseded v6 | 5 | 0 | 0 | 0 | 0 | Not run |
| Quota-blocked v7 | 5 | 1 | 0 | 1 | 4 | 0 |

v4 contains eleven exposed briefs and one brief not previously executed, Willow, which ran first. Both Willow operations passed all 54 declared checks combined. Cases and answer keys were assistant-authored; there was no independent reviewer. This is not an estimate of general reliability. v5 is deliberately a targeted regression run, not a new unseen evaluation.

All 20 completed v4 packs and all ten completed v5 packs passed application approval-blocking and standalone PDF response probes. Those checks did not prove semantic correctness or PDF visual layout. v4 retained seven completed operations with literal mismatches. See the original scorecards and compressed full records in [v4](evidence/quality-v4-2026-10-24/README.md) and [v5](evidence/quality-v5-2026-10-24/README.md). Earlier v1/v2/v3 failures remain historical evidence.

## Corrections and results

The first post-v4 build corrected false budget-item identity checks for copies/bottles/packages; accepted unknown-price items receive deterministic missing-price questions without invented costs; explicit hosts must remain checklist owners; comma-style unknown-price items and requested rehearsal tasks are checked; and requested venue versus booking approval is clarified. The Groq/Google model selector uses separate keys, consent and checkpoint identities. All 130 software tests passed on that deployed build.

v5 then completed the detailed school Prepare with all 44 declared checks, community Prepare with 28, debate Prepare/Update with 29/28, judge Prepare with 28 and older community Prepare with 29. Its other completed operations exposed a missing school start time, a request verb copied into the Riverside title and the proposed Oak Hall name being erased. The final community Update returned accepted facts, then hit Groq daily quota at invitation. The run stopped; it was not silently retried with another key, model or provider.

Code `0bba82442b9a48874534a828914fbd5bd9edd35f` adds conservative checks rejecting loss of an explicit programme start or a single supplied requested location, clarifies the schema/prompt for title/start/venue, and increments the browser checkpoint contract to v12. It also makes the legacy benchmark explicitly provider-aware. All **133 software tests** pass, including the captured missing-start failure, bounded regeneration and previous-pack preservation. Those software checks do not substitute for the pending live retests.

## Pending gate

[v7 stopped on daily quota](evidence/quality-v7-2026-10-24/README.md): detailed school Update, Riverside Prepare/Update, ambiguous-date Oak Prepare and the quota-blocked community Update. Successful v5 school/community Prepare baselines are embedded and hash-protected, avoiding redundant initial generations. Once provider capacity is available, use a new documented output/run revision on the matching source. The default v7 directory now contains preserved failures/skips and must not be overwritten. Preserve every outcome. Do not claim corrected live behavior until it is observed.

Separately, a selected Google Gemma request still returned upstream HTTP 500, reference `8e4fcf2f-4029-406e-a233-e5ee78105901`; [record and model-choice rationale](model-choice.md). This is distinct from Groq daily quota and the application/model omissions above. Neither provider is described as universally reliable. Real-phone usability was subsequently reported healthy by the owner. Human review effort and a timed manual-writing baseline remain unmeasured.

## Earlier preflight and v3 history


A new v3 corpus contains twelve paired fictional cases: ten exposed regression briefs plus two newly authored briefs run before first model inference on those briefs. The same assistant authored expectations; no independent reviewer or blinded evaluation is claimed. The answer key, scorer and implementation hashes are frozen before inference. v1/v2 evidence remains unchanged.

Preflight inspection reproduced a validator error on a previously exposed church assignment: Nora Cole now leads the choir instead of Musa Bello still demanded Musa Bello. Explicit now-leads and replaces-as assignments now supersede the old owner. The new regression also verifies rejection of the stale owner. All 121 software tests pass. Browser checkpoint contract version 10 prevents old saved partial responses bypassing the correction.

The school proposed venue answer-key ambiguity is adjudicated before this run: a null structured venue is acceptable while its confirmation is pending. When the structured venue is null, draft venue repetition is not required; the specific outstanding venue question is still checked. Other expected locations must still match. This change applies only to v3, not a retroactive rewrite of old scores.

The runner uses the live Groq configuration and sends a processor binding. It records every generation step, the raw model result, app-preserved questions, deterministic review, approval blocking and all four standalone PDF protocol probes. A filled worksheet baseline comes from expected answers; it is not a human timing or independent extraction baseline. The client spaces operations, keeps 6/30 service calls per ten-minute bucket for the owner and stops further inference on quota. A lock prevents overlapping evaluation processes. Model failures, skips, literal mismatches and semantic adjudication remain visible. New software fixes after a run require a new recorded revision/retest, without overwriting first attempts.

Completion requires the scorecard and per-case findings, fixes/retests for substantive defects, preserved raw records and explicit limits. Chunk 5 human effort and physical-device checks are separate.

## v3 interruption and throttle fix

The first v3 Prepare received usable facts after two provider attempts and a usable invitation, then its schedule received HTTP 429. The unclassified quota response stopped the runner: 1 attempted, 0 complete, 1 failed, 23 skipped. This is preserved, not counted as a pass or silently retried in place.

The Groq adapter now reads only known quota-window wording and a numeric Retry-After header (or a strictly parsed seconds hint). A provider-confirmed minute throttle with a wait up to 90 seconds can wait and retry within the existing three-attempt/shared-seven-minute cap. Daily and unknown quota errors never retry. Cancellation remains effective while waiting. Only sanitized category/delay fields reach logs and API errors, never the upstream message. 122 software tests pass.

A separate v4 freeze uses the same expectations and school adjudication. Seabreeze is now exposed; Willow has not yet had model inference. v4 spaces stages and operations, records minute-throttle failures without abandoning every later case, and still stops on daily/unknown quota. The original v3 records remain available in the archived raw evidence.

Independent Chunk 5 desktop checks have started at the owner’s request while this provider gate remains open. This does not waive or complete Chunk 4. See [Chunk 5 verification](chunk-5-verification.md).
