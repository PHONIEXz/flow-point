// Bounded English source checks. These reject demonstrable omissions, never fill facts.
const words = value => value.toLowerCase().replace(/programmes?/g,'program').match(/[a-z]+/g)?.filter(w=>!['a','an','the','one','printed','print','each','same','unit','price','cost','costs','hire'].includes(w)).map(w=>w.endsWith('s')?w.slice(0,-1):w) || [];
const overlaps = (a,b) => words(a).some(w=>words(b).includes(w));
const counts = {one:1,two:2,three:3,four:4,five:5};
const cancelled = (text,label) => text.split(/[\n.!?]/).some(s=>/\b(?:remove|cancel|omit|drop|no longer|replace)\b/i.test(s)&&overlaps(s,label));
export function explicitObligationIssues(plan,{request='',answers='',previousPlan=null}={}) {
 const issues=[];
 const emptyBudgetAllowed=/\b(?:remove|clear|cancel) (?:the |all )?budget(?: items)?\b/i.test(answers);
 const expectations=[];
 for(const source of [request,answers]) {
  // A quantity and item immediately followed by an explicit unit price or unknown price.
  const pattern=/\b(\d+|one|two|three|four|five)\s+([A-Za-z][A-Za-z -]{0,70}?)(?:\s+|,\s*)(?:at\s+(?:the\s+)?(?:same\s+)?([A-Z]{3})\s+([\d,]+(?:\.\d{1,2})?)\s*(?:each\b)?(?=[,.;\n]|$|\s+and\b)|(?:with\s+)?(?:an?\s+)?(?:unknown|unconfirmed|pending)\s+(?:unit\s+)?price|(?:whose\s+)?(?:unit\s+)?price\s+(?:is\s+)?(?:still\s+)?(?:unknown|unconfirmed|pending|awaiting\s+approval))/g;
  for(const m of source.matchAll(pattern)) {
   let label=m[2].trim();const quantity=counts[m[1]]||Number(m[1]);
   const prefix=source.slice(source.lastIndexOf('\n',m.index)+1,m.index).trim();
   if(/^(?:copies|bottles|packages?|packs?|items?|pieces?|sets?)$/i.test(label)&&prefix.length<=100&&/[:—–-]$/.test(prefix)&&words(prefix).some(w=>!['budget','cost','item','total'].includes(w))) label=prefix.replace(/[:—–-]+$/,'').trim();
   if(!Number.isSafeInteger(quantity)||quantity<1)continue;
   const item={label,quantity,latest:source===answers};
   if(m[3]===plan.currency) item.unitCostMinor=Math.round(Number(m[4].replaceAll(',',''))*100);
   const index=expectations.findIndex(e=>overlaps(e.label,label));
   if(index<0)expectations.push(item);else expectations[index]=item;
  }
 }
 for(const expected of expectations) {
  if(emptyBudgetAllowed||cancelled(answers,expected.label))continue;
  const item=plan.budget.find(b=>overlaps(b.label,expected.label));
  if(!item)issues.push(`Retain the explicitly requested budget item: ${expected.label}.`);
  else {
   const changedInUpdate = !expected.latest && answers.split(/[\n.!?]/).some(s=>overlaps(s,expected.label)&&/\d/.test(s));
   if(!changedInUpdate && item.quantity!==expected.quantity)issues.push(`Use the latest supplied quantity for ${expected.label}: ${expected.quantity}.`);
   if(!changedInUpdate && expected.unitCostMinor!==undefined&&item.unitCostMinor!==expected.unitCostMinor)issues.push(`Use the supplied unit price for ${expected.label}: ${expected.unitCostMinor} minor units.`);
  }
 }
 // Updates cannot silently drop budget lines already reviewed in the previous pack.
 for(const item of previousPlan?.budget||[]) {
  if(!emptyBudgetAllowed&&!cancelled(answers,item.label)&&!plan.budget.some(b=>overlaps(b.label,item.label)))issues.push(`Preserve the unchanged previous budget line: ${item.label}.`);
 }
 // Direct assignments also appear without Mr/Mrs/Dr. Keep them through unrelated updates.
 const assignments=[];
 for(const source of [request,answers]) for(const m of source.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s+(?:now\s+)?(?:leads?|coordinates?|manages?|hosts?)\s+(?:the\s+)?([^\n.!?;]+)/g)) {
  const row={name:m[1],role:m[2]};
  const index=assignments.findIndex(a=>overlaps(a.role,row.role));
  if(index<0)assignments.push(row);else assignments[index]=row;
 }
 for(const m of answers.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s+replaces\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s+as\s+([^\n.!?;]+)/g)) {
  const row={name:m[1],role:m[3]};const index=assignments.findIndex(a=>a.name===m[2]||overlaps(a.role,row.role));if(index<0)assignments.push(row);else assignments[index]=row;
 }
 for(const {name,role} of assignments) {
  const withdrawn=answers.split(/[\n.!?]/).some(s=>((s.includes(name)&&/\b(?:no longer|unassigned|removed)\b/i.test(s))||(/\b(?:cancel|remove|drop|omit)\b/i.test(s)&&overlaps(s,role))));
  if(withdrawn)continue;
  if(!plan.tasks.some(t=>(t.owner||'').toLowerCase().includes(name.toLowerCase())&&overlaps(t.label,role)))issues.push(`Retain ${name} as checklist owner for the supplied duty: ${role}.`);
 }
 return issues;
}
