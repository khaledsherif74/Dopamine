export const RANGE_PRESETS = ["today", "7d", "30d", "month", "all"];

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const iso = (d) => d.toISOString();

export function presetRange(key, now = new Date()) {
  const today = startOfDay(now);
  const back = (days) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
  switch (key) {
    case "today":
      return { from: iso(today), to: iso(endOfDay(now)) };
    case "7d":
      return { from: iso(back(6)), to: iso(endOfDay(now)) };
    case "30d":
      return { from: iso(back(29)), to: iso(endOfDay(now)) };
    case "month":
      return {
        from: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: iso(endOfDay(now)),
      };
    default:
      return {};
  }
}

function parseDay(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  return date.getFullYear() === y &&
    date.getMonth() === mo - 1 &&
    date.getDate() === d
    ? date
    : null;
}

export function validateRange({ from = "", to = "" } = {}) {
  const a = from ? parseDay(from) : null;
  const b = to ? parseDay(to) : null;
  if ((from && !a) || (to && !b))
    return { ok: false, range: {}, error: "earnings.errors.date" };
  if (a && b && a > b)
    return { ok: false, range: {}, error: "earnings.errors.order" };
  return {
    ok: true,
    range: {
      ...(a ? { from: iso(startOfDay(a)) } : {}),
      ...(b ? { to: iso(endOfDay(b)) } : {}),
    },
    error: null,
  };
}
