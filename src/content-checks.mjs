// Conservative checks for explicit English statements. They reject omissions;
// they never populate facts or certify semantic truth. Human source review remains required.
const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function amountMinor(value) {
  const [whole, fraction = ''] = value.replaceAll(',', '').split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2,'0'));
  return Number.isSafeInteger(result) ? result : null;
}
function rehearsalContext(value) {
  // Sentences/paragraphs mentioning rehearsal, including a following approval sentence.
  return [...value.matchAll(/[^\n.!?]*\brehears\w*[^\n.!?]*(?:[.!?][^\n.!?]{0,160})?/gi)].map(m => m[0]).join('\n');
}
export function sourceContentIssues(plan, { request = '', answers = '' } = {}) {
  const issues = [];
  const source = request + '\n' + answers;
  const costs = [...source.matchAll(new RegExp(`\\b${escape(plan.currency)}\\s*([0-9]+(?:,[0-9]{3})*(?:\\.[0-9]{1,2})?)(?!\\d|,\\d|\\.\\d)`, 'gi'))].map(m => amountMinor(m[1])).filter(n => n !== null);
  const supplied = new Set(costs);
  // Only identify a demonstrable factor-of-100 discrepancy, not unspecified-price syntax.
  if (plan.budget.some(item => item.unitCostMinor !== null && item.unitCostMinor !== 0 && !supplied.has(item.unitCostMinor) && (supplied.has(item.unitCostMinor * 100) || supplied.has(item.unitCostMinor / 100)))) issues.push('Check supplied prices: costs must be integer minor units, so multiply main currency units by 100.');
  if (/\b(?:spending limit|budget cap)\b[^\n.!?]{0,35}\b\d/i.test(source) && plan.spendingLimitMinor === null) issues.push('Retain the explicitly supplied spending limit in spendingLimitMinor.');
  // An honorific and a direct assignment predicate limit this check to explicit named duties.
  // Latest explicit reassignment/cancellation is left for human review rather than inferred.
  const activeSource = answers || request;
  const people = [...activeSource.matchAll(/\b(?:Mr|Mrs|Miss|Ms|Dr)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})([^\n.!?]*)/g)];
  for (const [, name, clause] of people) {
    if (!/\b(?:will|leads?|coordinates?|responsible|confirmed|assigned)\b/i.test(clause) || !/\b(?:approv\w*|organis\w*|organiz\w*|prepar\w*|coordinat\w*|lead\w*|officer|responsib\w*)\b/i.test(clause)) continue;
    if (/\b(?:cancel\w*|replac\w*|no longer|not the)\b/i.test(clause)) continue;
    if (!plan.tasks.some(task => (task.owner || '').toLowerCase().includes(name.toLowerCase()))) issues.push('Include every explicitly assigned named person as a checklist owner; do not leave a confirmed first-aid officer only in prose.');
  }
  const latest = rehearsalContext(answers) || rehearsalContext(request);
  if (latest && !/\b(?:cancelled|canceled|no rehearsal)\b/i.test(latest)) {
    const dateMatch = latest.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
    const iso = latest.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
    const date = dateMatch ? `${dateMatch[3]}-${String(months.indexOf(dateMatch[2].toLowerCase())+1).padStart(2,'0')}-${dateMatch[1].padStart(2,'0')}` : iso;
    if (date && !plan.tasks.some(task => /rehears/i.test(task.label) && task.dueDate === date)) issues.push('Include the explicitly dated rehearsal as a checklist task with its supplied dueDate, keeping its time approval separate.');
    if (/\btime\b[^\n.!?]{0,50}\b(?:approval|approved|pending)\b/i.test(latest) && /\b(?:needs?|await\w*|pending|unconfirmed|not approved)\b/i.test(latest) && !plan.openQuestions.some(q => /rehears/i.test(q) && /time|approv/i.test(q))) issues.push('Retain the unresolved rehearsal-time approval as a specific open question.');
  }
  const after = source.match(/after the event[^\n]*(?:\n[^\n]+)?/i)?.[0] || '';
  const taskText = plan.tasks.map(t=>t.label).join('\n');
  for (const [requested, present, label] of [
    [/clean(?:up|ing)?|clean the venue/i,/clean|tidy/i,'cleanup'],
    [/return borrowed equipment/i,/return.*(?:equipment|borrow)|(?:equipment|borrow).*return/i,'returning borrowed equipment'],
    [/reconcile spending/i,/reconcil|reconcile|account.*spend|spend.*account/i,'reconciling spending'],
    [/record.*feedback|collect.*feedback/i,/feedback/i,'recording feedback']
  ]) if (requested.test(after) && !present.test(taskText) && !/cancel.*after.event|no after.event/i.test(answers)) issues.push(`Retain the explicitly requested after-event checklist duty: ${label}.`);
  return [...new Set(issues)];
}
