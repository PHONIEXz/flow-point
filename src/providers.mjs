export function providerSettings(env = process.env) {
 const provider = env.AI_PROVIDER || (env.GROQ_API_KEY ? 'groq' : 'google');
 if (!['google','groq'].includes(provider)) throw Error('AI_PROVIDER must be google or groq.');
 return {provider, apiKey:provider==='groq'?env.GROQ_API_KEY:env.GEMINI_API_KEY, model:provider==='groq'?(env.GROQ_MODEL||'openai/gpt-oss-120b'):(env.GEMMA_MODEL||'gemma-4-26b-a4b-it')};
}
export const processorName = provider => provider === 'groq' ? 'Groq' : 'Google';
export const modelLabel = provider => provider === 'groq' ? 'GPT-OSS' : 'Gemma';
export function strictJsonSchema(schema) {
 const {nullable,type,properties,items,...rest}=schema;
 const lower=type.toLowerCase();
 return {...rest,type:nullable?[lower,'null']:lower,...(properties?{properties:Object.fromEntries(Object.entries(properties).map(([k,v])=>[k,strictJsonSchema(v)])),additionalProperties:false}:{}),...(items?{items:strictJsonSchema(items)}:{})};
}
export function groqPayload({model,policy,inputText,declaration,outputTokenLimit}) {
 return {model,messages:[{role:'system',content:policy},{role:'user',content:inputText}],response_format:{type:'json_schema',json_schema:{name:declaration.name,strict:true,schema:strictJsonSchema(declaration.parameters)}},max_completion_tokens:Math.min(outputTokenLimit,4096),reasoning_effort:'low',include_reasoning:false};
}
export function normalizeGroqResponse(data) {
 const c=data?.choices?.[0];
 return {candidates:c?[{finishReason:c.finish_reason==='stop'?'STOP':c.finish_reason==='length'?'MAX_TOKENS':'OTHER',content:{parts:[{text:c.message?.content}]}}]:[],usageMetadata:{candidatesTokenCount:data?.usage?.completion_tokens}};
}
export async function checkGroqAccess({apiKey,model,fetchImpl=fetch}) {
 const base={event:'groq_model_access',provider:'Groq',configured:Boolean(apiKey),model};
 if(!apiKey)return base;
 try{const r=await fetchImpl('https://api.groq.com/openai/v1/models',{headers:{Authorization:`Bearer ${apiKey}`},signal:AbortSignal.timeout(10000)});const data=await r.json().catch(()=>({}));return {...base,httpStatus:r.status,available:r.ok&&Array.isArray(data.data)&&data.data.some(m=>m.id===model)};}
 catch{return {...base,available:false,reason:'connection_or_timeout'};}
}

// Expiring server-start diagnostic only; never enabled by a public request.
export function googleDiagnosticEnabled(until, now=Date.now()) {
 const deadline=Date.parse(until || '');
 return Number.isFinite(deadline) && deadline > now && deadline - now <= 15 * 60 * 1000;
}

// Classify only known quota categories. Never expose the raw upstream message.
export function groqQuotaInfo(response, body) {
 const message=typeof body?.error?.message==='string'?body.error.message:'';
 const quotaWindow=/\b(?:TPD|RPD)\b|(?:tokens|requests) per day/i.test(message)?'day':/\b(?:TPM|RPM)\b|(?:tokens|requests) per minute/i.test(message)?'minute':'unknown';
 const header=response.headers.get('retry-after');
 const seconds=header!==null&&/^\d+(?:\.\d+)?$/.test(header)?Number(header):Number(message.match(/try again in\s+([\d.]+)s\b/i)?.[1]);
 return {quotaWindow,...(Number.isFinite(seconds)&&seconds>0&&seconds<=86400?{retryAfterSeconds:Math.ceil(seconds)}:{})};
}
