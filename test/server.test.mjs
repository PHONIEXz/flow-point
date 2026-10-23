import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createApp } from '../src/server.mjs';
import { generatePack, parseModelPlan, checkModelAccess } from '../src/gemma.mjs';
const sample = JSON.parse(await readFile(new URL('../examples/school-event.json', import.meta.url), 'utf8'));
function complete() { return { ...structuredClone(sample), startTime: '10:00', organizer: 'Example School', signatory: 'Principal', openQuestions: [], budget: [{ label: 'Paper', quantity: 3, unitCostMinor: 101 }], drafts: { invitation: 'Reviewed invitation.', schedule: '10:00 Welcome. 11:00 Closing.' } }; }
async function app(t, config = {}) { const server = createApp(config); server.listen(0, '127.0.0.1'); await once(server, 'listening'); t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); })); const base = `http://127.0.0.1:${server.address().port}`; return { get: path => fetch(base + path), post: (path, data, headers = {}, signal) => fetch(base + path, { signal, method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) }) }; }

test('HTTP flow: sample -> edit -> approve -> export -> edit invalidates approval', async t => {
  const client = await app(t, { apiKey: '' });
  const sampleResponse = await client.get('/api/sample'); assert.equal(sampleResponse.status, 200);
  const fixture = await sampleResponse.json(); assert.equal(fixture.provenance.mode, 'sample'); assert.ok(fixture.issues.length);
  let response = await client.post('/api/approve', { plan: fixture.plan, confirmed: true }); assert.equal(response.status, 400);
  const plan = complete(); response = await client.post('/api/approve', { plan, confirmed: true }); assert.equal(response.status, 200);
  const { approval } = await response.json();
  response = await client.post('/api/export', { plan, approval }); assert.match(await response.text(), /Status: Approved/);
  plan.venue = 'New hall'; response = await client.post('/api/review', { plan, approval }); assert.equal((await response.json()).approved, false);
  response = await client.post('/api/export', { plan, approval }); assert.match(await response.text(), /Status: Draft/);
});
test('blocks forged approvals and demands explicit review confirmation', async t => {
  const client = await app(t);
  assert.equal((await client.post('/api/approve', { plan: complete() })).status, 400);
  const response = await client.post('/api/export', { plan: complete(), approval: { fingerprint: 'fake' } });
  assert.match(await response.text(), /Status: Draft/);
});
test('sample and provider configuration never expose a secret or pretend to be live', async t => {
  const client = await app(t, { apiKey: 'private-test-secret' });
  const config = await (await client.get('/api/config')).text(); assert.doesNotMatch(config, /private-test-secret/); assert.equal(JSON.parse(config).liveAvailable, true);
  assert.equal((await (await client.get('/api/sample')).json()).provenance.mode, 'sample');
});
test('missing key gives an honest unavailable error with no sample fallback', async t => {
  const client = await app(t, { apiKey: '' });
  const response = await client.post('/api/generate', { request: 'Prepare a school event next week.' });
  assert.equal(response.status, 503); assert.match((await response.json()).error, /not connected/);
});
test('live provider adapter sends the key only in a header and validates returned plans', async t => {
  let seen;
  const client = await app(t, { apiKey: 'secret-fixture-key', fetchImpl: async (url, options) => { seen = { url, options }; return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(complete()) }] } }] }); } });
  const response = await client.post('/api/generate', { request: 'School event on 23 October 2026 at Example School.' });
  assert.equal(response.status, 200); const result = await response.json(); assert.equal(result.provenance.mode, 'live'); assert.match(result.provenance.model, /^gemma-/);
  assert.ok(!seen.url.includes('secret-fixture-key')); assert.equal(seen.options.headers['x-goog-api-key'], 'secret-fixture-key');
  assert.match(JSON.parse(seen.options.body).contents[0].parts[0].text, /Unknown facts MUST be null/);
  assert.equal(JSON.parse(seen.options.body).generationConfig.thinkingConfig.thinkingLevel, 'minimal');
});
test('provider quota, bad output, truncated output and network failures are actionable', async () => {
  const input = { request: 'A school event request.' };
  for (const [response, status] of [[new Response('', { status: 429 }), 429], [new Response('', { status: 403 }), 503], [Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{}' }] } }] }), 502], [Response.json({ candidates: [{ content: { parts: [{ text: 'invalid json' }] } }] }), 502]]) {
    await assert.rejects(generatePack(input, { apiKey: 'test', fetchImpl: async () => response }), error => error.status === status);
  }
  await assert.rejects(generatePack(input, { apiKey: 'test', fetchImpl: async () => { throw new Error('secret upstream failure'); } }), error => error.status === 502 && !error.message.includes('secret'));
});
test('rejects cross-site actions, malformed data, oversized requests and invalid money', async t => {
  const client = await app(t);
  assert.equal((await client.post('/api/review', { plan: complete() }, { Origin: 'https://other.test' })).status, 403);
  assert.equal((await client.post('/api/review', { plan: complete() }, { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await client.post('/api/generate', { request: 'short' })).status, 400);
  assert.equal((await client.post('/api/generate', { request: 'x'.repeat(110000) })).status, 413);
  const plan = complete(); plan.budget[0].unitCostMinor = 1.01;
  assert.equal((await client.post('/api/review', { plan })).status, 400);
});
test('model JSON parser accepts a fenced JSON block but rejects prose and invalid dates', () => {
  assert.equal(parseModelPlan('```json\n' + JSON.stringify(complete()) + '\n```').plan.title, sample.title);
  assert.throws(() => parseModelPlan('Here you go: ' + JSON.stringify(complete())));
  assert.throws(() => parseModelPlan(JSON.stringify({ ...complete(), eventDate: '2026-02-30' })));
});
test('health and static routes use restrictive headers and never serve server files', async t => {
  const client = await app(t);
  assert.equal((await client.get('/healthz')).status, 200);
  const response = await client.get('/workspace'); assert.equal(response.status, 200); assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
  assert.match(await response.text(), /src="\/workspace.js" type="module"/);
  const module = await client.get('/pack-store.mjs'); assert.equal(module.status, 200); assert.match(module.headers.get('content-type'), /text\/javascript/);
  assert.equal((await client.get('/src/server.mjs')).status, 404);
  assert.equal((await client.get('/.env')).status, 404);
});

test('PDF exports are attachments for draft and approved packs, including unknown prices', async t => {
  const client = await app(t);
  const fixture = await (await client.get('/api/sample')).json();
  let response = await client.post('/api/export', { plan: fixture.plan, format: 'pdf', sample: true });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  assert.match(response.headers.get('content-disposition'), /attachment; filename="flow-point-pack.pdf"/);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  assert.match(bytes.subarray(-30).toString(), /%%EOF/);
  const plan = complete();
  const { approval } = await (await client.post('/api/approve', { plan, confirmed: true })).json();
  response = await client.post('/api/export', { plan, approval, format: 'pdf' });
  assert.equal(response.status, 200);
  assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
  response = await client.post('/api/export', { plan: { ...plan, eventDate: '2026-02-30' }, format: 'pdf' });
  assert.equal(response.status, 400);
});


test('provider setup failures are specific without leaking upstream data', async () => {
  for (const [status, error, expected] of [
    [400, { message: 'API key not valid. secret-value', details: [{ reason: 'API_KEY_INVALID' }] }, /invalid or expired/],
    [403, { details: [{ reason: 'API_KEY_SERVICE_BLOCKED' }] }, /key restrictions/],
    [404, { message: 'secret-value' }, /configured Gemma model/],
    [400, { message: 'secret-value' }, /HTTP 400/]
  ]) {
    await assert.rejects(generatePack({ request: 'Example event request' }, { apiKey: 'secret-value', fetchImpl: async () => Response.json({ error }, { status }) }), failure => expected.test(failure.message) && !failure.message.includes('secret-value'));
  }
});

test('startup model check records status without returning key or provider response', async () => {
  const result = await checkModelAccess({ apiKey: 'private-value', fetchImpl: async () => new Response('private-upstream-body', { status: 200 }) });
  assert.equal(result.available, true); assert.equal(result.httpStatus, 200);
  assert.doesNotMatch(JSON.stringify(result), /private/);
});
test('cancellation and timeout while reading the provider body cannot return a new pack', async () => {
  const controller = new AbortController();
  await assert.rejects(generatePack({ request: 'Prepare Reading Day.' }, { apiKey: 'test', signal: controller.signal, fetchImpl: async () => ({ ok: true, json: async () => { controller.abort(); return { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(complete()) }] } }] }; } }) }), error => error.status === 499);
  await assert.rejects(generatePack({ request: 'Prepare Reading Day.' }, { apiKey: 'test', fetchImpl: async () => ({ ok: true, json: async () => { throw new DOMException('timed out', 'TimeoutError'); } }) }), error => error.status === 504);
});


test('disconnect cancels upstream work and releases both generation slots', { timeout: 5000 }, async t => {
  let started = 0, aborted = 0, respond = false;
  let firstStarted, bothStarted, bothAborted;
  const first = new Promise(resolve => { firstStarted = resolve; });
  const both = new Promise(resolve => { bothStarted = resolve; });
  const cancelled = new Promise(resolve => { bothAborted = resolve; });
  const client = await app(t, { apiKey: 'test', fetchImpl: async (_url, { signal }) => {
    if (respond) return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(complete()) }] } }] });
    started++; if (started === 1) firstStarted(); if (started === 2) bothStarted();
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => {
      aborted++; if (aborted === 2) bothAborted(); reject(signal.reason);
    }, { once: true }));
  } });
  const a = new AbortController(), b = new AbortController();
  const input = { request: 'Prepare a reading day event.' };
  const one = client.post('/api/generate', input, {}, a.signal).catch(error => error);
  await first;
  const two = client.post('/api/generate', input, {}, b.signal).catch(error => error);
  await both;
  assert.equal((await client.post('/api/generate', input)).status, 429);
  a.abort(); b.abort(); await Promise.all([one, two, cancelled]);
  respond = true;
  assert.equal((await client.post('/api/generate', input)).status, 200);
  assert.equal(aborted, 2);
});
