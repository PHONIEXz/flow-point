import { mkdir, readFile, writeFile } from 'node:fs/promises';
await mkdir('tmp', { recursive: true });
const source=await readFile('docs/school-event-test.md','utf8');
const request=source.split('## Initial brief\n\n')[1].split('\n## Follow-up update')[0].trim();
const answers=source.split('## Follow-up update\n\n')[1].split('\n## Expected checks')[0].trim();
const record={testedAt:new Date().toISOString(),input:'docs/school-event-test.md',site:'https://flowpoint.phoenixreborn.tech',checks:{}};
async function generate(data,label){
 const started=Date.now();
 const res=await fetch(record.site+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 const result=await res.json();record[label]={httpStatus:res.status,wallMs:Date.now()-started,...result};
 await writeFile('tmp/school-live-check.json',JSON.stringify(record,null,2));
 if(!res.ok) throw new Error(label+': '+result.error);
 return result;
}
try{
 const first=await generate({request},'initial');
 record.checks.initialKnownSubtotal=first.knownTotalMinor===13750000;
 record.checks.initialTwoUnknownPrices=first.plan.budget.filter(x=>x.unitCostMinor===null).length===2;
 record.checks.initialNoInventedStart=first.plan.startTime===null;
 const second=await generate({request,answers,previousPlan:first.plan},'updated');
 const p=second.plan;
 record.checks.updatedTotal=second.knownTotalMinor===18150000;
 record.checks.updatedDate=p.eventDate==='2026-11-21';
 record.checks.updatedStart=p.startTime==='10:00';
 record.checks.updatedVenue=/multipurpose hall/i.test(p.venue||'');
 record.checks.pendingRehearsalTime=p.openQuestions.some(x=>/rehears/i.test(x)&&/time/i.test(x));
 record.checks.firstAidOfficer=p.tasks.some(x=>/samuel\s+eze/i.test(x.owner||'')&&/first.?aid/i.test(x.label));
 record.checks.newRehearsalDate=p.tasks.some(x=>/rehears/i.test(x.label)&&x.dueDate==='2026-11-19');
 record.checks.noOldRehearsalDate=p.tasks.every(x=>x.dueDate!=='2026-11-12');
 record.checks.spendingLimit=p.tasks.some(x=>/200[,.]?000/.test(x.label));
 record.checks.remainingAllowance=p.tasks.some(x=>/18[,.]?500/.test(x.label));
 record.checks.approvalBlocked=second.issues.length>0;
}catch(error){record.failure=error.message;}
await writeFile('tmp/school-live-check.json',JSON.stringify(record,null,2));
console.log(JSON.stringify({checks:record.checks,failure:record.failure,initial:record.initial?.provenance,updated:record.updated?.provenance}));
