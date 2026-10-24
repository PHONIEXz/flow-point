import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as pause} from 'node:timers/promises';
import {fetch,EnvHttpProxyAgent} from 'undici';
import {prepareInStages} from '../public/generation.mjs';
import {scoreOperation} from '../evaluation/score-v2.mjs';
const dir='docs/evidence/groq-live-2026-10-24';await mkdir(dir,{recursive:true});
const fixture=JSON.parse(await readFile('evaluation/cases-v2.json','utf8')).cases.find(c=>c.id==='fresh-church');
const report={startedAt:new Date().toISOString(),appCommit:process.env.FLOWPOINT_CODE_COMMIT||null,scope:'Exposed church case, one staged Prepare and dependent Update. Reuses frozen v2 declared checks, not a new blind evaluation or reliability estimate.',fixtureSha256:createHash('sha256').update(JSON.stringify(fixture)).digest('hex'),runs:[]};
const dispatcher=new EnvHttpProxyAgent({headersTimeout:450000,bodyTimeout:450000});
const config=await(await fetch('https://flowpoint.phoenixreborn.tech/api/config',{dispatcher,signal:AbortSignal.timeout(15000)})).json();report.config=config;
if(config.provider!=='groq'||!config.liveAvailable)throw Error('Groq is not configured; no inference attempted.');
let previousPlan=null,lastCall=0;
async function save(){await writeFile(`${dir}/result.json`,JSON.stringify(report,null,2)+'\n');}
await save();
for(const action of ['prepare','update']){
 const row={action,startedAt:new Date().toISOString(),stages:[]};report.runs.push(row);
 try{
  const result=await prepareInStages({processingProvider:'groq',request:fixture.request,answers:action==='update'?fixture.answers:'',previousPlan},{call:async data=>{
   const remaining=65000-(Date.now()-lastCall);if(remaining>0){console.log(JSON.stringify({event:'spacing_calls',waitMs:remaining}));await pause(remaining);}
   lastCall=Date.now();const started=Date.now();
   const r=await fetch('https://flowpoint.phoenixreborn.tech/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),dispatcher,signal:AbortSignal.timeout(435000)});
   const raw=await r.text();let value;try{value=JSON.parse(raw);}catch{value={error:'Non-JSON upstream response'};}
   row.stages.push({stage:data.stage,httpStatus:r.status,wallMs:Date.now()-started,response:value});await save();console.log(JSON.stringify({action,stage:data.stage,httpStatus:r.status,requestId:value.requestId}));
   if(!r.ok)throw Object.assign(Error(value.error||`HTTP ${r.status}`),{httpStatus:r.status});return value;
  }});
  row.result=result;row.score=scoreOperation(result.plan,fixture.expected[action]);row.completed=true;previousPlan=result.plan;
 }catch(e){row.error=e.message;row.httpStatus=e.httpStatus;row.completed=false;}
 row.finishedAt=new Date().toISOString();await save();console.log(JSON.stringify({action,completed:row.completed,checks:row.score?.counts,error:row.error}));
 if(!row.completed){report.stoppedReason='No repeated operation attempts. Failed Prepare or quota stops dependent/later requests.';break;}
}
report.finishedAt=new Date().toISOString();await save();await dispatcher.close();
