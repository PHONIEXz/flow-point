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
- Render listing requires explicit confirmation of the workspace before the connector permits service inspection or changes. No service or DNS changes were made.

## Remaining acceptance gates

1. Confirm the Render workspace and inspect existing services before creating or changing one.
2. Deploy the Node service; add the Google key privately in its environment settings.
3. Use a novel request to verify actual model access, missing-information behavior and draft quality. Record the model, generated time, elapsed time and a sanitized output.
4. Verify desktop and phone layout, sample editing, draft restoration after reload, cancellation, approval invalidation and downloaded contents in a permitted browser.
5. Connect the verified service to flowpoint.phoenixreborn.tech, preserving existing root and unrelated DNS records; verify HTTPS.
6. Measure manual preparation effort against the same task using Flow Point. Do not invent time-savings percentages.
