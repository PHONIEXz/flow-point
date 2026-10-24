import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sourceContentIssues} from '../src/content-checks.mjs';
import {generatePack} from '../src/gemma.mjs';
const captured=JSON.parse(await readFile(new URL('./church-regression.json',import.meta.url)));
const good=()=>({...structuredClone(captured.rows[0].plan),tasks:[{label:'Lead the choir',owner:'Musa Bello',dueDate:null}],budget:[{label:'Programmes',quantity:80,unitCostMinor:125},{label:'Sound system hire',quantity:1,unitCostMinor:25000},{label:'Flowers',quantity:1,unitCostMinor:null}]});
const reply=p=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(p)}]}}]});
const config={apiKey:'test',wait:async()=>{},log(){}};
test('captured church omissions are rejected for both Prepare and Update',()=>{
 const [prepare,update]=captured.rows;
 assert.ok(sourceContentIssues(prepare.plan,{request:captured.request}).some(x=>/quantity/.test(x)));
 assert.ok(sourceContentIssues(prepare.plan,{request:captured.request}).some(x=>/Musa Bello/.test(x)));
 const issues=sourceContentIssues(update.plan,{request:captured.request,answers:captured.answers,previousPlan:prepare.plan});
 assert.ok(issues.some(x=>/programmes/.test(x)));assert.ok(issues.some(x=>/sound/.test(x)));assert.ok(issues.some(x=>/flower/.test(x)));assert.ok(issues.some(x=>/Musa Bello/.test(x)));
});
test('correct quantities and direct owner assignments survive unrelated and explicit updates',()=>{
 const p=good();assert.deepEqual(sourceContentIssues(p,{request:captured.request}),[]);
 assert.deepEqual(sourceContentIssues(p,{request:captured.request,answers:'The venue is now the annex.',previousPlan:p}),[]);
 const updated=good();updated.budget[0].quantity=100;updated.budget[2].unitCostMinor=3500;
 assert.deepEqual(sourceContentIssues(updated,{request:captured.request,answers:captured.answers,previousPlan:p}),[]);
 assert.deepEqual(sourceContentIssues(updated,{request:captured.request,answers:'Increase programmes to 100. Flowers now cost GBP 35.',previousPlan:p}),[]);
 const next={...updated,tasks:[{label:'Coordinate choir',owner:'Ada Okafor',dueDate:null}]};
 assert.deepEqual(sourceContentIssues(next,{request:captured.request,answers:'Ada Okafor leads the choir. Print 100 programmes at the same GBP 1.25 each.',previousPlan:p}),[]);
});
test('explicit removals remain allowed and prices cannot silently change',()=>{
 const p=good();p.budget=p.budget.filter(b=>!/Sound/.test(b.label));
 assert.deepEqual(sourceContentIssues(p,{request:captured.request,answers:'Remove sound hire.',previousPlan:good()}),[]);
 p.budget=[];p.tasks=[];
 assert.deepEqual(sourceContentIssues(p,{request:captured.request,answers:'Clear all budget items. Musa Bello is no longer leading the choir.',previousPlan:good()}),[]);
 const missingSound=good();missingSound.budget.splice(1,1);assert.ok(sourceContentIssues(missingSound,{request:captured.request}).some(x=>/sound/.test(x)));
 const bad=good();bad.budget[0].unitCostMinor=12500;assert.ok(sourceContentIssues(bad,{request:captured.request}).some(x=>/unit price/.test(x)));
});
test('both API generation paths regenerate omissions, preserve the input, and cap failed retries',async()=>{
 for(const stage of ['facts',null]){
  let calls=0;const before=structuredClone(captured.rows[0].plan);
  const result=await generatePack({request:captured.request,stage},{...config,fetchImpl:async()=>reply(++calls===1?captured.rows[0].plan:good())});
  assert.equal(calls,2);assert.equal(result.plan.budget[0].quantity,80);assert.deepEqual(captured.rows[0].plan,before);
  calls=0;await assert.rejects(generatePack({request:captured.request,stage},{...config,fetchImpl:async()=>{calls++;return reply(captured.rows[0].plan);}}),e=>e.code==='MODEL_CONTENT_MISSING');assert.equal(calls,3);
 }
});

test('new explicit owner replaces the old owner for now-leads and replaces-as wording',()=>{
 const p=good();p.tasks=[{label:'Lead choir',owner:'Nora Cole',dueDate:null}];
 for(const answers of ['Nora Cole now leads the choir instead of Musa Bello.','Nora Cole replaces Musa Bello as choir lead.']) {
  assert.deepEqual(sourceContentIssues(p,{request:captured.request,answers}),[]);
  assert.ok(sourceContentIssues(good(),{request:captured.request,answers}).some(x=>/Nora Cole/.test(x)));
 }
});
