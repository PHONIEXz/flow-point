import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generatePack } from '../src/gemma.mjs';
import { prepareInStages } from '../public/generation.mjs';
const sample = JSON.parse(await readFile(new URL('../examples/school-event.json', import.meta.url), 'utf8'));
const quiet = { apiKey: 'test', log() {}, wait: async () => {} };
function native(name, args) { return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ functionCall: { name, args } }] } }] }); }
test('staged generation extracts facts, freezes money and assembles separately validated drafts', async () => {
  const names = []; const seen = [];
  const call = data => generatePack(data, { ...quiet, fetchImpl: async (_, options) => {
    const payload = JSON.parse(options.body); const name = payload.tools[0].functionDeclarations[0].name; names.push(name); seen.push(payload);
    if (name === 'submit_event_facts') return native(name, sample);
    return native(name, { [data.stage]: data.stage === 'invitation' ? 'Draft invitation.' : 'Draft schedule.' });
  } });
  const result = await prepareInStages({ request: 'A fictional school event request.' }, { call });
  assert.deepEqual(names, ['submit_event_facts', 'submit_event_invitation', 'submit_event_schedule']);
  assert.deepEqual(result.plan.budget, sample.budget);
  assert.equal(result.plan.budget[0].unitCostMinor, null);
  assert.deepEqual(result.plan.drafts, { invitation: 'Draft invitation.', schedule: 'Draft schedule.' });
  assert.equal(result.provenance.steps.length, 3);
  assert.equal(seen[0].tools[0].functionDeclarations[0].parameters.properties.drafts, undefined);
});
test('later draft cannot mutate checkpoint facts or inject extra actions', async () => {
  const checkpoint = { ...sample, drafts: { invitation: '', schedule: '' } };
  await assert.rejects(generatePack({ request: 'A fictional school event', stage: 'invitation', checkpoint }, { ...quiet, fetchImpl: async () => native('submit_event_invitation', { invitation: 'Draft.', budget: [] }) }), error => error.code === 'MODEL_PLAN_INVALID');
  await assert.rejects(generatePack({ request: 'A fictional school event', stage: 'schedule', checkpoint }, quiet), error => error.status === 400);
  await assert.rejects(generatePack({ request: 'A fictional school event', stage: 'invitation', checkpoint: { ...checkpoint, budget: [{ label: 'Bad', quantity: 1, unitCostMinor: -1 }] } }, quiet), error => error.status === 400);
});
test('failed later step reuses only saved successful steps after serialization and rejects changed inputs', async () => {
  let saved; const calls = []; let fail = true;
  const input = { request: 'An exact original event brief', answers: 'Original update', previousPlan: sample };
  const call = async data => {
    calls.push(data.stage);
    if (data.stage === 'invitation' && fail) throw new Error('Provider unavailable');
    return { plan: sample, provenance: { stage: data.stage, attempts: 1, durationMs: 10 } };
  };
  await assert.rejects(prepareInStages(input, { call, checkpoint: value => { saved = value; } }), /Provider unavailable/);
  assert.equal(saved.results.length, 1);
  fail = false;
  const result = await prepareInStages(input, { call, saved: JSON.parse(JSON.stringify(saved)) });
  assert.deepEqual(calls, ['facts', 'invitation', 'invitation', 'schedule']);
  assert.equal(result.provenance.reusedSteps, 1);
  calls.length = 0;
  await prepareInStages({ ...input, answers: 'A different update' }, { call, saved });
  assert.deepEqual(calls, ['facts', 'invitation', 'schedule']);
});
test('cancellation after a saved step stops the next request without discarding progress', async () => {
  const controller = new AbortController(); let saved; let calls = 0;
  await assert.rejects(prepareInStages({ request: 'Original event request' }, {
    signal: controller.signal,
    call: async data => { calls++; return { plan: sample, provenance: { stage: data.stage, attempts: 1, durationMs: 1 } }; },
    checkpoint: value => { saved = value; controller.abort(); }
  }), error => error.name === 'AbortError');
  assert.equal(calls, 1); assert.equal(saved.results.length, 1);
});

test('generated facts reject literal field labels and retry from source input', async () => {
  let calls = 0;
  const result = await generatePack({ request: 'Fictional event signed by Mrs Grace Okoro.', stage: 'facts' }, { ...quiet, fetchImpl: async () => {
    calls++; return native('submit_event_facts', { ...sample, signatory: calls === 1 ? 'signatory' : 'Mrs Grace Okoro' });
  } });
  assert.equal(calls, 2); assert.equal(result.plan.signatory, 'Mrs Grace Okoro');
});

test('a stalled staged provider call leaves time to try the fallback model', async () => {
  const models = [];
  const result = await generatePack({ request: 'A fictional event request.', stage: 'facts' }, { ...quiet, attemptTimeoutMs: 10, fetchImpl: async (url, options) => {
    models.push(url);
    if (models.length === 1) return new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
    return native('submit_event_facts', sample);
  } });
  assert.equal(models.length, 2); assert.match(models[1], /gemma-4-31b-it/);
  assert.equal(result.provenance.attempts, 2);
});

test('detailed staged input uses small validated JSON responses without native tool settings', async () => {
  let payload;
  const result = await generatePack({ request: 'Detailed fictional notes. '.repeat(250), stage: 'facts' }, { ...quiet, fetchImpl: async (_, options) => {
    payload = JSON.parse(options.body);
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(sample) }] } }] });
  } });
  assert.equal(payload.tools, undefined); assert.equal(payload.systemInstruction, undefined);
  assert.match(payload.contents[0].parts[0].text, /JSON data schema/);
  assert.equal(result.provenance.responseFormat, 'text-json');
  assert.equal(result.plan.title, sample.title);
});

test('production HTTP transport uses a compatible fetch/dispatcher pair', async t => {
  const { createServer } = await import('node:http');
  const { once } = await import('node:events');
  const { fetchModelResponse } = await import('../src/gemma.mjs');
  const server = createServer((req, res) => { res.setHeader('Content-Type', 'application/json'); res.end('{"ok":true}'); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const response = await fetchModelResponse(`http://127.0.0.1:${server.address().port}/`, { signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ok: true });
});

test('plain JSON Gemma 4 steps disable thinking and retry truncation with a larger bounded output budget', async () => {
  const payloads = [];
  const result = await generatePack({ request: 'Detailed fictional event notes. '.repeat(200), stage: 'facts' }, { ...quiet, fetchImpl: async (_, options) => {
    const payload = JSON.parse(options.body); payloads.push(payload);
    if (payloads.length === 1) return Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"title":"cut off' }] } }] });
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(sample) }] } }] });
  } });
  assert.equal(payloads.length, 2);
  assert.equal(payloads[0].generationConfig.thinkingConfig.thinkingLevel, 'minimal');
  assert.equal(payloads[0].generationConfig.maxOutputTokens, 8192);
  assert.equal(payloads[1].generationConfig.maxOutputTokens, 16384);
  assert.equal(payloads[1].generationConfig.thinkingConfig.thinkingLevel, 'minimal');
  assert.doesNotMatch(payloads[1].contents[0].parts[0].text, /cut off/);
  assert.equal(result.plan.title, sample.title);
});
