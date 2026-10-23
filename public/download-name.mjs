// Prefer RFC 5987 UTF-8 names, but reject unsafe or mismatched suggestions.
export function downloadFilename(disposition, format, fallback) {
  function safe(name) {
    return typeof name === 'string' && name.length > 0 && name === name.trim()
      && !/[<>:"/\\|?*\p{Cc}\u202a-\u202e\u2066-\u2069]/u.test(name)
      && !/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name)
      && new TextEncoder().encode(name).length <= 255
      && name.toLowerCase().endsWith('.' + format);
  }
  const encoded = disposition.match(/(?:^|;)\s*filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try { const name = decodeURIComponent(encoded); if (safe(name)) return name; } catch { /* Try the ASCII suggestion. */ }
  }
  const plain = disposition.match(/(?:^|;)\s*filename="([^"]+)"/i)?.[1];
  return safe(plain) ? plain : fallback;
}
