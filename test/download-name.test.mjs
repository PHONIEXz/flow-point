import test from 'node:test';
import assert from 'node:assert/strict';
import { downloadFilename } from '../public/download-name.mjs';

test('browser download names preserve UTF-8 titles and safely handle malformed headers', () => {
  const fallback = 'fallback.pdf';
  assert.equal(downloadFilename("attachment; filename=\"old.pdf\"; filename*=UTF-8''%C3%89cole%20%E1%BB%8Cm%E1%BB%8D.pdf", 'pdf', fallback), 'École Ọmọ.pdf');
  for (const encoded of ['..%2F..%5C..%00evil.txt', 'unsafe%0Aname.pdf', '%E0%A4%A', 'wrong.txt', 'CON.pdf', 'x'.repeat(260) + '.pdf', '%E2%80%AEevil.pdf']) {
    assert.equal(downloadFilename("attachment; filename*=UTF-8''" + encoded, 'pdf', fallback), fallback);
  }
  assert.equal(downloadFilename("attachment; filename=\"safe.pdf\"; filename*=UTF-8''bad%00.pdf", 'pdf', fallback), 'safe.pdf');
  assert.equal(downloadFilename('attachment; filename="../unsafe.pdf"', 'pdf', fallback), fallback);
  assert.equal(downloadFilename('', 'pdf', fallback), fallback);
  assert.equal(downloadFilename('attachment; filename="budget.csv"', 'csv', 'fallback.csv'), 'budget.csv');
});
