import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { scoreOperation } from '../evaluation/score.mjs';
const suite=JSON.parse(await readFile(new URL('../evaluation/cases-v1.json',import.meta.url),'utf8'));
const fixture=suite.cases.find(c=>c.id==='fresh-zero-and-overspend');
function planFor(e){return {...Object.fromEntries(Object.entries(e.facts).map(([k,v])=>[k,Array.isArray(v)?v[0]:v])),requestedWeekday:null,tasks:e.owners.map(o=>({label:'Host the debate',owner:o.name,dueDate:null})),budget:e.budget.map(b=>({label:b.match[0],quantity:b.quantity,unitCostMinor:b.unitCostMinor})),openQuestions:e.pendingQuestions.map(q=>`Confirm ${q.label}`),drafts:{invitation:`Valley Debate Open, Valley Hall, 12:00. Signed Olu Dare, Secretary.`,schedule:'Valley Hall\n12:00 Introduction (10 minutes)\n12:10 Debate (40 minutes)\n12:50 Closing (10 minutes)'}};}

test('quality scorer distinguishes wrong known facts, missing facts and invented explicit unknowns',()=>{
 const e=fixture.expected.prepare,p=planFor(e);p.venue=null;p.signatory='A';p.budget[2].unitCostMinor=0;
 const score=scoreOperation(p,e);
 assert.equal(score.checks.find(c=>c.path==='venue').status,'missing');
 assert.equal(score.checks.find(c=>c.path==='signatory').status,'wrong');
 assert.equal(score.checks.find(c=>c.path==='budget.2.unitCostMinor').status,'invented-for-explicit-unknown');
 assert.equal(score.allDeclaredChecksPassed,false);
});
test('quality scorer preserves zero, checks overspend and does not confuse arithmetic with complete content quality',()=>{
 const e=fixture.expected.update,p=planFor(e);let s=scoreOperation(p,e);
 assert.equal(s.allDeclaredChecksPassed,true);assert.equal(s.checks.find(c=>c.label==='Arithmetic: remainingAllowanceMinor').actual,-100000);
 p.drafts.schedule='Dear Members, you are invited.\n'+p.drafts.schedule;s=scoreOperation(p,e);
 assert.equal(s.checks.find(c=>c.label==='schedule: document kind').status,'needs-manual-review');assert.equal(s.allDeclaredChecksPassed,false);
});
test('quality scorer checks supplied activity times and durations instead of only finding a number somewhere',()=>{
 const e=fixture.expected.update,p=planFor(e);p.drafts.schedule=p.drafts.schedule.replace('12:50 Closing','12:45 Closing');
 const s=scoreOperation(p,e);assert.equal(s.checks.find(c=>c.label.includes('Programme: 12:50')).status,'missing-or-wrong');
});
test('all frozen expected arithmetic is consistent and new cases stay separate from exposed regressions',()=>{
 assert.equal(suite.cases.length,10);assert.equal(suite.cases.filter(c=>c.cohort==='exposed').length,4);
 assert.equal(suite.cases.filter(c=>c.cohort==='fresh-before-first-inference').length,6);
 for(const c of suite.cases)for(const e of Object.values(c.expected)){
  assert.equal(e.budget.reduce((n,b)=>n+b.quantity*(b.unitCostMinor??0),0),e.knownTotalMinor);
  assert.equal(e.budget.filter(b=>b.unitCostMinor==null).length,e.unknownPrices);
 }
});
