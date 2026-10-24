// Local letter layout. Never invent contacts, dates, addresses or an attachment.
const limits={senderName:160,senderAddress:600,senderEmail:160,senderPhone:80,letterDate:10,recipientName:160,recipientOrganization:160,recipientAddress:600,subject:180,signatureName:160,signatureRole:160,signatureMode:12,formalClosing:80,informalClosing:80,enclosures:300,postscript:500};
export function normalizeLetterDetails(value={}) {
 const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const details=Object.fromEntries(Object.entries(limits).map(([key,max])=>[key,typeof input[key]==='string'?input[key].replace(/\r\n?/g,'\n').trim().slice(0,max):'']));
 if(!['','handwritten'].includes(details.signatureMode))details.signatureMode='';
 if(details.letterDate){const date=new Date(details.letterDate+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(details.letterDate)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==details.letterDate)details.letterDate='';}
 return details;
}
const closing=/^(?:yours (?:faithfully|sincerely)|sincerely|respectfully|kind regards|warm(?:ly| (?:regards|wishes))|best(?: (?:regards|wishes))?|love|cheers|take care|see you soon)[,.]?$/i;
export function letterLayout(plan,style='formal',value={}) {
 if(!['formal','informal'].includes(style))throw Error('Choose formal or informal.');
 const d=normalizeLetterDetails(value),formal=style==='formal';
 const signature=plan.signatory||'[Confirm signatory]';
 const parts=signature.split(/[,\n]/).map(s=>s.trim()).filter(Boolean);
 const name=d.signatureName||parts[0],role=d.signatureRole||parts.slice(1).join(', ');
 const lines=plan.drafts.invitation.trim().split('\n');
 const greetingIndex=lines.findIndex(l=>/^(?:dear|hi|hello|hey|dearest)\b/i.test(l.trim()));
 let content=greetingIndex<0?lines:lines.slice(greetingIndex+1);
 const end=content.findLastIndex(l=>closing.test(l.trim()));
 if(end>=0)content=content.slice(0,end);
 else {
  const signatures=new Set([signature,name,role,plan.organizer,...parts].filter(Boolean).map(s=>s.toLowerCase()));
  while(content.length&&(!content.at(-1).trim()||signatures.has(content.at(-1).trim().toLowerCase())||/^\[(?:confirm signatory|school name and signatory|signatory|name and title)\]$/i.test(content.at(-1).trim())))content.pop();
 }
 while(content.length&&(!content[0].trim()||content[0].trim()===plan.title||content[0].trim()===plan.organizer||/^\s*subject:/i.test(content[0])||content[0].trim()===`Invitation to ${plan.title}`||content[0].trim()===`Invitation for ${plan.title}`))content.shift();
 const body=content.join('\n').replace(/\n{3,}/g,'\n\n').trim();
 const date=d.letterDate?new Intl.DateTimeFormat(formal?'en-US':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(d.letterDate+'T12:00:00Z')):'';
 const oldGreeting=greetingIndex<0?'':lines[greetingIndex].trim();
 const greeting=formal?(d.recipientName?`Dear ${d.recipientName}:`:oldGreeting&&/^dear\b/i.test(oldGreeting)?oldGreeting.replace(/[,.:;]$/, '')+':':'Dear Sir or Madam:'):(d.recipientName?`Hi ${d.recipientName},`:'Hello everyone,');
 const sender=formal?[d.senderName||plan.organizer||name,d.senderAddress,d.senderEmail,d.senderPhone].filter(Boolean).join('\n'):d.senderAddress;
 const recipient=formal?[d.recipientName,d.recipientOrganization,d.recipientAddress].filter(Boolean).join('\n'):'';
 const signName=formal?name:d.signatureName||(/^\[/.test(name)?name:name.replace(/^(?:Mr|Mrs|Ms|Miss|Dr|Professor)\.?\s+/i,'').split(/\s+/)[0]);
 const signOff=(formal?d.formalClosing||'Sincerely':d.informalClosing||'Warmly').replace(/[,.:;]+$/,'')+',';
 const output=[sender,date,recipient,formal?`SUBJECT: ${d.subject||`Invitation to ${plan.title}`}`:'',greeting,body,[signOff,'',formal&&d.signatureMode==='handwritten'?'____________________________':'',signName,formal?role:''].filter((line,i)=>line||i===1).join('\n'),formal&&d.enclosures?`Enclosures: ${d.enclosures}`:'',!formal&&d.postscript?`P.S. ${d.postscript}`:''].filter(Boolean).join('\n\n');
 if(output.length>12000)throw Error('The letter is too long with its header. Shorten the body or contact details before applying.');
 return output;
}
