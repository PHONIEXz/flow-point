import { explicitObligationIssues } from './explicit-obligations.mjs';
import { clockTimes } from './plan.mjs';
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
function suppliedStart(text) {
  const values=[];let seen=false,uncertain=false;
  for(const clause of text.replace(/“[^”]*”|"[^"]*"|`[^`]*`/g,'').split(/[\n;!?]+|\.(?!\d)/)) {
    const matches=[...clause.matchAll(/\b(?:(?:programme|program|event)\s+(?:still\s+)?(?:runs?\s+from|begins?(?:\s+at)?|starts?(?:\s+at)?)|start(?:\s+time)?\s*(?:is|at|:)?)\s*(\d{1,2}[:.]\d{2}\s*(?:am|pm)?)/gi)];
    if(!matches.length)continue;seen=true;
    if(/\b(?:proposed|suggested|pending|unconfirmed|not approved|not confirmed|awaiting approval)\b/i.test(clause)){uncertain=true;continue;}
    for(const match of matches) {
      const time=clockTimes(match[1])[0];if(time)values.push(time);
    }
  }
  return !seen?undefined:!uncertain&&new Set(values).size===1?values[0]:null;
}
function hasSingleLocation(text) {
  const names=[];
  for(const clause of text.replace(/“[^”]*”|"[^"]*"|`[^`]*`/g,'').split(/[\n.!?;]+/)) {
    if(/\b(?:either|or|options?|choose between)\b/i.test(clause))continue;
    for(const match of clause.matchAll(/\b(?:at|in)\s+(?:the\s+)?((?:[A-Z][a-z]+\s+){0,4}(?:Hall|Room|Library|Chapel|Centre|Center)|school library|multipurpose hall)\b/g))names.push(match[1].toLowerCase());
  }
  return new Set(names).size===1;
}
export function sourceContentIssues(plan, { request = '', answers = '', previousPlan = null } = {}) {
  const issues = explicitObligationIssues(plan, { request, answers, previousPlan });
  const source = request + '\n' + answers;
  const timeWithdrawn=/\b(?:event|programme|program|start)\s+(?:start\s+)?time\s+(?:is\s+)?(?:now\s+)?(?:unknown|unconfirmed|pending|not confirmed|not approved)/i.test(answers);
  const latestStart=suppliedStart(answers);
  const start=timeWithdrawn?null:latestStart!==undefined?latestStart:suppliedStart(request);
  if(start && plan.startTime!==start)issues.push('Retain the latest explicitly supplied programme start time in startTime; registration and rehearsal times are separate.');
  const locationWithdrawn=/\b(?:venue|location)\s+(?:is\s+)?(?:now\s+)?(?:unknown|undecided|not selected|not chosen|TBD)\b/i.test(answers);
  if(!plan.venue&&!locationWithdrawn&&(hasSingleLocation(answers)||(!/\b(?:move|venue|location)\b/i.test(answers)&&(previousPlan?.venue||hasSingleLocation(request)))))issues.push('Retain the single supplied requested location in venue; a pending booking is a separate question, not a reason to erase its name.');
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
  if (latest && !/\b(?:cancel(?:led|ed)?|no rehearsal)\b/i.test(latest)) {
    const dateMatch = latest.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
    const iso = latest.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
    const date = dateMatch ? `${dateMatch[3]}-${String(months.indexOf(dateMatch[2].toLowerCase())+1).padStart(2,'0')}-${dateMatch[1].padStart(2,'0')}` : iso;
    if (!date && !plan.tasks.some(task=>/rehears/i.test(task.label))) issues.push('Retain the requested rehearsal as a checklist task, keeping unknown timing or approvals open.');
    if (date && !plan.tasks.some(task => /rehears/i.test(task.label) && task.dueDate === date)) issues.push('Include the explicitly dated rehearsal as a checklist task with its supplied dueDate, keeping its time approval separate.');
    if (/\btime\b[^\n.!?]{0,50}\b(?:approval|approved|pending)\b/i.test(latest) && /\b(?:needs?|await\w*|pending|unconfirmed|not approved)\b/i.test(latest) && !plan.openQuestions.some(q => /rehears/i.test(q) && /time|approv/i.test(q))) issues.push('Retain the unresolved rehearsal-time approval as a specific open question.');
  }
  let bookingPending=false;
  for(const clause of source.split(/[\n.!?;]+/)) {
    if(!/\b(?:booking|venue)\b/i.test(clause))continue;
    if(/\b(?:pending|unconfirmed|not confirmed|not approved|awaiting approval|needs approval)\b/i.test(clause))bookingPending=true;
    else if(/\b(?:confirmed|approved)\b|no booking (?:is )?required|booking (?:is )?cancelled/i.test(clause))bookingPending=false;
  }
  if(bookingPending && !plan.openQuestions.some(q=>/book|venue|room|hall|location/i.test(q))) issues.push('Retain the pending venue-booking approval as a specific open question.');
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
