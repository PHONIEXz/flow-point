import { providerSettings, processorName, modelLabel, checkGroqAccess, googleDiagnosticEnabled } from './providers.mjs';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { reviewPlan, approvePlan, isApproved } from './plan.mjs';
import { budgetCsv, preparationPack } from './export.mjs';
import { preparationPdf, pdfSections } from './pdf.mjs';
import { generatePack, checkModelAccess, probeGeneration, fetchModelResponse, MODEL_RESPONSE_TIMEOUT_MS, AppError } from './gemma.mjs';

const publicRoot = new URL('../dist/', import.meta.url);
const routes = { '/': 'index.html', '/workspace': 'workspace.html', '/workspace/': 'workspace.html', '/workspace/pack': 'workspace.html', '/workspace/pack/': 'workspace.html', '/styles.css': 'styles.css', '/organization.css': 'organization.css', '/judge.js': 'judge.js', '/app.js': 'app.js', '/workspace.css': 'workspace.css', '/workspace.js': 'workspace.js', '/theme.css': 'theme.css', '/theme.js': 'theme.js', '/pack-store.mjs': 'pack-store.mjs', '/download-name.mjs': 'download-name.mjs', '/money.mjs': 'money.mjs', '/generation.mjs': 'generation.mjs', '/source-fields.mjs': 'source-fields.mjs', '/update-history.mjs': 'update-history.mjs', '/letter-layout.mjs': 'letter-layout.mjs', '/judge-example.json': 'judge-example.json', '/judge': 'judge.html', '/icon.svg': 'icon.svg', '/sample-pack.md': 'sample-pack.md', '/sample-pack.pdf': 'sample-pack.pdf' };
const mime = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', json: 'application/json; charset=utf-8', svg: 'image/svg+xml', md: 'text/markdown; charset=utf-8', pdf: 'application/pdf' };
function json(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); }
async function body(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new AppError(415, 'Send JSON data.');
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > 300000) throw new AppError(413, 'This pack is too large. Please shorten it.'); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AppError(400, 'Invalid JSON data.'); }
}
export function createApp(options = {}) {
  const configured = providerSettings();
  const {provider = configured.provider, apiKey = configured.apiKey, model = options.provider && options.provider !== configured.provider ? (options.provider==='groq'?'openai/gpt-oss-120b':'gemma-4-26b-a4b-it') : configured.model, fetchImpl = fetchModelResponse, log = entry => console.info(JSON.stringify(entry))} = options;
  let active = 0;
  const limits = new Map();
  const approved = new Map(); // Review state, not user identity. Forgotten on restart.
  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    res.setHeader('Cache-Control', 'no-store');
    let pathname = '';
    const requestId = randomUUID();
    const started = Date.now();
    let action = 'prepare';
    res.setHeader('X-Request-ID', requestId);
    try {
      try { pathname = new URL(req.url, 'http://local').pathname; }
      catch { throw new AppError(400, 'Invalid request URL.'); }
      if (req.method === 'GET' && pathname === '/healthz') return json(res, 200, { status: 'ok' });
      if (req.method === 'GET' && pathname === '/api/config') return json(res, 200, { liveAvailable: Boolean(apiKey), provider, processor:processorName(provider), modelLabel:modelLabel(provider), model, storage: 'browser-local', generationTimeoutMs: MODEL_RESPONSE_TIMEOUT_MS });
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
          if ((provider === 'groq' || data.processingProvider) && data.processingProvider !== provider) throw new AppError(409, 'The AI processor changed. Reload the page and review the processing choice before generating.');
          action = data.previousPlan ? 'update' : 'prepare';
          const previousPlan = data.previousPlan ? reviewPlan(data.previousPlan).plan : null;
          // Per-process global quota/concurrency caps also protect deployments behind a proxy.
          const now = Date.now(), bucket = Math.floor(now / 600000);
          for (const key of limits.keys()) if (key !== bucket) limits.delete(key);
          if ((limits.get(bucket) || 0) >= 30 || active >= 2) throw new AppError(429, 'Flow Point is busy. Please wait a moment and retry.');
          limits.set(bucket, (limits.get(bucket) || 0) + 1);
          const controller = new AbortController();
          res.on('close', () => { if (!res.writableEnded) controller.abort(); });
          active++;
          log({ event: 'generation_request_started', requestId, action, provider, model });
          try {
            const result = await generatePack({ request: data.request, answers: data.answers, previousPlan, invitationStyle: data.invitationStyle || 'formal', stage: data.stage ?? null, checkpoint: data.checkpoint }, { apiKey, provider, model, fetchImpl, signal: controller.signal, requestId, action, log });
            log({ event: 'generation_request_succeeded', requestId, action, model: result.provenance.model, attempts: result.provenance.attempts, durationMs: Date.now() - started });
            return json(res, 200, { ...result, requestId });
          }
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
        const format = data.format === 'csv' ? 'csv' : data.format === 'pdf' ? 'pdf' : 'md';
        const section = data.section ?? null;
        if (section !== null && (format !== 'pdf' || !Object.hasOwn(pdfSections, section))) throw new AppError(400, 'Choose a valid document section and PDF format.');
        const sectionLabel = section ? pdfSections[section] : null;
        const sectionSlug = sectionLabel?.toLowerCase().replaceAll(' ', '-');
        const slug = review.plan.title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72).replace(/-$/, '') || 'event';
        const status = isApproved(review.plan, approval) ? 'approved' : 'draft';
        const stamp = new Date().toISOString().replace(/[-:.]/g, '');
        const filename = `${data.sample === true ? 'sample-' : ''}${slug}-${review.plan.eventDate || 'date-to-confirm'}-${sectionSlug || (format === 'csv' ? 'budget' : 'pack')}-${status}-${stamp}-${randomUUID().slice(0, 8)}.${format}`;
        // Keep the event's capitalization and spacing in the PDF download name.
        // Windows-reserved characters and control characters cannot be file names.
        let pdfTitle = review.plan.title.toWellFormed().normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '-').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '');
        if (!pdfTitle || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(pdfTitle)) pdfTitle = 'Event ' + pdfTitle;
        let boundedTitle = '';
        for (const character of pdfTitle) { if (Buffer.byteLength(boundedTitle + character, 'utf8') > 170) break; boundedTitle += character; }
        const pdfName = `${data.sample === true ? 'SAMPLE - ' : ''}${boundedTitle.trim().replace(/[. ]+$/, '') || 'Event'}${sectionLabel ? ' - ' + sectionLabel + (status === 'draft' ? ' - Draft' : '') : ''} - ${stamp}-${randomUUID().slice(0, 8)}.pdf`;
        const encodedPdfName = encodeURIComponent(pdfName).replace(/['()*]/g, char => '%' + char.charCodeAt(0).toString(16).toUpperCase());
        const attachment = `attachment; filename="${filename}"${format === 'pdf' ? `; filename*=UTF-8''${encodedPdfName}` : ''}`;

        if (data.format === 'pdf') {
          const pdf = await preparationPdf(review.plan, approval, { sample: data.sample === true, section });
          res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': attachment });
          return res.end(pdf);
        }
        if (data.format === 'csv') { res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': attachment }); return res.end(budgetCsv(review.plan)); }
        res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': attachment });
        return res.end((data.sample === true ? 'SAMPLE DATA: no AI inference was performed.\n\n' : '') + preparationPack(review.plan, approval));
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw new AppError(405, 'Method not allowed.');
      const file = routes[pathname];
      if (!file) throw new AppError(404, 'Page not found.');
      let content = await readFile(new URL(file, publicRoot));
      if (file === 'workspace.html' && pathname.startsWith('/workspace/pack')) content = Buffer.from(content.toString().replace('class="workspace-body"', 'class="workspace-body pack-page"'));
      if(file.endsWith('.html')) content = Buffer.from(content.toString().replaceAll('__AI_PROCESSOR__',processorName(provider)).replaceAll('__AI_MODEL_LABEL__',modelLabel(provider)));
      res.writeHead(200, { 'Content-Type': mime[file.split('.').pop()], ...(file === 'sample-pack.pdf' ? { 'Content-Disposition': `attachment; filename="SAMPLE - School Family Day - ${Date.now()}-${randomUUID().slice(0, 8)}.pdf"` } : {}) }); res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      const status = error instanceof AppError ? error.status : error.code === 'ENOENT' ? 404 : 400;
      if (pathname === '/api/generate') log({ event: 'generation_request_failed', requestId, action, httpStatus: status, code: error instanceof AppError ? error.code : 'VALIDATION_ERROR', durationMs: Date.now() - started });
      if (res.destroyed || res.writableEnded) return;
      // Never return upstream response bodies, prompts, or credentials.
      if(error instanceof AppError && error.code==='PROVIDER_QUOTA' && error.retryAfterSeconds) res.setHeader('Retry-After',String(error.retryAfterSeconds));
      json(res, status, { requestId, ...(error instanceof AppError && error.code==='PROVIDER_QUOTA'?{quotaWindow:error.quotaWindow,retryAfterSeconds:error.retryAfterSeconds}:{}), code: error instanceof AppError ? error.code : 'VALIDATION_ERROR', error: error instanceof AppError ? error.message : status === 404 ? 'Page not found. Run the build before starting the server.' : 'This plan could not be validated. Check the fields and try again.' });
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createApp();
  const settings=providerSettings();
  (settings.provider==='groq' ? checkGroqAccess({...settings,fetchImpl:fetchModelResponse}) : checkModelAccess(settings)).then(result => console.info(JSON.stringify(result)));
  if (googleDiagnosticEnabled(process.env.GEMMA_DIAGNOSTIC_UNTIL)) {
    if(settings.provider !== 'google') checkModelAccess({apiKey:process.env.GEMINI_API_KEY,model:process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it',fetchImpl:fetchModelResponse}).then(result=>console.info(JSON.stringify(result)));
    probeGeneration({ apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it' }).catch(() => console.info(JSON.stringify({ event: 'gemma_diagnostic_probe', failed: true })));
  }
  const portIndex = process.argv.indexOf('--port');
  const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 3000);
  server.listen(port, '0.0.0.0', () => console.log(`Flow Point listening on port ${port}`));
  process.on('SIGTERM', () => { server.close(); setTimeout(() => process.exit(0), 10000).unref(); });
}
