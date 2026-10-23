import test from 'node:test';
import assert from 'node:assert/strict';
import { minorToDecimal, formatMinor } from '../public/money.mjs';

test('browser money formatting preserves every accepted minor unit, including large totals', () => {
  for (const amount of [0, 1, 99, 100, 101, 18150000, 9007199254740990, Number.MAX_SAFE_INTEGER]) {
    const decimal = minorToDecimal(amount);
    assert.equal(BigInt(decimal.replace('.', '')), BigInt(amount));
  }
  assert.equal(minorToDecimal(9007199254740990), '90071992547409.90');
  assert.equal(formatMinor(18150000), '181,500.00');
  assert.equal(formatMinor(9007199254740990), '90,071,992,547,409.90');
  for (const invalid of [-1, 1.1, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => minorToDecimal(invalid));
});
