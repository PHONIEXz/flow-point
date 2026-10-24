# Chunk 2: source-linked fact review

Started 24 October 2026. The owner explicitly authorized moving to Chunk 2 while Chunk 1's large-school live Update remains blocked by provider HTTP 500/503. That gate is still open.

## Behavior

New staged fact generation requests short exact source quotes for event title, date, start time, venue, organizer, signatory, currency, spending limit, task owners/due dates and budget quantities/prices. The server binds a quote only when it occurs in the actual original request or latest update. Name, place, title and currency text must also contain the complete displayed token sequence. This lexical check is narrower than semantic validation. If an existing quote describes an old place, the server can locate the full new place name in an actual saved update and display that surrounding statement as unreviewed evidence. It never recovers an invented model quote this way. Unknowns remain unknown. Duplicate, invented or mismatched quotes do not receive a quote-found state.

Each relevant input has a Source disclosure. It distinguishes quote found but unreviewed, manually entered, unsupported, unknown, older pack without history, and confirmed by the user. Quotes are not semantic proof or machine confidence scores. The organizer may confirm a fact after checking it, or explicitly confirm all known facts after reviewing the cards across Details, Checklist and Budget. Unsupported or manually changed values require confirmation before final approval; unknown prices and other existing review issues remain unresolved.

Editing a fact invalidates its source link and confirmation. Row labels and currency are part of the binding so a changed duty/item/currency cannot inherit stale evidence. Editing original notes marks their quotes and manual confirmations stale. Saved source text is bound to its content hash; changing it without a matching source identity invalidates the link. Final approval fingerprints include evidence and review state.

Historical update quotes are carried only for unchanged values and row context. Saved history is bounded to eight source documents / 24,000 characters. Pruned evidence becomes unsupported. This is browser-local, self-reported organizer review, not a tamper-proof audit trail or authenticated third-party attestation. Older packs remain editable and receive no invented historical quotes.

Source records are stripped from the next provider prompt; it receives the original request, current update and plan facts as before. The JSON request limit is raised from 100,000 to 300,000 bytes to accommodate bounded source records, including a previous plan and a generation checkpoint. The original per-field limits, concurrency/rate limits, three-attempt ceiling, seven-minute per-step deadline, cancellation and old-pack protection remain.

PDF/Markdown exports retain review status and outstanding source-review issues. Source cards and complete raw source history are inspected in the workspace; the exports are not a new full evidence dossier.

## Automated verification

88 tests pass. New cases cover invented/altered quotes, latest-update venue evidence, unchanged historical prices, manual corrections, changed row context/currency, unsupported prices, persistent unknowns, source mutation, invalidated approval, old-pack migration, JSON save/restore, bounded history, metadata exclusion from provider prompts, and source preservation through draft stages. Direct model-supplied source metadata is ignored; server-bound quote records are authoritative for generated packs.

## Deployment and live checks

Release `580e6abbb4bf7e8905df1b0c8fd95183c3a71ea2` became live in deployment `dep-dbe6lj1srm7s73b39sm0`. The exposed fictional source fixture completed Prepare in 15.996 seconds of summed server generation time and Update in 16.353 seconds. These are server-operation times, not human effort or browser wall-time measurements. All six model calls used one attempt. Exact request references and observations are in `docs/evidence/chunk-2-source-live-2026-10-24.json`.

Initial known subtotal USD 60, provisional allowance USD 140, unknown banner price, quote disclosures and an explicit organizer confirmation were observed in the live browser. The earlier saved community pack showed no invented historical sources and was saved under a name before starting this case.

The Update returned the new venue, but paired it with an old venue quote and shortened the signer to A while quoting the correct full name. It also retained an answered banner question and omitted the named checklist duty. This is not an overall content pass. The lexical source guard and latest-update literal recovery were added from these observations. General semantic completeness remains the recorded Chunk 1 issue; source labels do not hide it.

Final corrective deployment, manual-edit/source invalidation, saved-state reload and narrow-layout observations remain to be recorded. Automated provider simulations do not establish live semantic accuracy.
