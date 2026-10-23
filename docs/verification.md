# Workspace verification record

Date: 23 October 2026. The live site was tested at `https://flowpoint.phoenixreborn.tech/workspace` and `/workspace/pack`.

## Live Gemma run

A fictional new event, Harbor Makers Club Community Repair Day, was entered in the live notes page. The input supplied Saturday 7 November 2026, Riverside Civic Hall in Abuja, organizer and signatory, 50 programmes at NGN 180 each, 60 water bottles at NGN 250 each, and 40 snack packs at an unknown price. The start time was deliberately omitted. No real attendee information was used.

The first generation returned Google HTTP 500. The UI kept the request and reported the failure without substituting the sample. A single retry succeeded with `gemma-4-26b-a4b-it` in 7.9 seconds. The generated pack preserved the date, venue, organizer, signatory, quantities and prices. It left the start time blank and asked for it. The snack-pack price remained unknown. Known subtotal was NGN 24,000, marked incomplete.

A follow-up confirmed a 09:30 start time and explicitly kept the snack price unknown. The live refinement succeeded in 7.7 seconds. The details, invitation and run of show used 09:30. The three budget quantities and known prices remained intact. The sample label was absent; the UI displayed live model provenance. The resulting schedule still had `[Time]` placeholders for later sessions and required human editing. The invitation is usable as a starting draft but generic, so this is not a claim of publish-ready writing.

The pack was named `Repair Day Live QA` in browser-local Saved Packs, alongside two earlier sample test packs. The direct `/workspace/pack` route and the move back to Notes were verified in a desktop browser. Notes survived navigation, and the named live pack returned after a full page reload. The refinement consent gate was verified separately with a sample pack: without consent, no request was sent and the UI explained the requirement. The user subsequently reported that the phone experience worked perfectly; no device model or independent mobile capture was recorded.

## PDF export

The live draft export was a two-page A4 PDF. Text extraction and page renders confirmed the draft label, event date, 09:30 start, venue, invitation, proposed schedule, task list, three budget items, NGN 9,000 and NGN 15,000 known line totals, NGN 24,000 incomplete subtotal, and unknown snack price. The run of show placeholders appeared in its review notes. The first PDF split the signatory's name and role across pages. After the layout fix deployed, a second live export kept `Best regards`, the name and role together on page two. The invitation itself spans the page break.

## Automated checks

`npm test` passed 30 tests on this version. The suite covers the sample, editing, approval and export routes, provider failure handling, exact money arithmetic, prompt-output validation, cancellation, named browser packs, PDF attachment behavior and static routes. Automated model tests use simulated HTTP responses; the run above is the separate live evidence.

## Remaining gates

- Record a short demo and make a fair manual-versus-assisted effort measurement that includes human review time. No percentage saving has been measured.
- Update the submission narrative with the observed provider HTTP 500, the successful retry, and the remaining human edits. Do not call the generated drafts approved.
