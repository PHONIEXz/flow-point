import { previousVersion } from './update-history.mjs';
export const legacyKey = 'flow-point-workspace-v1';
export const storageKey = 'flow-point-workspace-v2';
export const maxPacks = 12;
export const maxStoredCharacters = 1500000;

export function emptyWorkspace() {
  return { invitationStyle: 'formal', request: '', answers: '', plan: null, approval: null, provenance: null };
}

function copy(value) { return JSON.parse(JSON.stringify(value)); }
function restoreWorkspace(value) {
  const result = copy(value);
  if (result.previousVersion) {
    result.previousVersion = previousVersion(result.previousVersion);
    if (!result.previousVersion) result.historyUnavailable = true;
  }
  return result;
}
function validWorkspace(value) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    typeof value.request === 'string' && value.request.length <= 12000 &&
    typeof value.answers === 'string' && value.answers.length <= 8000 &&
    (value.plan === null || (value.plan && typeof value.plan === 'object' && !Array.isArray(value.plan)));
}

export function restoreCollection(raw, legacyRaw) {
  let value;
  try { value = raw ? JSON.parse(raw) : null; } catch { value = null; }
  if (value && validWorkspace(value.current) && Array.isArray(value.packs)) {
    const packs = value.packs.filter(item => item && typeof item.id === 'string' &&
      typeof item.name === 'string' && item.name.trim() && item.name.length <= 80 &&
      validWorkspace(item.workspace)).slice(0, maxPacks).map(item => ({ ...copy(item), workspace: restoreWorkspace(item.workspace) }));
    const activeId = packs.some(item => item.id === value.activeId) ? value.activeId : null;
    return { current: restoreWorkspace(value.current), packs, activeId };
  }
  try { value = legacyRaw ? JSON.parse(legacyRaw) : null; } catch { value = null; }
  return { current: validWorkspace(value) ? restoreWorkspace(value) : emptyWorkspace(), packs: [], activeId: null };
}

export function recordCurrent(collection, workspace, now = new Date().toISOString()) {
  const current = copy(workspace);
  const packs = collection.packs.map(item => item.id === collection.activeId ?
    { ...item, updatedAt: now, workspace: copy(current) } : item);
  return { current, packs, activeId: collection.activeId };
}

export function saveNamed(collection, workspace, name, id, now = new Date().toISOString()) {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  if (!workspace.plan) throw new Error('Prepare or open a pack before saving it.');
  if (!cleanName || cleanName.length > 80) throw new Error('Give this pack a name under 80 characters.');
  if (collection.packs.length >= maxPacks) throw new Error(`This browser can hold ${maxPacks} named packs. Download a copy before removing one.`);
  if (collection.packs.some(item => item.name.toLowerCase() === cleanName.toLowerCase())) throw new Error('That name is already used. Choose another.');
  const current = copy(workspace);
  return { current, activeId: id, packs: [{ id, name: cleanName, updatedAt: now, workspace: copy(current) }, ...collection.packs] };
}

export function renameNamed(collection, id, name) {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  if (!cleanName || cleanName.length > 80) throw new Error('Give this pack a name under 80 characters.');
  if (collection.packs.some(item => item.id !== id && item.name.toLowerCase() === cleanName.toLowerCase())) throw new Error('That name is already used. Choose another.');
  if (!collection.packs.some(item => item.id === id)) throw new Error('Saved pack not found.');
  return { ...collection, packs: collection.packs.map(item => item.id === id ? { ...item, name: cleanName } : item) };
}

export function openNamed(collection, id) {
  const selected = collection.packs.find(item => item.id === id);
  if (!selected) throw new Error('Saved pack not found.');
  return { ...collection, current: copy(selected.workspace), activeId: id };
}

export function removeNamed(collection, id) {
  return { ...collection, packs: collection.packs.filter(item => item.id !== id), activeId: collection.activeId === id ? null : collection.activeId };
}

export function newWorkspace(collection) {
  return { ...collection, current: emptyWorkspace(), activeId: null };
}

export function serializeCollection(collection) {
  const json = JSON.stringify(collection);
  if (json.length > maxStoredCharacters) throw new Error('Browser storage is full. Download a pack and remove an old saved copy.');
  return json;
}
