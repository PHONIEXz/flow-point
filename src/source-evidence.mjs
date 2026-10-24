import {createHash} from 'node:crypto';
import {factFields,factSourceInfo} from '../public/source-fields.mjs';
const sourceId = (kind,text) => createHash('sha256').update(kind+'\0'+text).digest('hex');
export function normalizeSourceEvidence(input,plan) {
  if (input == null) return null;
  if(input.version !== 1 || !Array.isArray(input.sources) || input.sources.length > 8 || !Array.isArray(input.records) || input.records.length > 420) throw new Error('Invalid source evidence');
  let total=0;
  const sources=[];
  for(const source of input.sources) {
    if (!source || !['notes','update'].includes(source.kind) || typeof source.text !== 'string' || source.text.length > 12000 || (total+=source.text.length)>24000) throw new Error('Invalid saved source');
    // A changed text with an unchanged identifier is stale, not a valid saved source.
    if (source.id === sourceId(source.kind,source.text) && !sources.some(s=>s.id===source.id)) sources.push({id:source.id,kind:source.kind,text:source.text});
  }
  const records=factFields(plan).map(field=> {
    const matches=input.records.filter(r=>r?.path===field.path);
    const old=matches.length === 1 ? matches[0] : null;
    const record={path:field.path,binding:field.binding,origin:input.legacy ? 'legacy' : 'unsupported',confirmed:false};
    if(!old) return record;
    if(old.binding !== field.binding) return {...record,origin:'manual'};
    if(old.origin === 'manual') return {...record,origin:'manual',confirmed:old.confirmed===true && field.value!==null};
    if(old.origin === 'legacy') return record;
    const source=sources.find(s=>s.id===old.sourceId);
    if(source && !(input.notesChanged && source.kind==='notes') && Number.isInteger(old.start) && Number.isInteger(old.end) && old.start>=0 && old.end>old.start && old.end<=source.text.length && old.end-old.start<=320 && source.text.slice(old.start,old.end).trim()) return {...record,origin:'extracted',sourceId:source.id,start:old.start,end:old.end,confirmed:old.confirmed===true && field.value!==null};
    return {...record,origin:'unsupported'};
  });
  return {version:1,legacy:input.legacy===true,notesChanged:input.notesChanged===true,sources,records};
}
export function attachSourceEvidence(plan,{request,answers='',previousPlan=null,quotes=[]}) {
  const notes={id:sourceId('notes',request),kind:'notes',text:request};
  const update=answers.trim() ? {id:sourceId('update',answers),kind:'update',text:answers} : null;
  const previous=previousPlan?.sourceEvidence;
  let sources=(previous?.sources || []).filter(s=>s.kind==='update' || (s.kind==='notes' && s.id===notes.id));
  sources=[...sources.filter(s=>s.id!==notes.id && s.id!==update?.id),notes,...(update?[update]:[])];
  while(sources.length>8 || sources.reduce((n,s)=>n+s.text.length,0)>24000) sources.shift();
  const proposed=Array.isArray(quotes) ? quotes.slice(0,160) : [];
  const records=factFields(plan).map(field=> {
    const empty={path:field.path,binding:field.binding,origin:'unsupported',confirmed:false};
    const matches=proposed.filter(q=>q?.path===field.path);
    if(matches.length) {
      if(matches.length!==1) return empty;
      const q=matches[0], source=q.source==='notes'?notes:q.source==='update'?update:null;
      if(!source || typeof q.quote!=='string' || !q.quote.trim() || q.quote.length>320) return empty;
      const start=source.text.indexOf(q.quote);
      if(start<0) return empty;
      return {...empty,origin:'extracted',sourceId:source.id,start,end:start+q.quote.length};
    }
    // Carry actual historical evidence only for the identical value AND row context.
    const old=previous?.records?.find(r=>r.path===field.path && r.binding===field.binding);
    if(old && !(previous.notesChanged && previous.sources.some(s=>s.id===old.sourceId && s.kind==='notes')) && (old.origin==='manual' || sources.some(s=>s.id===old.sourceId))) return {...old,confirmed:false};
    return empty;
  });
  const sourceEvidence=normalizeSourceEvidence({version:1,legacy:false,notesChanged:false,sources,records},plan);
  return {...plan,sourceEvidence};
}
export function sourceReviewIssues(plan) {
  if(!plan.sourceEvidence) return [];
  const missing=factFields(plan).map(f=>factSourceInfo(plan,f.path)).filter(f=>['unsupported','manual'].includes(f.status));
  if(!missing.length) return [];
  return [{code:'SOURCE_REVIEW',message:`${missing.length} fact(s) need source review or manual confirmation. Open their Source cards; check missing quotes and any manual corrections before approval.`}];
}
export function modelFacts(plan) {
  if(!plan) return null;
  const {sourceEvidence,...facts}=plan; return facts;
}
