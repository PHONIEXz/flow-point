# Workspace verification record

Date: 21 October 2026.

## User story

An organizer enters a request, generates an event pack, resolves missing details, edits its documents and budget, approves a version and downloads the reviewed pack. Drafts survive a reload on the same browser.

## Evidence

- Automated core/HTTP tests pass. The generation route is exercised with a simulated Google response; the server validates the result and returns model provenance.
- HTTP sample -> blocked approval -> completed plan -> approval -> approved Markdown -> edited plan -> draft Markdown is covered.
- Model quota/auth/network failures, malformed and truncated output, cross-site actions, oversized input and invalid currency arithmetic are covered.
- JavaScript syntax checks and the static build pass. The supervised preview starts at port 4173.
- Cloud browser access to the preview was rejected by the browser security policy. No screenshots, mobile layout, browser persistence behavior or click-through flow have been verified. No alternate browser path was used to bypass that decision.
- No GEMINI_API_KEY was available in this work session, so there is no live inference result or quality benchmark.
- The user confirmed Ayoade Paul's Workspace. Created the free Node Web Service `flow-point-app` (`srv-dbc8labbc2fs73blobc0`) in Frankfurt. Deployment `dep-dbc8ls4s728c73ec4lhg`, commit `8daac1cf752875b840b424ed2d13e36a03218f4f`, reached `live`. URL: https://flow-point-app.onrender.com/workspace. Health, workspace HTML, configuration and sample APIs return 200. A remote HTTP sample flow verifies approval, Markdown export and approval invalidation after an edit. Browser interaction and phone layout remain unverified. The API key and custom domain are not configured. No DNS changes were made.\n- The first clean Render build exposed that HTTP tests needed generated assets. Added a pretest build hook, reproduced a clean build locally, and passed all 20 tests before redeploying.

## Remaining acceptance gates

1. Confirm the Render workspace and inspect existing services before creating or changing one.
2. Deploy the Node service; add the Google key privately in its environment settings.
3. Use a novel request to verify actual model access, missing-information behavior and draft quality. Record the model, generated time, elapsed time and a sanitized output.
4. Verify desktop and phone layout, sample editing, draft restoration after reload, cancellation, approval invalidation and downloaded contents in a permitted browser.
5. Connect the verified service to flowpoint.phoenixreborn.tech, preserving existing root and unrelated DNS records; verify HTTPS.
6. Measure manual preparation effort against the same task using Flow Point. Do not invent time-savings percentages.

## Live provider check after key setup

The user added GEMINI_API_KEY and redeployed. A permitted browser loaded the deployed workspace and showed live configuration enabled. A novel Cedar Grove Reading Day request was submitted through the UI. The server returned provider failures and 60-second timeouts; no valid live preparation pack was received. This confirms the key is configured, not that it is valid or that inference is working. Added safe key/model error categories and Gemma 4 minimal-thinking settings; all 21 automated tests pass. Deployment dep-dbc8vk2fngtc739eb790 (commit b36d2b8eb6d009014170c1b60d77a701c784343b) reached live. The final browser attempt still returned a provider error. The complete live generation/review/export acceptance gate remains blocked. Screenshot capture of the final error timed out. No private key was read or exposed.
