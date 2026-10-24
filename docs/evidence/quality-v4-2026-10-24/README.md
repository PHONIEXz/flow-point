# Completed v4 evaluation evidence

This archive contains all 24 planned operation records: 22 attempted, 20 completed, two failed Prepare calls and two dependent Updates skipped. Thirteen completed operations passed every declared check. All 20 completed operations passed the application review/export probes; this did not imply every extracted fact was correct. See scorecard.md for the retained failures.

The frozen implementation was df2dda7f798c443bc1d24f100d2909e0141eecd5. Cases, expectations and implementation hashes were committed before inference. Eleven briefs were previously exposed; Willow was run first before prior inference. Cases and answer keys were assistant-authored, with no independent reviewer. No general reliability or human time-saving claim follows from this corpus.

The run was interrupted during a user pause and resumed after confirming no evaluator process remained. Completed records were reused, including failures and skips. An unfinished church Update was resumed without a recorded completed stage. A config-only startup timed out before inference, followed by a successful health/config check and resume. Summary start time reflects the final resumed process; each operation retains its own timestamps. Wall times include pacing and are not a human timing comparison. JSON files contain accepted, application-processed API outputs and receipts, not rejected internal retry outputs. PDF metadata validates response protocol/hash, not visual layout. Locks are excluded from this archive.

Application and prompt corrections plus separately recorded targeted retests follow this frozen run. The original scores are not rewritten to hide failures. Requested/proposed venue semantics are clarified separately in docs/model-choice.md.
