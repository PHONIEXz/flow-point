import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fetch,EnvHttpProxyAgent} from 'undici';
import {scoreOperation} from '../evaluation/score-v2.mjs';
const suite=JSON.parse(await readFile('evaluation/cases-v2.json','utf8'));
const fixture=suite.cases.find(c=>c.id==='fresh-church');
const path='docs/evidence/budget-owner-fix-2026-10-24.json';
const report={startedAt:new Date().toISOString(),appCommit:process.env.FLOWPOINT_CODE_COMMIT||null,scope:'Exposed church regression only, facts stage Prepare and Update. Not a new blind evaluation or full-pack test.',fixtureSha256:createHash('sha256').update(JSON.stringify(fixture)).digest('hex'),runs:[]};
for(const file of ['src/gemma.mjs','src/content-checks.mjs','src/explicit-obligations.mjs']) (report.files||={})[file]=createHash('sha256').update(await readFile(file)).digest('hex');
await mkdir('docs/evidence',{recursive:true});
const dispatcher=new EnvHttpProxyAgent({headersTimeout:450000,bodyTimeout:450000});
let previousPlan=null;
for(const action of ['prepare','update']) {
 const row={action,startedAt:new Date().toISOString()};
 try {
  const r=await fetch('https://flowpoint.phoenixreborn.tech/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request:fixture.request,answers:action==='update'?fixture.answers:'',previousPlan,stage:'facts'}),dispatcher,signal:AbortSignal.timeout(435000)});
  row.httpStatus=r.status;
  const raw=await r.text();
  try{row.response=JSON.parse(raw);}catch{row.error='Non-JSON upstream response';}
  if(r.ok&&row.response?.plan){previousPlan=row.response.plan;const scored=scoreOperation(previousPlan,fixture.expected[action]);row.budgetAndOwnerChecks=scored.checks.filter(c=>/Budget|Arithmetic|Responsibility/.test(c.label));row.targetChecksPassed=row.budgetAndOwnerChecks.every(c=>c.status==='correct');}
 }catch(e){row.error=e.message;}
 row.finishedAt=new Date().toISOString();report.runs.push(row);await writeFile(path,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({action,httpStatus:row.httpStatus,error:row.error,requestId:row.response?.requestId,targetChecksPassed:row.targetChecksPassed}));
 if(!previousPlan||row.httpStatus!==200){report.stoppedReason=row.httpStatus===429?'Provider/service quota; no more requests attempted.':'Prepare/update did not return usable facts; no more requests attempted.';break;}
}
report.finishedAt=new Date().toISOString();await writeFile(path,JSON.stringify(report,null,2)+'\n');await dispatcher.close();
