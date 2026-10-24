// Shared field identities. Context stops a reordered row inheriting another row's evidence.
export function factFields(plan) {
  const fields = ['title','eventDate','startTime','venue','organizer','signatory','currency','spendingLimitMinor'].map(path => ({ path, label: ({ eventDate:'Event date',startTime:'Start time',spendingLimitMinor:'Spending limit' })[path] || path[0].toUpperCase()+path.slice(1), value:plan[path] ?? null, context:path === 'spendingLimitMinor' ? plan.currency : '' }));
  (plan.tasks || []).forEach((row,i) => { for(const key of ['owner','dueDate']) fields.push({path:`tasks.${i}.${key}`,label:`Task ${i+1} ${key === 'owner' ? 'owner' : 'due date'}`,value:row[key] ?? null,context:row.label}); });
  (plan.budget || []).forEach((row,i) => { for(const key of ['quantity','unitCostMinor']) fields.push({path:`budget.${i}.${key}`,label:`Item ${i+1} ${key === 'quantity' ? 'quantity' : 'unit price'}`,value:row[key] ?? null,context:key === 'unitCostMinor' ? row.label+'\0'+plan.currency : row.label}); });
  return fields.map(field => ({...field,binding:JSON.stringify([field.value,field.context])}));
}
export function factSourceInfo(plan, path) {
  const field = factFields(plan).find(f => f.path === path);
  if (!field) return null;
  if (field.value === null || field.value === '') return {...field,status:'unknown',quote:null};
  const evidence = plan.sourceEvidence;
  const record = evidence?.records?.find(r => r.path === path);
  if (!evidence || (!record && evidence.legacy)) return {...field,status:'legacy',quote:null};
  if (!record || record.binding !== field.binding) return {...field,status:record ? 'manual' : 'unsupported',quote:null};
  const source = evidence.sources?.find(s => s.id === record.sourceId);
  const validSpan = source && Number.isInteger(record.start) && Number.isInteger(record.end) && record.start >= 0 && record.end > record.start && record.end <= source.text.length && record.end-record.start <= 320 && !(evidence.notesChanged && source.kind === 'notes');
  const quote = validSpan ? source.text.slice(record.start,record.end) : null;
  const confirmed = record.confirmed === true && (record.origin === 'manual' || Boolean(quote));
  return {...field,status:confirmed ? 'confirmed' : quote ? 'unreviewed' : record.origin === 'manual' ? 'manual' : record.origin === 'legacy' ? 'legacy' : 'unsupported',quote,sourceKind:quote ? source.kind : null,manual:record.origin === 'manual'};
}
export function markManualField(plan,path) {
  const field = factFields(plan).find(f => f.path === path); if (!field) return;
  if (!plan.sourceEvidence) plan.sourceEvidence = {version:1,legacy:true,notesChanged:false,sources:[],records:[]};
  plan.sourceEvidence.records = plan.sourceEvidence.records.filter(r => r.path !== path);
  plan.sourceEvidence.records.push({path,binding:field.binding,origin:'manual',confirmed:false});
}
export function confirmFact(plan,path) {
  const info = factSourceInfo(plan,path); if (!info || info.status === 'unknown') return;
  if (!plan.sourceEvidence) plan.sourceEvidence = {version:1,legacy:true,notesChanged:false,sources:[],records:[]};
  let record = plan.sourceEvidence.records.find(r => r.path === path);
  if (!record || record.binding !== info.binding || !info.quote) { markManualField(plan,path); record=plan.sourceEvidence.records.find(r => r.path === path); }
  record.confirmed=true;
}
export function markNotesChanged(plan) {
  if (!plan?.sourceEvidence) return;
  plan.sourceEvidence.notesChanged=true;
  for(const record of plan.sourceEvidence.records) if(record.origin === 'manual' || plan.sourceEvidence.sources.some(s => s.id === record.sourceId && s.kind === 'notes')) record.confirmed=false;
}
