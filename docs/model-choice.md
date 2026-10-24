# Choosing Gemma or GPT-OSS

The shared Drafting model control is visible on both Notes and Preparation pack. Choose Gemma via Google or GPT-OSS via Groq. The choice applies to the next Prepare/Update, is remembered on this browser, and is locked while an operation runs. Switching alone never rewrites, approves or replaces the current pack. Existing model/provenance records remain historical. Available models are determined by separately configured server keys; missing providers are shown as not connected.

## Why Groq was introduced

During development Google-hosted Gemma produced intermittent HTTP 500s, timeouts and quota interruptions, including failed updates after retries. Groq was added to reduce dependence on one provider and offer GPT-OSS as another open-weight model. Gemma was retained. A newly configured Google key later passed small 26B requests but a 31B probe timed out; those basic probes were not full event-pack quality tests. There is no general claim that Groq is superior or that switching services fixes extraction accuracy.

| Choice | Model family | API processor |
| --- | --- | --- |
| Gemma | Google Gemma | Google Gemini API |
| GPT-OSS | OpenAI GPT-OSS, open weights | Groq |

The GPT-OSS choice does not use the OpenAI API. Both providers run on the server with independent keys, limits and availability. Their separate request formats feed the same structure/content checks, source review, saved-prefix protection, review/approval and exports. Generation evidence records the actual model used; within-Google fallback may change the exact Gemma model and is disclosed in step receipts. Cross-provider fallback never happens automatically.

## Consent and saved work

Permission is saved separately for Google and Groq. A switch restores only the chosen provider’s own prior choice; otherwise it asks for consent on Notes. Remember my choice applies to that provider. Each request names the provider and current configured model. Unknown, unavailable or stale model choices fail safely before dispatch; one API key is never sent to the other service. Cached partial generation includes provider/model identity, preventing reuse across choices. The previous complete pack remains intact on error or cancellation.

Earlier videos and the public article describe the previous Google implementation. They remain historical until the presentation refresh; this change updates repository documentation and the judge guide, not those external publications. Both options still require human checking. A JSON response, an exact-match scorecard or a small demo does not guarantee that every fact is correct.
