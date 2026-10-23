import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { reviewPlan, approvePlan, isApproved } from './plan.mjs';
import { budgetCsv, preparationPack } from './export.mjs';
import { preparationPdf } from './pdf.mjs';
import { generatePack, checkModelAccess, AppError } from './gemma.mjs';

const publicRoot = new URL('../dist/', import.meta.url);
const routes = { '/': 'index.html', '/workspace': 'workspace.html', '/workspace/': 'workspace.html', '/styles.css': 'styles.css', '/app.js': 'app.js', '/workspace.css': 'workspace.css', '/workspace.js': 'workspace.js', '/pack-store.mjs': 'pack-store.mjs', '/icon.svg': 'icon.svg', '/sample-pack.md': 'sample-pack.md' };
const mime = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', svg: 'image/svg+xml', md: 'text/markdown; charset=utf-8' };
function json(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); }
async function body(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new AppError(415, 'Send JSON data.');
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > 100000) throw new AppError(413, 'This pack is too large. Please shorten it.'); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AppError(400, 'Invalid JSON data.'); }
}
export function createApp({ apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it', fetchImpl = fetch } = {}) {
  let active = 0;
  const limits = new Map();
  const approved = new Map(); // Review state, not user identity. Forgotten on restart.
  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    res.setHeader('Cache-Control', 'no-store');
    const pathname = new URL(req.url, 'http://local').pathname;
    try {
      if (req.method === 'GET' && pathname === '/healthz') return json(res, 200, { status: 'ok' });
      if (req.method === 'GET' && pathname === '/api/config') return json(res, 200, { liveAvailable: Boolean(apiKey), model, storage: 'browser-local' });
      if (req.method === 'GET' && pathname === '/api/sample') {
        const plan = JSON.parse(await readFile(new URL('../examples/school-event.json', import.meta.url), 'utf8'));
        return json(res, 200, { ...reviewPlan(plan), provenance: { mode: 'sample', model: null } });
      }
      if (pathname.startsWith('/api/')) {
        if (req.method !== 'POST') throw new AppError(405, 'Use POST for this action.');
        if (!['/api/generate', '/api/review', '/api/approve', '/api/export'].includes(pathname)) throw new AppError(404, 'Action not found.');
        // Browser requests must originate on this host. Do not trust proxy headers for origin checks.
        if (req.headers['sec-fetch-site'] === 'cross-site') throw new AppError(403, 'Open Flow Point directly to use this action.');
        if (req.headers.origin) {
          let host; try { host = new URL(req.headers.origin).host; } catch { throw new AppError(403, 'Invalid origin.'); }
          if (host !== req.headers.host) throw new AppError(403, 'Cross-site requests are not allowed.');
        }
        const data = await body(req);
        if (pathname === '/api/generate') {
          if (typeof data?.request !== 'string' || data.request.trim().length < 10 || data.request.length > 12000) throw new AppError(400, 'Describe the event using 10 to 12,000 characters.');
          if (data.answers != null && (typeof data.answers !== 'string' || data.answers.length > 8000)) throw new AppError(400, 'Clarifications must be text under 8,000 characters.');
          const previousPlan = data.previousPlan ? reviewPlan(data.previousPlan).plan : null;
          // Per-process global quota/concurrency caps also protect deployments behind a proxy.
          const now = Date.now(), bucket = Math.floor(now / 600000);
          for (const key of limits.keys()) if (key !== bucket) limits.delete(key);
          if ((limits.get(bucket) || 0) >= 30 || active >= 2) throw new AppError(429, 'Flow Point is busy. Please wait a moment and retry.');
          limits.set(bucket, (limits.get(bucket) || 0) + 1);
          const controller = new AbortController();
          res.on('close', () => { if (!res.writableEnded) controller.abort(); });
          active++;
          try { return json(res, 200, await generatePack({ request: data.request, answers: data.answers, previousPlan }, { apiKey, model, fetchImpl, signal: controller.signal })); }
          finally { active--; }
        }
        const review = reviewPlan(data.plan);
        if (pathname === '/api/review') return json(res, 200, { ...review, approved: isApproved(review.plan, data.approval) && approved.has(data.approval?.fingerprint) });
        if (pathname === '/api/approve') {
          if (data.confirmed !== true) throw new AppError(400, 'Confirm that you checked the facts and draft wording.');
          const approval = approvePlan(review.plan);
          if (approved.size >= 1000) approved.delete(approved.keys().next().value);
          approved.set(approval.fingerprint, approval);
          return json(res, 200, { approval });
        }
        const approval = data.approval && approved.get(data.approval.fingerprint);
        if (data.format === 'pdf') {
          const pdf = await preparationPdf(review.plan, approval, { sample: data.sample === true });
          res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="flow-point-pack.pdf"' });
          return res.end(pdf);
        }
        if (data.format === 'csv') { res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="flow-point-budget.csv"' }); return res.end(budgetCsv(review.plan)); }
        res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': 'attachment; filename="flow-point-pack.md"' });
        return res.end((data.sample === true ? 'SAMPLE DATA: no AI inference was performed.\n\n' : '') + preparationPack(review.plan, approval));
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw new AppError(405, 'Method not allowed.');
      const file = routes[pathname];
      if (!file) throw new AppError(404, 'Page not found.');
      const content = await readFile(new URL(file, publicRoot));
      res.writeHead(200, { 'Content-Type': mime[file.split('.').pop()] }); res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (res.destroyed || res.writableEnded) return;
      const status = error instanceof AppError ? error.status : error.code === 'ENOENT' ? 404 : 400;
      // Never return upstream response bodies, prompts, or credentials.
      json(res, status, { error: error instanceof AppError ? error.message : status === 404 ? 'Page not found. Run the build before starting the server.' : 'This plan could not be validated. Check the fields and try again.' });
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createApp();
  checkModelAccess({ apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it' }).then(result => console.info(JSON.stringify(result)));
  const portIndex = process.argv.indexOf('--port');
  const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 3000);
  server.listen(port, '0.0.0.0', () => console.log(`Flow Point listening on port ${port}`));
  process.on('SIGTERM', () => { server.close(); setTimeout(() => process.exit(0), 10000).unref(); });
}
