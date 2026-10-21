'use strict';
const $ = id => document.getElementById(id);
const storageKey = 'flow-point-workspace-v1';
let state = { request: '', answers: '', plan: null, approval: null, provenance: null };
let review = null, revision = 0, timer, controller, busy = false, liveAvailable = false;
const tabs = [...document.querySelectorAll('[role=tab]')];
function announce(message) { $('notice').textContent = message; $('notice').hidden = !message; }
function save() {
  state.request = $('request').value; state.answers = $('answers').value;
  try { localStorage.setItem(storageKey, JSON.stringify(state)); $('save-state').textContent = 'Saved on this browser'; }
  catch { $('save-state').textContent = 'Browser storage unavailable. Download your pack.'; }
}
function node(tag, text, className) { const item = document.createElement(tag); if (text != null) item.textContent = text; if (className) item.className = className; return item; }
async function api(path, data, signal) {
  const response = await fetch(path, data === undefined ? { signal } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal });
  if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || 'This action could not finish. Please retry.'); }
  return response.json();
}
function activate(tab) {
  tabs.forEach(item => { const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; $(item.getAttribute('aria-controls')).hidden = !selected; });
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
function inputField(label, value, onChange, { type = 'text', maxLength = 300, min, max, step } = {}) {
  const wrap = node('label', label), input = node('input'); input.type = type; input.value = value ?? ''; input.maxLength = maxLength;
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
    grid.append(inputField('Owner', task.owner, value => { task.owner = value || null; }, { maxLength: 150 }), inputField('Due date', task.dueDate, value => { task.dueDate = value || null; }, { type: 'date' }), removeButton('Remove task', () => { state.plan.tasks.splice(index, 1); invalidate(); renderRows(); })); row.append(grid); return row;
  }));
  $('budget').replaceChildren(...state.plan.budget.map((item, index) => {
    const row = node('div', null, 'budget-row'), grid = node('div', null, 'row-grid');
    row.append(inputField(`Item ${index + 1}`, item.label, value => { item.label = value; }, { maxLength: 200 }));
    grid.append(inputField('Quantity', item.quantity, value => { item.quantity = /^\d+$/.test(value) ? Number(value) : null; }, { type: 'number', min: 1, step: 1 }), inputField(`Unit price (${state.plan.currency})`, item.unitCostMinor == null ? '' : (item.unitCostMinor / 100).toFixed(2), value => {
      // Parse decimal text without floating-point currency arithmetic.
      if (value === '') item.unitCostMinor = null;
      else if (/^\d+(\.\d{1,2})?$/.test(value)) { const [whole, fraction = ''] = value.split('.'); item.unitCostMinor = Number(whole) * 100 + Number(fraction.padEnd(2, '0')); }
      else item.unitCostMinor = -1;
    }, { type: 'number', min: 0, step: '0.01' }), removeButton('Remove item', () => { state.plan.budget.splice(index, 1); invalidate(); renderRows(); })); row.append(grid); return row;
  }));
}
function renderPack() {
  const exists = Boolean(state.plan); $('empty-state').hidden = exists; $('pack-editor').hidden = !exists; $('clarify-section').hidden = !exists;
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
  $('request').disabled = value; $('answers').disabled = value; $('generate').disabled = value || !liveAvailable; $('refine').disabled = value || !liveAvailable; $('sample').disabled = value; $('reset').disabled = value;
  $('cancel').hidden = !value; $('generate').textContent = value ? 'Preparing with Gemma…' : 'Prepare my event pack ↗';
  if (!value && review) renderReview(); else $('approve').disabled = true;
}
async function generate(refine = false) {
  if (busy) return;
  if (!$('request-form').reportValidity()) return;
  if (refine && !$('answers').value.trim()) return announce('Add the confirmations or changes you want Gemma to apply.');
  if (!refine && state.plan && !confirm('Replace the current pack with a newly generated one? Download the current version first if you need to keep it.')) return;
  clearTimeout(timer); revision++; setBusy(true); announce('Gemma is preparing the pack. Your previous draft stays safe until a valid reply arrives.'); controller = new AbortController();
  try {
    const result = await api('/api/generate', { request: $('request').value, answers: refine ? $('answers').value : '', previousPlan: refine ? state.plan : null }, controller.signal);
    state.plan = result.plan; state.provenance = result.provenance; state.approval = null; review = result; $('review-confirm').checked = false; $('answers').value = ''; save(); renderPack();
    announce('Pack prepared. Compare the details with your request, then review every section.'); activate(tabs[0]); $('pack-heading').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { announce(error.name === 'AbortError' ? 'Generation cancelled. Your previous draft has been kept.' : error.message); }
  finally { controller = null; setBusy(false); }
}
$('request-form').addEventListener('submit', event => { event.preventDefault(); generate(); });
$('refine').addEventListener('click', () => generate(true));
$('cancel').addEventListener('click', () => controller?.abort());
async function sample() {
  if (busy) return;
  if (state.plan && !confirm('Replace the current draft with the labelled sample pack?')) return;
  try {
    const result = await api('/api/sample'); clearTimeout(timer); revision++;
    state = { request: 'SAMPLE: School Family Day on Friday, 23 October 2026, at the school assembly hall. Prepare invitations and a run of show, with 50 refreshment packs and 50 printed programmes. Prices and start time are not supplied.', answers: '', plan: result.plan, approval: null, provenance: result.provenance };
    $('request').value = state.request; $('answers').value = ''; $('review-confirm').checked = false; save(); renderPack(); announce('Sample workspace opened. This is hand-authored data, with no AI call. You can edit, review, and export it.'); activate(tabs[0]);
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
  const button = $(format === 'csv' ? 'export-csv' : 'export-md'); button.disabled = true;
  try {
    const response = await fetch('/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: state.plan, approval: state.approval, format, sample: state.provenance?.mode === 'sample' }) });
    if (!response.ok) { const data = await response.json(); throw new Error(data.error); }
    const blob = await response.blob(), url = URL.createObjectURL(blob), a = node('a'); a.href = url; a.download = (state.provenance?.mode === 'sample' ? 'sample-' : '') + (format === 'csv' ? 'flow-point-budget.csv' : 'flow-point-pack.md'); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Download started. The pack includes its review status; the CSV is a budget worksheet.');
  } catch (error) { announce(error.message || 'Download failed. Please retry.'); }
  finally { button.disabled = false; }
}
$('export-md').addEventListener('click', () => download('md')); $('export-csv').addEventListener('click', () => download('csv'));
$('reset').addEventListener('click', () => {
  if (!confirm('Clear this browser’s Flow Point request and draft? Download a copy first if you need it.')) return;
  try { localStorage.removeItem(storageKey); } catch { /* Storage may be disabled. */ }
  clearTimeout(timer); revision++; state = { request: '', answers: '', plan: null, approval: null, provenance: null }; review = null; $('request').value = ''; $('answers').value = ''; $('consent').checked = false; $('review-confirm').checked = false; renderPack(); $('pack-heading').textContent = 'A clearer next step.'; $('pack-status').textContent = 'Waiting for your request'; $('pack-status').className = 'state-badge'; $('stage-capture').classList.add('current'); $('stage-review').classList.remove('current'); $('stage-approve').classList.remove('current'); announce('Workspace cleared on this browser.');
});
async function init() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored && stored.length < 150000) {
      const saved = JSON.parse(stored);
      if (typeof saved.request === 'string' && saved.request.length <= 12000 && (saved.plan === null || typeof saved.plan === 'object')) {
        if (saved.plan) saved.plan = (await api('/api/review', { plan: saved.plan, approval: saved.approval })).plan;
        state = { request: saved.request, answers: typeof saved.answers === 'string' ? saved.answers.slice(0,8000) : '', plan: saved.plan, approval: saved.approval, provenance: saved.provenance };
      }
    }
    $('request').value = state.request; $('answers').value = state.answers; renderPack();
  } catch { announce('The saved draft could not be restored. You can start a new pack or retry after reconnecting.'); }
  try { const config = await api('/api/config'); liveAvailable = config.liveAvailable; $('model-state').textContent = liveAvailable ? `Live drafting · ${config.model}` : 'Live Gemma is not connected yet. The sample workspace is available.'; }
  catch { $('model-state').textContent = 'Cannot reach the app server. Please reconnect and reload.'; }
  $('generate').disabled = !liveAvailable; $('refine').disabled = !liveAvailable;
}
init();
