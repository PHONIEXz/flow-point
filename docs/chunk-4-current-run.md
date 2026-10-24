# Chunk 4: current Groq evaluation

A new v3 corpus contains twelve paired fictional cases: ten exposed regression briefs plus two newly authored briefs run before first model inference on those briefs. The same assistant authored expectations; no independent reviewer or blinded evaluation is claimed. The answer key, scorer and implementation hashes are frozen before inference. v1/v2 evidence remains unchanged.

Preflight inspection reproduced a validator error on a previously exposed church assignment: Nora Cole now leads the choir instead of Musa Bello still demanded Musa Bello. Explicit now-leads and replaces-as assignments now supersede the old owner. The new regression also verifies rejection of the stale owner. All 121 software tests pass. Browser checkpoint contract version 10 prevents old saved partial responses bypassing the correction.

The school proposed venue answer-key ambiguity is adjudicated before this run: a null structured venue is acceptable while its confirmation is pending. When the structured venue is null, draft venue repetition is not required; the specific outstanding venue question is still checked. Other expected locations must still match. This change applies only to v3, not a retroactive rewrite of old scores.

The runner uses the live Groq configuration and sends a processor binding. It records every generation step, the raw model result, app-preserved questions, deterministic review, approval blocking and all four standalone PDF protocol probes. A filled worksheet baseline comes from expected answers; it is not a human timing or independent extraction baseline. The client spaces operations, keeps 6/30 service calls per ten-minute bucket for the owner and stops further inference on quota. A lock prevents overlapping evaluation processes. Model failures, skips, literal mismatches and semantic adjudication remain visible. New software fixes after a run require a new recorded revision/retest, without overwriting first attempts.

Completion requires the scorecard and per-case findings, fixes/retests for substantive defects, preserved raw records and explicit limits. Chunk 5 human effort and physical-device checks are separate.

## v3 interruption and throttle fix

The first v3 Prepare received usable facts after two provider attempts and a usable invitation, then its schedule received HTTP 429. The unclassified quota response stopped the runner: 1 attempted, 0 complete, 1 failed, 23 skipped. This is preserved, not counted as a pass or silently retried in place.

The Groq adapter now reads only known quota-window wording and a numeric Retry-After header (or a strictly parsed seconds hint). A provider-confirmed minute throttle with a wait up to 90 seconds can wait and retry within the existing three-attempt/shared-seven-minute cap. Daily and unknown quota errors never retry. Cancellation remains effective while waiting. Only sanitized category/delay fields reach logs and API errors, never the upstream message. 122 software tests pass.

A separate v4 freeze uses the same expectations and school adjudication. Seabreeze is now exposed; Willow has not yet had model inference. v4 spaces stages and operations, records minute-throttle failures without abandoning every later case, and still stops on daily/unknown quota. The original v3 records remain available in the archived raw evidence.
