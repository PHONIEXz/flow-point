import { createHash } from 'node:crypto';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function calendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function text(value, name, maximum = 12000) {
  if (typeof value !== 'string' || value.length > maximum) throw new Error(`Invalid ${name}`);
  return value.trim();
}

// Treat model output as untrusted data. Preserve unknown facts as null.
export function validatePlan(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected a plan object');
  const title = text(input.title, 'title', 200);
  if (!title) throw new Error('Title is required');
  const eventDate = input.eventDate == null ? null : text(input.eventDate, 'event date', 10);
  if (eventDate !== null && !calendarDate(eventDate)) throw new Error('Invalid event date');
  const requestedWeekday = input.requestedWeekday == null ? null : text(input.requestedWeekday, 'weekday', 10);
  if (requestedWeekday !== null && !weekdays.includes(requestedWeekday)) throw new Error('Invalid weekday');
  const venue = input.venue == null ? null : text(input.venue, 'venue', 500) || null;
  const startTime = input.startTime == null ? null : text(input.startTime, 'start time', 5) || null;
  if (startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) throw new Error('Invalid start time');
  const organizer = input.organizer == null ? null : text(input.organizer, 'organizer', 200) || null;
  const signatory = input.signatory == null ? null : text(input.signatory, 'signatory', 200) || null;
  const currency = text(input.currency, 'currency', 3).toUpperCase();
  if (!['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD', 'CHF', 'INR', 'CNY', 'SGD', 'AED'].includes(currency)) throw new Error('Choose a supported currency with 100 minor units');
  if (!Array.isArray(input.tasks) || input.tasks.length > 100) throw new Error('Invalid tasks');
  const tasks = input.tasks.map((task) => {
    if (!task || typeof task !== 'object') throw new Error('Invalid task');
    const label = text(task.label, 'task label', 300);
    if (!label) throw new Error('Task label is required');
    const dueDate = task.dueDate == null ? null : text(task.dueDate, 'task date', 10);
    if (dueDate !== null && !calendarDate(dueDate)) throw new Error('Invalid task date');
    return { label, owner: task.owner == null ? null : text(task.owner, 'task owner', 150) || null, dueDate };
  });
  if (!Array.isArray(input.budget) || input.budget.length > 100) throw new Error('Invalid budget');
  const budget = input.budget.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid budget item');
    const label = text(item.label, 'budget label', 200);
    if (!label) throw new Error('Budget label is required');
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) throw new Error('Invalid quantity');
    const unitCostMinor = item.unitCostMinor ?? null;
    if (unitCostMinor !== null && (!Number.isSafeInteger(unitCostMinor) || unitCostMinor < 0)) throw new Error('Invalid unit cost');
    if (unitCostMinor !== null && !Number.isSafeInteger(item.quantity * unitCostMinor)) throw new Error('Budget amount is too large');
    return { label, quantity: item.quantity, unitCostMinor };
  });
  const knownTotalMinor = budget.reduce((total, item) => total + item.quantity * (item.unitCostMinor ?? 0), 0);
  if (!Number.isSafeInteger(knownTotalMinor)) throw new Error('Budget total is too large');
  const drafts = {};
  for (const key of ['invitation', 'schedule']) drafts[key] = text(input.drafts?.[key], key);
  if (!Array.isArray(input.openQuestions) || input.openQuestions.length > 50) throw new Error('Invalid open questions');
  const openQuestions = input.openQuestions.map((question) => text(question, 'open question', 500)).filter(Boolean);
  return { title, eventDate, requestedWeekday, venue, startTime, organizer, signatory, currency, tasks, budget, drafts, openQuestions };
}

export function reviewPlan(input) {
  const plan = validatePlan(input);
  const issues = [];
  if (!plan.eventDate) issues.push({ code: 'MISSING_DATE', message: 'Confirm the event date.' });
  if (!plan.venue) issues.push({ code: 'MISSING_VENUE', message: 'Confirm the venue.' });
  if (!plan.startTime) issues.push({ code: 'MISSING_TIME', message: 'Confirm the event start time.' });
  if (!plan.organizer) issues.push({ code: 'MISSING_ORGANIZER', message: 'Confirm the organizing school or group.' });
  if (!plan.signatory) issues.push({ code: 'MISSING_SIGNATORY', message: 'Confirm the invitation signatory.' });
  for (const question of plan.openQuestions) issues.push({ code: 'OPEN_QUESTION', message: question });
  if (!plan.drafts.invitation || !plan.drafts.schedule) issues.push({ code: 'MISSING_DRAFT', message: 'Complete both the invitation and run of show.' });
  if (Object.values(plan.drafts).some(draft => /\[(?:confirm\b|insert\b|enter\b|tbd\b|to be confirmed\b|(?:event\s+)?(?:date|time|venue|location|organizer|signatory|activity|name|price|quantity)\b)[^\]]*\]/i.test(draft))) issues.push({ code: 'DRAFT_PLACEHOLDER', message: 'Replace confirmation placeholders in the invitation and run of show.' });
  const actual = plan.eventDate && weekdays[calendarDate(plan.eventDate).getUTCDay()];
  if (actual && plan.requestedWeekday && actual !== plan.requestedWeekday) {
    issues.push({ code: 'DATE_CONFLICT', message: `${plan.eventDate} is a ${actual}, but the request says ${plan.requestedWeekday}.` });
  }
  plan.tasks.forEach((task, index) => {
    if (task.dueDate && plan.eventDate && task.dueDate > plan.eventDate) issues.push({ code: 'LATE_TASK', message: `Task ${index + 1} falls after the event. Confirm whether this is intentional.` });
  });
  const unknownPrices = plan.budget.filter((item) => item.unitCostMinor === null).length;
  if (unknownPrices) issues.push({ code: 'MISSING_PRICES', message: `${unknownPrices} budget item(s) need a price.` });
  const knownTotalMinor = plan.budget.reduce((total, item) => total + item.quantity * (item.unitCostMinor ?? 0), 0);
  return { plan, issues, knownTotalMinor, budgetComplete: unknownPrices === 0 };
}

export function fingerprint(input) {
  return createHash('sha256').update(JSON.stringify(validatePlan(input))).digest('hex');
}

export function approvePlan(input) {
  const review = reviewPlan(input);
  if (review.issues.length) throw new Error('Resolve review issues before approval');
  return { fingerprint: fingerprint(review.plan), approvedAt: new Date().toISOString() };
}

export function isApproved(input, approval) {
  return Boolean(approval?.fingerprint && approval.fingerprint === fingerprint(input));
}
