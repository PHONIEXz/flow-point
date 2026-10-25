# Final release checks, 25 October 2026

## Implemented

- Checklist owners/dates now produce explicit blocking review issues when absent. Generic Staff/Team/TBD owners normalize to unassigned. A task explicitly labelled proposed with a populated date also needs confirmation before approval. No unknown values are filled automatically.
- Markdown uses main currency units and line subtotals, retains unknown-price distinctions, and includes open questions plus each fact's value, source quote and review state. Original complete notes are not exported.
- The letter formatter strips at the first recognized closing, preventing duplicate sign-offs.
- Fallback is optional and disabled by default. A separate combined permission covers Google/Groq. Old permissions are never expanded. Content/structure rejection and cancellation never trigger cross-provider fallback. Successful step receipts retain actual provider/model and fallback origin.
- Hosted attempts have 45-second deadlines with two attempts per provider; the existing seven-minute per-step outer ceiling remains. Retry-After is honored within the remaining deadline. Short Groq minute limits wait; daily/unknown quotas stop that provider. Two failed operations open a 60-second circuit; quota opens it immediately.
- Draft prompts omit the redundant previous-plan copy once a checkpoint exists. Original notes remain because the current fact schema does not encode every activity duration, attendance term and safety detail. Removing those notes would risk losing context.

## Verification and limits

The final suite passes 145 software tests, including six new regression tests for the above defects/fallback boundaries. These use simulated provider responses, not a new live model-quality evaluation. The five quota-blocked v7 complete-generation checks remain owner-deferred. No quota-reset or provider-capacity guarantee is made. No new key was created or rotated.

Owner reports real-phone fitting/layout and perceived speed healthy. Device/browser and numerical timing were not supplied. Manual-writing time savings remain unmeasured.

The app still uses bounded admission (two concurrent requests and 30 calls per ten-minute process bucket), browser-local checkpoints and server-only keys. A durable queue, shared result cache, third provider, automatic 20B draft routing and user-supplied API keys are not added to this focused release. These are optional architecture changes, not prerequisites for an honest submission. No page-load warm-up inference consumes user quota.

Review of an older school sample found NGN 181,500 arithmetic was correct; that does not establish invitation claims as source-supported. Arbitrary semantic contradictions and quantities/audience relationships still require human source review. Older evidence is never relabelled as current-build output.
