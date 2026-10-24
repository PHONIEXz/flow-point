# Chunk 3: compare and restore updates

24 October 2026. Implementation and verification record.

## Behavior

Each successful Update commits a complete new pack together with one previous-version snapshot. Facts, responsibilities/deadlines, budget quantities/prices/totals/allowance, open questions and full invitation/run-of-show text are available in Compare & restore. Later manual edits appear on the Current side. Exact normalized labels pair task/budget rows by occurrence; renamed rows appear removed/added rather than being guessed.

Questions missing from an AI update are carried forward. Reworded questions may appear separately. Only an explicit Resolved action records a human resolution; absence alone never gets a resolved label. The 50-question cap causes an actionable failure if preserving questions would exceed it.

Restore selects the previous notes, changes input, facts, drafts and generation receipts. The replaced current pack becomes the new previous version, allowing a switch back. Approval and source confirmations are cleared; unfinished generation checkpoints are not restored. Restoring uses server validation, without calling Google. An approval is never stored in the history snapshot. Explicit question-resolution records stay with their version, separately from approval. Original generation receipts describe original generation, not a new model run.

## Persistence and failure boundary

One nonrecursive previous-version snapshot per current/named pack, at most 240,000 characters, within the existing 1,500,000-character shared collection and 12-named-pack limits. Current and named pack copies can both consume space. Browser/site storage eviction or clearing removes this history; it is not cloud storage or a permanent audit log. Existing packs without a snapshot remain editable with no invented history. Invalid history can be discarded without discarding the current pack. Download a PDF or Markdown backup for longer retention.

Final Update and Restore persist the candidate before replacing the editable current state. A failed/cancelled update preserves the previous complete pack and history; checkpoints still follow the existing retry rules. Storage failures and newer writes from another tab prevent replacement and display a warning. Failed server validation on Restore also leaves the current version intact.

## Automated checks

98 tests pass, including six history cases and four UI regression cases (some cover multiple failure modes). Existing generation, source evidence, approval, export and persistence tests remain in the suite. New coverage includes facts/owners/quantities/full drafts, omitted versus resolved questions, unknown versus zero prices, renamed tasks, bounded nonrecursive history, named-pack isolation, restore/switch-back, source confirmation reset, question overflow, failed/cancelled updates, final-commit storage failure, restore network/quota failure and stale-tab writes. The HTTP test checks the new browser module route.

These checks use simulated model replies. Live UI observations are recorded after deployment; no physical-phone or independent model reliability result is implied. Chunk 1 provider/semantic limitations remain open.

The live regression uses [this fixed fictional brief and update](evidence/chunk-3-fixture-2026-10-24.json). Initial Gemma output left the venue null for an unconfirmed booking; the tester explicitly entered Maple Hall before Update while retaining the booking question. This is a disclosed manual correction, not a fully untouched model-output pass. A title-source confirmation was recorded before Update to test that restoring the snapshot does not reuse that confirmation.

## Live desktop regression

The first Prepare completed with server-reported step durations totaling 40.713 seconds. Its facts step required a fallback attempt. The first Update saved two stages, then failed on schedule with reference `7a4014b3-14c7-4cf5-af21-dfebf449b71d`: the initial response failed a content check and fallback requests returned HTTP 500. The prior pack, title confirmation and changes input remained intact. Retry reused two saved steps and completed the schedule in 51.410 seconds after another content retry; the final displayed 66.7 seconds sums accepted step durations across attempts, not elapsed browser time or organizer effort.

Comparison exposed the desired venue/owner/quantity/price changes and an undesired structured signer change to `A`. Source review marked that value unsupported; the tester corrected it to Amina Bello, Club Secretary. The updated run of show also contained extra invitation prose before the timed programme. This live model output is **not** a full content-quality pass. Two omitted questions stayed open; the tester explicitly resolved the superseded booking and supplied banner-price questions, leaving rehearsal time open.

Restore recovered Maple Hall, Ada Okafor, 20 notebooks, unknown banner price, USD 60 known subtotal/USD 140 provisional allowance, and both original draft strings exactly. The source confirmation count returned to zero and the final-review checkbox was unchecked. The updated version remained available for switching back. The named test pack and three earlier packs were retained. [Observed UI record](evidence/chunk-3-live-2026-10-24.json).

A final hardening pass rejects malformed snapshot structures without losing current work, retains explicit question-resolution records across switches, fixes singular change labels and hides model cancellation controls during Restore. Physical-phone verification remains in Chunk 5.

## Deployed release and final check

Initial implementation: `f15de6132582772ab2d71f74b21acbe80dc06005`, Render `dep-dbe7lf4s728c73b9shhg`. Final code: `bb2c5a77b51ad97f02cef48fac9488c4204b1dd6`, Render `dep-dbe7su3ncjis73db4bag`, live on 24 October at 10:47 WAT. The full suite passed 98 tests on this code.

On the final release, reloading preserved the saved snapshot and the source-confirmation reset. Switch-back recovered Maple Library Hall, the corrected full signer, updated draft text, and the single still-open rehearsal question. The restore button displayed Restoring while the server validated the candidate, with no model-cancellation controls. Explicit resolution-record retention is covered by the automated swap test; earlier implementation snapshots do not invent resolution records they never captured.

After the testing session resumed in a fresh browser context, Render first displayed its free-service wake-up page; one reload after wake-up loaded the app scripts. Browser-local test packs from the earlier automation context were not available in that fresh context. The live guide’s new comparison/restore instructions were rechecked. This does not establish cross-device persistence, uptime guarantees or physical-phone success.

The owner supplied an InstaDemo style reference during this chunk. The [replacement video brief](short-video-brief-2026-10-24.md) and Chunk 6 now call for three distinct clips, each below one minute, after the remaining fixes. Existing videos and embeds were retained.
