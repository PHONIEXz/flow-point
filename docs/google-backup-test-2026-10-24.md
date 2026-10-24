# New Google key diagnostic with Groq active

The user saved a new GEMINI_API_KEY and redeployed. The live app remained configured for Groq GPT-OSS 120B. A short-lived server-start diagnostic can now test the separately stored Google key without changing the active provider, public routes or consent routing.

GEMMA_DIAGNOSTIC_UNTIL is opt-in and must be in the future within 15 minutes. The existing diagnostic sends only Reply with the single word OK to the configured Gemma model and its supported fallback, first with minimal settings and then app-style generation settings if the minimal call succeeds. It never accepts event notes, logs keys or logs model output. Minimal failure skips that model's settings call; there are no diagnostic retries. Each request has a 20-second timeout. This is a small connectivity/configuration test, not a full event-pack quality test. A startup during the opt-in window can repeat the diagnostic, so the flag is cleared after inspection.

120 software tests pass, including the expiry boundary and confirmation that enabling a diagnostic does not change the selected Groq provider/key. User-configured keys are preserved; only the nonsecret expiry flag is merged through Render configuration. No key is retrieved into the coding workspace.
