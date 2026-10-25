import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reviewPlan, approvePlan } from '../src/plan.mjs';
import { preparationPack } from '../src/export.mjs';
import { letterLayout } from '../public/letter-layout.mjs';
import { createProviderRunner } from '../src/resilience.mjs';
import { AppError, generatePack } from '../src/gemma.mjs';
const sample = JSON.parse(await readFile(new URL('../examples/school-event.json', import.meta.url)));
test('missing task dates and generic owners remain unresolved and block approval', () => {
 const p = structuredClone(sample); p.tasks = [{label:'Send invitations',owner:'Staff',dueDate:null}];
 const r = reviewPlan(p); assert.equal(r.plan.tasks[0].owner,null);
 assert.ok(r.issues.some(i=>i.code==='MISSING_TASK_OWNERS'));
 assert.ok(r.issues.some(i=>i.code==='MISSING_TASK_DATES'));
 assert.throws(()=>approvePlan(p));
 assert.equal(p.tasks[0].owner,'Staff');
});
test('Markdown shows human currency, subtotals, questions and unknown fact evidence', () => {
 const p = structuredClone(sample);p.budget=[{label:'Programmes',quantity:80,unitCostMinor:25000},{label:'Banner',quantity:1,unitCostMinor:null}];
 const output=preparationPack(p);
 assert.match(output,/80 × NGN 250\.00 = NGN 20,000\.00/);
 assert.match(output,/Known subtotal; incomplete budget: NGN 20,000\.00/);
 assert.match(output,/\[Unknown subtotal\]/);
 assert.match(output,/## Open questions/);assert.match(output,/## Source evidence/);
 assert.doesNotMatch(output,/2000000 minor units/);
});
test('two model sign-offs yield one closing and one signer',()=>{
 const p={title:'Reading Day',organizer:'Cedar Club',signatory:'Grace Okoro, Headteacher',drafts:{invitation:'Dear Parents,\n\nJoin us at 10:00.\n\nSincerely,\nHeadteacher, on behalf of Cedar Club\n\nWarm wishes,\nGrace Okoro'}};
 const text=letterLayout(p);assert.equal((text.match(/Sincerely,/g)||[]).length,1);
 assert.equal((text.match(/Grace Okoro/g)||[]).length,1);assert.doesNotMatch(text,/Warm wishes|on behalf of/);
});
test('fallback is opt-in, records the real provider and uses separate keys',async()=>{
 const calls=[];const providers={google:{provider:'google',apiKey:'google-test',model:'gemma-test'},groq:{provider:'groq',apiKey:'groq-test',model:'oss-test'}};
 const run=createProviderRunner({providers,generate:async(input,options)=>{calls.push(options);if(options.provider==='google')throw new AppError(502,'Provider down');return {plan:{},provenance:{provider:'Groq',model:options.model}};}});
 await assert.rejects(run({},providers.google),e=>e.status===502);assert.equal(calls.length,1);
 const result=await run({},providers.google,{},true);assert.equal(result.provenance.fallbackFrom,'google');assert.equal(result.provenance.provider,'Groq');
 assert.equal(calls.at(-1).apiKey,'groq-test');assert.equal(calls.at(-1).attemptTimeoutMs,45000);assert.equal(calls.at(-1).maxAttempts,2);
});
test('circuit pauses after two failed operations, expires, and cancellation never switches',async()=>{
 let now=0,calls=0;const selected={provider:'google',apiKey:'test'};
 const run=createProviderRunner({providers:{},now:()=>now,generate:async()=>{calls++;throw new AppError(502,'Down');}});
 await assert.rejects(run({},selected));await assert.rejects(run({},selected));
 await assert.rejects(run({},selected),e=>e.code==='PROVIDER_COOLDOWN');assert.equal(calls,2);
 now=60001;await assert.rejects(run({},selected));assert.equal(calls,3);
 const controller=new AbortController();controller.abort();await assert.rejects(run({},selected,{signal:controller.signal},true),e=>e.status===499);assert.equal(calls,3);
});
test('daily quota immediately pauses that provider and invalid output does not switch',async()=>{
 const providers={google:{provider:'google',apiKey:'g'},groq:{provider:'groq',apiKey:'q'}};let calls=0;
 const run=createProviderRunner({providers,generate:async()=>{calls++;throw new AppError(429,'Daily quota','PROVIDER_QUOTA');}});
 await assert.rejects(run({},providers.google));await assert.rejects(run({},providers.google),e=>e.code==='PROVIDER_COOLDOWN');assert.equal(calls,1);
 const invalid=createProviderRunner({providers,generate:async()=>{calls++;throw new AppError(502,'Invalid content','MODEL_CONTENT_MISSING');}});
 await assert.rejects(invalid({},providers.google,{},true),e=>e.code==='MODEL_CONTENT_MISSING');assert.equal(calls,2);
});

test('candidate refusal and non-success finish reasons never cross providers', async () => {
 const providers={google:{provider:'google',apiKey:'g'},groq:{provider:'groq',apiKey:'q'}};
 for (const finishReason of ['SAFETY','RECITATION','BLOCKLIST','PROHIBITED_CONTENT','SPII','OTHER','MAX_TOKENS']) {
  const calls=[];
  const run=createProviderRunner({providers,generate:(input,options)=>generatePack(input,{...options,log:()=>{},wait:async()=>{},fetchImpl:async url=>{calls.push(url);return Response.json({candidates:[{finishReason}]});}})});
  await assert.rejects(run({request:'Fictional school event.'},providers.google,{},true),e=>e.code==='MODEL_BLOCKED');
  assert.equal(calls.length,1,finishReason);
  assert.ok(calls.every(url=>!url.includes('api.groq.com')),finishReason);
 }
});
