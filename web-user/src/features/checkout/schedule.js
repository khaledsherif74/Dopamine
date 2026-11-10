export const MIN_LEAD_MINUTES = 60;
const STEP_MINUTES = 5;

const pad = (n) => String(n).padStart(2, "0");

export function toLocalInputValue(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function minScheduleDate(
  now = new Date(),
  leadMinutes = MIN_LEAD_MINUTES,
) {
  const ms = STEP_MINUTES * 60 * 1000;
  const t = new Date(now).getTime() + leadMinutes * 60 * 1000;
  return new Date(Math.ceil(t / ms) * ms);
}

export function parseScheduleInput(
  value,
  now = new Date(),
  leadMinutes = MIN_LEAD_MINUTES,
) {
  if (!value) return { ok: false, error: "required" };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { ok: false, error: "invalid" };
  if (d.getTime() < new Date(now).getTime() + leadMinutes * 60 * 1000)
    return { ok: false, error: "tooSoon" };
  return { ok: true, iso: d.toISOString() };
}
