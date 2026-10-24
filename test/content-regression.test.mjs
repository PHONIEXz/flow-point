import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reviewPlan, validatePlan, approvePlan, draftTimeIssues, clockTimes } from '../src/plan.mjs';
import { generatePack } from '../src/gemma.mjs';
import { preparationPack } from '../src/export.mjs';
import { generationKey } from '../public/generation.mjs';
const captured = JSON.parse(await readFile(new URL('../docs/evidence/school-update-captured-2026-10-24.json', import.meta.url), 'utf8'));
const school = () => structuredClone(captured.plan);
const reply = value => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }] });
const quiet = { apiKey: 'test', log() {}, wait: async () => {} };

test('captured real failure now flags omitted invitation time and missing programme anchor', () => {
  const codes = reviewPlan(school()).issues.map(x => x.code);
  assert.ok(codes.includes('INVITATION_TIME')); assert.ok(codes.includes('SCHEDULE_TIME'));
  assert.ok(codes.includes('OPEN_QUESTION')); assert.throws(() => approvePlan(school()));
});
test('school allowance is deterministic, unknowns provisional, zero distinct and old packs migrate without guessed limits', () => {
  const p = school();
  assert.equal(validatePlan(p).spendingLimitMinor, null);
  p.spendingLimitMinor = 20000000;
  let r = reviewPlan(p);
  assert.equal(r.knownTotalMinor, 18150000); assert.equal(r.remainingAllowanceMinor, 1850000); assert.equal(r.allowanceProvisional, false);
  assert.match(preparationPack(p), /Remaining allowance: 1850000 minor units/);
  p.budget[6].unitCostMinor = null; r = reviewPlan(p);
  assert.equal(r.allowanceProvisional, true); assert.equal(r.budgetComplete, false);
  assert.match(preparationPack(p), /Provisional allowance before unknown costs/);
  p.budget[6].unitCostMinor = 0; assert.equal(reviewPlan(p).allowanceProvisional, false);
  assert.ok(p.tasks.some(t => /samuel eze/i.test(t.owner) && /first.aid/i.test(t.label)));
  assert.ok(p.openQuestions.some(q => /rehearsal/i.test(q) && /time/i.test(q)));
});
test('different community event: afternoon time, registration before programme, exact/over budget and unsafe limits', () => {
  const p = { ...school(), title: 'Community Book Exchange', currency: 'USD', spendingLimitMinor: 50000, startTime: '14:15', openQuestions: [], tasks: [], budget: [{ label: 'Tables', quantity: 3, unitCostMinor: 10750 }], drafts: { invitation: 'Book exchange begins at 2:15 PM.', schedule: '14:00 Registration\n14:15 Welcome: 10 minutes\nSuggested 14:25 Book exchange: 30 minutes\nSuggested 14:55 Closing: 5 minutes' } };
  assert.deepEqual(draftTimeIssues(p), []);
  assert.equal(reviewPlan(p).remainingAllowanceMinor, 17750);
  p.spendingLimitMinor = 32250; assert.equal(reviewPlan(p).remainingAllowanceMinor, 0);
  p.spendingLimitMinor = 30000; assert.equal(reviewPlan(p).remainingAllowanceMinor, -2250);
  assert.ok(reviewPlan(p).issues.some(x => x.code === 'OVER_BUDGET'));
  assert.throws(() => approvePlan(p)); assert.match(preparationPack(p), /Over budget by: 2250/);
  for (const value of [-1, 0.1, Number.MAX_SAFE_INTEGER + 1, '500']) { p.spendingLimitMinor = value; assert.throws(() => validatePlan(p)); }
  assert.deepEqual(clockTimes('12:00 AM; 12:00 PM; 2:15 PM; 24:00; 99:99; 110:00'), ['00:00','12:00','14:15']);
  p.drafts.schedule = 'Programme start: 14:15\n14:00 Registration\n14:25 Welcome: 10 minutes\n14:15 Closing';
  assert.ok(draftTimeIssues(p).some(x => x.code === 'SCHEDULE_TIME'));
});
test('missing draft time regenerates only the affected step within three attempts and leaves checkpoint unchanged', async () => {
  const p = school(); p.spendingLimitMinor = 20000000;
  const before = structuredClone(p); let calls = 0;
  const r = await generatePack({ request: 'Original school notes', stage: 'invitation', checkpoint: p }, { ...quiet, fetchImpl: async () => reply({ invitation: ++calls === 1 ? 'Welcome at the hall.' : 'Welcome at 10:00.' }) });
  assert.equal(calls, 2); assert.deepEqual(p, before);
  assert.equal(r.plan.spendingLimitMinor, 20000000);
  assert.deepEqual(r.plan.tasks, p.tasks); assert.deepEqual(r.plan.openQuestions, p.openQuestions);
  calls = 0;
  await assert.rejects(generatePack({ request: 'Original school notes', stage: 'schedule', checkpoint: p }, { ...quiet, fetchImpl: async () => { calls++; return reply({ schedule: '09:30 Registration\nWelcome: 10 minutes' }); } }), e => e.code === 'MODEL_CONTENT_MISSING');
  assert.equal(calls, 3); assert.deepEqual(p, before);
});
test('old saved prefixes cannot reuse responses from the earlier content contract', () => {
  assert.equal(JSON.parse(generationKey({ request: 'Same notes' })).version, 5);
});

test('source checks reject real currency-unit mistake, missing named assignment and dated rehearsal without mutating facts', async () => {
  const { sourceContentIssues } = await import('../src/content-checks.mjs');
  const p = school(); p.spendingLimitMinor = 20000000; p.budget[6].unitCostMinor = 8500;
  p.tasks = p.tasks.filter(t => !/samuel|rehears/i.test(t.owner + ' ' + t.label)); p.openQuestions = [];
  const source = { request: 'The spending limit is NGN 200,000.', answers: 'The banner is NGN 8,500. Mr Samuel Eze is the confirmed first-aid officer. Move the rehearsal to Thursday, 19 November 2026; its time is still awaiting approval.' };
  const before = structuredClone(p);
  assert.equal(sourceContentIssues(p, source).length, 4); assert.deepEqual(p, before);
  let calls = 0; const fixed = school(); fixed.spendingLimitMinor = 20000000;
  const result = await generatePack({ ...source, stage: 'facts' }, { ...quiet, fetchImpl: async () => reply(++calls === 1 ? p : fixed) });
  assert.equal(calls, 2); assert.equal(result.knownTotalMinor, 18150000);
  assert.equal(sourceContentIssues(result.plan, source).length, 0);
  assert.equal(sourceContentIssues(fixed, { answers: 'The rehearsal is cancelled. Mr Samuel Eze is no longer assigned as first-aid officer.' }).length, 0);
});

test('checks clock arithmetic against activity minutes and regenerates a wrong closing time', async () => {
  const p = school(); p.startTime = '14:15'; p.drafts.invitation = 'Join us at 14:15.';
  const wrong = '14:00 Registration\n14:15 Welcome (10 minutes)\n14:25 Book exchange (30 minutes)\n14:50 Closing (5 minutes)';
  p.drafts.schedule = wrong;
  assert.match(reviewPlan(p).issues.find(x => x.code === 'SCHEDULE_DURATION').message, /14:55/);
  let calls = 0;
  const result = await generatePack({ request: 'Community event test', stage: 'schedule', checkpoint: p }, { ...quiet, fetchImpl: async () => reply({ schedule: ++calls === 1 ? wrong : wrong.replace('14:50 Closing', '14:55 Closing') }) });
  assert.equal(calls, 2); assert.equal(result.issues.some(x => x.code === 'SCHEDULE_DURATION'), false);
});
