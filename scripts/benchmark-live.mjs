import { EnvHttpProxyAgent, fetch } from 'undici';
import { setTimeout as pace } from 'node:timers/promises';
const generationDispatcher = new EnvHttpProxyAgent({ headersTimeout: 450000, bodyTimeout: 450000 });
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { prepareInStages } from '../public/generation.mjs';
if (!process.argv.includes('--live')) throw new Error('Pass --live to authorize real hosted inference requests.');
const arg = (key, fallback) => process.argv.includes(key) ? process.argv[process.argv.indexOf(key) + 1] : fallback;
const site = arg('--site', 'http://127.0.0.1:3000').replace(/\/$/, '');
const repeats = Number(arg('--repeats', '2'));
if (!Number.isInteger(repeats) || repeats < 1 || repeats > 2) throw new Error('Use 1 or 2 repeats per case to respect the live service quota.');
const example = JSON.parse(await readFile(new URL('../public/judge-example.json', import.meta.url), 'utf8'));
const school = await readFile(new URL('../docs/school-event-test.md', import.meta.url), 'utf8');
const detailed = { request: school.split('## Initial brief\n\n')[1].split('\n## Follow-up update')[0].trim(), answers: school.split('## Follow-up update\n\n')[1].split('\n## Expected checks')[0].trim() };
const cooldownBeforeUpdateMs = process.argv.includes('--paced') ? 60000 : 0;
const report = { cooldownBeforeUpdateMs, testedAt: new Date().toISOString(), site, version: 'staged-v1', scope: 'Hosted inference and deterministic facts. Startup, manual drafting, human review, export time and the explicitly recorded cooldown between operations are excluded.', runs: [] };
const output = arg('--output', `docs/evidence/live-${Date.now()}.json`);
await mkdir(new URL('../docs/evidence/', import.meta.url), { recursive: true });
const selectedCase = arg('--case', 'all');
if (!['all', 'judge', 'detailed-school'].includes(selectedCase)) throw new Error('Choose --case all, judge or detailed-school.');
const cases = [['judge', example], ['detailed-school', detailed]].filter(([label]) => selectedCase === 'all' || label === selectedCase);
const preparedPath = arg('--prepared', null);
if (preparedPath && (cases.length !== 1 || repeats !== 1)) throw new Error('--prepared requires one selected case and one repeat.');
const prepared = preparedPath ? JSON.parse(await readFile(preparedPath, 'utf8')).plan : null;
const actions = prepared ? ['update'] : ['prepare', 'update'];
if (preparedPath) report.preparedSource = preparedPath;
let stop = false;
for (const [label, fixture] of cases) {
  for (let repeat = 1; repeat <= repeats && !stop; repeat++) {
    let previousPlan = prepared;
    for (const action of actions) {
      if (action === 'update' && !prepared && cooldownBeforeUpdateMs) await pace(cooldownBeforeUpdateMs);
      const row = { label, repeat, action, startedAt: new Date().toISOString(), steps: [] }; const started = Date.now();
      try {
        const result = await prepareInStages({ request: fixture.request, answers: action === 'update' ? fixture.answers : '', previousPlan }, {
          call: async data => {
            const begin = Date.now();
            const response = await fetch(site + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), dispatcher: generationDispatcher, signal: AbortSignal.timeout(435000) });
            const value = await response.json();
            row.steps.push({ stage: data.stage, httpStatus: response.status, wallMs: Date.now() - begin, requestId: value.requestId, provenance: value.provenance, code: value.code });
            if (!response.ok) { if (response.status === 429) stop = true; throw new Error(value.error || 'Generation failed'); }
            return value;
          }
        });
        await mkdir('tmp', { recursive: true });
        await writeFile(`tmp/verified-${label}-${repeat}-${action}.json`, JSON.stringify(result, null, 2));
        const p = result.plan, updated = action === 'update', judge = label === 'judge';
        const checks = {
          date: p.eventDate === (judge || updated ? '2026-11-21' : '2026-11-14'),
          start: p.startTime === (judge || updated ? '10:00' : null),
          money: result.knownTotalMinor === (judge ? updated ? 600000 : 400000 : updated ? 18150000 : 13750000),
          unknownPrices: p.budget.filter(x => x.unitCostMinor === null).length === (updated ? 0 : judge ? 1 : 2),
          drafts: Boolean(p.drafts.invitation.trim() && p.drafts.schedule.trim()),
          invitationStart: !p.startTime || p.drafts.invitation.includes(p.startTime),
          scheduleStart: !p.startTime || p.drafts.schedule.includes(p.startTime),
          signatoryName: (judge ? /amina\s+bello/i : /grace\s+okoro/i).test(p.signatory || ''),
          invitationSignatory: (judge ? /amina\s+bello/i : /grace\s+okoro/i).test(p.drafts.invitation),
          namedActivityLead: p.tasks.some(x => (judge ? /ada\s+okafor/i : /daniel\s+musa/i).test(x.owner || '')),
          activityDurations: (judge ? [10, 30, 20] : [10, 15, 35, 30, 20, 25]).every(n => new RegExp(`\\b${n}\\s*(?:minutes?|mins?)\\b`, 'i').test(p.drafts.schedule)),
          ...(!updated ? { pendingVenue: p.openQuestions.some(x => /room|hall|venue|booking/i.test(x)) } : {}),
          ...(updated ? { venue: /multipurpose hall/i.test(p.venue || ''), invitationVenue: /multipurpose hall/i.test(p.drafts.invitation), scheduleVenue: /multipurpose hall/i.test(p.drafts.schedule) } : {}),
          ...(!judge && updated ? { pendingRehearsalTime: p.openQuestions.some(x => /rehears/i.test(x) && /time/i.test(x)), firstAidOfficer: p.tasks.some(x => /samuel\s+eze/i.test(x.owner || '') && /first.?aid/i.test(x.label)), newRehearsalDate: p.tasks.some(x => /rehears/i.test(x.label) && x.dueDate === '2026-11-19'), noOldRehearsalDate: p.tasks.every(x => x.dueDate !== '2026-11-12'), spendingLimit: p.spendingLimitMinor === 20000000, remainingAllowance: result.remainingAllowanceMinor === 1850000 && !result.allowanceProvisional } : {})
        };
        Object.assign(row, { completed: true, checks, checksPassed: Object.values(checks).every(Boolean), provenance: result.provenance });
        previousPlan = p;
      } catch (error) { Object.assign(row, { completed: false, error: error.message }); }
      row.wallMs = Date.now() - started; report.runs.push(row);
      await writeFile(output, JSON.stringify(report, null, 2) + '\n');
      console.log(JSON.stringify(row));
      if (!row.completed || stop) break;
    }
  }
}
const times = report.runs.filter(r => r.completed).map(r => r.wallMs).sort((a, b) => a - b);
report.summary = { planned: cases.length * repeats * actions.length, skipped: cases.length * repeats * actions.length - report.runs.length, attempted: report.runs.length, completed: times.length, checksPassed: report.runs.filter(r => r.checksPassed).length, medianCompletedMs: times.length ? (times[Math.floor((times.length - 1) / 2)] + times[Math.ceil((times.length - 1) / 2)]) / 2 : null, slowestCompletedMs: times.at(-1) ?? null, stoppedOnQuota: stop };
await writeFile(output, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ output, ...report.summary }));
if (report.summary.checksPassed !== report.summary.attempted || stop) process.exitCode = 1;
