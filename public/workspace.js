'use strict';
import { legacyKey, storageKey, maxPacks, emptyWorkspace, restoreCollection, recordCurrent, saveNamed, renameNamed, openNamed, removeNamed, newWorkspace, serializeCollection } from './pack-store.mjs';
const $ = id => document.getElementById(id);
let collection = { current: emptyWorkspace(), packs: [], activeId: null };
let state = collection.current;
let review = null, revision = 0, timer, controller, busy = false, liveAvailable = false;
const tabs = [...document.querySelectorAll('[role=tab]')];
function announce(message) { $('notice').textContent = message; $('notice').hidden = !message; }
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
    localStorage.setItem(storageKey, serializeCollection(candidate));
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
  clearTimeout(timer); revision++; review = null; $('review-confirm').checked = false;
  if (!persist(candidate)) return false;
  state = collection.current; $('request').value = state.request; $('answers').value = state.answers; $('refine-consent').checked = false;
  renderPack(); renderSavedPacks(); activate(tabs[0]); announce(message);
  switchView(state.plan ? 'pack' : 'notes');
  if (!state.plan) { $('pack-heading').textContent = 'A clearer next step.'; $('pack-status').textContent = 'Waiting for your request'; $('pack-status').className = 'state-badge'; $('stage-capture').classList.add('current'); $('stage-review').classList.remove('current'); $('stage-approve').classList.remove('current'); }
  return true;
}
async function openSaved(id) {
  if (busy) return;
  if ((state.plan || state.request.trim()) && !collection.activeId && !confirm('Open a saved pack? The unnamed current work will be replaced. Save it with a name first if you want to keep it.')) return;
  try {
    const candidate = openNamed(collection, id);
    candidate.current.plan = (await api('/api/review', { plan: candidate.current.plan, approval: candidate.current.approval })).plan;
    loadCurrent(candidate, `Opened “${candidate.packs.find(item => item.id === id).name}”. Review its facts and export status.`);
  } catch (error) { announce(error.message); }
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
  const response = await fetch(path, data === undefined ? { signal } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal });
  if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || 'This action could not finish. Please retry.'); }
  return response.json();
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
  save(); clearTimeout(timer); timer = setTimeout(refreshReview, 350);
}
async function refreshReview() {
  if (!state.plan) return;
  const version = revision;
  try {
    const result = await api('/api/review', { plan: state.plan, approval: state.approval });
    if (version !== revision) return;
    review = result;
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
  $('total-label').textContent = review.budgetComplete ? 'Total' : 'Known subtotal · incomplete';
  $('total-value').textContent = `${state.plan.currency} ${(review.knownTotalMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function inputField(label, value, onChange, { type = 'text', maxLength = 300, min, max, step, ariaLabel, inputMode, placeholder } = {}) {
  const wrap = node('label', label), input = node('input'); input.type = type; input.value = value ?? ''; input.maxLength = maxLength;
  if (ariaLabel) input.setAttribute('aria-label', ariaLabel); if (inputMode) input.inputMode = inputMode; if (placeholder) input.placeholder = placeholder;
  if (min != null) input.min = min; if (max != null) input.max = max; if (step != null) input.step = step;
  input.addEventListener('input', () => { onChange(input.value); invalidate(); }); wrap.append(input); return wrap;
}
function removeButton(label, action) { const button = node('button', label, 'quiet'); button.type = 'button'; button.addEventListener('click', action); return button; }
function renderRows() {
  if (!state.plan) return;
  $('questions').replaceChildren(...state.plan.openQuestions.map((question, index) => {
    const row = node('div', null, 'question-row'), input = node('input'); input.value = question; input.maxLength = 500; input.setAttribute('aria-label', `Open question ${index + 1}`);
    input.addEventListener('input', () => { state.plan.openQuestions[index] = input.value; invalidate(); });
    row.append(input, removeButton('Resolved ✓', () => { state.plan.openQuestions.splice(index, 1); invalidate(); renderRows(); })); return row;
  }));
  if (!state.plan.openQuestions.length) $('questions').append(node('p', 'No open questions recorded. Check the review notes above.', 'field-help'));
  $('tasks').replaceChildren(...state.plan.tasks.map((task, index) => {
    const row = node('div', null, 'task-row'), grid = node('div', null, 'row-grid');
    row.append(inputField(`Task ${index + 1}`, task.label, value => { task.label = value; }));
    grid.append(inputField('Owner (optional)', task.owner, value => { task.owner = value || null; }, { maxLength: 150, ariaLabel: `Task ${index + 1} owner`, placeholder: 'Unassigned' }), inputField('Due date (optional)', task.dueDate, value => { task.dueDate = value || null; }, { type: 'date', ariaLabel: `Task ${index + 1} due date` }), removeButton('Remove task', () => { state.plan.tasks.splice(index, 1); invalidate(); renderRows(); })); row.append(grid); return row;
  }));
  $('budget').replaceChildren(...state.plan.budget.map((item, index) => {
    const row = node('div', null, 'budget-row'), grid = node('div', null, 'row-grid');
    row.append(inputField(`Item ${index + 1}`, item.label, value => { item.label = value; }, { maxLength: 200 }));
    grid.append(inputField('Quantity', item.quantity, value => { item.quantity = /^\d+$/.test(value) ? Number(value) : null; }, { type: 'number', min: 1, step: 1, inputMode: 'numeric', ariaLabel: `Item ${index + 1} quantity` }), inputField(`Unit price (${state.plan.currency})`, item.unitCostMinor == null ? '' : (item.unitCostMinor / 100).toFixed(2), value => {
      // Parse decimal text without floating-point currency arithmetic.
      if (value === '') item.unitCostMinor = null;
      else if (/^\d+(\.\d{1,2})?$/.test(value)) { const [whole, fraction = ''] = value.split('.'); item.unitCostMinor = Number(whole) * 100 + Number(fraction.padEnd(2, '0')); }
      else item.unitCostMinor = -1;
    }, { type: 'number', min: 0, step: '0.01', inputMode: 'decimal', ariaLabel: `Item ${index + 1} unit price (${state.plan.currency})` }), removeButton('Remove item', () => { state.plan.budget.splice(index, 1); invalidate(); renderRows(); })); row.append(grid); return row;
  }));
}
function renderPack() {
  const exists = Boolean(state.plan); $('empty-state').hidden = exists; $('pack-editor').hidden = !exists; $('clarify-section').hidden = !exists;
  renderView();
  renderSavedPacks();
  if (!exists) return;
  $('pack-heading').textContent = state.plan.title;
  const p = state.provenance;
  $('provenance').textContent = p?.mode === 'sample' ? 'SAMPLE DATA · Hand-authored example. No AI call was made.' : p?.mode === 'live' ? `Generated with ${p.model} · ${new Date(p.generatedAt).toLocaleString()} · ${(p.durationMs / 1000).toFixed(1)} seconds · Human edits may follow.` : 'Restored working draft · Review all details.';
  document.querySelectorAll('[data-field]').forEach(input => { input.value = state.plan[input.dataset.field] ?? ''; });
  document.querySelectorAll('[data-draft]').forEach(input => { input.value = state.plan.drafts[input.dataset.draft]; });
  renderRows(); refreshReview();
}
document.querySelectorAll('[data-field]').forEach(input => input.addEventListener('input', () => {
  if (!state.plan) return;
  state.plan[input.dataset.field] = input.value || (input.dataset.field === 'title' || input.dataset.field === 'currency' ? '' : null);
  if (input.dataset.field === 'currency') state.plan.currency = input.value.toUpperCase();
  if (input.dataset.field === 'title') $('pack-heading').textContent = input.value || 'Untitled event';
  invalidate();
}));
document.querySelectorAll('[data-draft]').forEach(input => input.addEventListener('input', () => { state.plan.drafts[input.dataset.draft] = input.value; invalidate(); }));
$('request').addEventListener('input', () => { if (state.plan) invalidate(); else save(); });
$('answers').addEventListener('input', save);
$('review-confirm').addEventListener('change', () => { if (review) renderReview(); });
$('add-question').addEventListener('click', () => { if (state.plan.openQuestions.length >= 50) return announce('This pack already has 50 questions. Resolve existing ones first.'); state.plan.openQuestions.push(''); invalidate(); renderRows(); });
$('add-task').addEventListener('click', () => { if (state.plan.tasks.length >= 100) return announce('The checklist can hold up to 100 tasks.'); state.plan.tasks.push({ label: '', owner: null, dueDate: null }); invalidate(); renderRows(); });
$('add-budget').addEventListener('click', () => { if (state.plan.budget.length >= 100) return announce('The budget can hold up to 100 items.'); state.plan.budget.push({ label: '', quantity: 1, unitCostMinor: null }); invalidate(); renderRows(); });
function setBusy(value) {
  busy = value;
  document.querySelectorAll('#pack-editor input, #pack-editor textarea, #pack-editor select, #pack-editor button').forEach(input => { input.disabled = value; });
  $('request').disabled = value; $('answers').disabled = value; $('refine-consent').disabled = value; $('generate').disabled = value || !liveAvailable; $('refine').disabled = value || !liveAvailable; $('sample').disabled = value; $('reset').disabled = value;
  $('saved-name').disabled = value; renderSavedPacks();
  $('cancel').hidden = !value; $('cancel-refine').hidden = !value; $('generate').textContent = value ? 'Preparing with Gemma…' : 'Prepare my event pack ↗';
  if (!value && review) renderReview(); else $('approve').disabled = true;
}
async function generate(refine = false) {
  if (busy) return;
  if (refine) {
    if (!$('answers').value.trim()) return announce('Add the confirmations or changes you want Gemma to apply.');
    if (!$('refine-consent').checked) return announce('Confirm that this update can be sent to Google.');
  } else if (!$('request-form').reportValidity()) return;
  if (!refine && state.plan && !confirm(collection.activeId ? 'Prepare a new pack? Your named pack will stay in Saved Packs.' : 'Replace the current unnamed pack? Save it with a name first if you want to keep editing it.')) return;
  clearTimeout(timer); revision++; setBusy(true); announce('Gemma is preparing the pack. Your previous draft stays safe until a valid reply arrives.'); controller = new AbortController();
  try {
    const result = await api('/api/generate', { request: $('request').value, answers: refine ? $('answers').value : '', previousPlan: refine ? state.plan : null }, controller.signal);
    if (!refine) collection = { ...collection, activeId: null };
    state.plan = result.plan; state.provenance = result.provenance; state.approval = null; review = result; $('review-confirm').checked = false; $('refine-consent').checked = false; $('answers').value = ''; save(); renderPack();
    announce('Pack prepared. Compare the details with your notes, then review every section.'); activate(tabs[0]); switchView('pack', false, true);
  } catch (error) { announce(error.name === 'AbortError' ? 'Generation cancelled. Your previous draft has been kept.' : error.message); }
  finally { controller = null; setBusy(false); }
}
$('request-form').addEventListener('submit', event => { event.preventDefault(); generate(); });
$('refine').addEventListener('click', () => generate(true));
$('cancel').addEventListener('click', () => controller?.abort());
$('cancel-refine').addEventListener('click', () => controller?.abort());
async function sample() {
  if (busy) return;
  if (state.plan && !confirm(collection.activeId ? 'Open the sample? Your named pack will stay in Saved Packs.' : 'Replace the current unnamed pack with the labelled sample? Save it with a name first if needed.')) return;
  try {
    const result = await api('/api/sample'); clearTimeout(timer); revision++;
    collection = { ...collection, activeId: null };
    state = { request: 'SAMPLE: School Family Day on Friday, 23 October 2026, at the school assembly hall. Prepare invitations and a run of show, with 50 refreshment packs and 50 printed programmes. Prices and start time are not supplied.', answers: '', plan: result.plan, approval: null, provenance: result.provenance };
    $('request').value = state.request; $('answers').value = ''; $('review-confirm').checked = false; $('refine-consent').checked = false; save(); renderPack(); announce('Sample workspace opened. This is hand-authored data, with no AI call. You can edit, review, and export it.'); activate(tabs[0]); switchView('pack');
  } catch (error) { announce(error.message); }
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
    const blob = await response.blob(), url = URL.createObjectURL(blob), a = node('a'); a.href = url; a.download = (state.provenance?.mode === 'sample' ? 'sample-' : '') + (format === 'csv' ? 'flow-point-budget.csv' : `flow-point-pack.${format}`); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Download started. The pack includes its review status; the CSV is a budget worksheet.');
  } catch (error) { announce(error.message || 'Download failed. Please retry.'); }
  finally { button.disabled = false; }
}
$('export-pdf').addEventListener('click', () => download('pdf')); $('export-md').addEventListener('click', () => download('md')); $('export-csv').addEventListener('click', () => download('csv'));
$('reset').addEventListener('click', () => {
  if ((state.plan || state.request.trim()) && !collection.activeId && !confirm('Start a blank pack? The current unnamed work will be replaced. Save it with a name first if needed.')) return;
  if (busy) return;
  if (loadCurrent(newWorkspace(collection), 'Blank workspace ready. Your named packs remain available.')) $('consent').checked = false;
});
async function init() {
  try {
    const stored = localStorage.getItem(storageKey), legacy = localStorage.getItem(legacyKey);
    collection = restoreCollection(stored?.length <= 1500000 ? stored : null, legacy?.length <= 150000 ? legacy : null);
    state = collection.current;
    if (state.plan) state.plan = (await api('/api/review', { plan: state.plan, approval: state.approval })).plan;
    $('request').value = state.request; $('answers').value = state.answers; renderPack();
    if (!stored && legacy) save();
  } catch { announce('The saved draft could not be restored. You can start a new pack or retry after reconnecting.'); }
  try { const config = await api('/api/config'); liveAvailable = config.liveAvailable; $('model-state').textContent = liveAvailable ? `Live drafting · ${config.model}` : 'Live Gemma is not connected yet. The sample workspace is available.'; }
  catch { $('model-state').textContent = 'Cannot reach the app server. Please reconnect and reload.'; }
  $('generate').disabled = !liveAvailable; $('refine').disabled = !liveAvailable;
}
init();
