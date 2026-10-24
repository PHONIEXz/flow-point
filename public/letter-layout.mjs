// Local layout helper: preserves existing body text; no model request or invented address.
export function letterLayout(plan, style = 'formal') {
  if (!['formal','informal'].includes(style)) throw Error('Choose formal or informal.');
  const signature=plan.signatory || '[Confirm signatory]';
  const lines=plan.drafts.invitation.trim().split('\n');
  const body=lines.filter(line=>{
    const s=line.trim();
    return !(s===plan.title || s===signature || s===plan.organizer || /^(?:dear\b.*|hello everyone[,]?|yours (?:faithfully|sincerely)[,]?|warm (?:regards|wishes)[,]?|best (?:regards|wishes)[,]?)$/i.test(s) || /^invitation (?:to|for)\b/i.test(s));
  }).join('\n').replace(/\n{3,}/g,'\n\n').trim();
  const greeting=style==='formal'?(lines.find(l=>/^Dear\b/i.test(l.trim()))?.trim()||'Dear Sir/Madam,'):'Hello everyone,';
  return [style==='formal'?plan.organizer:null,greeting,style==='formal'?`Invitation to ${plan.title}`:null,body,style==='formal'?'Yours faithfully,':'Warm wishes,',signature].filter(Boolean).join('\n\n');
}
