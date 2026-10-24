import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createApp } from '../src/server.mjs';
import { generatePack, parseModelPlan, checkModelAccess, probeGeneration } from '../src/gemma.mjs';
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
  assert.match(JSON.parse(seen.options.body).systemInstruction.parts[0].text, /Unknown facts MUST be null/);
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
  const packPage = await client.get('/workspace/pack'); assert.equal(packPage.status, 200);
  assert.match(await packPage.text(), /class="workspace-body pack-page"/);
  const module = await client.get('/pack-store.mjs'); assert.equal(module.status, 200); assert.match(module.headers.get('content-type'), /text\/javascript/);
  const moneyModule = await client.get('/money.mjs'); assert.equal(moneyModule.status, 200); assert.match(await moneyModule.text(), /export function minorToDecimal/);
  assert.equal((await client.get('/src/server.mjs')).status, 404);
  assert.equal((await client.get('/.env')).status, 404);
});

test('PDF exports are attachments for draft and approved packs, including unknown prices', async t => {
  const client = await app(t);
  const fixture = await (await client.get('/api/sample')).json();
  let response = await client.post('/api/export', { plan: fixture.plan, format: 'pdf', sample: true });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  assert.match(response.headers.get('content-disposition'), /attachment; filename="sample-school-family-day-.*-pack-draft-.*\.pdf"/);
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


test('export names identify event, status and format and are unique even for repeated downloads', async t => {
  const client = await app(t);
  const plan = { ...complete(), title: 'Young Minds: Science / Reading "Day"' };
  const names = [];
  for (const format of ['pdf', 'pdf', 'md', 'csv']) {
    const response = await client.post('/api/export', { plan, format });
    assert.equal(response.status, 200);
    const name = response.headers.get('content-disposition').match(/filename="([^"]+)"/)[1];
    assert.match(name, /^young-minds-science-reading-day-/);
    assert.match(name, new RegExp(`-${format === 'csv' ? 'budget' : 'pack'}-draft-.*\\.${format}$`));
    assert.doesNotMatch(name, /[\r\n"\/]/);
    names.push(name);
    await response.arrayBuffer();
  }
  assert.equal(new Set(names).size, names.length);
  const { approval } = await (await client.post('/api/approve', { plan, confirmed: true })).json();
  const approved = await client.post('/api/export', { plan, approval, format: 'md' });
  assert.match(approved.headers.get('content-disposition'), /-pack-approved-/);
});


test('transient errors retry twice then use the supported Gemma fallback with honest provenance', async () => {
  const urls = [], delays = [];
  const result = await generatePack({ request: 'Fictional school test.' }, {
    apiKey: 'private-fixture', wait: async ms => delays.push(ms),
    fetchImpl: async url => { urls.push(url); return urls.length < 3 ? Response.json({ error: { status: 'INTERNAL' } }, { status: 500 }) : Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(complete()) }] } }] }); }
  });
  assert.equal(urls.length, 3);
  assert.match(urls[0], /gemma-4-26b-a4b-it:generateContent$/);
  assert.match(urls[1], /gemma-4-26b-a4b-it:generateContent$/);
  assert.match(urls[2], /gemma-4-31b-it:generateContent$/);
  assert.ok(delays[0] >= 1000 && delays[1] >= 2000);
  assert.equal(result.provenance.model, 'gemma-4-31b-it');
  assert.equal(result.provenance.requestedModel, 'gemma-4-26b-a4b-it');
  assert.equal(result.provenance.attempts, 3);
});

test('retries are bounded, stop on cancellation, and never retry quota or key errors', async () => {
  let calls = 0;
  await assert.rejects(generatePack({ request: 'Fictional event.' }, { apiKey: 'test', wait: async () => {}, fetchImpl: async () => { calls++; return Response.json({ error: { message: 'secret provider text' } }, { status: 500 }); } }), error => error.status === 502 && !error.message.includes('secret'));
  assert.equal(calls, 3);
  for (const status of [400, 401, 403, 429]) {
    calls = 0;
    await assert.rejects(generatePack({ request: 'Fictional event.' }, { apiKey: 'test', wait: async () => assert.fail('must not wait'), fetchImpl: async () => { calls++; return Response.json({ error: {} }, { status }); } }));
    assert.equal(calls, 1);
  }
  calls = 0; const controller = new AbortController();
  await assert.rejects(generatePack({ request: 'Fictional event.' }, { apiKey: 'test', signal: controller.signal, wait: async () => controller.abort(), fetchImpl: async () => { calls++; return new Response('', { status: 503 }); } }), error => error.status === 499);
  assert.equal(calls, 1);
});


test('request references correlate attempts, successes and failures without logging private content', async t => {
  const logs = [];
  const client = await app(t, { apiKey: 'private-key-marker', log: entry => logs.push(entry), fetchImpl: async () => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(complete()) }] } }] }) });
  const response = await client.post('/api/generate', { request: 'private-note-marker event.', previousPlan: complete(), answers: 'private-answer-marker' });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-request-id'), result.requestId);
  assert.ok(logs.some(entry => entry.event === 'generation_request_succeeded'));
  assert.ok(logs.some(entry => entry.event === 'gemma_generation_attempt'));
  assert.ok(logs.every(entry => entry.requestId === result.requestId && entry.action === 'update'));
  const failed = await app(t, { apiKey: 'private-key-marker', log: entry => logs.push(entry), fetchImpl: async () => Response.json({ error: { message: 'private-upstream-marker' } }, { status: 403 }) });
  const failure = await failed.post('/api/generate', { request: 'private-note-marker event.' });
  const error = await failure.json();
  assert.equal(failure.status, 503);
  assert.equal(failure.headers.get('x-request-id'), error.requestId);
  assert.notEqual(error.requestId, result.requestId);
  assert.ok(logs.some(entry => entry.event === 'generation_request_failed' && entry.requestId === error.requestId));
  assert.doesNotMatch(JSON.stringify(logs), /private-(key|note|answer|upstream)-marker/);
});

test('minimal probes omit all generation settings, do not retry errors and never log output', async () => {
  const payloads = [], logs = [];
  const results = await probeGeneration({ apiKey: 'private-key-marker', log: entry => logs.push(entry), fetchImpl: async (url, options) => {
    payloads.push(JSON.parse(options.body));
    return payloads.length === 1 ? Response.json({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] }) : Response.json({ error: { message: 'private-provider-marker' } }, { status: 500 });
  } });
  assert.equal(results.length, 3);
  assert.deepEqual(Object.keys(payloads[0]), ['contents']);
  assert.equal(payloads[1].generationConfig.thinkingConfig.thinkingLevel, 'minimal');
  assert.deepEqual(Object.keys(payloads[2]), ['contents']);
  assert.equal(results[0].usableReply, true);
  assert.equal(results[1].httpStatus, 500);
  assert.equal(results[2].model, 'gemma-4-31b-it');
  assert.doesNotMatch(JSON.stringify(logs), /private-|Reply with|candidates/);
});


test('invalid model JSON and invalid plan fields have separate safe diagnostic codes', () => {
  assert.throws(() => parseModelPlan('private-invalid-output'), error => error.code === 'MODEL_JSON_INVALID' && !error.message.includes('private'));
  const invalid = complete(); invalid.eventDate = '2026-02-30';
  assert.throws(() => parseModelPlan(JSON.stringify(invalid)), error => error.code === 'MODEL_PLAN_INVALID');
});


test('PDF download names preserve event title spelling and Unicode with safe unique suffixes', async t => {
  const client = await app(t);
  const names = [];
  for (const title of ['Young Minds: Science, Reading and Creativity Day', 'École Ọmọ Learning Day', 'CON', 'x'.repeat(200), 'Broken \ud800 title', '🎉'.repeat(100)]) {
    for (let copy = 0; copy < 2; copy++) {
      const response = await client.post('/api/export', { plan: { ...complete(), title }, format: 'pdf' });
      const header = response.headers.get('content-disposition');
      const name = decodeURIComponent(header.match(/filename\*=UTF-8''([^;]+)/)[1]);
      const expected = title === 'CON' ? 'Event CON' : title.startsWith('🎉') ? '🎉'.repeat(42) : title.toWellFormed().replace(':', '-').slice(0, 170);
      assert.ok(name.startsWith(expected + ' - '));
      assert.doesNotMatch(name, /[<>:"/\\|?*\u0000-\u001f]/);
      assert.ok(Buffer.byteLength(name) <= 255);
      assert.ok(name.endsWith('.pdf'));
      names.push(name);
      await response.arrayBuffer();
    }
  }
  assert.equal(new Set(names).size, names.length);
});

test('malformed provider envelopes remain safe upstream errors rather than client validation failures', async t => {
  for (const payload of [null, {}, { candidates: {} }, { candidates: [null] }, { candidates: [{ content: { parts: {} } }] }, { candidates: [{ content: { parts: [null, { text: 42 }] } }] }]) {
    const client = await app(t, { apiKey: 'test', log: () => {}, fetchImpl: async () => Response.json(payload) });
    const response = await client.post('/api/generate', { request: 'Prepare a school event.' });
    assert.equal(response.status, 502);
    assert.doesNotMatch((await response.json()).error, /This plan could not be validated/);
  }
  await assert.rejects(generatePack({ request: 'School event' }, { apiKey: 'test', log: () => {}, fetchImpl: async () => Response.json(null, { status: 403 }) }), error => error.status === 503);
});


test('a malformed request URL returns 400 and leaves the server healthy', async t => {
  const server = createApp({ apiKey: '' });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const port = server.address().port;
  const response = await new Promise((resolve, reject) => {
    const req = httpRequest({ hostname: '127.0.0.1', port, path: 'http://[', method: 'GET' }, res => { res.resume(); res.on('end', () => resolve(res)); });
    req.on('error', reject); req.end();
  });
  assert.equal(response.statusCode, 400);
  assert.equal((await fetch(`http://127.0.0.1:${port}/healthz`)).status, 200);
});

test('malformed JSON regenerates from original input on fallback without forwarding broken output', async () => {
  const input = { request: 'private-request-marker event', answers: 'private-answer-marker', previousPlan: complete() };
  const before = structuredClone(input), calls = [], logs = [];
  const result = await generatePack(input, { apiKey: 'private-key-marker', requestId: 'recovery-test', action: 'update', wait: async () => {}, log: entry => logs.push(entry), fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: calls.length === 1 ? '{"title":"private-broken-output-marker",' : JSON.stringify(complete()) }] } }] });
  } });
  assert.equal(result.provenance.attempts, 2);
  assert.equal(result.provenance.model, 'gemma-4-31b-it');
  assert.match(calls[1].url, /gemma-4-31b-it:generateContent$/);
  assert.equal(calls[0].options.signal, calls[1].options.signal);
  const prompt = JSON.parse(calls[1].options.body).contents[0].parts[0].text;
  assert.match(prompt, /RETRY:.*failed JSON or pack validation/);
  assert.doesNotMatch(prompt, /private-broken-output-marker/);
  assert.deepEqual(JSON.parse(prompt.split('\n\nINPUT DATA:\n')[1]), before);
  assert.deepEqual(input, before);
  assert.ok(logs.some(entry => entry.event === 'gemma_generation_retry' && entry.code === 'MODEL_JSON_INVALID' && entry.httpStatus === 200));
  assert.doesNotMatch(JSON.stringify(logs), /private-(key|request|answer|broken-output)-marker/);
});

test('invalid plan fields are rejected before recovery and a regenerated pack must pass strict validation', async () => {
  const invalid = { ...complete(), eventDate: '2026-02-30' }; let calls = 0;
  assert.throws(() => parseModelPlan(JSON.stringify(invalid)), error => error.code === 'MODEL_PLAN_INVALID');
  const result = await generatePack({ request: 'Fictional event.' }, { apiKey: 'test', wait: async () => {}, log: () => {}, fetchImpl: async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(++calls === 1 ? invalid : complete()) }] } }] }) });
  assert.equal(calls, 2); assert.equal(result.plan.eventDate, complete().eventDate);
  assert.equal(result.provenance.attempts, 2);
});

test('HTTP and invalid-output retries share one three-attempt cap and preserve the final diagnostic code', async () => {
  const invalid = { ...complete(), budget: [{ label: 'Paper', quantity: 0, unitCostMinor: 100 }] };
  let calls = 0;
  await assert.rejects(generatePack({ request: 'Fictional event.' }, { apiKey: 'test', wait: async () => {}, log: () => {}, fetchImpl: async () => {
    calls++;
    if (calls === 1) return Response.json({}, { status: 500 });
    return Response.json({ candidates: [{ content: { parts: [{ text: calls === 2 ? 'not JSON' : JSON.stringify(invalid) }] } }] });
  } }), error => error.status === 502 && error.code === 'MODEL_PLAN_INVALID');
  assert.equal(calls, 3);
});

test('invalid-output recovery stops on cancellation or timeout', async () => {
  const controller = new AbortController(); let calls = 0;
  await assert.rejects(generatePack({ request: 'Fictional event.' }, { apiKey: 'test', signal: controller.signal, log: () => {}, wait: async () => controller.abort(), fetchImpl: async () => { calls++; return Response.json({ candidates: [{ content: { parts: [{ text: 'broken JSON' }] } }] }); } }), error => error.status === 499);
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(generatePack({ request: 'Fictional event.' }, { apiKey: 'test', log: () => {}, wait: async () => {}, fetchImpl: async () => {
    if (++calls === 2) { const error = new Error('Timeout'); error.name = 'TimeoutError'; throw error; }
    return Response.json({ candidates: [{ content: { parts: [{ text: 'broken JSON' }] } }] });
  } }), error => error.status === 504);
  assert.equal(calls, 2);
});

test('safety blocks and token truncation are not retried as malformed JSON', async () => {
  for (const payload of [{ promptFeedback: { blockReason: 'SAFETY' } }, { candidates: [{ finishReason: 'SAFETY' }] }, { candidates: [{ finishReason: 'MAX_TOKENS' }] }]) {
    let calls = 0;
    await assert.rejects(generatePack({ request: 'Fictional event.' }, { apiKey: 'test', log: () => {}, wait: async () => assert.fail('must not retry'), fetchImpl: async () => { calls++; return Response.json(payload); } }), error => error.status === 502);
    assert.equal(calls, 1);
  }
});

test('HTTP generation recovers malformed output and reports the same reference if retries exhaust', async t => {
  let calls = 0;
  const recovered = await app(t, { apiKey: 'test', log: () => {}, fetchImpl: async () => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: ++calls === 1 ? '{"title":' : JSON.stringify(complete()) }] } }] }) });
  const response = await recovered.post('/api/generate', { request: 'Fictional school event.' });
  const data = await response.json();
  assert.equal(response.status, 200); assert.equal(data.provenance.attempts, 2);
  assert.equal(response.headers.get('x-request-id'), data.requestId);
  calls = 0;
  const failed = await app(t, { apiKey: 'test', log: () => {}, fetchImpl: async () => { calls++; return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"title":' }] } }] }); } });
  const rejected = await failed.post('/api/generate', { request: 'Fictional school event.' });
  const error = await rejected.json();
  assert.equal(rejected.status, 502); assert.equal(error.code, 'MODEL_JSON_INVALID'); assert.equal(calls, 3);
  assert.equal(rejected.headers.get('x-request-id'), error.requestId);
});

test('Gemma receives one data-only pack function and native arguments preserve quotes and paragraphs', async () => {
  let payload;
  const plan = complete(); plan.drafts.invitation = 'Dear "Parents",\n\nJoin us at the hall.\nAda Bello';
  const result = await generatePack({ request: 'private-note-marker event' }, { apiKey: 'test', log: () => {}, fetchImpl: async (_, options) => {
    payload = JSON.parse(options.body);
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'ignored model reasoning', thought: true }, { functionCall: { name: 'submit_event_pack', args: plan } }] } }] });
  } });
  assert.equal(result.plan.drafts.invitation, plan.drafts.invitation);
  assert.equal(result.provenance.responseFormat, 'function-call');
  assert.equal(payload.toolConfig.functionCallingConfig.mode, 'ANY');
  assert.deepEqual(payload.toolConfig.functionCallingConfig.allowedFunctionNames, ['submit_event_pack']);
  const declarations = payload.tools[0].functionDeclarations;
  assert.equal(declarations.length, 1); assert.equal(declarations[0].name, 'submit_event_pack');
  const schema = declarations[0].parameters;
  assert.deepEqual([...schema.required].sort(), Object.keys(plan).sort());
  assert.equal(schema.properties.eventDate.nullable, true);
  assert.equal(schema.properties.budget.items.properties.unitCostMinor.nullable, true);
  assert.doesNotMatch(payload.systemInstruction.parts[0].text, /private-note-marker/);
  assert.match(payload.contents[0].parts[0].text, /private-note-marker/);
});

test('native pack arguments still require strict field validation before recovery', async () => {
  let calls = 0;
  const invalid = { ...complete(), budget: [{ label: 'Paper', quantity: 2, unitCostMinor: 1.5 }] };
  const result = await generatePack({ request: 'Fictional event.' }, { apiKey: 'test', log: () => {}, wait: async () => {}, fetchImpl: async () => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ functionCall: { name: 'submit_event_pack', args: ++calls === 1 ? invalid : complete() } }] } }] }) });
  assert.equal(calls, 2); assert.equal(result.provenance.responseFormat, 'function-call');
  assert.deepEqual(result.plan.budget, complete().budget);
});

test('unexpected or multiple function calls are rejected rather than executed or silently selected', async () => {
  for (const functions of [[{ name: 'send_invitation', args: complete() }], [{ name: 'submit_event_pack', args: complete() }, { name: 'submit_event_pack', args: complete() }], [{ name: 'submit_event_pack', args: 'invalid string' }]]) {
    let calls = 0;
    await assert.rejects(generatePack({ request: 'Fictional event.' }, { apiKey: 'test', log: () => {}, wait: async () => {}, fetchImpl: async () => { calls++; return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: functions.map(functionCall => ({ functionCall })) } }] }); } }), error => error.code === 'MODEL_OUTPUT_INVALID');
    assert.equal(calls, 3);
  }
});

test('a malformed native function response can recover within the same bounded attempt budget', async () => {
  let calls = 0;
  const result = await generatePack({ request: 'Fictional event.' }, { apiKey: 'test', log: () => {}, wait: async () => {}, fetchImpl: async () => Response.json(++calls === 1 ? { candidates: [{ finishReason: 'MALFORMED_FUNCTION_CALL' }] } : { candidates: [{ finishReason: 'STOP', content: { parts: [{ functionCall: { name: 'submit_event_pack', args: complete() } }] } }] }) });
  assert.equal(calls, 2); assert.equal(result.provenance.attempts, 2);
  assert.equal(result.provenance.responseFormat, 'function-call');
});

test('detailed inputs start on the larger Gemma while short inputs keep the configured primary', async () => {
  for (const [request, expected] of [['Short fictional event.', 'gemma-4-26b-a4b-it'], ['Detailed event '.repeat(500), 'gemma-4-31b-it']]) {
    let used;
    const result = await generatePack({ request }, { apiKey: 'test', log: () => {}, fetchImpl: async url => { used = url; return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ functionCall: { name: 'submit_event_pack', args: complete() } }] } }] }); } });
    assert.ok(used.includes(expected + ':generateContent'));
    assert.equal(result.provenance.model, expected);
    assert.equal(result.provenance.primaryModel, expected);
    assert.equal(result.provenance.requestedModel, 'gemma-4-26b-a4b-it');
  }
});

test('safe response diagnostics record stop categories and token counts without raw model content', async () => {
  const logs = [];
  await assert.rejects(generatePack({ request: 'private-note-marker' }, { apiKey: 'private-key-marker', log: entry => logs.push(entry), fetchImpl: async () => Response.json({ usageMetadata: { candidatesTokenCount: 4096 }, candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'private-output-marker' }] } }] }) }), error => error.status === 502);
  const diagnostic = logs.find(entry => entry.event === 'gemma_generation_response');
  assert.equal(diagnostic.finishReason, 'MAX_TOKENS'); assert.equal(diagnostic.outputTokens, 4096);
  assert.doesNotMatch(JSON.stringify(logs), /private-(note|key|output)-marker/);
});
