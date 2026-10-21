import { readFile } from 'node:fs/promises';
import { preparationPack } from '../src/export.mjs';
const example = JSON.parse(await readFile(new URL('../examples/school-event.json', import.meta.url), 'utf8'));
console.log('Example fixture only. No model inference was performed.\n');
console.log(preparationPack(example));
