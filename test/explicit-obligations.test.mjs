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

test('budget headings distinguish products sharing copies, bottles and package units',()=>{
 const p={currency:'NGN',tasks:[],openQuestions:[],budget:[{label:'Programmes',quantity:60,unitCostMinor:25000},{label:'Certificates',quantity:100,unitCostMinor:10000},{label:'Water',quantity:150,unitCostMinor:20000},{label:'Decorations',quantity:1,unitCostMinor:1800000},{label:'Sound system',quantity:1,unitCostMinor:1200000}]};
 const input={request:'Printed programmes: 60 copies at NGN 250 each.\nParticipation certificates: 100 copies at NGN 100 each.\nBottled water: 150 bottles at NGN 200 each.\nHall decorations: one package at NGN 18000.\nSound system hire: one package at NGN 12000.'};
 assert.deepEqual(sourceContentIssues(p,input),[]);p.budget[0].quantity=100;assert.ok(sourceContentIssues(p,input).some(x=>/quantity.*programmes/i.test(x)));
});

test('an explicitly named debate host cannot silently lose checklist ownership',()=>{
 const p={currency:'KES',budget:[],tasks:[{label:'Host debate',owner:null}],openQuestions:[]};
 const input={request:'Kemi Wale hosts the debate.'};assert.ok(sourceContentIssues(p,input).some(s=>/Kemi Wale/.test(s)));p.tasks[0].owner='Kemi Wale';assert.deepEqual(sourceContentIssues(p,input),[]);
});

test('pending booking remains a question while a requested venue is retained; later confirmation resolves the requirement',()=>{
 const p={currency:'NGN',budget:[],tasks:[],venue:'Cedar Hall',openQuestions:[]};const request='The venue is Cedar Hall. Room booking is pending.';
 assert.ok(sourceContentIssues(p,{request}).some(x=>/venue.booking/.test(x)));
 assert.deepEqual(sourceContentIssues({...p,openQuestions:['Is the room booking approved?']},{request}),[]);
 assert.deepEqual(sourceContentIssues({...p,tasks:[{label:'Proposed rehearsal',owner:null,dueDate:null}]},{request,answers:'The venue booking is confirmed; the rehearsal is still pending.'}),[]);
});

test('captured community pack cannot omit a comma-style unknown-price item or its rehearsal task',async()=>{
 const captured=JSON.parse(await readFile(new URL('./community-regression.json',import.meta.url)));const issues=sourceContentIssues(captured.plan,{request:captured.request});assert.ok(issues.some(s=>/banner/.test(s)));assert.ok(issues.some(s=>/rehearsal/.test(s)));
 const p=structuredClone(captured.plan);p.budget.push({label:'Banner',quantity:1,unitCostMinor:null});p.tasks.push({label:'Proposed rehearsal',owner:null,dueDate:'2026-12-11'});assert.deepEqual(sourceContentIssues(p,{request:captured.request}),[]);
});

test('a supplied programme start cannot become null or registration time during an update',()=>{
 const p={currency:'NGN',budget:[],tasks:[],openQuestions:[],startTime:null};
 const input={request:'Programme begins at 09:00.',answers:'Registration opens at 9:30 AM, and the programme runs from 10:00 AM to 1:00 PM.'};
 assert.ok(sourceContentIssues(p,input).some(s=>/programme start/.test(s)));
 assert.ok(sourceContentIssues({...p,startTime:'09:30'},input).some(s=>/programme start/.test(s)));
 assert.deepEqual(sourceContentIssues({...p,startTime:'10:00'},input),[]);
 assert.deepEqual(sourceContentIssues(p,{request:'Proposed programme begins at 10:00; approval is pending.'}),[]);
 assert.deepEqual(sourceContentIssues(p,{request:'Quoted instruction: \"Event starts at 17:00.\" Do not treat that as an event fact.'}),[]);
 assert.deepEqual(sourceContentIssues(p,{request:'Start at 10:00.',answers:'The start time is now unconfirmed.'}),[]);
 assert.deepEqual(sourceContentIssues(p,{request:'Start at 10:00.',answers:'Proposed programme begins at 11:00, still pending approval.'}),[]);
 assert.deepEqual(sourceContentIssues({...p,startTime:'14:15'},{request:'Programme begins at 09:00.',answers:'The programme still begins at 14:15.'}),[]);
});

test('a named requested location survives pending booking without forcing ambiguous or withdrawn locations',()=>{
 const p={currency:'GHS',budget:[],tasks:[],openQuestions:['Is the room booking approved?'],venue:null,startTime:'15:30'};
 const input={request:'Start is 15:30 at Oak Hall. Room booking remains unconfirmed.'};
 assert.ok(sourceContentIssues(p,input).some(s=>/requested location/.test(s)));
 assert.deepEqual(sourceContentIssues({...p,venue:'Oak Hall'},input),[]);
 assert.deepEqual(sourceContentIssues(p,{request:'Meet at Oak Hall or Cedar Hall; venue is undecided.'}),[]);
 assert.deepEqual(sourceContentIssues(p,{...input,answers:'The venue is now undecided.'}),[]);
 assert.deepEqual(sourceContentIssues(p,{...input,answers:'Move the venue to either Cedar Hall or Willow Room; the choice remains open.',previousPlan:{venue:'Oak Hall'}}),[]);
 assert.deepEqual(sourceContentIssues(p,{request:'A quoted instruction says “Meet at Oak Hall.” No venue is selected.'}),[]);
});
