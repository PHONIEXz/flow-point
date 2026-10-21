import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calendarDate, reviewPlan, validatePlan, approvePlan, isApproved } from '../src/plan.mjs';
import { preparationPack, budgetCsv } from '../src/export.mjs';
const example = JSON.parse(await readFile(new URL('../examples/school-event.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(example);
function completePlan() {
  const plan = copy();
  plan.startTime = '10:00';
  plan.organizer = 'Example School';
  plan.signatory = 'Event Coordinator';
  plan.openQuestions = [];
  plan.budget.forEach((item) => { item.unitCostMinor = 10000; });
  plan.drafts.invitation = 'Reviewed invitation with confirmed details.';
  plan.drafts.schedule = '10:00 Welcome. 10:15 Presentations. 11:00 Closing.';
  return plan;
}

test('detects the date/weekday conflict from the church invitation case', () => {
  const plan = copy();
  plan.eventDate = '2026-10-26';
  plan.requestedWeekday = 'Sunday';
  assert.match(reviewPlan(plan).issues.find((item) => item.code === 'DATE_CONFLICT').message, /Monday/);
});
test('rejects impossible dates, preserving leap-year rules', () => {
  assert.equal(calendarDate('2026-02-29'), null);
  assert.ok(calendarDate('2028-02-29'));
  assert.equal(calendarDate('2026-13-01'), null);
  assert.equal(calendarDate('2026-2-01'), null);
});
test('unknown prices remain unknown and cannot be mistaken for a zero total', () => {
  const review = reviewPlan(copy());
  assert.equal(review.knownTotalMinor, 0);
  assert.equal(review.budgetComplete, false);
  assert.match(preparationPack(copy()), /incomplete budget/);
  assert.throws(() => approvePlan(copy()), /Resolve review issues/);
});
test('calculates exact totals in minor units, including zero-priced items', () => {
  const plan = completePlan();
  plan.budget = [{ label: 'Materials', quantity: 3, unitCostMinor: 101 }, { label: 'Donation', quantity: 1, unitCostMinor: 0 }];
  assert.equal(reviewPlan(plan).knownTotalMinor, 303);
  assert.equal(reviewPlan(plan).budgetComplete, true);
});
test('rejects fractional, negative and overflowing money amounts', () => {
  for (const amount of [-1, 1.5, Number.MAX_SAFE_INTEGER]) {
    const plan = completePlan();
    plan.budget[0].unitCostMinor = amount;
    assert.throws(() => validatePlan(plan));
  }
});
test('missing event facts and unresolved questions block approval', () => {
  const plan = completePlan();
  plan.eventDate = null;
  plan.venue = null;
  plan.openQuestions = ['What time should guests arrive?'];
  const codes = reviewPlan(plan).issues.map((issue) => issue.code);
  assert.ok(codes.includes('MISSING_DATE'));
  assert.ok(codes.includes('MISSING_VENUE'));
  assert.ok(codes.includes('OPEN_QUESTION'));
  assert.throws(() => approvePlan(plan));
});
test('flags preparation deadlines after the event', () => {
  const plan = completePlan();
  plan.tasks[0].dueDate = '2026-10-24';
  assert.ok(reviewPlan(plan).issues.some((issue) => issue.code === 'LATE_TASK'));
});
test('an edit invalidates an existing approval and marks exports draft', () => {
  const plan = completePlan();
  const approval = approvePlan(plan);
  assert.equal(isApproved(plan, approval), true);
  assert.match(preparationPack(plan, approval), /Status: Approved/);
  plan.drafts.invitation += ' Updated.';
  assert.equal(isApproved(plan, approval), false);
  assert.match(preparationPack(plan, approval), /Status: Draft/);
});
test('CSV escapes quotes, line breaks and spreadsheet formulas', () => {
  const plan = completePlan();
  plan.budget[0].label = '=HYPERLINK("https://example.test")';
  plan.budget[1].label = 'Paper, "blue"\nLarge';
  const csv = budgetCsv(plan);
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.test"")"'));
  assert.ok(csv.includes('"Paper, ""blue""\nLarge"'));
});
test('does not copy extra model-provided fields into the validated plan', () => {
  const plan = completePlan();
  plan.apiKey = 'must-not-be-copied';
  assert.equal(Object.hasOwn(validatePlan(plan), 'apiKey'), false);
});


test('essential event details and unresolved draft placeholders block approval', () => {
  for (const field of ['startTime', 'organizer', 'signatory']) {
    const plan = completePlan(); plan[field] = null; assert.throws(() => approvePlan(plan));
  }
  const plan = completePlan(); plan.startTime = '25:00'; assert.throws(() => validatePlan(plan));
  plan.startTime = '10:00'; plan.drafts.invitation += ' [Confirm venue]';
  assert.ok(reviewPlan(plan).issues.some(issue => issue.code === 'DRAFT_PLACEHOLDER'));
  assert.throws(() => approvePlan(plan));
});
