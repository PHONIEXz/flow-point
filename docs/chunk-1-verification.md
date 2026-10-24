# Chunk 1 verification: content omissions

24 October 2026. This is an exposed regression exercise, not independent evaluation or a reliability percentage.

## Frozen baseline

`docs/evidence/chunk-1-baseline-2026-10-24.json` records the pre-change code release and SHA-256 hashes of the school fixture, captured update and paced results. Those files remain unchanged. Baseline: the updated invitation omitted 10:00; the run of show lacked its programme anchor; spending limit and remaining allowance were absent. Named first-aid responsibility and the pending rehearsal question were present in that captured baseline.

## Implementation

- Structured nullable `spendingLimitMinor`, validated as a nonnegative safe integer. Old packs default to unknown, without inventing a historical limit. Changing the limit invalidates approval.
- Calculate allowance from validated costs, separately from model prose. Label balances provisional when prices are unknown; flag known overspend. Unknown prices remain distinct from zero. Display and edit the limit in Budget; include limit/allowance in PDF and Markdown.
- Check invitation start time and the first non-registration programme row. A standalone start-time heading does not count as an activity anchor. Adjacent timed activities are checked against their stated minute durations. Missing time regenerates only the affected stage within the existing three attempts/seven-minute deadline; exhaustion preserves the current complete pack.
- Conservative source checks reject demonstrable factor-of-100 currency discrepancies, omitted explicit named duties, a dated rehearsal absent from tasks, and an explicitly pending rehearsal-time question absent from questions. Recheck checkpoint facts before later drafts. New generation-key version invalidates earlier saved prefixes.

These checks cover specific explicit English patterns. They are not general language understanding, provenance verification or a guarantee that an amount is associated with the correct item. Unsupported statement forms still need human review. Checks never insert people, prices, dates or confirmations. Source-linked evidence remains Chunk 2.

## Tests and observed failures

79 automated tests pass. Added checks exercise the actual captured time failure, allowance arithmetic, unknown/zero/overspend and invalid limits, a different afternoon community event, bounded draft retry, immutable checkpoint facts and source-omission recovery.

The first live replay on commit `311f382c3eee1ad9b30344ff841555b55ce6e187` produced a correct initial pack, then an updated pack with a currency scale error (banner 8,500 kobo instead of 850,000), missing first-aid checklist assignment and missing rehearsal due date. The pending rehearsal question remained. The invitation time checker caught an omission and regenerated that stage on the alternate model. This replay failed content checks and is preserved, not replaced by a passing label:

- `docs/evidence/chunk-1-school-live-2026-10-24.json`
- `docs/evidence/chunk-1-first-update-failed-2026-10-24.json`

The subsequent source checks reject all three observed defects in that output. Code release for final replay: `dcd1c71bf90dfa27fbf91b970d07df80a6871ce8`. Render deployment: `dep-dbe6291srm7s73b0stq0`.

## Final live and export checks

The stricter release prepared the school brief in 73.375 seconds, passing the recorded checks. Its Update exhausted the bounded attempts with provider HTTP 500; one separately recorded Update-only retry returned provider HTTP 503. These are failures, not content passes. The initial accepted output and both reports are retained in `docs/evidence/chunk-1-school-prepare-final-2026-10-24.json`, `chunk-1-school-final-2026-10-24.json` and `chunk-1-school-update-retry-2026-10-24.json`. Do not mark the complete Prepare/Update gate passed. A smaller community Prepare/Update completed but inspection caught a closing time five minutes early, leading to the adjacent-activity arithmetic guard. Its observed budget, owners and pending question were correct; it is not recorded as an overall content pass. A separate interface organization update was requested during this verification and does not change that result. The community fixture was written after the initial prompt changes and is also an exposed regression, not unseen evidence. Deliberate 60-second gaps between Prepare and Update are recorded and excluded from per-operation wall times; provider retries are included.
