import { describe, it, expect, vi } from 'vitest';
import { createRefresher, WEB_HEADERS } from '../src/api/refresher.js';

const res = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('createRefresher', () => {
  it('calls /auth/refresh with the cookie + web headers and returns the new access token', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res(200, { data: { accessToken: 'NEW' } }));
    const r = createRefresher({ baseUrl: '/api/v1', fetchFn });
    expect(await r.refresh()).toEqual({ status: 'ok', accessToken: 'NEW' });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('/api/v1/auth/refresh');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(init.headers).toMatchObject({ ...WEB_HEADERS, 'Content-Type': 'application/json' });
    expect(init.body).toBe('{}');
  });

  it('is single-flight: concurrent callers share one request', async () => {
    let release;
    const fetchFn = vi.fn(() => new Promise(resolve => { release = () => resolve(res(200, { data: { accessToken: 'ONE' } })); }));
    const r = createRefresher({ baseUrl: '', fetchFn });
    const calls = [r.refresh(), r.refresh(), r.refresh()];
    release();
    const outs = await Promise.all(calls);
    expect(fetchFn.mock.calls.length).toBe(1);
    expect(outs.every(o => o.accessToken === 'ONE')).toBe(true);
  });

  it('a later refresh makes a new request once the first settled', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res(200, { data: { accessToken: 'T' } }));
    const r = createRefresher({ baseUrl: '', fetchFn });
    await r.refresh();
    await r.refresh();
    expect(fetchFn.mock.calls.length).toBe(2);
  });

  it('401 / 403 / missing token mean the session is over (denied)', async () => {
    for (const out of [res(401, {}), res(403, {}), res(200, { data: {} })]) {
      const r = createRefresher({ baseUrl: '', fetchFn: vi.fn().mockResolvedValue(out) });
      expect(await r.refresh()).toEqual({ status: 'denied' });
    }
  });

  it('5xx and network failures are NOT a logout (error)', async () => {
    expect(await createRefresher({ baseUrl: '', fetchFn: vi.fn().mockResolvedValue(res(502, {})) }).refresh()).toEqual({ status: 'error' });
    expect(await createRefresher({ baseUrl: '', fetchFn: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) }).refresh()).toEqual({ status: 'error' });
    expect(await createRefresher({ baseUrl: '', fetchFn: vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => { throw new Error('bad json'); } }) }).refresh()).toEqual({ status: 'error' });
  });

  it('times out an unresponsive server', async () => {
    const fetchFn = vi.fn((_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')))));
    const r = createRefresher({ baseUrl: '', fetchFn, timeoutMs: 20 });
    expect(await r.refresh()).toEqual({ status: 'error' });
  });
});
