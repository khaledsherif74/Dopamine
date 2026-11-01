import { describe, it, expect } from 'vitest';
import { pollUntil } from '../src/lib/poll.js';

function clock() {
  let t = 0;
  return { now: () => t, sleep: async ms => { t += ms; } };
}

describe('pollUntil', () => {
  it('returns as soon as the condition holds', async () => {
    const c = clock();
    let calls = 0;
    const out = await pollUntil(async () => (++calls >= 3 ? 'PAID' : 'PENDING'), { isDone: v => v === 'PAID', intervalMs: 1000, maxMs: 60000, ...c });
    expect(out).toMatchObject({ done: true, value: 'PAID', attempts: 3 });
  });
  it('stops at the time budget', async () => {
    const c = clock();
    const out = await pollUntil(async () => 'PENDING', { isDone: v => v === 'PAID', intervalMs: 1000, maxMs: 5000, ...c });
    expect(out.done).toBe(false);
    expect(out.timedOut).toBe(true);
    expect(out.attempts).toBeLessThanOrEqual(6);
  });
  it('survives transient errors and keeps polling', async () => {
    const c = clock();
    let calls = 0;
    const out = await pollUntil(async () => { if (++calls < 3) throw new Error('network'); return 'PAID'; }, { isDone: v => v === 'PAID', intervalMs: 100, maxMs: 60000, ...c });
    expect(out).toMatchObject({ done: true, attempts: 3 });
  });
  it('can be aborted (component unmounted)', async () => {
    const c = clock();
    const ctl = new AbortController();
    let calls = 0;
    const out = await pollUntil(async () => { if (++calls === 2) ctl.abort(); return 'PENDING'; }, { isDone: () => false, intervalMs: 10, maxMs: 60000, signal: ctl.signal, ...c });
    expect(out.aborted).toBe(true);
    expect(calls).toBe(2);
  });
});
