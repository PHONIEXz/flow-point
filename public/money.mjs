// Keep the minor-unit remainder intact instead of rounding a floating quotient.
export function minorToDecimal(minor) {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error('Invalid money amount');
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, '0')}`;
}
export function formatMinor(minor) {
  const [whole, fraction] = minorToDecimal(minor).split('.');
  return `${Number(whole).toLocaleString('en-NG')}.${fraction}`;
}
