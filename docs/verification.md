# Workspace verification record

Date: 23 October 2026. The live site was tested at `https://flowpoint.phoenixreborn.tech/workspace` and `/workspace/pack`.

## Live Gemma run

A fictional new event, Harbor Makers Club Community Repair Day, was entered in the live notes page. The input supplied Saturday 7 November 2026, Riverside Civic Hall in Abuja, organizer and signatory, 50 programmes at NGN 180 each, 60 water bottles at NGN 250 each, and 40 snack packs at an unknown price. The start time was deliberately omitted. No real attendee information was used.

The first generation returned Google HTTP 500. The UI kept the request and reported the failure without substituting the sample. A single retry succeeded with `gemma-4-26b-a4b-it` in 7.9 seconds. The generated pack preserved the date, venue, organizer, signatory, quantities and prices. It left the start time blank and asked for it. The snack-pack price remained unknown. Known subtotal was NGN 24,000, marked incomplete.

A follow-up confirmed a 09:30 start time and explicitly kept the snack price unknown. The live refinement succeeded in 7.7 seconds. The details, invitation and run of show used 09:30. The three budget quantities and known prices remained intact. The sample label was absent; the UI displayed live model provenance. The resulting schedule still had `[Time]` placeholders for later sessions and required human editing. The invitation is usable as a starting draft but generic, so this is not a claim of publish-ready writing.

After improving the run-of-show prompt, another live update took 8.5 seconds. It kept the confirmed 09:30 welcome and gave suggested 10:00 bicycle demonstrations, 11:30 electronics safety talk and 12:30 closing. Each later time was visibly labelled as a suggestion requiring confirmation. The price was still unknown and the pack remained a draft. This is one observed model response, not a broad quality benchmark.

The pack was named `Repair Day Live QA` in browser-local Saved Packs, alongside two earlier sample test packs. The direct `/workspace/pack` route and the move back to Notes were verified in a desktop browser. Notes survived navigation, and the named live pack returned after a full page reload. The refinement consent gate was verified separately with a sample pack: without consent, no request was sent and the UI explained the requirement. The user subsequently reported that the phone experience worked perfectly; no device model or independent mobile capture was recorded.

## PDF export

The live draft export was a two-page A4 PDF. Text extraction and page renders confirmed the draft label, event date, 09:30 start, venue, invitation, proposed schedule, task list, three budget items, NGN 9,000 and NGN 15,000 known line totals, NGN 24,000 incomplete subtotal, and unknown snack price. The run of show placeholders appeared in its review notes. The first PDF split the signatory's name and role across pages. After the layout fix deployed, a second live export kept `Best regards`, the name and role together on page two. The invitation itself spans the page break.

## Automated checks

`npm test` passed 30 tests on this version. The suite covers the sample, editing, approval and export routes, provider failure handling, exact money arithmetic, prompt-output validation, cancellation, named browser packs, PDF attachment behavior and static routes. Automated model tests use simulated HTTP responses; the run above is the separate live evidence.

## Remaining gates

- Record a short demo and make a fair manual-versus-assisted effort measurement that includes human review time. No percentage saving has been measured.
- Update the submission narrative with the observed provider HTTP 500, the successful retry, and the remaining human edits. Do not call the generated drafts approved.

## Author school-event pilot (23 October 2026)

See [the exact initial and follow-up briefs](school-event-test.md). The author reports manually timing the use of Flow Point at approximately 37 seconds for preparation and 53 seconds for update. There is one participant and one supplied updated PDF. These are user-measured operation timings. The manual-writing baseline and full review/export duration are not recorded, so no time-saving percentage is claimed.

Inspection of the four-page approved PDF verified the updated date, venue, 10:00 start, 09:30 registration, all supplied durations and the NGN 181,500 total. It also exposed omissions: the still-unconfirmed rehearsal time was not retained as a question; the named first-aid officer was absent; the NGN 200,000 ceiling and NGN 18,500 remaining allowance were not displayed. The prompt now explicitly requires unresolved approval questions, named duties and a checklist note for spending limits, but human review remains required. The original uploaded PDF is evidence of this earlier behavior, not a corrected result.

Consent now covers explicit generation and refinement actions through one choice. Remembering is opt-in on this browser, with session-only behavior by default and a Notes-page control to revoke or forget it. A restored pack without that choice cannot send an update until the choice is made. Export filenames identify the event, event date, sample/draft/approval status, timestamp and a random suffix for PDF, Markdown and CSV.

Post-deploy checks: remembered acceptance survived reload; revoking it unchecked both controls and survived reload. An update without acceptance returned to Notes before any generation. Two live PDF downloads completed from a previously saved real pack. The 31-test suite verifies unique, safe, event-specific names across PDF, Markdown, CSV and approved exports. The exact long school brief was retried once after an HTTP 500; the second attempt also returned HTTP 500 with notes preserved. Revised school-event content therefore remains unverified with the live model; do not describe those semantic omissions as resolved yet.

## Bounded retries and supported Gemma fallback (23 October 2026)

A short live request also returned Google HTTP 500, so the long school brief is not the sole observed trigger. Render startup metadata checks returned HTTP 200 for the configured model; the failures occurred during generation. Google documents both `gemma-4-26b-a4b-it` and `gemma-4-31b-it` and the minimal thinking setting used here. No definitive provider-side root cause was exposed.

The adapter now permits at most three attempts within the original 60-second request deadline: the configured 26b model, one delayed retry, then the documented 31b Gemma model if transient HTTP errors persist. Backoff includes jitter. Quota and key errors are not retried or bypassed, and cancellation stops retries. Successful provenance records the actual model, requested model, attempt count and elapsed time. There is no closed-model or sample fallback.

All 33 automated tests passed. The deployed exact school-event replay failed on initial generation: two 26b HTTP 500 responses followed by a 31b HTTP 500 response, with 4,929 ms recorded by the adapter. The second brief could not run because no new pack was produced. Semantic corrections remain unverified live. This shows bounded failure handling works; it does not show that the upstream outage or semantic omissions are fixed.

The author estimates that preparing equivalent documents manually could take hours. This is an estimate, not a measured baseline; the 37-second generation and 53-second update are the author's approximate measured app timings. No percentage saving is claimed.

References: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api and https://ai.google.dev/gemini-api/docs/troubleshooting .


## Correlated diagnostics and minimal Google probes (23 October 2026)

Generation now assigns a server-generated request ID, returns it in X-Request-ID and JSON, and includes it in every attempt and terminal request log. Logs distinguish prepare/update and record model, attempt, HTTP status and duration. The client appends the reference to errors. Successful generation is logged only after output validation. Raw notes, answers, model response text and keys are never logged. Separate MODEL_JSON_INVALID and MODEL_PLAN_INVALID codes identify invalid JSON and invalid plan fields without including their contents.

All 36 automated tests passed, including correlation across success/failure, privacy markers, minimal probe payloads and distinct validation codes. The initial diagnostic deployment became live at 13:07:37 UTC. Live health and client checks passed, and an invalid request returned matching header/body reference 9e0089df-22c8-483d-ba52-85a8eb62ba32.

An opt-in startup diagnostic, controlled by an expiry timestamp no more than one hour ahead, sends only "Reply with the single word OK." The bare 31b call returned HTTP 500 after 17,704 ms without application instructions or generationConfig. The bare 26b call reached the diagnostic's 20-second timeout and is inconclusive. Neither call produced a usable reply, so the conditional app-settings comparison did not run. These observations do not establish a global outage or a definitive backend root cause.

The subsequent exact school-event replay reached Google HTTP 200 on the first 26b attempt after 25,775 ms, but output failed JSON/plan validation. The correlated request ID was 9df88891-b056-4b9e-bdaa-72226e6deb6d; application response was HTTP 502. The follow-up brief was not sent. There are therefore at least two observed failure classes: upstream HTTP 500, and a successful upstream response whose content cannot be accepted. The exact invalid-output category in this replay predates the new category codes and is unknown. School-event semantic checks remain pending.

The author's screenshot separately confirms successful 31b preparation in 47.2 seconds; the author reports that Update failed first and succeeded on a manual retry. This is evidence of intermittent success, not proof of consistent reliability. The temporary startup diagnostic was disabled after collecting its results.
