import { formatMinor } from '../public/money.mjs';
import { factFields, factSourceInfo } from '../public/source-fields.mjs';
import { isApproved, reviewPlan } from './plan.mjs';

function csvCell(value) {
  let cell = String(value);
  // Stop spreadsheet applications interpreting user/model text as formulas.
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(cell)) cell = `'${cell}`;
  return `"${cell.replaceAll('"', '""')}"`;
}

export function budgetCsv(input) {
  const { plan } = reviewPlan(input);
  const rows = [['Item', 'Quantity', 'Unit cost (minor units)', 'Subtotal (minor units)', 'Currency']];
  for (const item of plan.budget) rows.push([item.label, item.quantity, item.unitCostMinor ?? '', item.unitCostMinor === null ? '' : item.quantity * item.unitCostMinor, plan.currency]);
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function preparationPack(input, approval) {
  const { plan, issues, knownTotalMinor, budgetComplete, remainingAllowanceMinor, allowanceProvisional } = reviewPlan(input);
  const approved = isApproved(plan, approval);
  const money = value => `${plan.currency} ${formatMinor(Math.abs(value))}`;
  const facts = factFields(plan).map(field => factSourceInfo(plan, field.path));
  return [
    `# ${plan.title}`,
    `Status: ${approved ? 'Approved' : 'Draft: review required'}`,
    `Event date: ${plan.eventDate ?? '[Confirm date]'}`,
    `Venue: ${plan.venue ?? '[Confirm venue]'}`,
    `Start time: ${plan.startTime ?? '[Confirm time]'}`,
    `Organizer: ${plan.organizer ?? '[Confirm organizer]'}`,
    `Signatory: ${plan.signatory ?? '[Confirm signatory]'}`,
    '## Review notes',
    issues.length ? issues.map((issue) => `- ${issue.message}`).join('\n') : 'No structural issues found. Check all draft wording and facts before use.',
    '## Open questions', plan.openQuestions.length ? plan.openQuestions.map(q => `- ${q}`).join('\n') : 'None recorded. Review the source notes before use.',
    '## Source evidence and unconfirmed facts',
    ...facts.map(f => `- ${f.label}${f.context ? ` (${f.context.replaceAll('\0', ' / ')})` : ''}: ${f.value === null ? "Unknown" : JSON.stringify(f.value)}; ${f.status}${f.quote ? `; ${f.sourceKind} quote: ${JSON.stringify(f.quote)}` : '; no source quote'}.`),
    'A matching quote does not confirm interpretation. Unknown facts and unreviewed sources still need human review. Full original notes are not included.',
    '## Invitation', plan.drafts.invitation,
    '## Run of show', plan.drafts.schedule,
    '## Preparation checklist',
    plan.tasks.map((task) => `- [ ] ${task.label} | Owner: ${task.owner ?? '[Assign]'} | Due: ${task.dueDate ?? '[Set date]'}`).join('\n'),
    '## Budget',
    `Currency: ${plan.currency}. Amounts shown in main currency units.`,
    plan.budget.map((item) => `- ${item.label}: ${item.quantity} × ${item.unitCostMinor === null ? '[Confirm price]' : money(item.unitCostMinor)} = ${item.unitCostMinor === null ? '[Unknown subtotal]' : money(item.quantity * item.unitCostMinor)}`).join('\n'),
    `${budgetComplete ? 'Total' : 'Known subtotal; incomplete budget'}: ${money(knownTotalMinor)}.`,
    `Spending limit: ${plan.spendingLimitMinor === null ? 'Not supplied' : money(plan.spendingLimitMinor) + '.'}`,
    remainingAllowanceMinor === null ? 'Remaining allowance: unknown without a spending limit.' : `${remainingAllowanceMinor < 0 ? 'Over budget by' : allowanceProvisional ? 'Provisional allowance before unknown costs' : 'Remaining allowance'}: ${money(remainingAllowanceMinor)}.${allowanceProvisional ? ' This is not a final available balance.' : ''}`,
    'Approval covers this exact plan version. Editing the plan requires a new review.'
  ].join('\n\n') + '\n';
}
