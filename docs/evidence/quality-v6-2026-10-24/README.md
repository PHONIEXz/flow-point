# v6 retests: pending, no inference attempted

Five exposed operations are frozen in evaluation/cases-v6.json and freeze-v6.json. The prior run reached Groq daily quota; no v6 generation has been attempted, and there is no passing v6 scorecard.

After capacity is available, run from the matching source checkout:

```sh
node scripts/evaluate-quality-v6.mjs --live --output docs/evidence/quality-v6-2026-10-24
```

This makes real hosted requests using the existing configured provider. Do not run while the recorded daily quota remains exhausted. No alternate keys/models/providers are used to bypass it. The known school and community Updates reuse their frozen successful v5 Prepare baselines. Other cases rerun Prepare and its paired Update where applicable. Expectations are unchanged. This is post-fix regression evidence, not unseen or independently authored validation. Completed records and failures must be preserved, not overwritten to obtain a better score.
