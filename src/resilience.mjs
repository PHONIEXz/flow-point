import { AppError } from './gemma.mjs';

// Per-process circuit state contains provider IDs and expiry times, never user notes.
export function createProviderRunner({ generate, providers, now = Date.now, cooldownMs = 60000 }) {
  const failures = new Map();
  const retryable = error => [429, 502, 503, 504].includes(error.status) && !['PROVIDER_REQUEST_REJECTED', 'MODEL_BLOCKED', 'MODEL_CONTENT_MISSING', 'MODEL_JSON_INVALID', 'MODEL_PLAN_INVALID', 'MODEL_OUTPUT_INVALID', 'MODEL_RESPONSE_INVALID', 'MODEL_TRUNCATED'].includes(error.code);
  return async function run(input, selected, shared = {}, allowFallback = false) {
    const alternate = selected.provider === 'google' ? 'groq' : 'google';
    const choices = [selected, ...(allowFallback && providers[alternate]?.apiKey ? [providers[alternate]] : [])];
    let lastError;
    for (const choice of choices) {
      if (shared.signal?.aborted) throw new AppError(499, 'Generation cancelled.');
      const state = failures.get(choice.provider);
      if (state?.until > now()) {
        lastError = new AppError(503, 'This AI provider is temporarily paused after failures. Your draft is safe. Try the other provider or wait a minute.', 'PROVIDER_COOLDOWN');
        continue;
      }
      try {
        const result = await generate(input, { ...shared, ...choice, attemptTimeoutMs: 45000, maxAttempts: 2 });
        failures.delete(choice.provider);
        return { ...result, provenance: { ...result.provenance, ...(choice.provider !== selected.provider ? { fallbackFrom: selected.provider } : {}) } };
      } catch (error) {
        lastError = error;
        if (!retryable(error)) throw error;
        const count = (state?.count || 0) + 1;
        failures.set(choice.provider, { count, until: error.status === 429 || count >= 2 ? now() + cooldownMs : 0 });
      }
    }
    throw lastError;
  };
}
