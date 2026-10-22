import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { preparationPack } from '../src/export.mjs';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
// Existing Render services may still run the earlier build command without
// an install step. Bootstrap pinned dependencies once, before tests import PDFKit.
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const missing = Object.entries(manifest.dependencies || {}).some(([name, version]) => {
  try { return JSON.parse(readFileSync(new URL(`node_modules/${name}/package.json`, root), 'utf8')).version !== version; } catch { return true; }
});
if (missing) execFileSync('npm', ['ci', '--ignore-scripts'], { cwd: fileURLToPath(root), stdio: 'inherit' });
const output = new URL('dist/', root);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL('public/', root), output, { recursive: true });
const sample = JSON.parse(await readFile(new URL('examples/school-event.json', root), 'utf8'));
await writeFile(new URL('sample-pack.md', output), 'SAMPLE DATA: hand-authored fixture. No AI inference was performed.\n\n' + preparationPack(sample));
console.log('Built Flow Point client assets and sample pack in dist/.');
