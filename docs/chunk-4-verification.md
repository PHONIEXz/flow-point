> Historical v1 record. For current v4/v5 results, the daily-quota block and five unexecuted v6 retests, see [current Chunk 4 status](chunk-4-current-run.md). The live quality gate remains open; 133 software tests pass on the latest correction build.

# Chunk 4: frozen quality evaluation v1

24 October 2026. **Status: harness implemented; live evaluation interrupted by provider quota. The live quality gate is open.**

## Frozen before inference

Commit `992fd0333d90180708148d2df4702317a83c24b3` records ten paired briefs/updates and the scorer before any new evaluation requests. Four cases are exposed regressions; six were fresh before first inference, covering school/church/community work, ambiguous dates, changed owners, unknown prices, explicit zero donations, overspending and untrusted quoted instructions. The assistant wrote and arithmetic-checked expectations. There is no independent human or blinded adjudication. The app under test was `a6cd07addb03bf060701bbbe21e8015f8c1c3d87`. [Hashes and frozen time](../evaluation/freeze-v1.json), [cases](../evaluation/cases-v1.json), [method and limitations](../evaluation/README.md).

The CLI writes original stage replies, request references, failures, generated plans, application-applied question preservation, declared-check outcomes and separate PDF/approval behavior. It also saves filled template worksheets from the answer key. Those worksheets assume the facts were already entered correctly; they are not note extractors or a timed human baseline. Finished records are not silently retried. No prompts, scorer or answer keys changed during the run.

## Observed operations

| Cohort | Planned | Attempted | Returned complete pack | Failed | Skipped |
| --- | ---: | ---: | ---: | ---: | ---: |
| Exposed regressions | 8 | 3 | 1 | 2 | 5 |
| Fresh before first inference | 12 | 0 | 0 | 0 | 12 |
| Total | 20 | 3 | 1 | 2 | 17 |

The judge Prepare saved facts and invitation replies, then its schedule step exhausted attempts with provider HTTP 500. Reference `3a3b0725-2371-4934-8814-3b9f7e2fc6db`. Its Update was skipped because there was no complete initial pack.

The detailed-school Prepare completed. All four individual PDF endpoints returned PDF responses, and approval remained blocked with outstanding review issues. Its Update received model quota HTTP 429 at facts, reference `6c4d745c-68c5-4d03-9ee9-9ed701fdf958`. The runner stopped rather than probing other models/keys or continuing inference. All remaining planned operations remain visible as skipped. No fresh case was evaluated.

For the one completed pack, 39 declared literal checks matched and one venue-field check did not. These are a small set of checks on one exposed initial pack, not an overall accuracy or reliability estimate. Operation wall time includes review and export probes; per-stage/model timings are recorded separately. Neither measures human review effort. [Scorecard](evidence/quality-v1-2026-10-24/scorecard.md) and [raw summary](evidence/quality-v1-2026-10-24/summary.json).

## Post-run qualitative inspection, outside the frozen score

The returned school invitation and relative schedule correctly kept the start time unapproved, described the Main Assembly Hall as proposed, retained the named signer and activity durations, and kept unknown costs and the first-aid/rehearsal questions visible. The schedule’s relative intervals covered 180 minutes.

The sole literal mismatch was `venue: null` versus the answer key’s proposed Main Assembly Hall. Because the venue was explicitly unconfirmed, null can be reasonable abstention for a final/confirmed venue field. The application has no separate proposed-venue/status field. This is an answer-key/product-semantics limitation requiring adjudication, not proof of an invented venue or a reason to force unconfirmed facts into a confirmed slot. The frozen result was retained, not regraded after seeing the reply.

The generated checklist contained six mostly named duties, but omitted explicitly requested after-event cleanup, returning borrowed equipment, reconciling spending and recording feedback. This is a substantive coverage gap. Those tasks were not included in the declared v1 metric, so the 39 matching checks do not imply checklist completeness. Add coverage checks and retest on a new frozen set after any prompt/validator tuning. Do not rename a tuned rerun independent evaluation.

## Remaining work

Provider access must become available before the remaining fresh cases and paired updates can be exercised. Preserve this interrupted run. A separate output directory records a later run without overwriting it. If the app/scorer changes, create a new freeze/version and reserve new unseen cases for verification. Manual drafting/review/export effort and real-phone checks remain Chunk 5, not inferred here.

The automated suite has 104 passing tests: 100 application/export tests and four evaluator checks. Those are software checks with simulated provider responses, distinct from this live inference record.
