'use strict';
import { prepareInStages } from './generation.mjs';
import { downloadFilename } from './download-name.mjs';
import { factFields, factSourceInfo, markManualField, confirmFact, markNotesChanged } from './source-fields.mjs';
import { minorToDecimal, formatMinor } from './money.mjs';
import { legacyKey, storageKey, maxPacks, emptyWorkspace, restoreCollection, recordCurrent, saveNamed, renameNamed, openNamed, removeNamed, newWorkspace, serializeCollection } from './pack-store.mjs';
const $ = id => document.getElementById(id);
let collection = { current: emptyWorkspace(), packs: [], activeId: null };
let state = collection.current;
let lastSavedRaw = null;
const sourceHosts = new Map();
let review = null, revision = 0, timer, controller, busy = false, liveAvailable = false;
const tabs = [...document.querySelectorAll('[role=tab]')];
function announce(message) { $('notice').textContent = message; $('notice').hidden = !message; }
// A versioned choice covers explicit Prepare and Update actions, never automatic sends.
const consentKey = 'flow-point-google-processing-v2';
let processingAllowed = false;
function restoreConsent() {
  let remembered = false;
  try { remembered = localStorage.getItem(consentKey) === 'allowed'; } catch { /* Session choice still works. */ }
  let session = false;
  try { session = sessionStorage.getItem(consentKey) === 'allowed'; } catch { /* In-memory choice still works. */ }
  processingAllowed = remembered || session;
  $('consent').checked = processingAllowed;
  $('remember-consent').checked = remembered;
  renderConsent();
}
function renderConsent() {
  $('processing-status').textContent = processingAllowed
    ? 'Google processing allowed for Prepare and Update. ' + ($('remember-consent').checked ? 'Choice remembered on this browser.' : 'Choice applies to this tab session.')
    : 'Choose whether to allow Google processing on the Notes page before updating.';
}
function saveConsent() {
  processingAllowed = $('consent').checked;
  if (!processingAllowed) $('remember-consent').checked = false;
  let remembered = false;
  try {
    if (processingAllowed && $('remember-consent').checked) { localStorage.setItem(consentKey, 'allowed'); remembered = true; }
    else localStorage.removeItem(consentKey);
  } catch { /* Do not claim that a preference was saved when storage is blocked. */ }
  try {
    if (processingAllowed) sessionStorage.setItem(consentKey, 'allowed');
    else sessionStorage.removeItem(consentKey);
  } catch { /* Current page still remembers the choice. */ }
  if ($('remember-consent').checked && !remembered) {
    $('remember-consent').checked = false;
    $('consent-help').textContent = 'This browser could not remember your choice. It applies to this open page only.';
  } else $('consent-help').textContent = 'Otherwise, your choice lasts for this tab session. You can change it here at any time.';
  renderConsent();
}
$('consent').addEventListener('change', saveConsent);
$('remember-consent').addEventListener('change', () => {
  if (!$('consent').checked) { $('remember-consent').checked = false; return announce('Choose whether to allow Google processing first.'); }
  saveConsent();
});
$('change-consent').addEventListener('click', () => {
  switchView('notes'); $('consent').focus(); announce('Change or forget your Google processing choice below your notes. This does not send any content.');
});
window.addEventListener('storage', event => { if (event.key === consentKey || event.key === null) { if (event.newValue !== 'allowed') { try { sessionStorage.removeItem(consentKey); } catch {} } restoreConsent(); } });
restoreConsent();

function renderView() {
  const wantsPack = location.pathname.startsWith('/workspace/pack');
  const pack = wantsPack && Boolean(state.plan);
  if (wantsPack && !pack) history.replaceState(null, '', '/workspace');
  document.body.classList.toggle('pack-page', pack);
  if (pack) { $('pack-link').setAttribute('aria-current', 'page'); $('notes-link').removeAttribute('aria-current'); }
  else { $('notes-link').setAttribute('aria-current', 'page'); $('pack-link').removeAttribute('aria-current'); }
  $('pack-link').hidden = !state.plan;
  $('review-pack').hidden = !state.plan;
}
function switchView(view, replace = false, internal = false) {
  if (busy && !internal) return announce('Finish or cancel the current update before switching pages.');
  if (view === 'pack' && !state.plan) return announce('Prepare or open a pack first.');
  const path = view === 'pack' ? '/workspace/pack' : '/workspace';
  if (location.pathname !== path) history[replace ? 'replaceState' : 'pushState'](null, '', path);
  renderView(); window.scrollTo({ top: 0, behavior: 'instant' });
}
for (const id of ['notes-link', 'pack-link', 'edit-notes', 'review-pack']) {
  $(id).addEventListener('click', event => { event.preventDefault(); switchView(id === 'notes-link' || id === 'edit-notes' ? 'notes' : 'pack'); });
}
window.addEventListener('popstate', renderView);
function persist(candidate) {
  try {
    // Do not replace newer work written by another open tab.
    if (localStorage.getItem(storageKey) !== lastSavedRaw) {
      $('save-state').textContent = 'Another tab changed the saved workspace.';
      announce('Another tab saved changes. Your edits are still open here. Download or copy them, then reload to use the latest saved workspace.');
      return false;
    }
    const raw = serializeCollection(candidate);
    localStorage.setItem(storageKey, raw);
    lastSavedRaw = raw;
    try { localStorage.removeItem(legacyKey); } catch { /* The new entry is already saved. */ }
    collection = candidate;
    $('save-state').textContent = 'Saved on this browser';
    renderSavedPacks();
    return true;
  } catch {
    $('save-state').textContent = 'Browser storage unavailable or full. Download your pack.';
    announce('This change could not be saved in this browser. Download a copy before leaving.');
    return false;
  }
}
function save() {
  state.request = $('request').value; state.answers = $('answers').value;
  persist(recordCurrent(collection, state));
}
function node(tag, text, className) { const item = document.createElement(tag); if (text != null) item.textContent = text; if (className) item.className = className; return item; }
function renderSavedPacks() {
  $('saved-count').textContent = `${collection.packs.length} of ${maxPacks}`;
  const active = collection.packs.find(item => item.id === collection.activeId);
  $('saved-active').textContent = active ? `Editing “${active.name}”. Changes save here automatically.` : 'Your current pack has no saved name yet.';
  $('saved-create').hidden = Boolean(active);
  $('save-named').disabled = busy || !state.plan || collection.packs.length >= maxPacks;
  $('saved-list').replaceChildren(...collection.packs.map(item => {
    const row = node('li', null, item.id === collection.activeId ? 'active' : '');
    const name = node('span', item.name, 'saved-item-name');
    const date = node('span', `Saved ${new Date(item.updatedAt).toLocaleString()}`, 'saved-item-date');
    const actions = node('div', null, 'saved-item-actions');
    const open = node('button', item.id === collection.activeId ? 'Current' : 'Open', 'quiet'); open.type = 'button'; open.disabled = busy || item.id === collection.activeId;
    open.setAttribute('aria-label', `Open ${item.name}`); open.addEventListener('click', () => openSaved(item.id));
    const rename = node('button', 'Rename', 'quiet'); rename.type = 'button'; rename.disabled = busy;
    rename.setAttribute('aria-label', `Rename ${item.name}`); rename.addEventListener('click', () => renameSaved(item.id));
    const remove = node('button', 'Remove', 'quiet'); remove.type = 'button'; remove.disabled = busy;
    remove.setAttribute('aria-label', `Remove ${item.name}`); remove.addEventListener('click', () => removeSaved(item.id));
    actions.append(open, rename, remove); row.append(name, date, actions); return row;
  }));
}
function loadCurrent(candidate, message) {
  if (!persist(candidate)) return false;
  clearTimeout(timer); revision++; review = null; $('review-confirm').checked = false;
  state = collection.current; $('request').value = state.request; $('answers').value = state.answers;
  renderPack(); renderSavedPacks(); activate(tabs[0]); announce(message);
  switchView(state.plan ? 'pack' : 'notes', false, true);
  if (!state.plan) { $('pack-heading').textContent = 'A clearer next step.'; $('pack-status').textContent = 'Waiting for your request'; $('pack-status').className = 'state-badge'; $('stage-capture').classList.add('current'); $('stage-review').classList.remove('current'); $('stage-approve').classList.remove('current'); }
  return true;
}
async function openSaved(id) {
  if (busy) return;
  if ((state.plan || state.request.trim()) && !collection.activeId && !confirm('Open a saved pack? The unnamed current work will be replaced. Save it with a name first if you want to keep it.')) return;
  setBusy(true);
  try {
    const candidate = openNamed(collection, id);
    candidate.current.plan = (await api('/api/review', { plan: candidate.current.plan, approval: candidate.current.approval })).plan;
    loadCurrent(candidate, `Opened “${candidate.packs.find(item => item.id === id).name}”. Review its facts and export status.`);
  } catch (error) { announce(error.message); }
  finally { setBusy(false); }
}
function renameSaved(id) {
  const item = collection.packs.find(entry => entry.id === id);
  if (!item) return;
  const name = prompt('Name this saved pack (80 characters maximum):', item.name);
  if (name === null) return;
  try { if (persist(renameNamed(collection, id, name))) announce('Saved pack renamed.'); }
  catch (error) { announce(error.message); }
}
function removeSaved(id) {
  const item = collection.packs.find(entry => entry.id === id);
  if (!item || !confirm(`Remove “${item.name}” from this browser? This cannot be undone. Download a copy first if you need it.`)) return;
  if (persist(removeNamed(collection, id))) announce(`Removed “${item.name}”. The current workspace stays open.`);
}
$('save-named').addEventListener('click', () => {
  try {
    const candidate = saveNamed(collection, state, $('saved-name').value, crypto.randomUUID());
    if (persist(candidate)) { $('saved-name').value = ''; announce('Named pack saved. Edits to it will save automatically on this device.'); }
  } catch (error) { announce(error.message); }
});
async function api(path, data, signal) {
  const requestController = new AbortController();
  let timedOut = false;
  const cancel = () => requestController.abort();
  if (signal?.aborted) cancel();
  else signal?.addEventListener('abort', cancel, { once: true });
  const deadline = setTimeout(() => { timedOut = true; cancel(); }, path === '/api/generate' ? 435000 : 15000);
  try {
    const response = await fetch(path, data === undefined ? { signal: requestController.signal } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: requestController.signal });
    if (!response.ok) { const result = await response.json().catch(() => ({})); const message = result?.error || 'This action could not finish. Please retry.'; throw new Error(message + (result?.requestId ? ` Reference: ${result.requestId}` : '')); }
    return await response.json();
  } catch (error) {
    if (timedOut) throw new Error('The app server took too long to reply. Your current notes and draft are still here. Check your connection and retry.');
    throw error;
  } finally {
    clearTimeout(deadline);
    signal?.removeEventListener('abort', cancel);
  }
}
function activate(tab) {
  tabs.forEach(item => { const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; $(item.getAttribute('aria-controls')).hidden = !selected; });
  tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab));
  tab.addEventListener('keydown', event => {
    const keys = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 };
    if (keys[event.key] !== undefined) { event.preventDefault(); activate(tabs[keys[event.key]]); tabs[keys[event.key]].focus(); }
  });
});
function invalidate() {
  revision++; review = null; state.approval = null; $('review-confirm').checked = false;
  $('approve').disabled = true; $('pack-status').textContent = 'Draft · checking edits'; $('pack-status').className = 'state-badge';
  $('stage-approve').classList.remove('current'); $('stage-review').classList.add('current');
  $('approval-help').textContent = 'Your changes need a fresh review. Check affected draft wording too.';
  $('source-reviewed').checked = false; renderSourceCards();
  save(); clearTimeout(timer); timer = setTimeout(refreshReview, 350);
}
async function refreshReview() {
  if (!state.plan) return;
  const version = revision;
  try {
    const result = await api('/api/review', { plan: state.plan, approval: state.approval });
    if (version !== revision) return;
    review = result;
    if (JSON.stringify(state.plan.sourceEvidence) !== JSON.stringify(result.plan.sourceEvidence)) { state.plan.sourceEvidence = result.plan.sourceEvidence; save(); }
    if (state.approval && !result.approved) { state.approval = null; save(); }
    renderReview();
  } catch (error) {
    if (version !== revision) return;
    $('review-title').textContent = 'Some fields need attention'; $('issues').replaceChildren(node('li', error.message));
    $('approve').disabled = true; $('pack-status').textContent = 'Draft · invalid fields';
  }
}
function renderReview() {
  const issues = review?.issues || [];
  $('review-title').textContent = issues.length ? `${issues.length} item${issues.length === 1 ? '' : 's'} to check before approval` : 'Ready for your final review';
  $('issues').replaceChildren(...(issues.length ? issues.map(issue => node('li', issue.message)) : [node('li', 'Structural checks passed. Verify facts and wording against the original request.')]));
  const approved = Boolean(state.approval && review.approved);
  $('pack-status').textContent = approved ? 'Approved version' : issues.length ? `Draft · ${issues.length} review items` : 'Draft · ready for review';
  $('pack-status').className = approved ? 'state-badge approved' : 'state-badge';
  $('approve').disabled = busy || approved || issues.length > 0 || !$('review-confirm').checked;
  $('approve').textContent = approved ? 'Version approved ✓' : 'Approve this version';
  $('approval-help').textContent = approved ? 'Approval covers this exact version. Any edit requires a new review. Keep a downloaded copy; server restarts may require renewed approval.' : 'Draft exports are available. Review issues must be resolved before approval.';
  $('stage-capture').classList.remove('current'); $('stage-review').classList.toggle('current', !approved); $('stage-approve').classList.toggle('current', approved);
  $('source-reviewed').disabled = busy;
  $('confirm-source-facts').disabled = busy || !$('source-reviewed').checked;
  renderSourceCards();
  $('total-label').textContent = review.budgetComplete ? 'Total' : 'Known subtotal · incomplete';
  $('total-value').textContent = `${state.plan.currency} ${formatMinor(review.knownTotalMinor)}`;
  $('allowance').className = review.remainingAllowanceMinor == null ? 'allowance-neutral' : review.allowanceProvisional || review.remainingAllowanceMinor < 0 ? 'allowance-warning' : '';
  $('allowance').textContent = review.remainingAllowanceMinor == null ? 'Remaining allowance unknown: no spending limit supplied.' : `${review.remainingAllowanceMinor < 0 ? 'Over budget by' : review.allowanceProvisional ? 'Provisional allowance before unknown costs' : 'Remaining allowance'}: ${state.plan.currency} ${formatMinor(Math.abs(review.remainingAllowanceMinor))}${review.allowanceProvisional ? '. Not a final available balance.' : ''}`;
}
function inputField(label, value, onChange, { type = 'text', maxLength = 300, min, max, step, ariaLabel, inputMode, placeholder, sourcePath } = {}) {
  const wrap = node('label', label), input = node('input'); input.type = type; input.value = value ?? ''; input.maxLength = maxLength;
  if (ariaLabel) input.setAttribute('aria-label', ariaLabel); if (inputMode) input.inputMode = inputMode; if (placeholder) input.placeholder = placeholder;
  if (min != null) input.min = min; if (max != null) input.max = max; if (step != null) input.step = step;
  input.addEventListener('input', () => { onChange(input.value); if (sourcePath) markManualField(state.plan, sourcePath); invalidate(); }); wrap.append(input);
  if (!sourcePath) return wrap;
  const group = node('div', null, 'fact-input'), host = node('div', null, 'source-host');
  group.append(wrap, host); sourceHosts.set(sourcePath, host); return group;
}
function removeButton(label, action) { const button = node('button', label, label.startsWith('Resolved') ? 'quiet resolve-action' : 'quiet danger-action'); button.type = 'button'; button.addEventListener('click', action); return button; }
function renderRows() {
  if (!state.plan) return;
  for (const key of sourceHosts.keys()) if (key.startsWith('tasks.') || key.startsWith('budget.')) sourceHosts.delete(key);
  $('questions').replaceChildren(...state.plan.openQuestions.map((question, index) => {
    const row = node('div', null, 'question-row'), input = node('input'); input.value = question; input.maxLength = 500; input.setAttribute('aria-label', `Open question ${index + 1}`);
    input.addEventListener('input', () => { state.plan.openQuestions[index] = input.value; invalidate(); });
    row.append(input, removeButton('Resolved ✓', () => { state.plan.openQuestions.splice(index, 1); invalidate(); renderRows(); })); return row;
  }));
  if (!state.plan.openQuestions.length) $('questions').append(node('p', 'No open questions recorded. Check the review notes above.', 'field-help'));
  $('tasks').replaceChildren(...state.plan.tasks.map((task, index) => {
    const row = node('div', null, 'task-row'), grid = node('div', null, 'row-grid');
    row.append(inputField(`Task ${index + 1}`, task.label, value => { task.label = value; }));
    grid.append(inputField('Owner (optional)', task.owner, value => { task.owner = value || null; }, { maxLength: 150, sourcePath: `tasks.${index}.owner`, ariaLabel: `Task ${index + 1} owner`, placeholder: 'Unassigned' }), inputField('Due date (optional)', task.dueDate, value => { task.dueDate = value || null; }, { type: 'date', sourcePath: `tasks.${index}.dueDate`, ariaLabel: `Task ${index + 1} due date` }), removeButton('Remove task', () => { state.plan.tasks.splice(index, 1); invalidate(); renderRows(); })); row.append(grid); return row;
  }));
  $('budget').replaceChildren(...state.plan.budget.map((item, index) => {
    const row = node('div', null, 'budget-row'), grid = node('div', null, 'row-grid');
    row.append(inputField(`Item ${index + 1}`, item.label, value => { item.label = value; }, { maxLength: 200 }));
    grid.append(inputField('Quantity', item.quantity, value => { item.quantity = /^\d+$/.test(value) ? Number(value) : null; }, { type: 'number', min: 1, step: 1, inputMode: 'numeric', sourcePath: `budget.${index}.quantity`, ariaLabel: `Item ${index + 1} quantity` }), inputField(`Unit price (${state.plan.currency})`, item.unitCostMinor == null ? '' : Number.isSafeInteger(item.unitCostMinor) && item.unitCostMinor >= 0 ? minorToDecimal(item.unitCostMinor) : String(item.unitCostMinor / 100), value => {
      // Parse decimal text without floating-point currency arithmetic.
      if (value === '') item.unitCostMinor = null;
      else if (/^\d+(\.\d{1,2})?$/.test(value)) { const [whole, fraction = ''] = value.split('.'); item.unitCostMinor = Number(whole) * 100 + Number(fraction.padEnd(2, '0')); }
      else item.unitCostMinor = -1;
    }, { type: 'number', min: 0, step: '0.01', inputMode: 'decimal', sourcePath: `budget.${index}.unitCostMinor`, ariaLabel: `Item ${index + 1} unit price (${state.plan.currency})` }), removeButton('Remove item', () => { state.plan.budget.splice(index, 1); invalidate(); renderRows(); })); row.append(grid); return row;
  }));
  renderSourceCards();
}
function registerStaticSources() {
  document.querySelectorAll('[data-field]').forEach(input => {
    if (input.dataset.field === 'requestedWeekday') return;
    attachStaticSource(input, input.dataset.field);
  });
  attachStaticSource($('spending-limit'), 'spendingLimitMinor');
}
function attachStaticSource(input, path) {
  // Unit/UI harnesses may not expose DOM layout methods; the real inputs do.
  if (!input?.closest) return;
  if (sourceHosts.has(path)) return;
  const label = input.closest('label'); if (!label) return;
  const group=node('div',null,'fact-input'), host=node('div',null,'source-host');
  label.replaceWith(group); group.append(label,host); sourceHosts.set(path,host);
}
function renderSourceCards() {
  if (!state.plan) return;
  const labels = {unknown:'Unknown · needs a value',legacy:'No saved source · needs review',unreviewed:'Quote found · needs review',manual:'Manually entered · needs review',unsupported:'No valid quote · needs review',confirmed:'Confirmed by you'};
  const all = factFields(state.plan).map(f => factSourceInfo(state.plan,f.path));
  const counts = { confirmed:0, unknown:0, review:0 };
  for(const info of all) counts[info.status === 'confirmed' ? 'confirmed' : info.status === 'unknown' ? 'unknown' : 'review']++;
  $('source-summary').textContent = `${counts.confirmed} confirmed by you · ${counts.review} known facts to review · ${counts.unknown} unknown values`;
  for(const [path,host] of sourceHosts) {
    const info=factSourceInfo(state.plan,path); if (!info) { host.replaceChildren(); continue; }
    const open=host._sourceOpen || false;
    const card=node('details',null,`source-card source-${info.status}`); card.open=open;
    card.addEventListener('toggle', () => { host._sourceOpen=card.open; });
    const summary=node('summary', labels[info.status]); summary.setAttribute('aria-label', `${info.label} source: ${labels[info.status]}`); card.append(summary);
    const body=node('div',null,'source-card-body');
    if(info.quote) {
      body.append(node('span', info.sourceKind === 'update' ? 'Saved update' : 'Original notes', 'source-kind'),node('blockquote',info.quote));
      body.append(node('p','Check that this quote supports the value. Its presence does not prove the interpretation.','field-help'));
    } else body.append(node('p', info.status === 'legacy' ? 'This older pack has no saved quote for this fact. Check your notes or enter a correction; no historical source has been invented.' : info.status === 'manual' ? 'You changed this fact. Its previous quote and confirmation no longer apply. Check the value before confirming it.' : info.status === 'unknown' ? 'No value is supplied. Confirm it in the relevant field or through Update.' : info.status === 'confirmed' ? 'You manually confirmed this value. There is no supporting saved quote.' : 'No matching source quote is saved. A quote may be missing, invalid, or outdated. Check your notes and correct or manually confirm this fact.', 'field-help'));
    if(info.status !== 'unknown' && info.status !== 'confirmed') {
      const button=node('button','Confirm this fact','quiet source-confirm-button'); button.type='button'; button.disabled=busy; button.setAttribute('aria-label', `Confirm ${info.label}`);
      button.addEventListener('click',()=> { if(busy) return; confirmFact(state.plan,path); invalidate(); }); body.append(button);
    }
    card.append(body); host.replaceChildren(card);
  }
}
function renderEvidence(p) {
  const evidence = $('generation-evidence');
  if (p?.pipeline !== 'staged-v1' || !Array.isArray(p.steps)) {
    evidence.replaceChildren(node('p', p?.mode === 'sample' ? 'Hand-authored sample. No model inference or live timing.' : 'Earlier generation format. See the provenance and dated verification record.', 'field-help')); return;
  }
  const metrics = node('div', null, 'evidence-metrics');
  const seconds = value => Number.isFinite(value) && value >= 0 ? `${(value / 1000).toFixed(1)} s` : 'Unavailable';
  for (const [value, label] of [[String(p.steps.length), 'Validated steps'], [seconds(p.durationMs), 'Server generation'], [String(p.reusedSteps || 0), 'Reused steps']]) {
    const card = node('div', null, 'evidence-metric'); card.append(node('strong', value), node('span', label)); metrics.append(card);
  }
  const grid = node('div', null, 'evidence-grid');
  const labels = { facts: 'Event facts & budget', invitation: 'Invitation', schedule: 'Run of show' };
  for (const [index, step] of p.steps.entries()) {
    const card = node('article', null, 'evidence-step');
    card.append(node('span', `STEP ${index + 1}`, 'eyebrow'), node('h4', labels[step.stage] || 'Generation step'), node('p', step.model || 'Model unavailable', 'evidence-model'), node('p', `${seconds(step.durationMs)} · ${step.attempts ?? '?'} attempt(s)`, 'evidence-timing'));
    const reference = node('details', null, 'reference-details'); reference.append(node('summary', 'Request reference'), node('code', step.requestId || 'Unavailable'));
    if (step.requestId) {
      const copy = node('button', 'Copy reference', 'quiet'); copy.type = 'button';
      copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(step.requestId); copy.textContent = 'Copied ✓'; } catch { announce('Copy is unavailable. Select the reference shown in Generation evidence.'); } }); reference.append(copy);
    }
    card.append(reference); grid.append(card);
  }
  evidence.replaceChildren(metrics, grid, node('p', 'Server timings exclude human review and export. Completed replies save in this browser; references help investigate a failed request.', 'field-help'));
}
function renderPack() {
  const exists = Boolean(state.plan); $('empty-state').hidden = exists; $('pack-editor').hidden = !exists; $('clarify-section').hidden = !exists;
  renderView();
  renderSavedPacks();
  if (!exists) return;
  $('spending-limit').value = state.plan.spendingLimitMinor == null ? '' : minorToDecimal(state.plan.spendingLimitMinor);
  $('pack-heading').textContent = state.plan.title;
  const p = state.provenance;
  renderEvidence(p);
  $('provenance').textContent = p?.mode === 'sample' ? 'SAMPLE DATA · Hand-authored example. No AI call was made.' : p?.mode === 'live' ? `Generated with ${p.pipeline === 'staged-v1' ? 'Gemma in 3 steps' : p.model} · ${new Date(p.generatedAt).toLocaleString()} · ${(p.durationMs / 1000).toFixed(1)} seconds · Human edits may follow.` : 'Restored working draft · Review all details.';
  document.querySelectorAll('[data-field]').forEach(input => { input.value = state.plan[input.dataset.field] ?? ''; });
  document.querySelectorAll('[data-draft]').forEach(input => { input.value = state.plan.drafts[input.dataset.draft]; });
  registerStaticSources(); renderRows(); refreshReview();
}
document.querySelectorAll('[data-field]').forEach(input => input.addEventListener('input', () => {
  if (!state.plan) return;
  state.plan[input.dataset.field] = input.value || (input.dataset.field === 'title' || input.dataset.field === 'currency' ? '' : null);
  markManualField(state.plan, input.dataset.field);
  if (input.dataset.field === 'currency') state.plan.currency = input.value.toUpperCase();
  if (input.dataset.field === 'title') $('pack-heading').textContent = input.value || 'Untitled event';
  invalidate();
  if (input.dataset.field === 'currency') renderRows();
}));
document.querySelectorAll('[data-draft]').forEach(input => input.addEventListener('input', () => { state.plan.drafts[input.dataset.draft] = input.value; invalidate(); }));
$('request').addEventListener('input', () => { if (state.plan) { markNotesChanged(state.plan); invalidate(); } else save(); });
$('answers').addEventListener('input', save);
$('spending-limit').addEventListener('input', () => {
  if (!state.plan) return;
  const value = $('spending-limit').value;
  const [whole, fraction = ''] = value.split('.');
  state.plan.spendingLimitMinor = value === '' ? null : /^\d+(\.\d{1,2})?$/.test(value) ? Number(whole) * 100 + Number(fraction.padEnd(2, '0')) : -1;
  markManualField(state.plan, 'spendingLimitMinor');
  invalidate();
});
$('source-reviewed').addEventListener('change', () => { $('confirm-source-facts').disabled=busy || !$('source-reviewed').checked; });
$('confirm-source-facts').addEventListener('click', () => {
  if(busy || !state.plan || !$('source-reviewed').checked) return;
  for(const field of factFields(state.plan)) confirmFact(state.plan,field.path);
  invalidate(); announce('Your fact review is recorded. Check the draft wording and any remaining questions before final approval.');
});
$('review-confirm').addEventListener('change', () => { if (review) renderReview(); });
$('add-question').addEventListener('click', () => { if (state.plan.openQuestions.length >= 50) return announce('This pack already has 50 questions. Resolve existing ones first.'); state.plan.openQuestions.push(''); invalidate(); renderRows(); });
$('add-task').addEventListener('click', () => { if (state.plan.tasks.length >= 100) return announce('The checklist can hold up to 100 tasks.'); state.plan.tasks.push({ label: '', owner: null, dueDate: null }); invalidate(); renderRows(); });
$('add-budget').addEventListener('click', () => { if (state.plan.budget.length >= 100) return announce('The budget can hold up to 100 items.'); state.plan.budget.push({ label: '', quantity: 1, unitCostMinor: null }); invalidate(); renderRows(); });
function setBusy(value) {
  busy = value;
  document.querySelectorAll('#pack-editor input, #pack-editor textarea, #pack-editor select, #pack-editor button').forEach(input => { input.disabled = value; });
  $('request').disabled = value; $('answers').disabled = value; $('consent').disabled = value; $('remember-consent').disabled = value; $('change-consent').disabled = value; $('generate').disabled = value || !liveAvailable; $('refine').disabled = value || !liveAvailable; $('sample').disabled = value; $('empty-sample').disabled = value; $('reset').disabled = value;
  $('saved-name').disabled = value; $('judge-example').disabled = value; renderSavedPacks();
  $('cancel').hidden = !value; $('cancel-refine').hidden = !value; $('generate').textContent = value ? 'Preparing with Gemma…' : 'Prepare my event pack ↗';
  if (!value && review) renderReview(); else $('approve').disabled = true;
}
async function generate(refine = false) {
  if (busy) return;
  if (refine) {
    if (!$('answers').value.trim()) return announce('Add the confirmations or changes you want Gemma to apply.');
  } else if (!$('request-form').reportValidity()) return;
  if (!processingAllowed) { switchView('notes'); $('consent').focus(); return announce('Allow Google processing below your notes before preparing or updating a pack.'); }
  if (!refine && state.plan && !confirm(collection.activeId ? 'Prepare a new pack? Your named pack will stay in Saved Packs.' : 'Replace the current unnamed pack? Save it with a name first if you want to keep editing it.')) return;
  save(); clearTimeout(timer); revision++; setBusy(true); announce('Preparing three sections with Gemma. Each step can take up to 7 minutes. You can cancel and retry with the same notes to reuse saved progress.'); controller = new AbortController();
  try {
    const input = { request: $('request').value, answers: refine ? $('answers').value : '', previousPlan: refine ? state.plan : null };
    const result = await prepareInStages(input, {
      call: (data, signal) => api('/api/generate', data, signal), saved: state.pendingGeneration, signal: controller.signal,
      checkpoint: work => { state.pendingGeneration = work; save(); },
      progress: ({ stage, index, reused }) => {
        const label = { facts: 'Event details, checklist and budget', invitation: 'Invitation draft', schedule: 'Run of show' }[stage];
        announce(`Step ${index + 1} of 3: ${label}. ${reused ? `${reused} saved step(s) reused. ` : ''}Completed steps save in this browser. Your previous pack stays safe.`);
      }
    });
    const checked = await api('/api/review', { plan: result.plan }, controller.signal);
    for (const field of ['plan', 'issues', 'knownTotalMinor', 'budgetComplete', 'remainingAllowanceMinor', 'allowanceProvisional']) result[field] = checked[field];
    delete state.pendingGeneration;
    if (!refine) collection = { ...collection, activeId: null };
    state.plan = result.plan; state.provenance = result.provenance; state.approval = null; review = result; $('review-confirm').checked = false; $('answers').value = ''; save(); renderPack();
    announce('Pack prepared. Compare the details with your notes, then review every section.'); activate(tabs[0]); switchView('pack', false, true);
  } catch (error) { const kept = state.pendingGeneration?.results?.length || 0; announce((error.name === 'AbortError' ? 'Generation cancelled. Your previous draft has been kept.' : error.message) + (kept ? ` ${kept} completed step(s) kept. Check the browser save status above. Retry with the same notes and changes to resume.` : '')); }
  finally { controller = null; setBusy(false); }
}
$('request-form').addEventListener('submit', event => { event.preventDefault(); generate(); });
$('refine').addEventListener('click', () => generate(true));
$('cancel').addEventListener('click', () => controller?.abort());
$('cancel-refine').addEventListener('click', () => controller?.abort());
async function sample() {
  if (busy) return;
  if (state.plan && !confirm(collection.activeId ? 'Open the sample? Your named pack will stay in Saved Packs.' : 'Replace the current unnamed pack with the labelled sample? Save it with a name first if needed.')) return;
  setBusy(true);
  try {
    const result = await api('/api/sample'); clearTimeout(timer); revision++;
    collection = { ...collection, activeId: null };
    state = { request: 'SAMPLE: School Family Day on Friday, 23 October 2026, at the school assembly hall. Prepare invitations and a run of show, with 50 refreshment packs and 50 printed programmes. Prices and start time are not supplied.', answers: '', plan: result.plan, approval: null, provenance: result.provenance };
    $('request').value = state.request; $('answers').value = ''; $('review-confirm').checked = false; save(); renderPack(); announce('Sample workspace opened. This is hand-authored data, with no AI call. You can edit, review, and export it.'); activate(tabs[0]); switchView('pack', false, true);
  } catch (error) { announce(error.message); }
  finally { setBusy(false); }
}
$('sample').addEventListener('click', sample); $('empty-sample').addEventListener('click', sample);
$('approve').addEventListener('click', async () => {
  const version = revision; $('approve').disabled = true;
  try {
    const result = await api('/api/approve', { plan: state.plan, confirmed: $('review-confirm').checked });
    if (version !== revision) return;
    state.approval = result.approval; save(); await refreshReview(); announce('This version is approved. You can download the reviewed preparation pack.');
  } catch (error) { announce(error.message); if (review) renderReview(); }
});
async function download(format) {
  const button = $(`export-${format}`); button.disabled = true;
  try {
    const response = await fetch('/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: state.plan, approval: state.approval, format, sample: state.provenance?.mode === 'sample' }) });
    if (!response.ok) { const data = await response.json(); throw new Error(data.error); }
    const disposition = response.headers.get('Content-Disposition') || '';
    const filename = downloadFilename(disposition, format, `flow-point-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${format}`);
    const blob = await response.blob(), url = URL.createObjectURL(blob), a = node('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Download started. The pack includes its review status; the CSV is a budget worksheet.');
  } catch (error) { announce(error.message || 'Download failed. Please retry.'); }
  finally { button.disabled = false; }
}
$('export-pdf').addEventListener('click', () => download('pdf')); $('export-md').addEventListener('click', () => download('md')); $('export-csv').addEventListener('click', () => download('csv'));
$('reset').addEventListener('click', () => {
  if ((state.plan || state.request.trim()) && !collection.activeId && !confirm('Start a blank pack? The current unnamed work will be replaced. Save it with a name first if needed.')) return;
  if (busy) return;
  loadCurrent(newWorkspace(collection), 'Blank workspace ready. Your named packs and AI processing choice remain available.');
});
$('judge-example').addEventListener('click', async () => {
  if (busy) return;
  if ((state.plan || state.request.trim()) && !confirm('Load the fictional judge brief? Save your current pack with a name first if you need it.')) return;
  setBusy(true);
  try {
    const example = await api('/judge-example.json');
    if (loadCurrent(newWorkspace(collection), 'Fictional judge brief loaded. No AI call yet. Read the notes, allow Google processing, then prepare the pack.')) {
      $('request').value = example.request; save(); switchView('notes', false, true);
    }
  } catch (error) { announce(error.message); }
  finally { setBusy(false); }
});
async function init() {
  setBusy(true);
  try {
    const stored = localStorage.getItem(storageKey), legacy = localStorage.getItem(legacyKey);
    lastSavedRaw = stored;
    collection = restoreCollection(stored?.length <= 1500000 ? stored : null, legacy?.length <= 150000 ? legacy : null);
    state = collection.current;
    // Restore notes before contacting the server, so a failed review cannot hide them.
    $('request').value = state.request; $('answers').value = state.answers;
    if (state.plan) state.plan = (await api('/api/review', { plan: state.plan, approval: state.approval })).plan;
    renderPack();
    if (state.pendingGeneration?.results?.length) announce('An unfinished generation has saved progress. Use Prepare or Update again with the same notes and changes to resume.');
    if (!stored && legacy) save();
  } catch { announce('The saved draft could not be restored. You can start a new pack or retry after reconnecting.'); }
  try { const config = await api('/api/config'); liveAvailable = config.liveAvailable; $('model-state').textContent = liveAvailable ? `Live drafting · ${config.model}` : 'Live Gemma is not connected yet. The sample workspace is available.'; }
  catch { $('model-state').textContent = 'Cannot reach the app server. Please reconnect and reload.'; }
  setBusy(false);
}
init();
