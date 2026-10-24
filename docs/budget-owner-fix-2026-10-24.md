# Budget and direct-owner omission guards

The exposed church regression returned 4 printed programmes instead of the requested 80, omitted the choir owner, and returned an empty budget on Update. These are model extraction errors, not arithmetic bugs: totals correctly reflected the wrong extracted inputs.

The server now rejects missing or altered explicitly phrased quantities/unit prices, retains previous budget lines unless explicitly removed, and checks direct named assignments without honorifics through unrelated updates. New explicit assignments override the previous duty owner. These checks run for staged facts, saved later-stage checkpoints, and both function-call/text whole-pack replies. Bounded retries include actionable validation feedback. Exhausting attempts leaves the previous browser pack safe.

Scope: conservative English patterns, including quantity + item + at CURRENCY price each, and leads/coordinates/manages assignments. Semantic paraphrases remain for human source review. Numerically changed items in follow-up wording outside the supported extraction pattern are left for human review rather than forcing an obsolete quantity/price. Explicit removals remain permitted. No facts are automatically invented or repaired. The prompt now audits unchanged budgets and named duties across Update.

Generation checkpoint contract advances to version 7 so old partial output cannot bypass new validation. Old completed packs remain editable; this change does not certify or silently rewrite them. The previous frozen v1/v2 evaluation and failures remain unchanged. New tests replay the captured bad church outputs and verify corrected outputs, quantity/price changes, owner reassignment, explicit removals, non-mutation and the three-attempt limit. All 111 software tests pass. Hosted inference is separate and may still stop at Google's quota or provider errors.

## Deployed verification

Code commit f5813a941d1d16c76f53f6edef4a4334b074048b was confirmed live on Render deploy dep-dbebbqo473hc73cooik0. `/healthz` returned 200, and the live client serves checkpoint contract version 7.

A focused hosted facts-stage church regression was attempted at 13:44 UTC. Request c7686593-a56e-4244-bfe4-7f7690c30dd0 received a model HTTP 200 on attempt 1, which the new content validator rejected with MODEL_CONTENT_MISSING. Attempts 2 and 3 both returned provider HTTP 500, exhausting the existing cap. The API returned 502 with a safe error and request reference. No pack was accepted, no browser pack was changed, and Update was not attempted because Prepare failed. This demonstrates live rejection of a content omission, not successful model correction or completed live quality testing. Raw safe receipt and server metadata are stored in the adjacent evidence files.

Google's quota and HTTP 500 failures remain external blockers. No further live requests or API-key changes were made in response to this failure. The software fixes are complete; successful live Prepare/Update correction still needs provider availability.
