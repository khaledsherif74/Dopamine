const locale = (lang) => (lang === "ar" ? "ar-EG" : "en-EG");

export function formatMoney(amount, lang = "en") {
  const n = Number(amount);
  return new Intl.NumberFormat(locale(lang), {
    style: "currency",
    currency: "EGP",
  }).format(Number.isFinite(n) ? n : 0);
}

const toDate = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function formatDate(value, lang = "en") {
  const d = toDate(value);
  return d
    ? new Intl.DateTimeFormat(locale(lang), { dateStyle: "medium" }).format(d)
    : "";
}

export function formatTime(value, lang = "en") {
  const d = toDate(value);
  return d
    ? new Intl.DateTimeFormat(locale(lang), { timeStyle: "short" }).format(d)
    : "";
}

export function formatDateTime(value, lang = "en") {
  const d = toDate(value);
  return d
    ? new Intl.DateTimeFormat(locale(lang), {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d)
    : "";
}

export function formatClock(hhmm, lang = "en") {
  if (typeof hhmm !== "string" || !/^\d{1,2}:\d{2}$/.test(hhmm)) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return new Intl.DateTimeFormat(locale(lang), { timeStyle: "short" }).format(
    d,
  );
}

export function formatRating(value, lang = "en") {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n)
    ? new Intl.NumberFormat(locale(lang), {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      }).format(n)
    : "";
}
