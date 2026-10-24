// Opt-in hosted regression, not independent evaluation or an npm test/build step.
import { readFile, writeFile } from 'node:fs/promises';
import { EnvHttpProxyAgent, fetch } from 'undici';
import { prepareInStages } from '../public/generation.mjs';
import { reviewPlan } from '../src/plan.mjs';
import { setTimeout as pause } from 'node:timers/promises';
if (!process.argv.includes('--live')) throw new Error('Pass --live for real hosted inference.');
const site = 'https://flowpoint.phoenixreborn.tech';
const fixture = JSON.parse(await readFile(new URL('../docs/evidence/chunk-1-community-fixture-2026-10-24.json', import.meta.url), 'utf8'));
const output = new URL('../docs/evidence/chunk-1-community-live-2026-10-24.json', import.meta.url);
const dispatcher = new EnvHttpProxyAgent({ headersTimeout: 450000, bodyTimeout: 450000 });
const report = { testedAt: new Date().toISOString(), site, scope: 'Exposed Chunk 1 regression. Fictional fixture written after the prompt change, not an unseen evaluation. Generation wall time excludes the explicit 60-second gap between operations; human review and exports measured separately.', cooldownBeforeUpdateMs: 60000, runs: [] };
let previousPlan = null;
try {
  for (const action of ['prepare', 'update']) {
    if (action === 'update') await pause(60000);
    const row = { action, steps: [], startedAt: new Date().toISOString() }; const start = Date.now();
    try {
      const result = await prepareInStages({ request: fixture.request, answers: action === 'update' ? fixture.answers : '', previousPlan }, { call: async data => {
        const response = await fetch(site + '/api/generate', { dispatcher, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(435000) });
        const value = await response.json(); row.steps.push({ stage: data.stage, httpStatus: response.status, requestId: value.requestId, provenance: value.provenance, code: value.code });
        if (!response.ok) throw new Error(value.error || 'Generation failed'); return value;
      } });
      const r = reviewPlan(result.plan), p = r.plan, updated = action === 'update';
      const checks = {
        limit: p.spendingLimitMinor === 50000,
        costs: r.knownTotalMinor === (updated ? 34750 : 32250),
        allowance: r.remainingAllowanceMinor === (updated ? 15250 : 17750),
        provisional: r.allowanceProvisional === !updated,
        unknownPrices: p.budget.filter(x => x.unitCostMinor === null).length === (updated ? 0 : 1),
        timeChecks: !r.issues.some(x => ['INVITATION_TIME', 'SCHEDULE_TIME'].includes(x.code)),
        start: p.startTime === '14:15',
        pendingRehearsal: p.openQuestions.some(q => /rehearsal/i.test(q) && /time|approv/i.test(q)),
        namedDuties: ['ada nwosu', 'david cole'].every(name => p.tasks.some(t => (t.owner || '').toLowerCase().includes(name))),
        durations: [10,30,5].every(n => new RegExp(`\\b${n}\\s*(?:minutes?|mins?)\\b`, 'i').test(p.drafts.schedule)),
        venue: p.venue === (updated ? 'Cedar Library Hall' : 'Cedar Hall'),
        approvalBlocked: r.issues.length > 0
      };
      Object.assign(row, { completed: true, checks, checksPassed: Object.values(checks).every(Boolean), result }); previousPlan = p;
    } catch(error) { Object.assign(row, { completed: false, error: error.message }); }
    row.wallMs = Date.now() - start; report.runs.push(row);
    await writeFile(output, JSON.stringify(report,null,2) + '\n');
    console.log(JSON.stringify({ action, completed: row.completed, checks: row.checks, wallMs: row.wallMs, error: row.error }));
    if (!row.completed) break;
  }
} finally { await dispatcher.close(); }
report.summary = { planned: 2, attempted: report.runs.length, completed: report.runs.filter(r => r.completed).length, checksPassed: report.runs.filter(r => r.checksPassed).length };
await writeFile(output,JSON.stringify(report,null,2) + '\n');
if(report.summary.checksPassed !== 2) process.exitCode = 1;
