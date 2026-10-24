import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { prepareInStages } from '../public/generation.mjs';
import * as store from '../public/pack-store.mjs';
import { downloadFilename } from '../public/download-name.mjs';
import { minorToDecimal, formatMinor } from '../public/money.mjs';
import * as sourceFields from '../public/source-fields.mjs';
import { letterLayout } from '../public/letter-layout.mjs';
import * as updateHistory from '../public/update-history.mjs';
import { reviewPlan } from '../src/plan.mjs';
const source = (await readFile(new URL('../public/workspace.js', import.meta.url), 'utf8')).replace(/^import .*;$/gm, '');
const sample = JSON.parse(await readFile(new URL('../examples/school-event.json', import.meta.url), 'utf8'));
const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
function harness(fetchImpl, initial = null, { fastTimeouts = false } = {}) {
  const elements = new Map();
  function element(id = '') {
    return { id, value: '', checked: false, disabled: false, hidden: false, dataset: {}, attributes: {}, handlers: {}, children: [],
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener(type, fn) { this.handlers[type] = fn; },
      setAttribute(key, value) { this.attributes[key] = value; }, removeAttribute(key) { delete this.attributes[key]; }, getAttribute(key) { return this.attributes[key]; },
      querySelectorAll() { return []; }, prepend(...items) { this.children.unshift(...items); }, append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; }, focus() {}, scrollIntoView() {}, reportValidity() { return true; }
    };
  }
  const get = id => { if (!elements.has(id)) elements.set(id, element(id)); return elements.get(id); };
  const tab = get('tab-details'); tab.setAttribute('aria-controls', 'details-panel');
  const values = new Map(initial ? [[store.storageKey, JSON.stringify(initial)]] : []);
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const location = { pathname: '/workspace' };
  const context = vm.createContext({ ...store, ...sourceFields, ...updateHistory, letterLayout, prepareInStages, structuredClone, DOMException, downloadFilename, minorToDecimal, formatMinor, console, fetch: fetchImpl, AbortController, crypto: { randomUUID: () => 'test-id' }, URL,
    document: { getElementById: get, createElement: element, body: get('body'), querySelectorAll: selector => selector === '[role=tab]' ? [tab] : selector.startsWith('#pack-editor ') ? [get('editable')] : [] },
    window: { addEventListener() {}, scrollTo() {} }, location, history: { pushState: (_, __, path) => { location.pathname = path; }, replaceState: (_, __, path) => { location.pathname = path; } },
    localStorage: storage, sessionStorage: { getItem() { return null; }, removeItem() {}, setItem() {} }, confirm: () => true, setTimeout: (fn, ms) => setTimeout(fn, fastTimeouts && ms === 15000 ? 0 : ms), clearTimeout
  });
  vm.runInContext(source, context);
  return { get, values, run: code => vm.runInContext(code, context), location };
}
const config = () => Response.json({ liveAvailable: true, model: 'test' });
const pack = () => Response.json({ ...reviewPlan(sample), provenance: { mode: 'sample' } });

test('loading a sample prevents a second load or a competing generation and unlocks afterward', async () => {
  const pending = deferred(); let calls = 0;
  const ui = harness(async path => path === '/api/config' ? config() : (++calls, pending.promise));
  await flush();
  const loading = ui.get('sample').handlers.click();
  assert.equal(ui.get('request').disabled, true);
  assert.equal(ui.get('empty-sample').disabled, true);
  await ui.get('empty-sample').handlers.click();
  await ui.run('generate()');
  assert.equal(calls, 1);
  pending.resolve(pack()); await loading; await flush();
  assert.equal(ui.get('request').disabled, false);
  assert.equal(ui.location.pathname, '/workspace/pack');
});

test('opening a saved pack locks edits until review finishes and recovers after failure', async () => {
  const pending = deferred();
  let collection = store.saveNamed(store.restoreCollection(null, null), { ...store.emptyWorkspace(), request: 'Saved school notes', plan: sample }, 'School', 'school');
  collection = store.newWorkspace(collection);
  const ui = harness(async path => path === '/api/config' ? config() : pending.promise, collection);
  await flush();
  const loading = ui.run("openSaved('school')");
  assert.equal(ui.get('request').disabled, true);
  pending.resolve(Response.json({ error: 'Server unavailable' }, { status: 503 })); await loading;
  assert.equal(ui.get('request').disabled, false);
  assert.match(ui.get('notice').textContent, /Server unavailable/);
  assert.equal(ui.get('request').value, '');
});

test('startup restores original notes even when server review fails', async () => {
  const current = { ...store.emptyWorkspace(), request: 'Keep these original notes', answers: 'Keep this update', plan: sample };
  const ui = harness(async path => path === '/api/config' ? config() : Response.json({ error: 'Offline' }, { status: 503 }), { current, packs: [], activeId: null });
  assert.equal(ui.get('request').disabled, true);
  await flush();
  assert.equal(ui.get('request').value, current.request);
  assert.equal(ui.get('answers').value, current.answers);
  assert.equal(ui.get('request').disabled, false);
  assert.equal(JSON.parse(ui.values.get(store.storageKey)).current.request, current.request);
});

test('a tab does not overwrite a workspace already changed by another tab', async () => {
  const ui = harness(async () => config()); await flush();
  const other = { current: { ...store.emptyWorkspace(), request: 'New notes in another tab' }, packs: [], activeId: null };
  const raw = JSON.stringify(other); ui.values.set(store.storageKey, raw);
  ui.get('request').value = 'My older tab edits'; ui.get('request').handlers.input();
  assert.equal(ui.values.get(store.storageKey), raw);
  assert.match(ui.get('notice').textContent, /another tab/i);
  assert.equal(ui.get('request').value, 'My older tab edits');
});

test('a full browser store cannot erase the current draft during a workspace switch', async () => {
  const current = { ...store.emptyWorkspace(), request: 'Keep my unsaved notes' };
  const ui = harness(async () => config(), { current, packs: [], activeId: null }); await flush();
  const before = ui.values.get(store.storageKey);
  ui.run("localStorage.setItem = () => { throw new Error('QuotaExceededError'); }");
  ui.get('reset').handlers.click();
  assert.equal(ui.get('request').value, current.request);
  assert.equal(ui.values.get(store.storageKey), before);
  assert.match(ui.get('save-state').textContent, /storage unavailable or full/);
});

test('request cancellation reaches fetch and all processing controls recover', async () => {
  let interrupted;
  const ui = harness(async (path, options) => {
    if (path === '/api/config') return config();
    if (path === '/api/generate') return new Promise((_, reject) => { options.signal.addEventListener('abort', () => { interrupted = true; const error = new Error('Cancelled'); error.name = 'AbortError'; reject(error); }, { once: true }); });
    return pack();
  }); await flush();
  ui.get('request').value = 'A sufficiently detailed event request';
  ui.get('consent').checked = true; ui.get('consent').handlers.change();
  const generating = ui.run('generate()');
  assert.equal(ui.get('request').disabled, true);
  ui.get('cancel').handlers.click(); await generating;
  assert.equal(interrupted, true);
  assert.equal(ui.get('request').disabled, false);
  assert.match(ui.get('notice').textContent, /cancelled/);
});

test('a stalled sample request times out and unlocks the workspace', async () => {
  const ui = harness(async (path, options) => path === '/api/config' ? config() : new Promise((_, reject) => options.signal.addEventListener('abort', () => { const error = new Error('Aborted'); error.name = 'AbortError'; reject(error); })), null, { fastTimeouts: true });
  await flush();
  await ui.get('sample').handlers.click();
  assert.equal(ui.get('request').disabled, false);
  assert.match(ui.get('notice').textContent, /too long to reply/);
});

test('a failed AI update preserves the previous plan, original notes and follow-up changes', async () => {
  const current = { ...store.emptyWorkspace(), request: 'Original school event notes', answers: 'Change the venue to the library', plan: sample, provenance: { mode: 'sample' } };
  const ui = harness(async path => path === '/api/config' ? config() : path === '/api/generate' ? Response.json({ error: 'Google is unavailable', requestId: 'safe-reference' }, { status: 502 }) : pack(), { current, packs: [], activeId: null });
  await flush();
  ui.get('consent').checked = true; ui.get('consent').handlers.change();
  await ui.run('generate(true)');
  assert.equal(ui.get('request').value, current.request);
  assert.equal(ui.get('answers').value, current.answers);
  assert.equal(ui.run('state.plan.title'), current.plan.title);
  assert.equal(ui.get('refine').disabled, false);
  assert.match(ui.get('notice').textContent, /Google is unavailable.*safe-reference/);
});

test('a failed later step persists progress without replacing the current pack; retry resumes and commits atomically', async () => {
  const current = { ...store.emptyWorkspace(), request: 'Original school event notes', answers: 'Move the event to a new hall', plan: sample, provenance: { mode: 'sample' } };
  const stages = []; let fail = true;
  const ui = harness(async (path, options) => {
    if (path === '/api/config') return config();
    if (path !== '/api/generate') return pack();
    const { stage } = JSON.parse(options.body); stages.push(stage);
    if (stage === 'invitation' && fail) return Response.json({ error: 'Provider unavailable' }, { status: 502 });
    return Response.json({ ...reviewPlan(sample), provenance: { mode: 'live', stage, attempts: 1, durationMs: 1 } });
  }, { current, packs: [], activeId: null });
  await flush(); ui.get('consent').checked = true; ui.get('consent').handlers.change();
  await ui.run('generate(true)');
  const stored = JSON.parse(ui.values.get(store.storageKey));
  assert.equal(stored.current.provenance.mode, 'sample');
  assert.equal(stored.current.pendingGeneration.results.length, 1);
  assert.equal(ui.get('answers').value, current.answers);
  fail = false; await ui.run('generate(true)');
  assert.deepEqual(stages, ['facts', 'invitation', 'invitation', 'schedule']);
  assert.equal(ui.run('state.provenance.pipeline'), 'staged-v1');
  assert.equal(ui.run('state.pendingGeneration'), undefined);
  assert.equal(ui.get('answers').value, '');
});

test('successful update commits previous version and retained questions atomically; restore clears approval and can switch back', async () => {
  const current = { ...store.emptyWorkspace(), request: 'Original event notes with a pending rehearsal.', answers: 'Change the venue to Library Hall', plan: sample, approval: { fingerprint: 'old' }, provenance: { mode: 'sample' } };
  const updated = { ...structuredClone(sample), venue: 'Library Hall', openQuestions: [], drafts: { invitation: 'New invitation.', schedule: 'New schedule.' } };
  const ui = harness(async (path, options) => {
    if (path === '/api/config') return config();
    const body = JSON.parse(options.body);
    if (path === '/api/generate') return Response.json({ ...reviewPlan(updated), provenance: { mode: 'live', stage: body.stage, attempts: 1, durationMs: 1 } });
    return Response.json(reviewPlan(body.plan));
  }, { current, packs: [], activeId: null });
  await flush(); ui.get('consent').checked = true; ui.get('consent').handlers.change();
  await ui.run('generate(true)'); await flush();
  let stored = JSON.parse(ui.values.get(store.storageKey)).current;
  assert.equal(stored.plan.venue, 'Library Hall'); assert.equal(stored.approval, null);
  assert.equal(stored.previousVersion.workspace.plan.venue, sample.venue);
  assert.equal(stored.previousVersion.workspace.answers, current.answers);
  assert.deepEqual(stored.plan.openQuestions, sample.openQuestions);
  assert.equal(ui.get('update-comparison').hidden, false);
  assert.equal(ui.get('restore-previous').disabled, true);
  ui.get('restore-confirm').checked = true; ui.get('restore-confirm').handlers.change();
  assert.equal(ui.get('restore-previous').disabled, false);
  await ui.get('restore-previous').handlers.click(); await flush();
  stored = JSON.parse(ui.values.get(store.storageKey)).current;
  assert.equal(stored.plan.venue, sample.venue); assert.equal(stored.plan.drafts.invitation, sample.drafts.invitation);
  assert.equal(stored.approval, null); assert.equal(stored.pendingGeneration, undefined);
  assert.equal(stored.previousVersion.workspace.plan.venue, 'Library Hall');
  assert.equal(ui.get('review-confirm').checked, false); assert.equal(ui.get('restore-confirm').checked, false);
});

test('failed and cancelled updates preserve the complete pack and its existing previous-version snapshot', async () => {
  for (const cancel of [false, true]) {
    const before = { ...store.emptyWorkspace(), request: 'Original school notes', answers: 'Move the room', plan: sample, provenance: { mode: 'sample' } };
    const current = updateHistory.updatedWorkspace(before, { plan: { ...sample, venue: 'New Hall' } }); current.answers = 'Try moving again';
    const history = JSON.stringify(current.previousVersion);
    const ui = harness(async (path, options) => {
      if (path === '/api/config') return config();
      if (path !== '/api/generate') return Response.json(reviewPlan(JSON.parse(options.body).plan));
      if (!cancel) return Response.json({ error: 'Provider unavailable' }, { status: 502 });
      return new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true }));
    }, { current, packs: [], activeId: null });
    await flush(); ui.get('consent').checked = true; ui.get('consent').handlers.change();
    const generating = ui.run('generate(true)');
    if (cancel) ui.get('cancel-refine').handlers.click();
    await generating;
    assert.equal(ui.run('JSON.stringify(state.previousVersion)'), history);
    assert.equal(ui.run('state.plan.venue'), 'New Hall');
    assert.equal(ui.get('answers').value, 'Try moving again');
  }
});

test('storage failure on final update commit keeps the previous pack, snapshot and completed checkpoints', async () => {
  const before = { ...store.emptyWorkspace(), request: 'Original notes', answers: 'First update', plan: sample };
  const current = updateHistory.updatedWorkspace(before, { plan: { ...sample, venue: 'First Hall' } }); current.answers = 'Second update';
  let ui, completed = 0;
  ui = harness(async (path, options) => {
    if (path === '/api/config') return config();
    const body = JSON.parse(options.body);
    if (path === '/api/generate') { completed++; return Response.json({ ...reviewPlan({ ...sample, venue: 'Second Hall' }), provenance: { mode: 'live', stage: body.stage, attempts: 1, durationMs: 1 } }); }
    if (completed === 3) ui.run("localStorage.setItem = () => { throw new Error('QuotaExceededError'); }");
    return Response.json(reviewPlan(body.plan));
  }, { current, packs: [], activeId: null });
  await flush(); ui.get('consent').checked = true; ui.get('consent').handlers.change();
  await ui.run('generate(true)');
  const saved = JSON.parse(ui.values.get(store.storageKey)).current;
  assert.equal(saved.plan.venue, 'First Hall'); assert.equal(ui.run('state.plan.venue'), 'First Hall');
  assert.equal(saved.previousVersion.workspace.plan.venue, sample.venue);
  assert.equal(saved.pendingGeneration.results.length, 3);
  assert.match(ui.get('save-state').textContent, /storage unavailable or full/);
  assert.equal(ui.get('answers').value, 'Second update');
});

test('restore failures and stale tabs cannot replace the active pack or destroy saved history', async () => {
  for (const failure of ['network', 'quota', 'stale-tab']) {
    const before = { ...store.emptyWorkspace(), request: 'Original notes', answers: 'Move hall', plan: sample };
    const current = updateHistory.updatedWorkspace(before, { plan: { ...sample, venue: 'Current Hall' } });
    let restoring = false, ui;
    ui = harness(async (path, options) => {
      if (path === '/api/config') return config();
      if (restoring && failure === 'network') return Response.json({ error: 'Server unavailable' }, { status: 503 });
      if (restoring && failure === 'quota') ui.run("localStorage.setItem = () => { throw new Error('QuotaExceededError'); }");
      if (restoring && failure === 'stale-tab') ui.values.set(store.storageKey, 'newer saved work from another tab');
      return Response.json(reviewPlan(JSON.parse(options.body).plan));
    }, { current, packs: [], activeId: null });
    await flush(); restoring = true; ui.get('restore-confirm').checked = true;
    await ui.run('restorePrevious()');
    assert.equal(ui.run('state.plan.venue'), 'Current Hall');
    assert.equal(ui.run('state.previousVersion.workspace.plan.venue'), sample.venue);
    if (failure === 'stale-tab') assert.equal(ui.values.get(store.storageKey), 'newer saved work from another tab');
    else assert.equal(JSON.parse(ui.values.get(store.storageKey)).current.plan.venue, 'Current Hall');
    assert.match(ui.get('notice').textContent, failure === 'network' ? /Restore did not finish/ : failure === 'quota' ? /could not be saved/ : /Another tab saved/);
  }
});

test('Google processing permission does not authorize Groq and Groq choice is remembered separately',async()=>{
 const pending=deferred();let requests=0;
 const ui=harness(async path=>path==='/api/config'?pending.promise:(requests++,pack()));
 ui.values.set('flow-point-google-processing-v2','allowed');
 pending.resolve(Response.json({provider:'groq',processor:'Groq',modelLabel:'GPT-OSS',model:'openai/gpt-oss-120b',liveAvailable:true}));await flush();
 assert.equal(ui.get('consent').checked,false);assert.match(ui.get('processing-consent-text').textContent,/sent to Groq/);
 await ui.run('generate()');assert.equal(requests,0);assert.match(ui.get('notice').textContent,/Allow Groq/);
 ui.get('consent').checked=true;ui.get('remember-consent').checked=true;ui.get('consent').handlers.change();
 assert.equal(ui.values.get('flow-point-groq-processing-v1'),'allowed');assert.equal(ui.values.get('flow-point-google-processing-v2'),'allowed');
 assert.match(ui.get('processing-status').textContent,/Groq processing allowed/);
});
