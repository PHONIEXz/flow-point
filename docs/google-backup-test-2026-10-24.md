# New Google key diagnostic with Groq active

The user saved a new GEMINI_API_KEY and redeployed. The live app remained configured for Groq GPT-OSS 120B. A short-lived server-start diagnostic can now test the separately stored Google key without changing the active provider, public routes or consent routing.

GEMMA_DIAGNOSTIC_UNTIL is opt-in and must be in the future within 15 minutes. The existing diagnostic sends only Reply with the single word OK to the configured Gemma model and its supported fallback, first with minimal settings and then app-style generation settings if the minimal call succeeds. It never accepts event notes, logs keys or logs model output. Minimal failure skips that model's settings call; there are no diagnostic retries. Each request has a 20-second timeout. This is a small connectivity/configuration test, not a full event-pack quality test. A startup during the opt-in window can repeat the diagnostic, so the flag is cleared after inspection.

120 software tests pass, including the expiry boundary and confirmation that enabling a diagnostic does not change the selected Groq provider/key. User-configured keys are preserved; only the nonsecret expiry flag is merged through Render configuration. No key is retrieved into the coding workspace.

## Observed results

Diagnostic code 5c9e566369e9b073716ba0e6f5c3fa79444c482a deployed live on dep-dbebtipsrm7s73bl2oc0. Groq stayed active; its metadata check returned 200 with GPT-OSS 120B available.

The new Google key was configured. Gemma 26B minimal inference returned HTTP 200 with usable OK reply in 1,809 ms, and app-style settings returned HTTP 200 with usable reply in 579 ms. Gemma 31B minimal inference timed out at 20,004 ms, so its settings variant was skipped. There were no retries or real event notes in this diagnostic.

Google's separate GET model-metadata check returned 403, while both 26B generation POSTs succeeded. This discrepancy is preserved without asserting a cause or treating metadata failure as proof that inference is unavailable. No raw provider error bodies or key values were retrieved. A successful tiny reply does not establish successful long-prompt/schema/event-pack generation or eliminate the earlier intermittent 500 errors. Groq remains selected for public generation. The diagnostic expiry flag is cleared after reading these results.
