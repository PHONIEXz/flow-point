# Workspace verification record

Date: 21 October 2026.

## Current result

The deployed desktop workflow has passed with actual hosted Gemma inference: request -> generated pack -> review -> approval -> Markdown and CSV downloads -> reload restoration -> edit invalidates approval.

App: https://flowpoint.phoenixreborn.tech/workspace
Original address: https://flow-point-app.onrender.com/workspace
Service: flow-point-app (srv-dbc8labbc2fs73blobc0), free Node service, Frankfurt.
Verified deployment: dep-dbc95cg473hc73fgrm10, commit 24937cca33def818312769c6fa18259d21f18df8.
Model: gemma-4-26b-a4b-it through Google's Gemini API.

## Automated checks

All 22 automated tests pass. Tests cover dates, exact integer budget arithmetic, approval fingerprints, CSV escaping, HTTP workflow, request validation, provider failures and safe model-access diagnostics. Model responses in automated tests are simulated and are distinct from the real browser runs below.

## Live evidence

The user configured GEMINI_API_KEY privately in Render. The server model metadata check returned HTTP 200. No private key was read or exposed.

A browser submitted this test request:

> Reading Day on Saturday 14 November 2026, 10:00 to 12:00, Cedar Grove hall. Organizer: Cedar Grove Club. Signatory: Ada, coordinator. Currency NGN. Budget: 10 snack packs at 1000 naira each. Prepare a short invitation, schedule and checklist. Keep every section brief.

- Actual generation succeeded in 5.9 seconds in the first successful run and 6.2 seconds in a subsequent browser run.
- The pack preserved the supplied date, weekday, time, venue, organizer and currency.
- The generated checklist kept unspecified owners and due dates blank.
- Budget: quantity 10, unit price NGN 1,000, total NGN 10,000; stored subtotal 1,000,000 kobo.
- The model unnecessarily asked for currency confirmation despite NGN being supplied. A human resolved it against the original request before approval. This illustrates why review is still needed.
- Invitation and proposed schedule were inspected, then the version was approved.
- The browser's Download pack and Budget CSV controls both produced files. Local inspection confirmed Approved status, event details and exact CSV money values.
- Reloading restored the request, plan and approval from browser local storage after the API check completed.
- Editing invitation wording immediately removed approval and required a fresh review. The revised version was reviewed and approved again.
- A desktop screenshot captured the approved version. Phone layout remains unverified.

## Custom-domain verification

The provider dashboard confirmed CNAME flowpoint -> flow-point-app.onrender.com (TTL Auto). After the user completed the Render domain association, the custom-domain workspace loaded successfully in the browser over HTTPS. An HTTPS GET to /healthz returned HTTP 200 and {"status":"ok"} with normal certificate validation. Render's own certificate status label was not separately observed. Drafts are stored per origin, so drafts from onrender.com do not automatically appear at the custom domain. The earlier full generation/review/export test was performed at the original address.

## Earlier failures and fixes

The first clean Render build exposed a test order issue. Added a pretest asset build and reproduced a passing clean build locally.

Initial live attempts returned provider failures and 60-second timeouts. Added specific sanitized provider errors, minimal thinking for Gemma 4 and a bounded output size. Later short-request runs succeeded. This does not prove the earlier provider failures cannot recur, or establish reliability for long requests.

The free Render service displayed its wake-up page after inactivity; the workspace loaded after startup. Cold starts remain a product limitation of the selected hosting tier.

## Remaining work

2. Set the optional HTTP health-check path to /healthz in the dashboard; MCP direct creation did not expose this setting.
3. Verify phone layout, live refinement, cancellation, sparse/contradictory novel requests and longer-input reliability.
4. Measure human preparation effort against the same task using Flow Point. Generation elapsed time is not a measured time-savings percentage.
5. Produce final demo/screenshots and the DEV submission. Do not claim category completion until its requirements are verified.
