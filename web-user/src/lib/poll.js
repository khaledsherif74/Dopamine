// Repeatedly call `fn` until `isDone(value)` or the time budget is spent.
// Injectable `sleep`/`now` keep it testable; `signal` lets a component cancel on unmount.
export async function pollUntil(fn, { isDone, intervalMs = 2500, maxMs = 120000, sleep = ms => new Promise(r => setTimeout(r, ms)), now = () => Date.now(), signal } = {}) {
  const started = now();
  let attempts = 0;
  let last;
  for (;;) {
    if (signal?.aborted) return { done: false, aborted: true, value: last, attempts };
    attempts += 1;
    try {
      last = await fn(attempts);
      if (isDone(last)) return { done: true, value: last, attempts };
    } catch (err) {
      last = { error: err }; // transient failure: keep polling until the budget ends
    }
    if (now() - started + intervalMs > maxMs) return { done: false, timedOut: true, value: last, attempts };
    await sleep(intervalMs);
  }
}
