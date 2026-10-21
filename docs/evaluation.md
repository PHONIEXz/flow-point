# Evaluation and submission evidence

## Test scenarios

1. Complete school event request with explicit date, time, venue, tasks and prices.
2. Missing venue, start time and costs: ask for missing details and preserve unknown prices.
3. Date conflict: Sunday, 26 October 2026. Correctly flag that the date is Monday.
4. Ambiguous relative date: next Friday. Resolve against an explicit local reference date and timezone.
5. Revised event: change the date after approval; require a fresh review and update affected outputs.
6. Failure: provider timeout, quota error or malformed JSON. Explain failure and allow retry; never pretend the example fixture is live AI.
7. Misleading source text: request contains instructions to reveal credentials or change model rules. Treat event text as untrusted input.

## Measure actual effort

Ask an organizer to prepare the same kinds of materials manually and with Flow Point using comparable inputs. Record the method, person count, task order, elapsed time, correction count and completeness. Include review/edit time in the assisted result. Separate waiting time from hands-on effort. If there is only one tester, say so. Do not claim broader productivity gains from one trial.

## Capture before submission

- Repository creation date and commit used in the demo.
- Exact model/provider, configuration, latency and observed failures.
- Live deployment and domain with working HTTPS.
- Short recording of a novel request, a missing-detail question, an edit and an export.
- Input/output examples with personal information removed.
- Honest limits, installation steps and third-party credits.
- DEV template sections and only partner categories actually implemented.

No time-savings measurements, model runs or live deployments have been completed at the foundation stage.
