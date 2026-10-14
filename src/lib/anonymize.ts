/**
 * Known identifiers plus common structured PII, before transmission to AI.
 * Kept in sync with supabase/functions/_shared/anonymize.ts (duplicated because
 * one runs in the browser/Vite build and the other in the Deno edge runtime).
 */
const ACCENT_CLASSES: Record<string, string> = {
  a: 'aàáâãäAÀÁÂÃÄ',
  e: 'eèéêëEÈÉÊË',
  i: 'iìíîïIÌÍÎÏ',
  o: 'oòóôõöOÒÓÔÕÖ',
  u: 'uùúûüUÙÚÛÜ',
  c: 'cçCÇ',
  n: 'nñNÑ',
};

function toFlexiblePattern(value: string): string {
  // Normalize the identifier's own accents away first, so "José" and "Jose"
  // both expand from the same base letter and match either spelling in the text.
  const base = value.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(/[a-zA-Z]/g, (ch) => {
    const cls = ACCENT_CLASSES[ch.toLowerCase()];
    return cls ? `[${cls}]` : ch;
  });
}

export function anonymize(text: string, identifiers: (string|null|undefined)[]): string {
  let result = text;
  const names = identifiers.filter((s): s is string => !!s?.trim());
  // Also redact each individual name token (first name, surname, nickname),
  // not just an exact full-string match -- "a Maria contou que..." must be caught too.
  const tokens = names.flatMap((s) => s.split(/\s+/)).filter((t) => t.length >= 3);
  const all = [...new Set([...names, ...tokens])].sort((a, b) => b.length - a.length);
  for (const value of all) {
    const pattern = toFlexiblePattern(value);
    result = result.replace(new RegExp(`\\b${pattern}\\b`, 'g'), '[IDENTIDADE REMOVIDA]');
  }
  return result
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[EMAIL REMOVIDO]')
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF REMOVIDO]')
    .replace(/(?:\+?55\s*)?\(?\d{2}\)?[\s.-]*\d{4,5}[\s.-]*\d{4}\b/g, '[TELEFONE REMOVIDO]')
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}-?[\dxX]\b/g, '[RG REMOVIDO]')
    .replace(/\b\d{5}-?\d{3}\b/g, '[CEP REMOVIDO]')
    .replace(/\b(Rua|Av\.?|Avenida|Travessa|Alameda|Rodovia|Estrada)\s+[^\n,;.]+,?\s*\d+[a-zA-Z]?\b/gi, '[ENDEREÇO REMOVIDO]');
}
