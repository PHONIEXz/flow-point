# Chunk 4: current Groq evaluation

A new v3 corpus contains twelve paired fictional cases: ten exposed regression briefs plus two newly authored briefs run before first model inference on those briefs. The same assistant authored expectations; no independent reviewer or blinded evaluation is claimed. The answer key, scorer and implementation hashes are frozen before inference. v1/v2 evidence remains unchanged.

Preflight inspection reproduced a validator error on a previously exposed church assignment: Nora Cole now leads the choir instead of Musa Bello still demanded Musa Bello. Explicit now-leads and replaces-as assignments now supersede the old owner. The new regression also verifies rejection of the stale owner. All 121 software tests pass. Browser checkpoint contract version 10 prevents old saved partial responses bypassing the correction.

The school proposed venue answer-key ambiguity is adjudicated before this run: a null structured venue is acceptable while its confirmation is pending. When the structured venue is null, draft venue repetition is not required; the specific outstanding venue question is still checked. Other expected locations must still match. This change applies only to v3, not a retroactive rewrite of old scores.

The runner uses the live Groq configuration and sends a processor binding. It records every generation step, the raw model result, app-preserved questions, deterministic review, approval blocking and all four standalone PDF protocol probes. A filled worksheet baseline comes from expected answers; it is not a human timing or independent extraction baseline. The client spaces operations, keeps 6/30 service calls per ten-minute bucket for the owner and stops further inference on quota. A lock prevents overlapping evaluation processes. Model failures, skips, literal mismatches and semantic adjudication remain visible. New software fixes after a run require a new recorded revision/retest, without overwriting first attempts.

Completion requires the scorecard and per-case findings, fixes/retests for substantive defects, preserved raw records and explicit limits. Chunk 5 human effort and physical-device checks are separate.
