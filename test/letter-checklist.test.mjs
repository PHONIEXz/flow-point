import test from 'node:test';
import assert from 'node:assert/strict';
import {letterLayout} from '../public/letter-layout.mjs';
import {sourceContentIssues} from '../src/content-checks.mjs';
test('letter layouts preserve body facts and provide conventional greetings and closings without invented addresses',()=>{
 const p={title:'Reading Day',organizer:'Reading Club',signatory:'Ada, Secretary',drafts:{invitation:'Reading Day\nDear Parents,\n\nJoin us at Library Hall at 10:00.\n\nWarm regards,\nAda, Secretary'}};
 const formal=letterLayout(p);assert.match(formal,/Dear Parents,/);assert.match(formal,/Invitation to Reading Day/);assert.match(formal,/Library Hall at 10:00/);assert.match(formal,/Yours faithfully,/);
 assert.equal(letterLayout({...p,drafts:{invitation:formal}}),formal);
 assert.match(letterLayout(p,'informal'),/^Hello everyone,/);assert.throws(()=>letterLayout(p,'other'));
});
test('requested after-event jobs cannot silently disappear from a named-duty-only checklist',()=>{
 const input={request:'After the event, staff should clean the venue, return borrowed equipment, reconcile spending and record brief feedback.'};
 const p={currency:'NGN',budget:[],tasks:[{label:'Approve invitations',owner:'Ada'}],openQuestions:[]};
 assert.equal(sourceContentIssues(p,input).length,4);
 p.tasks.push(...['Clean venue','Return equipment','Reconcile spending','Record feedback'].map(label=>({label,owner:null})));
 assert.deepEqual(sourceContentIssues(p,input),[]);
 assert.deepEqual(sourceContentIssues({...p,tasks:[]},{request:'Hold a reading event.'}),[]);
});
