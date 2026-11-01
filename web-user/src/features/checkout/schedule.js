// Delivery time for pre-order items. The server only requires a time in the future;
// the lead time below is a UI default so people don't pick "in 3 minutes".

export const MIN_LEAD_MINUTES = 60;
const STEP_MINUTES = 5;

const pad = n => String(n).padStart(2, '0');

// <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm"
export function toLocalInputValue(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// earliest allowed time: now + lead, rounded UP to the next 5 minutes
export function minScheduleDate(now = new Date(), leadMinutes = MIN_LEAD_MINUTES) {
  const ms = STEP_MINUTES * 60 * 1000;
  const t = new Date(now).getTime() + leadMinutes * 60 * 1000;
  return new Date(Math.ceil(t / ms) * ms);
}

// -> { ok: true, iso } | { ok: false, error: 'required' | 'invalid' | 'tooSoon' }
export function parseScheduleInput(value, now = new Date(), leadMinutes = MIN_LEAD_MINUTES) {
  if (!value) return { ok: false, error: 'required' };
  const d = new Date(value); // a local date-time string is parsed as local time
  if (Number.isNaN(d.getTime())) return { ok: false, error: 'invalid' };
  if (d.getTime() < new Date(now).getTime() + leadMinutes * 60 * 1000) return { ok: false, error: 'tooSoon' };
  return { ok: true, iso: d.toISOString() };
}
