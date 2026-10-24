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

- Make a fair manual-versus-assisted effort measurement that includes human review and export time. No percentage saving has been measured.
- Three edited demonstration videos and the updated narrative are now published. Their evidence labels and limitations are recorded below; no draft is presented as approved.

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


## Latest author report, review and media refresh (23 October 2026)

The author subsequently reported that preparation and update worked and confirmed the first-aid duty, pending rehearsal-time question, NGN 181,500 total and NGN 18,500 remaining allowance in the school-event retest. This is an author-reported manual check, not an independently captured corrected PDF or a reliability benchmark. Earlier failures and pending-at-the-time observations above are retained chronologically.

Copilot Chat evaluated the PDF download-name change. Unicode handling and browser filename validation were implemented after evaluating its findings; one predicted HTTP status was corrected. All 38 automated tests passed in the last code check. See [the Copilot review record](copilot-review.md). No formal Copilot PR review registered.

The revised three-video set is 3:12 per video, with original instrumental music, captions, cursor emphasis and edited actual interface motion. The films include earlier successful Community Repair Day live-run evidence and explicitly labelled hand-authored sample sections. In the recorded follow-up run, the invitation omitted the confirmed 09:30 start and an explicit editor correction was made. Successful prepare/update evidence is not a claim that every result preserves every fact.

Fresh recording attempts returned two generation timeouts and a Google HTTP 500. A later generation attempt during the image refresh also returned HTTP 500 (reference 2b2b68d2-8088-4ca3-9518-d6ffbc722a4c); the notes were preserved. No sample was substituted for a successful model response. These observations establish intermittent failure, not a definitive Google backend root cause or global outage.

The new PNG screenshots show the current Notes, schedule and budget editors using a labelled, manually edited School Family Day sample. Fictional confirmations include 09:30, Harbor Community School and Ada Bello. Programmes are 50 × NGN 180; 50 refreshment packs have no price. The NGN 9,000 known subtotal is incomplete, and the sample remains a draft. This is separate from the earlier NGN 24,000 Community Repair Day live pack. The current Home-page capture is the cover. See [media provenance and original images](media/README.md).

All three YouTube players loaded with the expected titles in DEV preview and their embed URLs were verified on the published article. Continuous playback of the full uploads was not independently confirmed in the cloud browser. The local source MP4s passed full decoding checks at 1080p, 24 fps, with 48 kHz AAC stereo audio and 192-second duration.


## Repository audit (23 October 2026)

A clean checkout of `63e7ad3` was reviewed. Fixed asynchronous sample/saved-pack load races, restored notes before network validation, hardened malformed provider envelopes, and handled invalid request URLs inside the server error boundary. The Node engine floor now matches the documented 22.9 minimum. All 43 tests pass; `npm audit --omit=dev` reports zero known vulnerabilities. Current deployment discovery shows automatic deploys enabled, the older `npm test && npm run build` command and an empty HTTP health-check path, so the live service uses the default TCP check rather than the Blueprint’s declared `/healthz`. See [the detailed review](repo-review.md). No new live inference success rate was measured by this audit.


## Deployed follow-up app check (23 October 2026)

The second pass fixes stale-tab overwrites, exact browser money display, budget currency labels and stalled client requests, with 49 passing tests. App commit `470e47a` is confirmed live in `dep-dbdrtknavr4c7396s4ug`; the actual Render build command and `/healthz` HTTP path now match the Blueprint. No plan or secret changed.

The fictional Library Reading Afternoon prepared successfully via the 31b fallback after two primary HTTP 500s (36.1 seconds), then updated successfully on the primary model (5.5 seconds). Browser checks confirmed updated venue, time, named task owner, NGN 11,000 budget, saved-pack reopening/reload, theme switching, currency labels, approval invalidation and a stale-tab warning that preserved the newer notes. Live export API checks passed for PDF, Markdown and CSV; the synthetic PDF was rendered and inspected. Browser download events were observed, but returned browser file paths could not be inspected locally. See [the full boundary-by-boundary record](repo-review.md#final-deployed-verification).


## Invalid JSON recovery (24 October 2026)

After the author changed the project/key and redeployed, a fictional prepare/update pair succeeded on the primary model at the first attempt (10.2 and 6.2 seconds). Those two checks did not establish reliability. The subsequent author report `84d0884f-b86c-4cce-b2f6-3254b7dfb6f8` traced to upstream HTTP 200 after 23,122 ms followed by `MODEL_JSON_INVALID`; it was neither an HTTP 500 nor a rejected key. The raw response and the author's notes were not retained in logs, so the exact JSON syntax error and original brief cannot be reconstructed from that reference.

The adapter previously retried only transient HTTP statuses. It now also regenerates invalid JSON, invalid plan fields, missing output and malformed response envelopes from the original input, with an explicit formatting reminder. It uses the existing Gemma fallback after an invalid reply when available. Both error classes share the original maximum of three calls and one 60-second deadline; cancellation still stops work. Validation remains strict. No broken model text is patched, displayed or sent into the retry prompt. Safety blocks and token truncation are not retried as format failures. Safe logs retain category, attempt, model and request reference, without private notes or raw output.

All 55 tests pass, including malformed-output recovery through the HTTP endpoint, exhausted retry codes/references, original-input preservation, mixed HTTP/output retry bounds, cancellation and timeout. These injected failures demonstrate the recovery mechanism; they do not prove that the author's unavailable original brief will always succeed.


### Native pack response follow-up

The first recovery deployment (`2df834c`) replayed the long school brief. The primary again returned invalid JSON after about 25 seconds; the fallback then reached the shared 60-second timeout. Request `cdee1ebb-3387-4278-81a8-1ab6ce50df0e` therefore did not complete. Recovery alone was not sufficient for that live case.

The adapter now requests Gemma 4's supported function response using one data-only `submit_event_pack` declaration and moves the trusted contract to `systemInstruction`. There is no executable function, email action or booking tool. The only accepted named function result is validated as the same plan contract; arbitrary/multiple functions and malformed arguments are rejected. Valid text JSON remains supported for older replies. Provenance now records `responseFormat` so live function-call use can be distinguished from the compatibility text path. The original retry/time bounds and privacy rules remain. All 59 tests pass, including native arguments with embedded quotes/paragraphs, schema-nullability checks, strict value validation and malformed-function recovery.

Implementation references: [Gemma on the Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api#function-calling), [function-calling modes](https://ai.google.dev/gemini-api/docs/generate-content/function-calling#function-calling-modes). Official documentation confirms Gemma 4 system instructions and function calling; the live retest is required to verify this application's deployed combination.


The hosted native function response was verified on a short fictional brief: request `95b5dfca-5f4f-4353-8e2a-a97ae803f634` returned a valid pack on the primary model at the first attempt in 6,344 ms, with `responseFormat: function-call`. The first native long-brief attempt (`2cd024d9-b880-48c2-bf99-14a3f1654d29`) reached the old 60-second deadline before any response. The follow-up extends the shared generation deadline to 90 seconds and the browser wait to 105 seconds, retaining the three-call cap and cancellation. The progress notice states the 90-second allowance. The prompt now requests concise drafts under 3,000 characters each while explicitly retaining supplied facts and durations. Longer requests and recovery can therefore take longer than the earlier short timings. The final long replay is recorded below when complete.


The 90-second native long replay (`bb62f54b-6c7c-4e9e-96b9-a1ed9e67eae1`) did not produce a usable result: a primary HTTP 500 was retried, then a returned candidate had a non-success finish reason. The earlier adapter did not log that category, so its exact reason is unknown and must not be inferred. Safe response diagnostics now record a fixed stop-category whitelist and numeric output-token count, without response text. Inputs whose serialized request, answers and previous plan exceed 5,000 characters start on the existing larger 31b Gemma model; short requests keep the configured 26b primary. Fallback selection and actual model choice remain explicit in provenance, with the same 90-second and three-attempt bounds. This is a routing heuristic, not a reliability guarantee. The suite passes 61 tests, including both routing paths and safe truncation diagnostics.


### Final deployed checks for this pass

Application commit `98966788b1d7b3623baccf4ef7c3c9f135a1ea2b` is live in `dep-dbe2090m7kps73c2ml00`. The final short fictional Prepare and Update checks both returned HTTP 200 on the first primary 26b attempt, using native `function-call` responses:

| Action | Reference | Server time | Known total |
| --- | --- | --- | --- |
| Prepare | `810d7b9e-26e0-4d0f-989c-0963286b9cd8` | 5,886 ms | NGN 4,000 |
| Update | `36c7f01e-30a0-4c3e-99d5-d624e9b653ab` | 6,101 ms | NGN 6,000 |

The final 5,915-character school-event replay did **not** pass. Reference `66d7af42-1bb6-4434-a82d-8a5fbccb193c` started on 31b, which returned HTTP 503 followed by HTTP 500; the 26b fallback then reached the shared 90-second deadline. The follow-up update was not sent, and no school quality checks were claimed as passed. The original user brief behind `84d0884f-b86c-4cce-b2f6-3254b7dfb6f8` is unavailable, so that exact case cannot be asserted resolved. No raw notes, raw broken output or credentials were logged. This pass improves typed formatting and recovery but does not establish reliable completion for detailed briefs. All 61 automated tests pass; the live long-input failure remains an explicit open limitation.


## Staged preparation and judge guide, 24 October 2026

Changed the current browser path to facts/checklist/budget, invitation, and run of show. Each response is independently validated and saved in browser-local workspace data. Identical-input retries resume the completed prefix; changed notes, update text or previous plan invalidate it. Draft calls are assembled onto validated facts and cannot alter structured budget values. Final server review runs before the old complete pack is replaced. Browser storage restrictions are reported; requests lost before receipt cannot be recovered. No exactly-once provider claim.

Automated suite: **66 passed**. Added recovery-after-serialization, changed-input invalidation, cancellation, immutable facts / invalid stage output, and atomic UI replacement coverage. These tests use simulated provider replies. The public `/judge` guide provides exact fictional inputs, expected totals and review/export instructions. A separate opt-in `scripts/benchmark-live.mjs` records actual hosted results, including failures. Live staged results are pending deployment at this point; see the next dated record for outcomes.


### First hosted staged measurements (03:27 UTC)

Deployed `7e8ff61439290bf2865e40506351461e9490f587` to Render `dep-dbe2airncjis73dtu2g0`, verified live and `/judge` accessible. Ran `scripts/benchmark-live.mjs --live --site https://flowpoint.phoenixreborn.tech --repeats 2`.

- Judge brief Prepare completed in **18.606 s wall time**. Date, time, NGN 4,000 known subtotal, one unknown price and both nonempty drafts passed the recorded checks.
- Judge brief Update completed in **13.394 s wall time**. Date, time, NGN 6,000 total, zero unknown prices and changed venue in both drafts passed.
- Second Prepare saved its facts response, then its invitation request returned **429** (`32172129-d4bf-4a84-8d87-36595dfec946`). The runner stopped on quota, without retrying the rate-limit response. It did not attempt the detailed school case.

Of the **three attempted operations**, two completed and passed the listed checks, one failed on quota. The planned eight operations were not all attempted. Median of the two completed operations is 16.000 s; this tiny, interrupted sample is not a reliability estimate or a manual time-saving measurement. Startup, review and export time are excluded. Per-step references, attempts and exact durations: [`evidence/staged-live-2026-10-24.json`](evidence/staged-live-2026-10-24.json). The narrow checks do not establish every sentence's accuracy. The detailed-school staged regression still needs its own result.

Browser-only follow-up at 03:29 UTC completed the short brief but showed `signatory` instead of Amina Bello in the signatory field. Approval remained blocked by other issues, but the structural validator did not catch this semantic substitution. This run is not a content pass. Added generation-time rejection of literal field-label placeholders and clearer named-field descriptions, plus benchmark checks for signer, named activity lead and explicit durations. The earlier two benchmark passes apply only to their recorded narrower checks.


### Detailed staged replay and bounded fallback

A separate detailed-school Prepare reached the server at 03:29:24 UTC and timed out at 60 seconds, before an upstream response was logged (`0403e34c-af80-49fc-9aaa-6afb7cdbfea6`). Wall time including client/network overhead: 63.850 s. Update was skipped because no new pack existed. See [`evidence/staged-school-2026-10-24.json`](evidence/staged-school-2026-10-24.json). This is a failed replay, not a successful detailed-content regression.

Follow-up code uses focused instructions for each stage and limits each staged provider attempt to 20 seconds within the shared 60-second step deadline. A timed-out first attempt can therefore reach the fallback model. It also describes named fields explicitly, rejects literal field labels, shows per-step references in the workspace and expands the opt-in benchmark's semantic checks. **68 automated tests pass**, including fallback after a stalled attempt and rejection of a literal signatory label. A subsequent live result is required to judge the detailed path.


### Bounded-attempt live result (03:34–03:36 UTC)

Render deploy `dep-dbe2e6gm7kps73c3ur9g`, app commit `d2e3620a14d6fa6b7686d8d61d541175135fe1d1`, became live. The detailed-school facts step still failed after 44.876 s wall time with an upstream HTTP 500 after bounded attempts. No pack was committed and Update was skipped. [`evidence/staged-school-bounded-2026-10-24.json`](evidence/staged-school-bounded-2026-10-24.json).

The fixed judge example then passed both operations with the **expanded** checks: actual signer name, signer in invitation, named lead, explicit activity durations, date, time, exact budget and updated venue in both drafts. Prepare: **16.452 s** wall time. Update: **12.723 s**. Two attempted / two completed / two passed the recorded checks. [`evidence/staged-judge-bounded-2026-10-24.json`](evidence/staged-judge-bounded-2026-10-24.json). This remains a small sample, not proof of reliability for arbitrary notes.

The latest code tests plain JSON responses for staged inputs over 5,000 serialized characters, with the same validation and no native tool settings. Staged retries also use this simpler response format. Short requests retain the successful native function path. **69 automated tests pass**. Detailed live verification for this format change is recorded next; it must not be presumed successful from the mocked tests.

The browser replacement retest was stopped by automatic approval review because it would overwrite an existing browser draft. The confirmation was dismissed; no saved draft was replaced in that retest. The independent API benchmark provided the subsequent content checks.


### Final plain-JSON detailed replay (03:38 UTC)

App commit `e6a4309c01418eba9a2454cd95b8cfb68944d9ce` became live on Render deployment `dep-dbe2fs1srm7s73de3gj0` at 03:37:56 UTC. The first detailed-school facts step again timed out: request `972715f4-2efd-4dcf-8a0f-9a84a36d5743`, HTTP 504 after 67.609 s client wall time (60-second server step deadline). No completed facts response reached the client; Update was skipped. [`evidence/staged-school-json-2026-10-24.json`](evidence/staged-school-json-2026-10-24.json).

**Final status:** staged browser recovery, judge guide, generation receipts and reproducible benchmark tooling are deployed. **Detailed-brief live completion remains unverified and failed in these replays.** Do not call the whole app complete or claim this provider limitation is fixed. The passing short-brief expanded checks above do not establish long-brief reliability. The latest full automated suite passes 69 tests with simulated provider responses. No manual-writing baseline, percentage time saving or overall reliability estimate has been measured. The published DEV post has not been edited in this session; its repository draft has been updated with this distinction.


## Seven-minute response limit (24 October, requested change)

Model generation now has a **420,000 ms (seven-minute) shared deadline per step**, including retries. Removed the earlier 20-second attempt cutoff by raising the default attempt limit to the same seven minutes. Browser and opt-in benchmark requests allow 435,000 ms, so they do not deliberately cancel before the server deadline. Three sequential steps can take up to about 21 minutes. Cancellation and saved-step recovery remain available.

Pinned Undici 8.12.3 and used a dedicated generation dispatcher with 435,000 ms headers/body timeouts, avoiding the default five-minute HTTP client cutoff. Node 22.19.0 or newer is required by that dependency. Benchmarks use a corresponding HTTP dispatcher. This changes application-side wait limits; it does not guarantee that Google or an intermediate network will keep every request open or complete successfully. Earlier live failure records remain unchanged. No seven-minute-long provider completion is claimed from the automated checks.

Verification for the timeout change: **70 automated tests passed**, including a real local HTTP request through the production fetch/dispatcher pair. The dependency's paired fetch is used instead of mixing its new dispatcher protocol with Node's bundled fetch. `/api/config` now reports `generationTimeoutMs: 420000` for read-only deployment verification. The older live runs are not rerun or relabelled as seven-minute tests.
