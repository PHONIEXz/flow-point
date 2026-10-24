import { formatMinor } from './money.mjs';

// One non-recursive snapshot per workspace. The collection's existing quota still applies.
export const maxPreviousCharacters = 240000;
const copy = value => JSON.parse(JSON.stringify(value));
const key = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const questions = values => [...new Map((Array.isArray(values) ? values : []).filter(q => typeof q === 'string' && q.trim() && q.length <= 500).map(q => [key(q), q])).values()];

function usablePlan(plan) {
  return plan && typeof plan === 'object' && !Array.isArray(plan) && typeof plan.title === 'string' && typeof plan.currency === 'string' &&
    Array.isArray(plan.tasks) && plan.tasks.length <= 100 && plan.tasks.every(t => t && typeof t.label === 'string') &&
    Array.isArray(plan.budget) && plan.budget.length <= 100 && plan.budget.every(b => b && typeof b.label === 'string') &&
    Array.isArray(plan.openQuestions) && plan.openQuestions.length <= 50 && plan.openQuestions.every(q => typeof q === 'string' && q.length <= 500) &&
    plan.drafts && typeof plan.drafts.invitation === 'string' && typeof plan.drafts.schedule === 'string';
}

export function previousVersion(value) {
  if (!value || value.version !== 1 || !['update', 'restore'].includes(value.action) || !Number.isFinite(Date.parse(value.capturedAt))) return null;
  const w = value.workspace;
  if (!w || typeof w.request !== 'string' || w.request.length > 12000 || typeof w.answers !== 'string' || w.answers.length > 8000 || !usablePlan(w.plan)) return null;
  // Select fields explicitly: snapshots cannot contain nested history, checkpoints or approvals.
  const result = { version: 1, action: value.action, capturedAt: value.capturedAt,
    carriedQuestions: questions(value.carriedQuestions).slice(0, 50),
    workspace: { invitationStyle: w.invitationStyle === 'informal' ? 'informal' : 'formal', request: w.request, answers: w.answers, plan: copy(w.plan), provenance: w.provenance ? copy(w.provenance) : null, questionResolutions: questions(w.questionResolutions).slice(-50) } };
  if (JSON.stringify(result).length > maxPreviousCharacters) return null;
  return result;
}

export function capturePrevious(workspace, action = 'update', carriedQuestions = [], now = new Date().toISOString()) {
  const result = previousVersion({ version: 1, action, capturedAt: now, carriedQuestions, workspace });
  if (!result) throw new Error('The previous pack is too large to keep safely in this browser. Download a backup and reduce the pack before updating.');
  return result;
}

export function retainOpenQuestions(before, generated) {
  const existing = questions(before?.openQuestions);
  const next = questions(generated.openQuestions);
  const nextKeys = new Set(next.map(key));
  const carriedQuestions = existing.filter(q => !nextKeys.has(key(q)));
  if (next.length + carriedQuestions.length > 50) throw new Error('This update would exceed 50 open questions. Your previous pack is unchanged. Review and explicitly resolve answered questions before retrying.');
  return { plan: { ...generated, openQuestions: [...next, ...carriedQuestions] }, carriedQuestions };
}

export function updatedWorkspace(before, result, now) {
  const { plan, carriedQuestions } = retainOpenQuestions(before.plan, result.plan);
  return { request: before.request, answers: '', plan: copy(plan), approval: null, provenance: copy(result.provenance ?? null),
    questionResolutions: [], previousVersion: capturePrevious(before, 'update', carriedQuestions, now) };
}

export function restoredWorkspace(current, now) {
  const prior = previousVersion(current.previousVersion);
  if (!prior) throw new Error('No usable previous version is saved for this pack.');
  const restored = copy(prior.workspace);
  if (restored.plan.sourceEvidence?.records) for (const record of restored.plan.sourceEvidence.records) record.confirmed = false;
  return { ...restored, approval: null, previousVersion: capturePrevious(current, 'restore', [], now) };
}

export function markQuestionResolved(workspace, question) {
  workspace.questionResolutions = questions([...(workspace.questionResolutions || []), question]).slice(-50);
}

const display = value => value == null || value === '' ? 'Unknown / not supplied' : String(value);
const money = (value, currency) => value == null ? 'Unknown / not supplied' : Number.isSafeInteger(value) && value >= 0 ? `${currency} ${formatMinor(value)}` : 'Invalid amount · review needed';
function budgetSummary(plan) {
  let total = 0;
  const complete = plan.budget.every(item => item.unitCostMinor != null);
  for (const item of plan.budget) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0 || (item.unitCostMinor != null && (!Number.isSafeInteger(item.unitCostMinor) || item.unitCostMinor < 0))) return 'Invalid budget · review needed';
    total += item.quantity * (item.unitCostMinor ?? 0);
  }
  if (!Number.isSafeInteger(total)) return 'Invalid budget · review needed';
  const totalText = `${complete ? 'Total' : 'Known subtotal, incomplete'}: ${money(total, plan.currency)}`;
  if (plan.spendingLimitMinor == null) return `${totalText}. Spending limit unknown.`;
  if (!Number.isSafeInteger(plan.spendingLimitMinor) || plan.spendingLimitMinor < 0) return `${totalText}. Invalid spending limit · review needed.`;
  const remaining = plan.spendingLimitMinor - total;
  if (!Number.isSafeInteger(remaining)) return `${totalText}. Invalid allowance · review needed.`;
  return `${totalText}. ${remaining < 0 ? 'Over budget' : complete ? 'Remaining allowance' : 'Provisional allowance before unknown costs'}: ${money(Math.abs(remaining), plan.currency)}.`;
}

// Exact normalized labels are paired, including duplicates by occurrence. Renamed rows
// appear as removed/added; no fuzzy matching guesses whether two duties are the same.
function compareRows(before, after, describe) {
  const used = new Set(); const changes = [];
  for (const old of before) {
    const index = after.findIndex((item, i) => !used.has(i) && key(item.label) === key(old.label));
    if (index < 0) { changes.push({ label: old.label, status: 'Removed · check for omission', before: describe(old, 'before'), after: 'Not present' }); continue; }
    used.add(index); const next = after[index];
    const a = describe(old, 'before'), b = describe(next, 'after');
    if (a !== b || old.label !== next.label) changes.push({ label: next.label, status: 'Changed', before: a, after: b });
  }
  after.forEach((item, i) => { if (!used.has(i)) changes.push({ label: item.label, status: 'Added', before: 'Not present', after: describe(item, 'after') }); });
  return changes;
}

export function compareVersions(workspace) {
  const prior = previousVersion(workspace.previousVersion);
  if (!prior || !workspace.plan) return null;
  const a = prior.workspace.plan, b = workspace.plan;
  const facts = [];
  for (const [path, label] of Object.entries({ title: 'Event title', eventDate: 'Event date', startTime: 'Start time', requestedWeekday: 'Supplied weekday', venue: 'Venue', organizer: 'Organizer', signatory: 'Invitation signatory', currency: 'Currency', spendingLimitMinor: 'Spending limit' })) {
    const old = path === 'spendingLimitMinor' ? money(a[path], a.currency) : display(a[path]);
    const next = path === 'spendingLimitMinor' ? money(b[path], b.currency) : display(b[path]);
    if (old !== next) facts.push({ label, before: old, after: next, status: 'Changed' });
  }
  const tasks = compareRows(a.tasks || [], b.tasks || [], task => `Owner: ${display(task.owner)} · Due: ${display(task.dueDate)}`);
  const budget = compareRows(a.budget || [], b.budget || [], (item, side) => {
    const currency = side === 'before' ? a.currency : b.currency;
    const total = item.unitCostMinor == null ? null : item.quantity * item.unitCostMinor;
    return `Quantity: ${display(item.quantity)} · Unit price: ${money(item.unitCostMinor, currency)} · Line total: ${money(total, currency)}`;
  });
  const beforeQ = questions(a.openQuestions), afterQ = questions(b.openQuestions);
  const afterKeys = new Set(afterQ.map(key)), beforeKeys = new Set(beforeQ.map(key));
  const resolved = new Set(questions(workspace.questionResolutions).map(key));
  const carried = new Set(prior.carriedQuestions.map(key));
  const questionChanges = beforeQ.map(question => ({ question, status: afterKeys.has(key(question)) ? carried.has(key(question)) ? 'Kept open · omitted by update' : 'Still open' : resolved.has(key(question)) ? 'Marked resolved by you' : 'Absent · not marked resolved' }));
  for (const question of afterQ) if (!beforeKeys.has(key(question))) questionChanges.push({ question, status: 'New open question' });
  for (const question of questions(workspace.questionResolutions)) if (!beforeKeys.has(key(question)) && !afterKeys.has(key(question))) questionChanges.push({ question, status: 'New question · marked resolved by you' });
  const drafts = ['invitation', 'schedule'].map(path => ({ path, label: path === 'invitation' ? 'Invitation' : 'Run of show', changed: a.drafts?.[path] !== b.drafts?.[path], before: a.drafts?.[path] || '', after: b.drafts?.[path] || '' }));
  return { facts, tasks, budget, questions: questionChanges, drafts, budgetBefore: budgetSummary(a), budgetAfter: budgetSummary(b), notesChanged: prior.workspace.request !== workspace.request, capturedAt: prior.capturedAt, action: prior.action, updateText: prior.workspace.answers };
}
