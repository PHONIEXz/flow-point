# Groq migration evidence

All input events and names in these records are fictional regression fixtures. No API key is included.

- result.json: exposed church staged Prepare and dependent Update, with 65-second spacing. All six calls returned 200. Original content scores include a missing schedule venue.
- unpaced-prepare.json: one separate unpaced Prepare through the staging helper, 9,930 ms operation wall time, all three calls returned 200. It also omitted schedule venue. This is not a representative latency estimate.
- post-fix-schedules.json: targeted schedule regeneration after adding an explicit header instruction and a source-aware venue omission check. Both returned 200; correct venues present; resulting checkpoint-based packs matched 29/29 and 28/28 declared checks. Facts/invitation were reused from the earlier run, not regenerated in this follow-up.

Read ../../groq-provider-2026-10-24.md for scope, deployment details and limitations. These are exposed regressions, not an independent evaluation or reliability claim. Existing whole-suite v1/v2 failures and quota interruptions remain preserved elsewhere.
