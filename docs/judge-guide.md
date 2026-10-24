# Reproduce Flow Point's event workflow

Open https://flowpoint.phoenixreborn.tech/judge for the guided test. On Notes, open **Examples & help** and choose **Load fictional judge brief**. This loads `public/judge-example.json` without inference. Read the brief, choose **GPT-OSS · Groq** or **Gemma · Google** in **Drafting model**, and permit that provider’s processing before live generation. Each provider has a separate remembered permission. Changing the model leaves the current pack intact. Groq is the deployment default. Configured Google requests can still fail with upstream HTTP 500; see [model choice and rationale](model-choice.md).

1. Prepare Community Reading Morning. Check the title, date `2026-11-21`, time `10:00`, school library, Amina Bello and Ada Okafor.
2. Check NGN 4,000 known subtotal and one unknown programme price. Booking remains unconfirmed. A draft with unresolved issues cannot be approved.
3. Paste the exact `answers` field into Update. Check NGN 6,000 total, 25 notebooks at NGN 200, ten programmes at NGN 100, and the multipurpose hall in both drafts.
4. Check the activity sequence and exact 10/30/20/10 minute durations. An anchored schedule starts at 10:00; later proposed activity times must be labelled suggested.
5. Review all sections, resolve only answered questions, approve the exact version, then download the PDF. Edit a detail and confirm approval clears. PDF names begin with the event title plus a unique suffix.
6. Name the pack, reload, reopen, and download a backup.

Each generation step can wait up to seven minutes for its model response. Retries share that step deadline. Three steps can take up to about 21 minutes in total; the Cancel button remains available.

## Recovery test

In browser developer tools, block `/api/generate` after the first step completes, or cancel during a later step. Your previous complete pack must remain unchanged. Retry with the exact same notes, changes and previous plan: completed steps are reused. Changing any input invalidates the checkpoint. No draft is published into the pack editor until all three steps and the final server review succeed. Storage restrictions can prevent durable checkpoints; the UI reports storage failure and still keeps work in the open page.

Checkpoints live only in this browser, inside its workspace data. They are unencrypted like the existing saved packs. They are not a server queue and do not make provider billing exactly-once. A response lost before the browser saves it may need a new request. Quota and concurrency caps are per server instance.

## Repeatable live measurements

`node scripts/benchmark-live.mjs --live --site https://flowpoint.phoenixreborn.tech --repeats 2 --provider groq`

Use `--provider google` to test Gemma explicitly. This deliberately makes real hosted requests. Never run it as part of tests/builds. It runs Prepare and Update on the fixed judge brief and the original detailed school brief (`docs/school-event-test.md`). Each completed case normally uses three requests. Stop on rate limits instead of retrying repeatedly. Results include every failure, per-step timings and request references, without storing private API keys or raw model output. No manual-writing or human-review time is measured.

The labelled sample, model-backed test, automated simulated-provider tests and edited walkthrough videos demonstrate different things. Do not present one as another. See `docs/verification.md` for dated results.

Use `--paced` for a deliberate 60-second cooldown between Prepare and Update when checking provider quota sensitivity. The report records that pause and excludes it from operation timings. The benchmark now respects standard HTTP(S) proxy environment settings. Accepted fictional results are also captured under ignored `tmp/` for manual inspection; never mistake structural acceptance for a content pass.
