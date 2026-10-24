# Groq provider support

Adding a Groq key alone did not switch the previous Google-only server. The user's manual Render deploy completed, but startup reported Google not configured. This implementation adds a separate Groq transport while sharing pack validation, content omission checks, checkpoint safety, review and exports.

Groq uses the Chat Completions API, bearer authentication, GPT-OSS 120B by default and strict JSON-schema responses. The Google schema is converted to JSON Schema (including nullable fields and closed nested objects). No reasoning text is displayed or stored. Provider and actual model appear in provenance and safe diagnostic logs. Keys remain server-only. The Groq key is never sent to Google; the Google key is never used as a Groq key. No automatic cross-provider fallback exists. Supported Groq models are GPT-OSS 120B and 20B. Existing three-attempt/shared seven-minute bounds apply; quota/access/schema errors do not loop.

Set GROQ_API_KEY. An existing Groq key selects Groq automatically unless AI_PROVIDER explicitly selects Google. Optional settings: AI_PROVIDER=groq and GROQ_MODEL=openai/gpt-oss-120b. Google remains selectable explicitly with its own key/model. Startup checks model listing without a billable generation probe; model listing is not proof of inference availability.

Google consent is not reused for Groq. Remembered choice is per processor; every Groq generation request must identify groq as the processor, rejecting missing/stale Google bindings with 409 before any upstream call. Browser checkpoint version 8 also includes processor identity. UI disclosures and current model labels follow server configuration, while old saved pack provenance remains historical. Old videos/submission are acknowledged as the earlier Google implementation; no external article or video was modified.

All 118 software tests pass, including endpoint/auth routing, strict schemas, captured omission retry, quota/access failures without Google fallback, secret redaction, stale-processor rejection and independent remembered choices. Live inference remains a separate verification step. Free-tier token limits can reject long notes or frequent multi-stage requests; this feature cannot guarantee provider availability or unlimited usage.

Official API references: https://console.groq.com/docs/structured-outputs and https://console.groq.com/docs/reasoning .
