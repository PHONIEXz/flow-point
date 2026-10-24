import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { capturePrevious, previousVersion, updatedWorkspace, restoredWorkspace, compareVersions, markQuestionResolved, maxPreviousCharacters } from '../public/update-history.mjs';
import { emptyWorkspace, restoreCollection, recordCurrent, saveNamed, openNamed, newWorkspace, serializeCollection } from '../public/pack-store.mjs';
const sample = JSON.parse(await readFile(new URL('../examples/school-event.json', import.meta.url), 'utf8'));
const base = () => ({ ...emptyWorkspace(), request: 'Fictional school reading event notes.', answers: 'Move to Library Hall and increase notebooks to 25.', plan: { ...structuredClone(sample), currency: 'NGN', spendingLimitMinor: 20000000, tasks: [{ label: 'Lead reading circle', owner: 'Ada', dueDate: null }], budget: [{ label: 'Notebooks', quantity: 20, unitCostMinor: 20000 }], openQuestions: ['What time is rehearsal?'] }, approval: { fingerprint: 'old' }, provenance: { mode: 'sample' } });
const update = before => ({ plan: { ...structuredClone(before.plan), venue: 'Library Hall', tasks: [{ label: 'Lead reading circle', owner: 'Bola', dueDate: '2026-11-19' }], budget: [{ label: 'Notebooks', quantity: 25, unitCostMinor: 20000 }], openQuestions: ['Who brings water?'], drafts: { invitation: 'Meet at Library Hall.', schedule: 'Reading in Library Hall.' } }, provenance: { mode: 'live' } });

test('venue, duty, quantity, allowance and complete draft changes are visible; omitted questions stay open', () => {
  const before = base(), result = update(before), next = updatedWorkspace(before, result, '2026-10-24T10:00:00Z');
  assert.deepEqual(next.plan.openQuestions, ['Who brings water?', 'What time is rehearsal?']);
  assert.equal(next.approval, null); assert.equal(next.answers, '');
  const diff = compareVersions(next);
  assert.equal(diff.facts.find(f => f.label === 'Venue').after, 'Library Hall');
  assert.match(diff.tasks[0].after, /Bola.*2026-11-19/);
  assert.match(diff.budget[0].before, /Quantity: 20/); assert.match(diff.budget[0].after, /Quantity: 25/);
  assert.match(diff.budgetAfter, /NGN 5,000.00.*NGN 195,000.00/);
  assert.equal(diff.drafts[0].before, before.plan.drafts.invitation);
  assert.equal(diff.drafts[0].after, result.plan.drafts.invitation);
  assert.equal(diff.questions.find(q => q.question.includes('rehearsal')).status, 'Kept open · omitted by update');
  assert.equal(diff.questions.find(q => q.question.includes('water')).status, 'New open question');
  assert.equal(before.approval.fingerprint, 'old'); assert.equal(result.plan.openQuestions.length, 1);
});

test('retained, explicitly resolved and merely absent questions have distinct states', () => {
  const before = base(); before.plan.openQuestions.push('Is the room booked?', 'Who is the signer?');
  const result = update(before); result.plan.openQuestions.push('What time is rehearsal?');
  const next = updatedWorkspace(before, result);
  assert.equal(compareVersions(next).questions[0].status, 'Still open');
  next.plan.openQuestions = next.plan.openQuestions.filter(q => q !== 'Is the room booked?');
  assert.equal(compareVersions(next).questions.find(q => q.question.includes('booked')).status, 'Absent · not marked resolved');
  markQuestionResolved(next, 'Is the room booked?');
  assert.equal(compareVersions(next).questions.find(q => q.question.includes('booked')).status, 'Marked resolved by you');
  next.plan.openQuestions.push('Is the room booked?');
  assert.equal(compareVersions(next).questions.find(q => q.question.includes('booked')).status, 'Kept open · omitted by update');
  markQuestionResolved(next, 'Who brings water?'); next.plan.openQuestions = next.plan.openQuestions.filter(q => q !== 'Who brings water?');
  assert.equal(compareVersions(next).questions.find(q => q.question.includes('water')).status, 'New question · marked resolved by you');
});

test('restore recovers original notes, wording and unknowns, drops approvals/confirmations and can switch back', () => {
  const before = base(); before.plan.budget[0].unitCostMinor = null;
  before.plan.sourceEvidence = { records: [{ confirmed: true }, { confirmed: false }] };
  const next = updatedWorkspace(before, update(before));
  markQuestionResolved(next, 'Who brings water?');
  next.approval = { fingerprint: 'new' }; next.pendingGeneration = { results: ['unfinished'] };
  const restored = restoredWorkspace(next);
  assert.equal(restored.request, before.request); assert.equal(restored.answers, before.answers);
  assert.equal(restored.plan.drafts.invitation, before.plan.drafts.invitation);
  assert.equal(restored.plan.budget[0].unitCostMinor, null);
  assert.equal(restored.approval, null); assert.equal(restored.pendingGeneration, undefined);
  assert.ok(restored.plan.sourceEvidence.records.every(r => !r.confirmed));
  assert.equal(next.plan.sourceEvidence.records[0].confirmed, true);
  assert.equal(restored.previousVersion.workspace.approval, undefined);
  assert.equal(restored.previousVersion.workspace.previousVersion, undefined);
  const switchedBack = restoredWorkspace(restored);
  assert.equal(switchedBack.plan.venue, 'Library Hall');
  assert.deepEqual(switchedBack.questionResolutions, ['Who brings water?']);
});

test('history is isolated per named pack, bounded, nonrecursive and backwards compatible', () => {
  const a = updatedWorkspace(base(), update(base()));
  let collection = saveNamed(restoreCollection(null, null), a, 'First', 'a');
  collection = saveNamed(newWorkspace(collection), { ...emptyWorkspace(), request: 'Other notes', plan: sample }, 'Second', 'b');
  collection = restoreCollection(serializeCollection(collection));
  assert.equal(openNamed(collection, 'a').current.previousVersion.workspace.plan.venue, base().plan.venue);
  assert.equal(openNamed(collection, 'b').current.previousVersion, undefined);
  const repeated = restoredWorkspace(restoredWorkspace(a));
  assert.equal(repeated.previousVersion.workspace.previousVersion, undefined);
  const huge = base(); huge.plan.extra = 'x'.repeat(maxPreviousCharacters);
  assert.throws(() => capturePrevious(huge), /too large/);
  const corrupt = { ...base(), previousVersion: { version: 1, workspace: {} } };
  const restored = restoreCollection(JSON.stringify({ current: corrupt, packs: [], activeId: null }));
  assert.equal(restored.current.plan.title, sample.title); assert.equal(restored.current.previousVersion, null);
  assert.equal(restored.current.historyUnavailable, true);
  assert.equal(previousVersion({ ...a.previousVersion, capturedAt: 'invalid' }), null);
  assert.equal(previousVersion({ ...a.previousVersion, workspace: { ...a.previousVersion.workspace, plan: {} } }), null);
});

test('renamed rows are removed/added rather than guessed, and unknown money is distinct from zero', () => {
  const before = base(); before.plan.budget.push({ label: 'Banner', quantity: 1, unitCostMinor: null });
  const result = update(before); result.plan.tasks[0].label = 'Lead book exchange'; result.plan.budget.push({ label: 'Banner', quantity: 1, unitCostMinor: 0 });
  const diff = compareVersions(updatedWorkspace(before, result));
  assert.deepEqual(diff.tasks.map(t => t.status), ['Removed · check for omission', 'Added']);
  assert.match(diff.budget.find(b => b.label === 'Banner').before, /Unknown/);
  assert.match(diff.budget.find(b => b.label === 'Banner').after, /NGN 0.00/);
  assert.match(diff.budgetBefore, /incomplete/); assert.doesNotMatch(diff.budgetAfter, /incomplete/);
});

test('question overflow rejects the update without dropping old questions or changing the previous pack', () => {
  const before = base(); before.plan.openQuestions = Array.from({ length: 50 }, (_, i) => `Old question ${i}?`);
  const result = update(before);
  assert.throws(() => updatedWorkspace(before, result), /exceed 50/);
  assert.equal(before.plan.openQuestions.length, 50); assert.equal(before.previousVersion, undefined);
});
