import test from 'node:test';import assert from 'node:assert/strict';
import {completePriceQuestions} from '../src/input-questions.mjs';
import {contentCheckCodes} from '../src/gemma.mjs';
test('unknown prices get explicit questions without inventing costs, duplicating questions or confusing zero',()=>{
 const p={budget:[{label:'Poster',quantity:1,unitCostMinor:null},{label:'Room',quantity:1,unitCostMinor:0}],openQuestions:['Supervision needs approval.']};const before=structuredClone(p);const r=completePriceQuestions(p);assert.deepEqual(p,before);assert.deepEqual(r.plan.budget,p.budget);assert.equal(r.added.length,1);assert.match(r.added[0],/Poster/);assert.equal(completePriceQuestions(r.plan).added.length,0);
 assert.equal(completePriceQuestions({...p,openQuestions:['What is the poster price?']}).added.length,0);
 assert.equal(completePriceQuestions({budget:[{label:'Cost of poster',quantity:1,unitCostMinor:null}],openQuestions:['What is the cost of sound hire?']}).added.length,1);
});
test('safe content categories identify rehearsal and budget checks without exposing source wording',()=>{
 const codes=contentCheckCodes(['Include the explicitly dated rehearsal as a checklist task with its supplied dueDate.','Retain the explicitly requested budget item: private-item-marker.']);assert.deepEqual(codes,['REHEARSAL_DATE','BUDGET_ITEM']);assert.doesNotMatch(JSON.stringify(codes),/private-item-marker/);
});
