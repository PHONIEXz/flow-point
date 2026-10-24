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
    '## Invitation', plan.drafts.invitation,
    '## Run of show', plan.drafts.schedule,
    '## Preparation checklist',
    plan.tasks.map((task) => `- [ ] ${task.label} | Owner: ${task.owner ?? '[Assign]'} | Due: ${task.dueDate ?? '[Set date]'}`).join('\n'),
    '## Budget',
    `Currency: ${plan.currency}. Amounts below are integer minor units (for NGN, kobo).`,
    plan.budget.map((item) => `- ${item.label}: ${item.quantity} × ${item.unitCostMinor ?? '[Confirm price]'}`).join('\n'),
    `${budgetComplete ? 'Total' : 'Known subtotal; incomplete budget'}: ${knownTotalMinor} minor units.`,
    `Spending limit: ${plan.spendingLimitMinor === null ? 'Not supplied' : plan.spendingLimitMinor + ' minor units.'}`,
    remainingAllowanceMinor === null ? 'Remaining allowance: unknown without a spending limit.' : `${remainingAllowanceMinor < 0 ? 'Over budget by' : allowanceProvisional ? 'Provisional allowance before unknown costs' : 'Remaining allowance'}: ${Math.abs(remainingAllowanceMinor)} minor units.${allowanceProvisional ? ' This is not a final available balance.' : ''}`,
    'Approval covers this exact plan version. Editing the plan requires a new review.'
  ].join('\n\n') + '\n';
}
