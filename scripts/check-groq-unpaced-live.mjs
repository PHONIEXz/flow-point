import {readFile,writeFile} from 'node:fs/promises';
import {setTimeout as pause} from 'node:timers/promises';
import {fetch,EnvHttpProxyAgent} from 'undici';
import {prepareInStages} from '../public/generation.mjs';
import {scoreOperation} from '../evaluation/score-v2.mjs';
const dir='docs/evidence/groq-live-2026-10-24';
const earlier=JSON.parse(await readFile(`${dir}/result.json`,'utf8'));
const fixture=JSON.parse(await readFile('evaluation/cases-v2.json','utf8')).cases.find(c=>c.id==='fresh-church');
const report={appCommit:earlier.appCommit,scope:'One additional exposed Prepare with the browser generation helper and no artificial spacing between stages. Cooldown before the operation protects the existing free quota.',stages:[]};
const cooldown=Math.max(0,65000-(Date.now()-Date.parse(earlier.finishedAt)));if(cooldown){console.log(JSON.stringify({event:'before_operation_cooldown',waitMs:cooldown}));await pause(cooldown);}
report.startedAt=new Date().toISOString();const dispatcher=new EnvHttpProxyAgent({headersTimeout:450000,bodyTimeout:450000});
const save=()=>writeFile(`${dir}/unpaced-prepare.json`,JSON.stringify(report,null,2)+'\n');
try{
const result=await prepareInStages({processingProvider:'groq',request:fixture.request},{call:async data=>{
 const started=Date.now();const r=await fetch('https://flowpoint.phoenixreborn.tech/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),dispatcher,signal:AbortSignal.timeout(435000)});const value=await r.json();report.stages.push({stage:data.stage,httpStatus:r.status,wallMs:Date.now()-started,response:value});await save();console.log(JSON.stringify({stage:data.stage,httpStatus:r.status,requestId:value.requestId}));if(!r.ok)throw Error(value.error||`HTTP ${r.status}`);return value;
}});report.result=result;report.score=scoreOperation(result.plan,fixture.expected.prepare);report.completed=true;
}catch(e){report.completed=false;report.error=e.message;}
report.finishedAt=new Date().toISOString();report.operationWallMs=Date.parse(report.finishedAt)-Date.parse(report.startedAt);await save();await dispatcher.close();console.log(JSON.stringify({completed:report.completed,operationWallMs:report.operationWallMs,checks:report.score?.counts,error:report.error}));
