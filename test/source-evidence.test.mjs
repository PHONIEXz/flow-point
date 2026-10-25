import test from 'node:test';
import assert from 'node:assert/strict';
import {attachSourceEvidence,modelFacts} from '../src/source-evidence.mjs';
import {factFields,factSourceInfo,markManualField,confirmFact,markNotesChanged} from '../public/source-fields.mjs';
import {reviewPlan,validatePlan,approvePlan,isApproved} from '../src/plan.mjs';
import {generatePack,parseModelPlan} from '../src/gemma.mjs';
import {restoreCollection,serializeCollection} from '../public/pack-store.mjs';
const notes='Cedar Reading Club meets at Cedar Hall on 12 December 2026 at 14:15. Ada Nwosu signs. USD 500 spending limit. Tables: 3 at USD 107.50 each. Ada Nwosu coordinates registration.';
const base=()=>({title:'Book Exchange',eventDate:'2026-12-12',requestedWeekday:'Saturday',startTime:'14:15',venue:'Cedar Hall',organizer:'Cedar Reading Club',signatory:'Ada Nwosu',currency:'USD',spendingLimitMinor:50000,tasks:[{label:'Coordinate registration',owner:'Ada Nwosu',dueDate:'2026-12-11'}],budget:[{label:'Tables',quantity:3,unitCostMinor:10750}],drafts:{invitation:'Join us at 14:15.',schedule:'14:15 Welcome (10 minutes)\n14:25 Reading (30 minutes)\n14:55 Closing (5 minutes)'},openQuestions:[]});
const cited=()=>attachSourceEvidence(base(),{request:notes,quotes:[{path:'venue',source:'notes',quote:'at Cedar Hall on 12 December 2026'},{path:'budget.0.unitCostMinor',source:'notes',quote:'Tables: 3 at USD 107.50 each.'},{path:'tasks.0.owner',source:'notes',quote:'Ada Nwosu coordinates registration.'}]});
const quiet={apiKey:'test',log(){},wait:async()=>{}};

test('only exact existing quotes receive a quote-found label; finding text is not confirmation',()=>{
 const p=cited(), info=factSourceInfo(p,'venue');
 assert.equal(info.status,'unreviewed'); assert.equal(info.quote,'at Cedar Hall on 12 December 2026');
 for(const quote of ['A confirmed Cedar Hall booking.','at cedar hall on 12 December 2026','at  Cedar Hall on 12 December 2026']) {
  const bad=attachSourceEvidence(base(),{request:notes,quotes:[{path:'venue',source:'notes',quote}]});
  assert.equal(factSourceInfo(bad,'venue').status,'unsupported'); assert.equal(factSourceInfo(bad,'venue').quote,null);
 }
 const ambiguous=attachSourceEvidence(base(),{request:notes,quotes:[{path:'venue',source:'notes',quote:'Cedar Hall'},{path:'venue',source:'notes',quote:'Ada Nwosu'}]});
 assert.equal(factSourceInfo(ambiguous,'venue').status,'unsupported');
});
test('an updated venue cites the new statement while unchanged prices retain actual historical evidence',()=>{
 const previous=cited(), update='The venue is now Cedar Library Hall. Prices stay unchanged.';
 const next=attachSourceEvidence({...base(),venue:'Cedar Library Hall'},{request:notes,answers:update,previousPlan:previous,quotes:[{path:'venue',source:'update',quote:'The venue is now Cedar Library Hall.'}]});
 assert.equal(factSourceInfo(next,'venue').sourceKind,'update'); assert.equal(factSourceInfo(next,'venue').quote,'The venue is now Cedar Library Hall.');
 assert.equal(factSourceInfo(next,'budget.0.unitCostMinor').sourceKind,'notes');
 const later=attachSourceEvidence({...base(),venue:'Cedar Library Hall'},{request:notes,answers:'Attendance is free.',previousPlan:next});
 assert.equal(factSourceInfo(later,'venue').sourceKind,'update'); assert.equal(factSourceInfo(later,'venue').quote,'The venue is now Cedar Library Hall.');
});
test('manual corrections and changed row contexts cannot inherit a prior quote or confirmation',()=>{
 const p=cited(); confirmFact(p,'venue'); assert.equal(factSourceInfo(p,'venue').status,'confirmed');
 p.venue='Other Hall'; markManualField(p,'venue');
 const changed=validatePlan(p); assert.equal(factSourceInfo(changed,'venue').status,'manual'); assert.equal(factSourceInfo(changed,'venue').quote,null);
 confirmFact(changed,'venue'); assert.equal(factSourceInfo(changed,'venue').status,'confirmed'); assert.equal(factSourceInfo(changed,'venue').manual,true);
 const row=cited(); row.budget[0].label='Chairs'; assert.equal(factSourceInfo(validatePlan(row),'budget.0.unitCostMinor').quote,null);
 const currency=cited(); currency.currency='NGN'; assert.equal(factSourceInfo(validatePlan(currency),'budget.0.unitCostMinor').quote,null);
 const owner=cited(); owner.tasks[0].label='Purchase materials'; assert.equal(factSourceInfo(validatePlan(owner),'tasks.0.owner').quote,null);
});
test('unsupported prices block approval until explicitly reviewed; unknown prices remain unresolved',()=>{
 const p=attachSourceEvidence(base(),{request:notes,quotes:[]});
 assert.equal(factSourceInfo(p,'budget.0.unitCostMinor').status,'unsupported'); assert.throws(()=>approvePlan(p));
 for(const field of factFields(p)) confirmFact(p,field.path);
 const approval=approvePlan(p); assert.equal(isApproved(p,approval),true);
 p.budget[0].unitCostMinor=null; markManualField(p,'budget.0.unitCostMinor'); confirmFact(p,'budget.0.unitCostMinor');
 assert.equal(factSourceInfo(p,'budget.0.unitCostMinor').status,'unknown'); assert.equal(isApproved(p,approval),false); assert.throws(()=>approvePlan(p));
});
test('editing notes or tampering with a source snapshot invalidates evidence and approval',()=>{
 const p=cited(); for(const field of factFields(p)) confirmFact(p,field.path);
 const approval=approvePlan(p); markNotesChanged(p);
 assert.equal(factSourceInfo(validatePlan(p),'venue').quote,null); assert.equal(isApproved(p,approval),false); assert.throws(()=>approvePlan(p));
 const tampered=cited(); for(const field of factFields(tampered)) confirmFact(tampered,field.path);
 const old=approvePlan(tampered); tampered.sourceEvidence.sources[0].text+=' New venue decision.';
 const checked=validatePlan(tampered); assert.equal(factSourceInfo(checked,'venue').quote,null); assert.equal(isApproved(checked,old),false);
});
test('older saved packs remain editable without invented source history; real evidence survives serialization',()=>{
 const old=validatePlan(base()); assert.equal(old.sourceEvidence,undefined); assert.equal(factSourceInfo(old,'venue').status,'legacy');
 old.venue='New Hall'; markManualField(old,'venue'); assert.equal(factSourceInfo(old,'organizer').status,'legacy'); assert.equal(factSourceInfo(old,'venue').status,'manual');
 const p=cited(), current={request:notes,answers:'',plan:p,approval:null,provenance:null};
 const restored=restoreCollection(serializeCollection({current,packs:[],activeId:null}),null);
 assert.equal(factSourceInfo(validatePlan(restored.current.plan),'venue').quote,'at Cedar Hall on 12 December 2026');
});
test('source storage is bounded and old evidence is never rebound to a different update',()=>{
 let p=cited(); const original=structuredClone(p);
 for(let i=0;i<12;i++) p=attachSourceEvidence({...p},{request:notes,answers:`Update ${i}: `+'x'.repeat(4000),previousPlan:p});
 assert.ok(p.sourceEvidence.sources.length<=8); assert.ok(p.sourceEvidence.sources.reduce((n,s)=>n+s.text.length,0)<=24000);
 assert.equal(factSourceInfo(p,'venue').quote,'at Cedar Hall on 12 December 2026');
 assert.throws(()=>validatePlan({...original,sourceEvidence:{version:1,sources:[],records:Array(421).fill({})}}));
 assert.equal(modelFacts(original).sourceEvidence,undefined);
});
test('staged model quotes are bound to actual request text and preserved by later drafts',async()=>{
 const raw={...base(),sourceQuotes:[{path:'venue',source:'notes',quote:'Cedar Hall'},{path:'budget.0.unitCostMinor',source:'notes',quote:'A price that never appeared'}]};
 let payload;
 const facts=await generatePack({request:notes,stage:'facts'},{...quiet,fetchImpl:async(_,options)=>{payload=JSON.parse(options.body);return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{functionCall:{name:'submit_event_facts',args:raw}}]}}]});}});
 assert.equal(factSourceInfo(facts.plan,'venue').quote,'Cedar Hall'); assert.equal(factSourceInfo(facts.plan,'budget.0.unitCostMinor').status,'unsupported');
 assert.ok(payload.tools[0].functionDeclarations[0].parameters.properties.sourceQuotes);
 const invitation=await generatePack({request:notes,stage:'invitation',checkpoint:facts.plan},{...quiet,fetchImpl:async(_,options)=>{const sent=JSON.parse(options.body); assert.doesNotMatch(sent.contents[0].parts[0].text,/sourceEvidence/);return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{functionCall:{name:'submit_event_invitation',args:{invitation:'Join us at 14:15.'}}}]}}]});}});
 assert.deepEqual(invitation.plan.sourceEvidence,facts.plan.sourceEvidence);
 const forged={...base(),sourceEvidence:cited().sourceEvidence}; assert.equal(parseModelPlan(JSON.stringify(forged)).plan.sourceEvidence,undefined);
});

test('a genuine old venue quote cannot label a different venue; a single-letter signer is unsupported',()=>{
 const previous=cited();
 const next=attachSourceEvidence({...base(),venue:'Cedar Library Hall',signatory:'A'},{request:notes,answers:'The confirmed venue is now Cedar Library Hall; its booking is approved. Keep Ada Okafor in charge.',previousPlan:previous,quotes:[{path:'venue',source:'notes',quote:'at Cedar Hall on 12 December 2026'},{path:'signatory',source:'notes',quote:'Ada Nwosu'}]});
 assert.equal(factSourceInfo(next,'venue').sourceKind,'update'); assert.match(factSourceInfo(next,'venue').quote,/Cedar Library Hall/);
 assert.equal(factSourceInfo(next,'signatory').status,'unsupported'); assert.equal(factSourceInfo(next,'signatory').quote,null);
 // A valid place fragment is not sufficient if the displayed name has extra unsupported words.
 const partial=attachSourceEvidence({...base(),venue:'Cedar Hall Annex'},{request:notes,quotes:[{path:'venue',source:'notes',quote:'Cedar Hall'}]});
 assert.equal(factSourceInfo(partial,'venue').status,'unsupported');
});
