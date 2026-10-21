# MVP specification

## User and outcome

An organizer at a school, church or small community group has a rough request and needs usable event preparation materials. The first benchmark is a school family event. Support general event text without adding specialized event types before the core flow works.

## Workflow

Capture request -> Extract structured plan -> Resolve questions -> Draft artifacts -> Review -> Approve -> Export.

Keep the original request visible. Show supplied facts separately from proposals. Missing facts must stay unknown. For ambiguous dates, ask the organizer instead of silently choosing. Confirm a date/day conflict explicitly. Suggested budget prices must not be presented as supplied or verified prices.

## Interface

Use a readable, mobile-friendly workspace with a calm cream background, dark ink, purple accents and generous spacing. The primary action is preparing the event pack. Show progress through concrete stages, clear failures, retry and cancel. Place the original request beside the pack on large screens and above it on phones. Offer a sample request clearly labelled as sample data.

## Core contract

`src/plan.mjs` normalizes title, eventDate, requestedWeekday, venue, currency, tasks, budget, drafts and openQuestions. Money uses integer minor units, not floating-point prices. Model output must pass validation before rendering/export. Known budget subtotal is distinguished from a complete total.

Approval is a product review state, not an authentication or authorization mechanism. A content fingerprint invalidates a previous review after any normalized field changes. The web layer must also handle unresolved factual questions and never imply external actions have happened.

## Next implementation

1. Scaffold eve using its installed documentation and confirm Render compatibility.
2. Add server-only hosted Gemma inference with strict output validation, request size limits, timeout and clear quota errors. Confirm model access with an actual test request.
3. Build the capture, clarify, preview, edit and approve screens.
4. Integrate pack and CSV exports. Add a polished print view; PDF generation can follow verified print output.
5. Store working drafts locally in the browser with explicit clear/reset controls. Avoid creating accounts for this MVP.
6. Deploy the code, connect the domain and complete the evidence checklist.

## Acceptance gates

- A novel request reaches a usable pack with actual Gemma inference.
- Missing venue, start time, signatory and budget prices are surfaced.
- Date conflicts and malformed AI output produce understandable review states.
- Edits survive a reload and invalidate previous approval.
- A downloaded pack matches the reviewed version.
- A user can complete the main flow on a phone without zooming.
- Provider failures do not silently substitute sample results.

External email sending, calendar writes, recurring runs, OCR and multi-user collaboration are later milestones. The MVP produces preparation materials; it does not claim to complete the real-world event tasks.
