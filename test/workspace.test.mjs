import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import * as store from '../public/pack-store.mjs';
import { downloadFilename } from '../public/download-name.mjs';
import { reviewPlan } from '../src/plan.mjs';
const source = (await readFile(new URL('../public/workspace.js', import.meta.url), 'utf8')).replace(/^import .*;$/gm, '');
const sample = JSON.parse(await readFile(new URL('../examples/school-event.json', import.meta.url), 'utf8'));
const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
function harness(fetchImpl, initial = null) {
  const elements = new Map();
  function element(id = '') {
    return { id, value: '', checked: false, disabled: false, hidden: false, dataset: {}, attributes: {}, handlers: {}, children: [],
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener(type, fn) { this.handlers[type] = fn; },
      setAttribute(key, value) { this.attributes[key] = value; }, removeAttribute(key) { delete this.attributes[key]; }, getAttribute(key) { return this.attributes[key]; },
      append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; }, focus() {}, scrollIntoView() {}, reportValidity() { return true; }
    };
  }
  const get = id => { if (!elements.has(id)) elements.set(id, element(id)); return elements.get(id); };
  const tab = get('tab-details'); tab.setAttribute('aria-controls', 'details-panel');
  const values = new Map(initial ? [[store.storageKey, JSON.stringify(initial)]] : []);
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const location = { pathname: '/workspace' };
  const context = vm.createContext({ ...store, downloadFilename, console, fetch: fetchImpl, AbortController, crypto: { randomUUID: () => 'test-id' }, URL,
    document: { getElementById: get, createElement: element, body: get('body'), querySelectorAll: selector => selector === '[role=tab]' ? [tab] : selector.startsWith('#pack-editor ') ? [get('editable')] : [] },
    window: { addEventListener() {}, scrollTo() {} }, location, history: { pushState: (_, __, path) => { location.pathname = path; }, replaceState: (_, __, path) => { location.pathname = path; } },
    localStorage: storage, sessionStorage: { getItem() { return null; }, removeItem() {}, setItem() {} }, confirm: () => true, setTimeout, clearTimeout
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
