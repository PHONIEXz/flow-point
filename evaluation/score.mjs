import { clockTimes, reviewPlan } from '../src/plan.mjs';
import { factSourceInfo } from '../public/source-fields.mjs';
const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]/gu,' ').replace(/\s+/g,' ').trim();
const options = value => Array.isArray(value) ? value : [value];
const same = (actual, expected) => options(expected).some(v => typeof v === 'string' ? normalize(actual) === normalize(v) : actual === v);
const contains = (text, expected) => options(expected).some(v => normalize(text).includes(normalize(v)));
const named = (text, name) => normalize(text).includes(normalize(name));
function outcome(label, actual, expected, path) {
  const ok = same(actual, expected);
  return { label, path, expected, actual: actual ?? null, status: ok ? 'correct' : actual == null || actual === '' ? 'missing' : expected == null ? 'invented-for-explicit-unknown' : 'wrong' };
}

// Literal, declared checks. This is not an exhaustive semantic fact-checker.
export function scoreOperation(plan, expected) {
  const checks = [];
  for (const [path, value] of Object.entries(expected.facts)) {
    const check = outcome(`Fact: ${path}`, plan[path], value, path);
    if (['wrong','invented-for-explicit-unknown'].includes(check.status)) {
      const source = factSourceInfo(plan,path);
      check.sourceState = source.status;
      check.specificSourceWarning = ['unsupported','manual','unknown'].includes(source.status);
    }
    checks.push(check);
  }
  const used = new Set();
  for (const item of expected.budget) {
    const index = plan.budget.findIndex((row,i) => !used.has(i) && item.match.some(term => normalize(row.label).includes(normalize(term))));
    if (index < 0) { checks.push({ label:`Budget line: ${item.match[0]}`, status:'missing', expected:item, actual:null }); continue; }
    used.add(index); const row = plan.budget[index];
    checks.push(outcome(`Budget quantity: ${item.match[0]}`,row.quantity,item.quantity,`budget.${index}.quantity`));
    checks.push(outcome(`Budget price: ${item.match[0]}`,row.unitCostMinor,item.unitCostMinor,`budget.${index}.unitCostMinor`));
  }
  plan.budget.forEach((row,i) => { if(!used.has(i)) checks.push({ label:'Unexpected budget line',status:'unverified-extra',actual:row,expected:null }); });
  const review = reviewPlan(plan);
  for (const field of ['knownTotalMinor','remainingAllowanceMinor']) checks.push(outcome(`Arithmetic: ${field}`,review[field],expected[field]));
  checks.push(outcome('Unknown price count',plan.budget.filter(x=>x.unitCostMinor==null).length,expected.unknownPrices));
  for (const owner of expected.owners) {
    const rows = plan.tasks.filter(t=>new RegExp(owner.rolePattern,'i').test(t.label));
    const found = rows.some(t=>named(t.owner,owner.name));
    checks.push({ label:`Responsibility: ${owner.name}`, expected:owner,actual:rows.map(t=>({label:t.label,owner:t.owner})),status:found?'correct':rows.length?'wrong':plan.tasks.some(t=>named(t.owner,owner.name))?'needs-manual-review':'missing' });
  }
  for (const item of expected.taskDates || []) checks.push({ label:`Task date: ${item.pattern}`,expected:item.date,actual:plan.tasks.filter(t=>new RegExp(item.pattern,'i').test(t.label)).map(t=>t.dueDate),status:plan.tasks.some(t=>new RegExp(item.pattern,'i').test(t.label)&&t.dueDate===item.date)?'correct':'missing-or-wrong' });
  for (const question of expected.pendingQuestions) checks.push({ label:`Pending question: ${question.label}`,expected:question.pattern,actual:plan.openQuestions.filter(q=>new RegExp(question.pattern,'i').test(q)),status:plan.openQuestions.some(q=>new RegExp(question.pattern,'i').test(q))?'correct':'missing' });
  for (const [draftName,text] of Object.entries(plan.drafts)) {
    for (const field of draftName==='invitation'?['venue','signatory']:['venue']) {
      const value=expected.facts[field];
      if(value!=null) checks.push({ label:`${draftName}: ${field}`, expected:value, status:contains(text,value)?'correct':'missing-or-wrong' });
    }
    if(expected.facts.startTime) checks.push({label:`${draftName}: confirmed start`,expected:expected.facts.startTime,status:clockTimes(text).includes(expected.facts.startTime)?'correct':'missing-or-wrong'});
    if(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) checks.push({label:`${draftName}: unsupplied contact address`,status:'unverified-extra',actual:'An email-shaped string appears although none is supplied.'});
  }
  checks.push({label:'schedule: document kind',expected:'programme rather than invitation prose',status:/dear (?:members|parents|guests)|cordially invited|you are (?:warmly )?invited/i.test(plan.drafts.schedule)?'needs-manual-review':'correct'});
  const lines=plan.drafts.schedule.split('\n');
  for (const [time,activity,duration] of expected.schedule) {
    const line=lines.find(line=>clockTimes(line)[0]===time&&new RegExp(activity,'i').test(line));
    const times=line?clockTimes(line):[];
    const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
    const rangeOk=times.length>1&&(minutes(times[1])-minutes(times[0])+1440)%1440===duration;
    const durationOk=line&&new RegExp(`\\b${duration}\\s*(?:minutes?|mins?)\\b`,'i').test(line);
    checks.push({label:`Programme: ${time} ${activity} (${duration} min)`,expected:{time,activity,duration},actual:line??null,status:line&&(rangeOk||durationOk)?'correct':line?'needs-manual-review':'missing-or-wrong'});
  }
  const {sourceEvidence,...content}=plan;
  for(const text of expected.forbidden) checks.push({label:`Untrusted text excluded: ${text}`,expected:'absent',status:contains(JSON.stringify(content),text)?'wrong':'correct'});
  for(const check of checks) if(check.path && ['wrong','invented-for-explicit-unknown'].includes(check.status) && check.specificSourceWarning===undefined) { const source=factSourceInfo(plan,check.path);check.sourceState=source.status;check.specificSourceWarning=['unsupported','manual','unknown'].includes(source.status); }
  const counts={};for(const check of checks) counts[check.status]=(counts[check.status]||0)+1;
  return {checks,counts,allDeclaredChecksPassed:checks.every(c=>c.status==='correct'),wrongFactsWithoutSpecificSourceWarning:checks.filter(c=>c.path&&c.status==='wrong'&&!c.specificSourceWarning).map(c=>c.path),reviewIssues:review.issues};
}

// A worksheet filled from the prewritten answer key, not a source-note extractor
// or a timed human baseline. It makes the arithmetic/presentation comparison explicit.
export function templateWorksheet(fixture,action) {
  const e=fixture.expected[action];
  return `# ${options(e.facts.title)[0]}: filled template baseline\n\n`+
    'The assistant filled this worksheet from the frozen expected values. It is not an independent extraction benchmark or measured human workflow.\n\n'+
    Object.entries(e.facts).map(([k,v])=>`- ${k}: ${JSON.stringify(v)}`).join('\n')+'\n\n'+
    '| Item | Quantity | Unit price in minor units |\n| --- | ---: | ---: |\n'+e.budget.map(b=>`| ${b.match[0]} | ${b.quantity} | ${b.unitCostMinor??'Unknown'} |`).join('\n')+`\n\nKnown subtotal in minor units: ${e.knownTotalMinor}. Remaining/provisional allowance in minor units: ${e.remainingAllowanceMinor??'Unknown'}. Unknown prices: ${e.unknownPrices}.\n\n`+
    'Pending questions: '+e.pendingQuestions.map(q=>q.label).join('; ')+'.\n\nInvitation wording, schedule wording and full suggested checklist still require authoring and review. No time-saving claim is made.\n';
}
