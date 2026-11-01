// Pure translation helpers (no React) so they are unit-testable.

const lookup = (dict, key) =>
  key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), dict);

export function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, name) =>
    params[name] === undefined || params[name] === null ? '' : String(params[name]),
  );
}

// dictionaries: { en: {...}, ar: {...} }. Falls back to English, then to the key itself.
export function translate(dictionaries, lang, key, params) {
  const hit = lookup(dictionaries[lang], key);
  const value = typeof hit === 'string' ? hit : lookup(dictionaries.en, key);
  return typeof value === 'string' ? interpolate(value, params) : key;
}

const isPlainObject = v => v && typeof v === 'object' && !Array.isArray(v);

export function mergeDictionaries(...sources) {
  const deepMerge = (a, b) => {
    const out = { ...a };
    for (const [k, v] of Object.entries(b ?? {})) {
      out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v;
    }
    return out;
  };
  const langs = new Set(sources.flatMap(s => Object.keys(s)));
  return Object.fromEntries(
    [...langs].map(lang => [lang, sources.reduce((acc, s) => deepMerge(acc, s[lang] ?? {}), {})]),
  );
}

export const SUPPORTED_LANGS = ['en', 'ar'];
export const directionOf = lang => (lang === 'ar' ? 'rtl' : 'ltr');

export function pickInitialLang(stored, navigatorLang) {
  if (SUPPORTED_LANGS.includes(stored)) return stored;
  return String(navigatorLang ?? '').toLowerCase().startsWith('ar') ? 'ar' : 'en';
}
