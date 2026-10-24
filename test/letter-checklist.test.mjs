import test from 'node:test';
import assert from 'node:assert/strict';
import {letterLayout,normalizeLetterDetails} from '../public/letter-layout.mjs';
import {sourceContentIssues} from '../src/content-checks.mjs';
test('letter layouts preserve body facts and provide conventional greetings and closings without invented addresses',()=>{
 const p={title:'Reading Day',organizer:'Reading Club',signatory:'Ada, Secretary',drafts:{invitation:'Reading Day\nDear Parents,\n\nJoin us at Library Hall at 10:00.\n\nWarm regards,\nAda, Secretary'}};
 const formal=letterLayout(p);assert.match(formal,/Dear Parents:/);assert.match(formal,/Invitation to Reading Day/);assert.match(formal,/Library Hall at 10:00/);assert.match(formal,/Sincerely,/);
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
test('switching letter layouts keeps a single signatory and preserves body paragraphs',()=>{
 for(const signatory of [null,'Grace Okoro, Headteacher']) {
  const body='Please join us at 10:00.\n\nBring a book to share.';
  const p={title:'Reading Day',organizer:'Reading Club',signatory,drafts:{invitation:`Dear Dr Bello,\n\n${body}\n\nYours sincerely,\n${signatory?'Grace Okoro\nHeadteacher\nOn behalf of Reading Club':'[School name and signatory]'}`}};
  const formal=letterLayout(p);
  assert.ok(formal.includes(body));assert.match(formal,/Sincerely,/);
  assert.equal((formal.match(/Grace Okoro|Confirm signatory/g)||[]).length,1);
  const informal=letterLayout({...p,drafts:{invitation:formal}},'informal');
  assert.ok(informal.includes(body));assert.match(informal,/Warmly,/);
  assert.equal(letterLayout({...p,drafts:{invitation:informal}},'informal'),informal);
  assert.doesNotMatch(informal,/School name and signatory|On behalf of/);
 }
});

test('formal block letter has supplied contact blocks, independent letter date, subject before salutation and one signature',()=>{
 const p={title:'Reading Day',eventDate:'2026-12-12',organizer:'Cedar Club',signatory:'Ada Cole, Secretary',drafts:{invitation:'Dear Parents,\n\nPlease join us on 12 December at 10:00.\n\nBring a book.\n\nWarm wishes,\nAda Cole\nSecretary'}};
 const details={senderName:'Cedar Club',senderAddress:'12 Cedar Street\nLagos, Nigeria',senderEmail:'cedar@example.org',senderPhone:'+234 000 000 0000',letterDate:'2026-10-24',recipientName:'Dr. Bola Reed',recipientOrganization:'Oak School',recipientAddress:'3 Oak Road\nAbuja, Nigeria',subject:'Invitation to Reading Day',enclosures:'Programme outline'};
 const letter=letterLayout(p,'formal',details);
 assert.ok(letter.startsWith('Cedar Club\n12 Cedar Street\nLagos, Nigeria\ncedar@example.org\n+234 000 000 0000\n\nOctober 24, 2026\n\nDr. Bola Reed\nOak School\n3 Oak Road\nAbuja, Nigeria'));
 assert.match(letter,/SUBJECT: Invitation to Reading Day\n\nDear Dr\. Bola Reed:/);
 assert.ok(letter.includes('Please join us on 12 December at 10:00.\n\nBring a book.'));
 assert.match(letter,/Sincerely,\n\nAda Cole\nSecretary\n\nEnclosures: Programme outline$/);
 assert.equal((letter.match(/Ada Cole/g)||[]).length,1);assert.equal(letterLayout({...p,drafts:{invitation:letter}},'formal',details),letter);
 const changed=letterLayout({...p,drafts:{invitation:letter}},'formal',{...details,senderAddress:'New Street',signatureName:'Nora Cole',signatureRole:'Chair'});
 assert.doesNotMatch(changed,/12 Cedar Street|Ada Cole/);assert.match(changed,/Nora Cole\nChair/);
});

test('informal letter omits subject and recipient address, keeps optional location/date and adds a personal P.S.',()=>{
 const p={title:'Reading Day',organizer:'Cedar Club',signatory:'Ada Cole, Secretary',drafts:{invitation:'Dear Parents,\n\nI hope you are well.\n\nJoin us at 10:00.\n\nSincerely,\nAda Cole\nSecretary'}};
 const d={senderAddress:'Lagos',letterDate:'2026-10-24',recipientName:'Bola',recipientAddress:'Do not include',recipientOrganization:'Do not include',senderEmail:'Do not include',subject:'Do not include',signatureName:'Ada',informalClosing:'Take care',postscript:'Bring your favourite book.'};
 const letter=letterLayout(p,'informal',d);
 assert.ok(letter.startsWith('Lagos\n\n24 October 2026\n\nHi Bola,'));assert.doesNotMatch(letter,/SUBJECT:|Do not include|Secretary/);assert.match(letter,/Take care,\n\nAda\n\nP\.S\. Bring your favourite book\.$/);
 assert.equal(letterLayout({...p,drafts:{invitation:letter}},'informal',d),letter);
});

test('missing optional letter details are omitted, invalid dates do not become event dates and oversized composition preserves input',()=>{
 const p={title:'Reading Day',eventDate:'2026-12-12',organizer:null,signatory:null,drafts:{invitation:'A body paragraph.\n\nInvitation to participate is open to all.'}};
 const original=structuredClone(p),letter=letterLayout(p,'formal',{letterDate:'2026-02-30'});
 assert.doesNotMatch(letter,/2026|Email|Street|Enclosures/);assert.ok(letter.includes('Invitation to participate is open to all.'));assert.deepEqual(p,original);
 assert.equal(normalizeLetterDetails({letterDate:'2028-02-29'}).letterDate,'2028-02-29');assert.equal(normalizeLetterDetails({senderName:{bad:true}}).senderName,'');
 assert.throws(()=>letterLayout({...p,drafts:{invitation:'X'.repeat(12000)}},'formal',{senderAddress:'A'.repeat(600)}),/too long/);assert.deepEqual(p,original);
});

test('a physical formal letter can include a signing line without duplicating names or informal signatures',()=>{
 const p={title:'Reading Day',organizer:'Cedar Club',signatory:'Ada Cole, Secretary',drafts:{invitation:'Join us at 10:00.'}};
 const d={signatureMode:'handwritten',formalClosing:'Respectfully'};const letter=letterLayout(p,'formal',d);
 assert.match(letter,/Respectfully,\n\n_+\nAda Cole\nSecretary/);assert.equal(letterLayout({...p,drafts:{invitation:letter}},'formal',d),letter);assert.doesNotMatch(letterLayout({...p,drafts:{invitation:letter}},'informal',d),/_{4}|Secretary/);
});
