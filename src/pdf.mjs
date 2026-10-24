import { createRequire } from 'node:module';
import { PDFDocument } from 'pdfkit';
import { isApproved, reviewPlan } from './plan.mjs';

const require = createRequire(import.meta.url);
const regular = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf');
const bold = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf');

// Keep integer arithmetic through formatting, including very large safe amounts.
export function money(minor) {
  if (minor < 0) return `-${money(-minor)}`;
  return `${Math.floor(minor / 100).toLocaleString('en-NG')}.${String(minor % 100).padStart(2, '0')}`;
}

export const pdfSections = Object.freeze({ invitation: 'Invitation', schedule: 'Run of show', tasks: 'Preparation checklist', budget: 'Budget' });

export async function preparationPdf(input, approval, { sample = false, section = null } = {}) {
  if (section !== null && !Object.hasOwn(pdfSections, section)) throw new Error('Invalid PDF section');
  const { plan, issues, knownTotalMinor, budgetComplete, remainingAllowanceMinor, allowanceProvisional } = reviewPlan(input);
  const approved = isApproved(plan, approval);
  const status = `${sample ? 'SAMPLE DATA / ' : ''}${approved ? 'Approved version' : 'DRAFT / Review required'}`;
  const doc = new PDFDocument({ size: 'A4', margins: { top: 76, bottom: 58, left: 48, right: 48 }, autoFirstPage: false, bufferPages: true,
    info: { Title: section ? `${plan.title} - ${pdfSections[section]}` : plan.title, Author: 'Flow Point', Subject: status } });
  const chunks = [];
  const result = new Promise((resolve, reject) => { doc.on('data', chunk => chunks.push(chunk)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });
  doc.registerFont('Body', regular).registerFont('Bold', bold);
  const width = 499.28;
  function paragraph(text, { size = 10, color = '#282439', font = 'Body' } = {}) {
    doc.font(font).fontSize(size).fillColor(color).text(String(text), 48, doc.y, { width, lineGap: 3, paragraphGap: 6 });
    doc.moveDown(0.4);
  }
  function room(height) { if (doc.y + height > doc.page.height - 58) doc.addPage(); }
  function heading(title) { room(70); doc.moveDown(0.4); paragraph(title, { size: 15, font: 'Bold', color: '#7B263F' }); }
  doc.addPage();
  paragraph(plan.title, { size: 24, font: 'Bold' });
  paragraph(section ? pdfSections[section] : 'Event preparation pack', { size: 15, font: 'Bold', color: '#7B263F' });
  if (sample) paragraph('Hand-authored sample. No AI generation was performed for this example.', { color: '#805000' });
  if (!section) {
  for (const [label, value] of [['Event date', plan.eventDate], ['Start time', plan.startTime], ['Venue', plan.venue], ['Organizer', plan.organizer], ['Signatory', plan.signatory]]) paragraph(`${label}: ${value ?? 'To confirm'}`);
  heading('Review notes');
  paragraph(approved ? 'This exact version was reviewed and approved. Approval does not confirm external actions or guarantee factual accuracy.' : 'This is a working draft. Check the facts, wording and outstanding items before use.');
  if (issues.length) for (const issue of issues) paragraph(`• ${issue.message}`, { size: 9 });
  else paragraph('Structural checks passed. Human review of the facts and wording is still required.', { size: 9 });
  } else {
    paragraph(approved ? 'Approved as part of this reviewed pack version.' : `Draft / Review required. The current pack has ${issues.length} review item(s). Check the facts and wording before use.`, { size: 9, color: '#575065' });
  }
  if (!section || section === 'invitation') {
  if (!section) heading('Invitation');
  const invitation = plan.drafts.invitation || 'No invitation drafted.';
  const invitationBlocks = invitation.split(/\n\s*\n/);
  for (let index = 0; index < invitationBlocks.length; index++) {
    // Keep the closing and signatory together when a model supplies them as
    // short separate paragraphs near a page boundary.
    if (index === invitationBlocks.length - 3) {
      const closing = invitationBlocks.slice(index).join('\n\n');
      const closingHeight = doc.font('Body').fontSize(10).heightOfString(closing, { width, lineGap: 3, paragraphGap: 6 });
      if (closingHeight < doc.page.height - 134) room(closingHeight + 38);
    }
    paragraph(invitationBlocks[index]);
  }
  }
  if (!section || section === 'schedule') {
    if (!section) heading('Proposed run of show');
    if (section) paragraph('Proposed programme. Confirm timings, durations and presenters before use.', { size: 9 });
    paragraph(plan.drafts.schedule || 'No schedule drafted.');
  }
  if (!section || section === 'tasks') {
  if (!section) heading('Preparation checklist');
  if (section) paragraph('Proposed preparation work. Assign and confirm owners and deadlines; these are not completed actions.', { size: 9 });
  if (!plan.tasks.length) paragraph('No preparation tasks recorded.');
  for (const [index, task] of plan.tasks.entries()) {
    const taskHeight = doc.font('Bold').fontSize(10).heightOfString(`${index + 1}. ${task.label}`, { width, lineGap: 3 });
    const ownerHeight = doc.font('Body').fontSize(9).heightOfString(`Owner: ${task.owner ?? 'Unassigned'}    Due: ${task.dueDate ?? 'Not set'}`, { width, lineGap: 3 });
    room(taskHeight + ownerHeight + 30); paragraph(`${index + 1}. ${task.label}`, { font: 'Bold' });
    paragraph(`Owner: ${task.owner ?? 'Unassigned'}    Due: ${task.dueDate ?? 'Not set'}`, { size: 9, color: '#575065' });
  }
  }
  if (!section || section === 'budget') {
  doc.font('Body').fontSize(9);
  const budgetHeight = 150 + plan.budget.reduce((height, item) => height + Math.max(20, doc.heightOfString(item.label, { width: 210, lineGap: 2 }) + 12) + 3, 0);
  if (!section) { room(Math.min(budgetHeight, doc.page.height - 134)); heading('Budget'); }
  paragraph(`Currency: ${plan.currency}. Amounts are in main units (for NGN, naira).`, { size: 9 });
  const columns = [{ x: 48, w: 214 }, { x: 270, w: 35 }, { x: 313, w: 105 }, { x: 426, w: 121 }];
  function row(values, header = false) {
    doc.font(header ? 'Bold' : 'Body').fontSize(9);
    const height = Math.max(20, ...values.map((value, i) => doc.heightOfString(value, { width: columns[i].w - 4, lineGap: 2 }) + 12));
    if (doc.y + height > doc.page.height - 58) { doc.addPage(); if (!header) row(['Item', 'Qty', 'Unit price', 'Subtotal'], true); }
    const y = doc.y;
    values.forEach((value, i) => doc.font(header ? 'Bold' : 'Body').fontSize(9).fillColor('#282439').text(value, columns[i].x, y + 4, { width: columns[i].w - 4, lineGap: 2, align: i ? 'right' : 'left' }));
    doc.moveTo(48, y + height).lineTo(547, y + height).strokeColor('#E4D7CC').stroke(); doc.y = y + height + 3;
  }
  if (plan.budget.length) {
    room(65); row(['Item', 'Qty', 'Unit price', 'Subtotal'], true);
    for (const item of plan.budget) row([item.label, String(item.quantity), item.unitCostMinor === null ? 'Unknown' : money(item.unitCostMinor), item.unitCostMinor === null ? 'Unknown' : money(item.quantity * item.unitCostMinor)]);
  } else paragraph('No budget items recorded. Check whether costs are still missing.');
  room(65); paragraph(`${budgetComplete ? 'Total' : 'Known subtotal (incomplete)'}: ${plan.currency} ${money(knownTotalMinor)}`, { font: 'Bold', size: 12 });
  paragraph(`Spending limit: ${plan.spendingLimitMinor === null ? 'Not supplied' : plan.currency + ' ' + money(plan.spendingLimitMinor)}`);
  paragraph(remainingAllowanceMinor === null ? 'Remaining allowance: unknown without a spending limit.' : `${remainingAllowanceMinor < 0 ? 'Over budget by' : allowanceProvisional ? 'Provisional allowance before unknown costs' : 'Remaining allowance'}: ${plan.currency} ${money(Math.abs(remainingAllowanceMinor))}${allowanceProvisional ? '. Not a final available balance.' : ''}`);
  paragraph('Unknown prices are not zero. Suggested tasks and schedules describe proposed work, not completed actions.', { size: 9 });
  }
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.margins.bottom; doc.page.margins.bottom = 0;
    // Draw page furniture after flowing body text, so automatic page breaks
    // cannot overwrite the header while continuing a paragraph.
    // Preserve the exact event title in the running header, including long titles.
    let headerSize = 10;
    doc.font('Bold').fontSize(headerSize);
    while (headerSize > 6 && doc.heightOfString(plan.title, { width, lineGap: 1 }) > 28) doc.fontSize(headerSize -= 0.5);
    doc.fillColor('#7B263F').text(plan.title, 48, 20, { width, lineGap: 1 });
    doc.moveTo(48, 52).lineTo(547, 52).strokeColor('#D4C2B5').stroke();
    doc.font('Body').fontSize(8).fillColor('#575065').text(`Flow Point • ${section ? pdfSections[section] + ' • ' : ''}${status} • Page ${i + 1} of ${range.count}`, 48, doc.page.height - 35, { width, lineBreak: false });
    doc.page.margins.bottom = bottom;
  }
  doc.end();
  return result;
}
