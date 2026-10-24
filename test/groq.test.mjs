import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {readFile} from 'node:fs/promises';
import {providerSettings,strictJsonSchema,checkGroqAccess} from '../src/providers.mjs';
import {generatePack} from '../src/gemma.mjs';
import {stageFunction} from '../src/pack-schema.mjs';
import {createApp} from '../src/server.mjs';
const fixture=JSON.parse(await readFile(new URL('./church-regression.json',import.meta.url)));
const good=()=>({...structuredClone(fixture.rows[0].plan),tasks:[{label:'Lead choir',owner:'Musa Bello',dueDate:null}],budget:[{label:'Programmes',quantity:80,unitCostMinor:125},{label:'Sound hire',quantity:1,unitCostMinor:25000},{label:'Flowers',quantity:1,unitCostMinor:null}]});
const reply=plan=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(plan),reasoning:'not exposed'}}],usage:{completion_tokens:1000}});
const config={provider:'groq',apiKey:'fake-test-key',wait:async()=>{},log(){}};
test('provider selection keeps credentials separate and permits an explicit Google selection',()=>{
 assert.equal(providerSettings({GROQ_API_KEY:'fake-groq',GEMINI_API_KEY:'fake-google'}).provider,'groq');
 assert.equal(providerSettings({GROQ_API_KEY:'fake-groq'}).model,'openai/gpt-oss-120b');
 assert.equal(providerSettings({AI_PROVIDER:'google',GROQ_API_KEY:'fake-groq',GEMINI_API_KEY:'fake-google'}).apiKey,'fake-google');
 assert.equal(providerSettings({AI_PROVIDER:'groq',GEMINI_API_KEY:'fake-google'}).apiKey,undefined);
 assert.throws(()=>providerSettings({AI_PROVIDER:'arbitrary'}));
});
test('Groq strict schemas close nested objects and preserve nulls and required fields',()=>{
 const s=strictJsonSchema(stageFunction('facts').parameters);
 assert.equal(s.additionalProperties,false);assert.deepEqual(s.properties.venue.type,['string','null']);
 assert.equal(s.properties.budget.items.additionalProperties,false);assert.ok(s.required.includes('sourceQuotes'));
});
test('Groq uses its own endpoint and strict JSON, validates bad facts, and records truthful provenance',async()=>{
 let calls=0;const logs=[];
 const result=await generatePack({request:fixture.request,stage:'facts'},{...config,log:e=>logs.push(e),fetchImpl:async(url,opts)=>{
  assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(opts.headers.Authorization,'Bearer fake-test-key');assert.equal(opts.headers['x-goog-api-key'],undefined);
  const p=JSON.parse(opts.body);assert.equal(p.model,'openai/gpt-oss-120b');assert.equal(p.response_format.json_schema.strict,true);assert.equal(p.include_reasoning,false);assert.equal(p.tools,undefined);assert.ok(p.max_completion_tokens<=4096);
  return reply(++calls===1?fixture.rows[0].plan:good());
 }});
 assert.equal(calls,2);assert.equal(result.provenance.provider,'Groq');assert.equal(result.provenance.model,'openai/gpt-oss-120b');assert.equal(result.provenance.responseFormat,'json-schema');assert.equal(result.plan.budget[0].quantity,80);assert.ok(logs.some(l=>l.event==='groq_generation_retry'));assert.doesNotMatch(JSON.stringify(result),/fake-test-key|not exposed/);
});
test('Groq quota and access errors never cause a Google fallback or leak raw upstream messages',async()=>{
 for(const [status,expected] of [[429,429],[401,503],[400,502]]){
  let calls=0;await assert.rejects(generatePack({request:fixture.request,stage:'facts'},{...config,fetchImpl:async url=>{calls++;assert.match(url,/api.groq.com/);return Response.json({error:{message:'fake-secret-upstream'}},{status});}}),e=>e.status===expected&&!e.message.includes('fake-secret-upstream'));
  assert.equal(calls,1);
 }
});
test('Groq HTTP surface binds processing choice to provider and renders current disclosure without secrets',async t=>{
 let calls=0;const server=createApp({...config,fetchImpl:async()=>{calls++;return reply(good());}});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));const base=`http://127.0.0.1:${server.address().port}`;
 const c=await(await fetch(base+'/api/config')).json();assert.equal(c.processor,'Groq');assert.equal(c.modelLabel,'GPT-OSS');assert.doesNotMatch(JSON.stringify(c),/fake-test-key/);
 const html=await(await fetch(base+'/workspace')).text();assert.match(html,/sent to Groq for hosted GPT-OSS/);assert.doesNotMatch(html,/__AI_PROCESSOR__/);
 for(const processingProvider of [undefined,'google']){const r=await fetch(base+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request:fixture.request,stage:'facts',processingProvider})});assert.equal(r.status,409);}
 assert.equal(calls,0);
 const r=await fetch(base+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request:fixture.request,stage:'facts',processingProvider:'groq'})});assert.equal(r.status,200);assert.equal(calls,1);
});
test('Groq model availability check uses bearer auth and checks actual model presence',async()=>{
 const r=await checkGroqAccess({apiKey:'fake-test-key',model:'openai/gpt-oss-120b',fetchImpl:async(url,opts)=>{assert.equal(url,'https://api.groq.com/openai/v1/models');assert.equal(opts.headers.Authorization,'Bearer fake-test-key');return Response.json({data:[{id:'openai/gpt-oss-120b'}]});}});assert.equal(r.available,true);assert.doesNotMatch(JSON.stringify(r),/fake-test-key/);
});

test('a standalone schedule must retain a supplied venue and retries without altering the checkpoint',async()=>{
 const p=good(),before=structuredClone(p);let calls=0;
 const schedule='17:45 Registration\n18:00 Welcome (10 minutes)\n18:10 Choir performance (30 minutes)\n18:40 Closing (10 minutes)';
 const r=await generatePack({request:fixture.request,stage:'schedule',checkpoint:p},{...config,fetchImpl:async()=>reply({schedule:++calls===1?schedule:`Cedar Chapel Choir Evening\nGrace Chapel\n${schedule}`})});
 assert.equal(calls,2);assert.match(r.plan.drafts.schedule,/Grace Chapel/);assert.deepEqual(p,before);
});
