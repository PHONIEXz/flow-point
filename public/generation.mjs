// Browser-local checkpoints contain event data, never credentials. They are not approvals.
export const generationStages = ['facts', 'invitation', 'schedule'];
export function generationKey(input) { return JSON.stringify({ version: 3, request: input.request, answers: input.answers || '', previousPlan: input.previousPlan || null }); }
export async function prepareInStages(input, { call, saved = null, checkpoint = () => {}, progress = () => {}, signal } = {}) {
  const key = generationKey(input);
  let work = { key, results: [] };
  if (saved?.key === key && Array.isArray(saved.results) && saved.results.length <= 3 && saved.results.every((r, i) => r?.plan && r?.provenance?.stage === generationStages[i])) work = structuredClone(saved);
  const reused = work.results.length;
  for (let index = work.results.length; index < generationStages.length; index++) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const stage = generationStages[index];
    progress({ stage, index, reused });
    const result = await call({ ...input, stage, checkpoint: work.results.at(-1)?.plan || null }, signal);
    if (!result?.plan || result.provenance?.stage !== stage) throw new Error('The server returned an incompatible generation step. Reload the app and retry.');
    work.results.push(result);
    await checkpoint(structuredClone(work));
  }
  const last = work.results.at(-1);
  return { ...last, provenance: { ...last.provenance, pipeline: 'staged-v1', attempts: work.results.reduce((n, r) => n + r.provenance.attempts, 0), durationMs: work.results.reduce((n, r) => n + r.provenance.durationMs, 0), reusedSteps: reused, steps: work.results.map(r => ({ stage: r.provenance.stage, model: r.provenance.model, durationMs: r.provenance.durationMs, attempts: r.provenance.attempts, requestId: r.requestId })) } };
}
