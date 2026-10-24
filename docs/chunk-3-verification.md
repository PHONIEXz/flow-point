# Chunk 3: compare and restore updates

24 October 2026. Implementation and verification record.

## Behavior

Each successful Update commits a complete new pack together with one previous-version snapshot. Facts, responsibilities/deadlines, budget quantities/prices/totals/allowance, open questions and full invitation/run-of-show text are available in Compare & restore. Later manual edits appear on the Current side. Exact normalized labels pair task/budget rows by occurrence; renamed rows appear removed/added rather than being guessed.

Questions missing from an AI update are carried forward. Reworded questions may appear separately. Only an explicit Resolved action records a human resolution; absence alone never gets a resolved label. The 50-question cap causes an actionable failure if preserving questions would exceed it.

Restore selects the previous notes, changes input, facts, drafts and generation receipts. The replaced current pack becomes the new previous version, allowing a switch back. Approval and source confirmations are cleared; unfinished generation checkpoints are not restored. Restoring uses server validation, without calling Google. An approval is never stored in the history snapshot. Original generation receipts describe original generation, not a new model run.

## Persistence and failure boundary

One nonrecursive previous-version snapshot per current/named pack, at most 240,000 characters, within the existing 1,500,000-character shared collection and 12-named-pack limits. Current and named pack copies can both consume space. Browser/site storage eviction or clearing removes this history; it is not cloud storage or a permanent audit log. Existing packs without a snapshot remain editable with no invented history. Invalid history can be discarded without discarding the current pack. Download a PDF or Markdown backup for longer retention.

Final Update and Restore persist the candidate before replacing the editable current state. A failed/cancelled update preserves the previous complete pack and history; checkpoints still follow the existing retry rules. Storage failures and newer writes from another tab prevent replacement and display a warning. Failed server validation on Restore also leaves the current version intact.

## Automated checks

98 tests pass, including six history cases and four UI regression cases (some cover multiple failure modes). Existing generation, source evidence, approval, export and persistence tests remain in the suite. New coverage includes facts/owners/quantities/full drafts, omitted versus resolved questions, unknown versus zero prices, renamed tasks, bounded nonrecursive history, named-pack isolation, restore/switch-back, source confirmation reset, question overflow, failed/cancelled updates, final-commit storage failure, restore network/quota failure and stale-tab writes. The HTTP test checks the new browser module route.

These checks use simulated model replies. Live UI observations are recorded after deployment; no physical-phone or independent model reliability result is implied. Chunk 1 provider/semantic limitations remain open.
