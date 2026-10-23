import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyWorkspace, restoreCollection, recordCurrent, saveNamed, openNamed, removeNamed, newWorkspace, serializeCollection, maxPacks } from '../public/pack-store.mjs';

const workspace = title => ({ ...emptyWorkspace(), request: `Prepare ${title}`, plan: { title, drafts: { invitation: `Invite to ${title}`, schedule: 'Schedule' }, tasks: [], budget: [] }, approval: { fingerprint: title }, provenance: { mode: 'sample' } });

test('migrates the old unnamed draft, then keeps two independently editable named packs', () => {
  const old = workspace('School Day');
  let collection = restoreCollection(null, JSON.stringify(old));
  assert.equal(collection.current.plan.title, 'School Day');
  assert.equal(collection.packs.length, 0);

  collection = saveNamed(collection, collection.current, 'School Day', 'school');
  collection.current.plan.title = 'School Day revised';
  collection.current.approval = null;
  collection = recordCurrent(collection, collection.current);
  collection = newWorkspace(collection);
  collection = saveNamed(collection, workspace('Church Day'), 'Church Day', 'church');
  collection = openNamed(collection, 'school');

  assert.equal(collection.current.plan.title, 'School Day revised');
  assert.equal(collection.current.approval, null);
  assert.equal(collection.packs.find(item => item.id === 'church').workspace.plan.title, 'Church Day');
  assert.equal(restoreCollection(serializeCollection(collection), null).activeId, 'school');
});

test('removing the active saved copy leaves the editable current pack in place', () => {
  const collection = saveNamed(restoreCollection(null, null), workspace('Family Day'), 'Family Day', 'one');
  const removed = removeNamed(collection, 'one');
  assert.equal(removed.current.plan.title, 'Family Day');
  assert.equal(removed.activeId, null);
  assert.equal(removed.packs.length, 0);
});

test('rejects duplicate names, over-capacity shelves and oversized browser data', () => {
  let collection = restoreCollection(null, null);
  for (let index = 0; index < maxPacks; index++) {
    collection = saveNamed(newWorkspace(collection), workspace(`Event ${index}`), `Event ${index}`, String(index));
  }
  assert.throws(() => saveNamed(newWorkspace(collection), workspace('Extra'), 'Extra', 'extra'), /12 named packs/);
  assert.throws(() => saveNamed(newWorkspace(removeNamed(collection, '0')), workspace('Extra'), 'EVENT 1', 'extra'), /already used/);
  assert.throws(() => serializeCollection({ ...collection, current: { ...workspace('X'), request: 'x'.repeat(1500001) } }), /storage is full/);
});

test('a corrupt new entry can fall back to the older draft', () => {
  const original = workspace('Original');
  const restored = restoreCollection('{bad-json', JSON.stringify(original));
  assert.equal(restored.current.plan.title, 'Original');
});
