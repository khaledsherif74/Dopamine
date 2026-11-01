import { describe, it, expect, vi } from 'vitest';
import { bootstrapSession } from '../src/auth/session.js';
import { createRefresher } from '../src/api/refresher.js';

const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const refresherReturning = out => ({ refresh: vi.fn().mockResolvedValue(out) });

describe('bootstrapSession (refresh cookie -> /auth/me)', () => {
  it('restores the session', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(200, { data: { id: 'u1', role: 'USER', name: 'Sam' } }));
    const out = await bootstrapSession({ baseUrl: '/api/v1', role: 'USER', refresher: refresherReturning({ status: 'ok', accessToken: 'A' }), fetchFn });
    expect(out).toEqual({ status: 'authenticated', accessToken: 'A', account: { id: 'u1', role: 'USER', name: 'Sam' } });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('/api/v1/auth/me');
    expect(init.headers.Authorization).toBe('Bearer A');
    expect(init.headers['X-Client']).toBe('web');
  });

  it('no cookie / expired session -> anonymous (and /me is never called)', async () => {
    const fetchFn = vi.fn();
    expect(await bootstrapSession({ baseUrl: '', role: 'USER', refresher: refresherReturning({ status: 'denied' }), fetchFn })).toEqual({ status: 'anonymous' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('server unreachable -> error (not anonymous)', async () => {
    expect(await bootstrapSession({ baseUrl: '', role: 'USER', refresher: refresherReturning({ status: 'error' }), fetchFn: vi.fn() })).toEqual({ status: 'error' });
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await bootstrapSession({ baseUrl: '', role: 'USER', refresher: refresherReturning({ status: 'ok', accessToken: 'A' }), fetchFn })).toEqual({ status: 'error' });
    expect(await bootstrapSession({ baseUrl: '', role: 'USER', refresher: refresherReturning({ status: 'ok', accessToken: 'A' }), fetchFn: vi.fn().mockResolvedValue(json(500, {})) })).toEqual({ status: 'error' });
  });

  it('a deactivated account (/me 403) or unknown one (404) is anonymous', async () => {
    for (const status of [401, 403, 404]) {
      const fetchFn = vi.fn().mockResolvedValue(json(status, {}));
      expect(await bootstrapSession({ baseUrl: '', role: 'USER', refresher: refresherReturning({ status: 'ok', accessToken: 'A' }), fetchFn })).toEqual({ status: 'anonymous' });
    }
  });

  it("another role's session cookie never logs in here", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(200, { data: { id: 's1', role: 'SUPPORT' } }));
    expect(await bootstrapSession({ baseUrl: '', role: 'USER', refresher: refresherReturning({ status: 'ok', accessToken: 'A' }), fetchFn })).toEqual({ status: 'anonymous' });
  });

  it('works end-to-end with the real single-flight refresher', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(json(200, { data: { accessToken: 'TOK' } }))
      .mockResolvedValueOnce(json(200, { data: { id: 'u1', role: 'USER' } }));
    const refresher = createRefresher({ baseUrl: '/api/v1', fetchFn });
    const out = await bootstrapSession({ baseUrl: '/api/v1', role: 'USER', refresher, fetchFn });
    expect(out.status).toBe('authenticated');
    expect(fetchFn.mock.calls.map(c => c[0])).toEqual(['/api/v1/auth/refresh', '/api/v1/auth/me']);
  });
});
