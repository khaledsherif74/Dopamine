export const MAX_CANNED = 30;
export const MAX_TITLE = 40;
export const MAX_BODY = 1000;

const clean = (r) => ({
  id: r.id,
  title: r.title.trim().slice(0, MAX_TITLE),
  body: r.body.trim().slice(0, MAX_BODY),
});
const usable = (r) =>
  r &&
  typeof r === "object" &&
  typeof r.id === "string" &&
  r.id &&
  typeof r.title === "string" &&
  typeof r.body === "string" &&
  r.title.trim() &&
  r.body.trim();

export function normalizeCanned(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const r of raw) {
    if (!usable(r) || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(clean(r));
    if (out.length === MAX_CANNED) break;
  }
  return out;
}

function validate({ title = "", body = "" }) {
  const errors = {};
  const t = String(title).trim();
  const b = String(body).trim();
  if (!t) errors.title = "canned.errors.titleRequired";
  else if (t.length > MAX_TITLE) errors.title = "canned.errors.titleTooLong";
  if (!b) errors.body = "canned.errors.bodyRequired";
  else if (b.length > MAX_BODY) errors.body = "canned.errors.bodyTooLong";
  return { errors, value: { title: t, body: b } };
}

const randomId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function addCanned(list, input, makeId = randomId) {
  const { errors, value } = validate(input);
  if (Object.keys(errors).length) return { ok: false, list, errors };
  if (list.length >= MAX_CANNED)
    return { ok: false, list, errors: { title: "canned.errors.limit" } };
  return { ok: true, list: [...list, { id: makeId(), ...value }], errors: {} };
}

export function updateCanned(list, id, input) {
  const { errors, value } = validate(input);
  if (Object.keys(errors).length) return { ok: false, list, errors };
  if (!list.some((r) => r.id === id))
    return { ok: false, list, errors: { title: "canned.errors.notFound" } };
  return {
    ok: true,
    list: list.map((r) => (r.id === id ? { id, ...value } : r)),
    errors: {},
  };
}

export const removeCanned = (list, id) =>
  list.some((r) => r.id === id) ? list.filter((r) => r.id !== id) : list;

export function filterCanned(list, query) {
  const q = String(query ?? "")
    .trim()
    .toLowerCase();
  if (!q) return list;
  return list.filter(
    (r) =>
      r.title.toLowerCase().includes(q) || r.body.toLowerCase().includes(q),
  );
}
