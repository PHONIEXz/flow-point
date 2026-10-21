import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createApp } from '../src/server.mjs';
import { generatePack, parseModelPlan } from '../src/gemma.mjs';
const sample = JSON.parse(await readFile(new URL('../examples/school-event.json', import.meta.url), 'utf8'));
function complete() { return { ...structuredClone(sample), startTime: '10:00', organizer: 'Example School', signatory: 'Principal', openQuestions: [], budget: [{ label: 'Paper', quantity: 3, unitCostMinor: 101 }], drafts: { invitation: 'Reviewed invitation.', schedule: '10:00 Welcome. 11:00 Closing.' } }; }
async function app(t, config = {}) { const server = createApp(config); server.listen(0, '127.0.0.1'); await once(server, 'listening'); t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); })); const base = `http://127.0.0.1:${server.address().port}`; return { get: path => fetch(base + path), post: (path, data, headers = {}) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) }) }; }

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
  assert.equal((await client.get('/src/server.mjs')).status, 404);
  assert.equal((await client.get('/.env')).status, 404);
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
