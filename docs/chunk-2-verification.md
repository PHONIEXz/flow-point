# Chunk 2: source-linked fact review

Started 24 October 2026. The owner explicitly authorized moving to Chunk 2 while Chunk 1's large-school live Update remains blocked by provider HTTP 500/503. That gate is still open.

## Behavior

New staged fact generation requests short exact source quotes for event title, date, start time, venue, organizer, signatory, currency, spending limit, task owners/due dates and budget quantities/prices. The server binds a quote only when it occurs in the actual original request or latest update. Unknowns remain unknown. Duplicate, invented or mismatched quotes do not receive a quote-found state.

Each relevant input has a Source disclosure. It distinguishes quote found but unreviewed, manually entered, unsupported, unknown, older pack without history, and confirmed by the user. Quotes are not semantic proof or machine confidence scores. The organizer may confirm a fact after checking it, or explicitly confirm all known facts after reviewing the cards across Details, Checklist and Budget. Unsupported or manually changed values require confirmation before final approval; unknown prices and other existing review issues remain unresolved.

Editing a fact invalidates its source link and confirmation. Row labels and currency are part of the binding so a changed duty/item/currency cannot inherit stale evidence. Editing original notes marks their quotes and manual confirmations stale. Saved source text is bound to its content hash; changing it without a matching source identity invalidates the link. Final approval fingerprints include evidence and review state.

Historical update quotes are carried only for unchanged values and row context. Saved history is bounded to eight source documents / 24,000 characters. Pruned evidence becomes unsupported. This is browser-local, self-reported organizer review, not a tamper-proof audit trail or authenticated third-party attestation. Older packs remain editable and receive no invented historical quotes.

Source records are stripped from the next provider prompt; it receives the original request, current update and plan facts as before. The JSON request limit is raised from 100,000 to 300,000 bytes to accommodate bounded source records, including a previous plan and a generation checkpoint. The original per-field limits, concurrency/rate limits, three-attempt ceiling, seven-minute per-step deadline, cancellation and old-pack protection remain.

PDF/Markdown exports retain review status and outstanding source-review issues. Source cards and complete raw source history are inspected in the workspace; the exports are not a new full evidence dossier.

## Automated verification

87 tests pass. New cases cover invented/altered quotes, latest-update venue evidence, unchanged historical prices, manual corrections, changed row context/currency, unsupported prices, persistent unknowns, source mutation, invalidated approval, old-pack migration, JSON save/restore, bounded history, metadata exclusion from provider prompts, and source preservation through draft stages. Direct model-supplied source metadata is ignored; server-bound quote records are authoritative for generated packs.

## Deployment and live checks

Pending. Automated provider simulations do not prove live citation coverage or semantic accuracy. Record actual browser/API observations here, including failures, before marking this chunk complete.
