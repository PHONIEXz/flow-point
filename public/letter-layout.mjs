// Local layout helper: preserves existing body text; no model request or invented address.
export function letterLayout(plan, style = 'formal') {
  if (!['formal','informal'].includes(style)) throw Error('Choose formal or informal.');
  const signature = plan.signatory || '[Confirm signatory]';
  const lines = plan.drafts.invitation.trim().split('\n');
  const closing = /^(?:yours (?:faithfully|sincerely)|warm (?:regards|wishes)|best (?:regards|wishes))[,]?$/i;
  const signatureParts = new Set(signature.split(/[,\n]/).map(s => s.trim().toLowerCase()).filter(Boolean));
  const signatureLine = line => {
    const s = line.trim();
    return s === signature || s === plan.organizer || signatureParts.has(s.toLowerCase()) || /^\[(?:confirm signatory|school name and signatory|signatory|name and title)\]$/i.test(s) || (plan.organizer && s.toLowerCase() === `on behalf of ${plan.organizer}`.toLowerCase());
  };
  let tail = lines.length;
  while (tail > 0 && (!lines[tail-1].trim() || signatureLine(lines[tail-1]) || closing.test(lines[tail-1].trim()))) tail--;
  const body = lines.slice(0,tail).filter(line => {
    const s = line.trim();
    return !(s === plan.title || s === plan.organizer || /^(?:dear\b.*|hello everyone[,]?)$/i.test(s) || /^invitation (?:to|for)\b/i.test(s));
  }).join('\n').replace(/\n{3,}/g,'\n\n').trim();
  const greeting = style === 'formal' ? (lines.find(l => /^Dear\b/i.test(l.trim()))?.trim() || 'Dear Sir/Madam,') : 'Hello everyone,';
  const namedRecipient = /^Dear\s+(?:Mr\.?|Mrs\.?|Ms\.?|Miss|Dr\.?|Professor)\s+\S/i.test(greeting);
  return [style === 'formal' ? plan.organizer : null, greeting, style === 'formal' ? `Invitation to ${plan.title}` : null, body, style === 'formal' ? (namedRecipient ? 'Yours sincerely,' : 'Yours faithfully,') : 'Warm wishes,', signature].filter(Boolean).join('\n\n');
}
