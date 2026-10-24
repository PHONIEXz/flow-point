import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { EnvHttpProxyAgent, fetch } from 'undici';
import { setTimeout as pause } from 'node:timers/promises';
import { prepareInStages } from '../public/generation.mjs';
import { updatedWorkspace } from '../public/update-history.mjs';
import { scoreOperation, templateWorksheet } from '../evaluation/score-v2.mjs';
const arg=(name,fallback)=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:fallback;
const site=arg('--site','https://flowpoint.phoenixreborn.tech').replace(/\/$/,'');
const live=process.argv.includes('--live');
const output=arg('--output',live?'docs/evidence/quality-v2-2026-10-24':'tmp/quality-dry-run');
const raw=await readFile('evaluation/cases-v2.json','utf8');
const freeze=JSON.parse(await readFile('evaluation/freeze-v2.json','utf8'));
const digest=createHash('sha256').update(raw).digest('hex');
if(digest!==freeze.casesSha256) throw Error('Frozen case file changed. Use a new version rather than silently changing expectations.');
for(const [path,hash] of Object.entries(freeze.files)) if(createHash('sha256').update(await readFile(path)).digest('hex')!==hash) throw Error(`Frozen implementation/scorer changed: ${path}`);
const suite=JSON.parse(raw);
const manifest=JSON.parse(await readFile('package.json','utf8'));
await mkdir(output,{recursive:true});
const dispatcher=new EnvHttpProxyAgent({headersTimeout:450000,bodyTimeout:450000});
let calls=0,bucket=Math.floor(Date.now()/600000),stop=false;
const perBucket=24; // Leave capacity for the owner's browser; do not evade service quota.
async function post(path,data,row,stage){
  if(path==='/api/generate') {
    const next=Math.floor(Date.now()/600000);if(next!==bucket){bucket=next;calls=0;}
    while(calls>=perBucket&&Math.floor(Date.now()/600000)===bucket){
      const wait=Math.min(30000,(bucket+1)*600000-Date.now()+1000);
      console.log(JSON.stringify({event:'quota_cooldown',until:new Date((bucket+1)*600000+1000).toISOString()}));await pause(Math.max(0,wait));
    }
    const current=Math.floor(Date.now()/600000);if(current!==bucket){bucket=current;calls=0;}calls++;
  }
  const started=Date.now();
  const response=await fetch(site+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),dispatcher,signal:AbortSignal.timeout(path==='/api/generate'?435000:30000)});
  const value=await response.json();
  if(path==='/api/generate') {row.attempts.push({stage,httpStatus:response.status,wallMs:Date.now()-started,response:value});await writeFile(`${output}/${row.id}-${row.action}.json`,JSON.stringify(row,null,2)+'\n');}
  if(response.status===429)stop=true;
  if(!response.ok)throw Object.assign(Error(value.error||`HTTP ${response.status}`),{httpStatus:response.status,requestId:value.requestId});
  return value;
}
const report={version:1,packageVersion:manifest.version,startedAt:new Date().toISOString(),site,casesSha256:digest,frozenAt:freeze.frozenAt,appCommit:freeze.appCommit,scope:'Ten paired fictional cases; four exposed and six fresh before first inference. Literal declared checks, not exhaustive semantic review or an independent blinded evaluation. One operation attempt each, with the existing server retry policy; skips and failures remain visible.',runs:[]};
async function summarize(){
 const groups={};
 for(const cohort of ['exposed','fresh-before-first-inference']) {
  const rows=report.runs.filter(r=>r.cohort===cohort),attempted=rows.filter(r=>r.attempted),completed=rows.filter(r=>r.completed);
  const statuses={};for(const row of completed)for(const [k,n] of Object.entries(row.appScore.counts))statuses[k]=(statuses[k]||0)+n;
  groups[cohort]={planned:suite.cases.filter(c=>c.cohort===cohort).length*2,recorded:rows.length,attempted:attempted.length,completed:completed.length,failed:attempted.filter(r=>!r.completed).length,skipped:rows.filter(r=>!r.attempted).length,applicationChecksPassed:completed.filter(r=>r.appChecksPassed).length,exportFailures:completed.flatMap(r=>r.exports).filter(e=>e.httpStatus!==200||!e.pdfHeader).length,allDeclaredChecksPassed:completed.filter(r=>r.appScore.allDeclaredChecksPassed).length,declaredCheckStatuses:statuses};
 }
 report.summary={planned:20,attempted:report.runs.filter(r=>r.attempted).length,completed:report.runs.filter(r=>r.completed).length,failed:report.runs.filter(r=>r.attempted&&!r.completed).length,skipped:report.runs.filter(r=>!r.attempted).length,stoppedOnQuota:stop,groups};
 await writeFile(`${output}/summary.json`,JSON.stringify(report,null,2)+'\n');
 const lines=['# Flow Point quality evaluation v2',`Started ${report.startedAt}. Frozen cases SHA-256: ${digest}.`,'',report.scope,'','| Cohort | Planned operations | Attempted | Completed | Failed | Skipped | All declared checks passed |','| --- | ---: | ---: | ---: | ---: | ---: | ---: |'];
 for(const [name,g]of Object.entries(groups))lines.push(`| ${name} | ${g.planned} | ${g.attempted} | ${g.completed} | ${g.failed} | ${g.skipped} | ${g.allDeclaredChecksPassed} |`);
 lines.push('','These are operation and declared-check counts, not an overall reliability percentage. Raw model outputs, application question preservation, safe request receipts and failures are stored separately per operation. Manual review time and a timed human baseline are unmeasured.','', '| Case / action | Result | Non-passing declared checks |', '| --- | --- | --- |');
 for(const r of report.runs)lines.push(`| ${r.id} / ${r.action} | ${r.completed?'Completed':r.attempted?'Failed':'Skipped'} | ${r.completed?r.appScore.checks.filter(c=>c.status!=='correct').map(c=>`${c.label}: ${c.status}`).join('; ').replaceAll('|','/'):String(r.error||r.skipReason).replaceAll('|','/')} |`);
 await writeFile(`${output}/scorecard.md`,lines.join('\n')+'\n');
}
for(const fixture of suite.cases){
 let previous=null;
 for(const action of ['prepare','update']) {
  await writeFile(`${output}/${fixture.id}-${action}-template.md`,templateWorksheet(fixture,action));
  const path=`${output}/${fixture.id}-${action}.json`;
  let interruptedRecord=null;
  try{await access(path);const saved=JSON.parse(await readFile(path,'utf8'));if(saved.casesSha256===digest&&saved.finishedAt){report.runs.push(saved);if(saved.completed)previous=saved.applied;if(saved.failure?.httpStatus===429)stop=true;console.log(JSON.stringify({event:'reused_record',id:fixture.id,action,completed:saved.completed}));continue;} interruptedRecord=`${fixture.id}-${action}.interrupted-${Date.now()}.json`;await writeFile(`${output}/${interruptedRecord}`,JSON.stringify(saved,null,2)+'\n');}catch{}
  const row={id:fixture.id,cohort:fixture.cohort,action,casesSha256:digest,startedAt:new Date().toISOString(),attempted:false,completed:false,attempts:[],interruptedRecord};
  if(!live||stop||(action==='update'&&!previous)){row.skipReason=!live?'Dry run, pass --live for hosted inference.':stop?'Stopped after quota response.':'Prepare did not produce a pack; Update depends on it.';}
  else {
   row.attempted=true;console.log(JSON.stringify({event:'operation_started',id:fixture.id,action}));const started=Date.now();
   try{
    const generated=await prepareInStages({request:fixture.request,answers:action==='update'?fixture.answers:'',previousPlan:action==='update'?previous.plan:null},{call:data=>post('/api/generate',data,row,data.stage),progress:({stage})=>console.log(JSON.stringify({event:'stage',id:fixture.id,action,stage}))});
    row.rawModelResult=generated;row.rawModelScore=scoreOperation(generated.plan,fixture.expected[action]);
    const workspace=action==='update'?updatedWorkspace({request:fixture.request,answers:fixture.answers,plan:previous.plan,provenance:previous.provenance},generated):{request:fixture.request,answers:'',plan:generated.plan,approval:null,provenance:generated.provenance};
    const reviewed=await post('/api/review',{plan:workspace.plan},row);workspace.plan=reviewed.plan;
    row.applied=workspace;row.questionAudit={raw:generated.plan.openQuestions,carriedForReview:workspace.previousVersion?.carriedQuestions||[],totalApplicationQuestions:workspace.plan.openQuestions.length};row.appScore=scoreOperation(workspace.plan,fixture.expected[action]);
    row.approvalProbe={attempted:reviewed.issues.length>0};
    if(reviewed.issues.length){try{await post('/api/approve',{plan:workspace.plan,confirmed:true},row);row.approvalProbe.blocked=false;}catch(e){row.approvalProbe.blocked=e.httpStatus===400;row.approvalProbe.httpStatus=e.httpStatus;}}
    row.exports=[];
    for(const section of ['invitation','schedule','tasks','budget']){
     const response=await fetch(site+'/api/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:workspace.plan,format:'pdf',section}),dispatcher,signal:AbortSignal.timeout(30000)});
     const bytes=Buffer.from(await response.arrayBuffer());row.exports.push({section,httpStatus:response.status,contentType:response.headers.get('content-type'),filename:response.headers.get('content-disposition'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),pdfHeader:bytes.subarray(0,5).toString()==='%PDF-'});
    }
    row.appChecksPassed=row.exports.every(e=>e.httpStatus===200&&e.contentType==='application/pdf'&&e.pdfHeader)&&(!row.approvalProbe.attempted||row.approvalProbe.blocked===true);
    row.completed=true;previous=workspace;
   }catch(error){row.error=error.message;row.failure={httpStatus:error.httpStatus??null,requestId:error.requestId??null};}
   row.wallMs=Date.now()-started;
  }
  row.finishedAt=new Date().toISOString();await writeFile(path,JSON.stringify(row,null,2)+'\n');report.runs.push(row);await summarize();
  console.log(JSON.stringify({event:'operation_finished',id:fixture.id,action,completed:row.completed,error:row.error,counts:row.appScore?.counts}));
 }
}
report.finishedAt=new Date().toISOString();await summarize();await dispatcher.close();console.log(JSON.stringify({event:'finished',...report.summary}));
