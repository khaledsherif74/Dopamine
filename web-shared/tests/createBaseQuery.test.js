import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBaseQuery, shouldSkipRefresh } from '../src/api/createBaseQuery.js';

const ok = { data: { ok: true } };
const unauthorized = { error: { status: 401, data: {} } };

function setup({ raw, refresh }) {
  const refresher = { refresh: vi.fn(refresh) };
  const dispatch = vi.fn();
  const onToken = vi.fn(t => ({ type: 'token', payload: t }));
  const onLogout = vi.fn(() => ({ type: 'logout' }));
  const baseQuery = createBaseQuery({ baseUrl: '/api/v1', getToken: () => 'x', onToken, onLogout, refresher, rawBaseQuery: raw });
  const api = { dispatch };
  return { baseQuery, api, refresher, dispatch, onToken, onLogout };
}

describe('createBaseQuery', () => {
  let raw;
  beforeEach(() => { raw = vi.fn(); });

  it('passes successful and non-401 results straight through', async () => {
    raw.mockResolvedValueOnce(ok).mockResolvedValueOnce({ error: { status: 500 } });
    const { baseQuery, api, refresher } = setup({ raw, refresh: async () => ({ status: 'ok', accessToken: 'n' }) });
    expect(await baseQuery('/orders', api, {})).toEqual(ok);
    expect((await baseQuery('/orders', api, {})).error.status).toBe(500);
    expect(refresher.refresh).not.toHaveBeenCalled();
  });

  it('401 -> refresh -> store the new token -> retry once', async () => {
    raw.mockResolvedValueOnce(unauthorized).mockResolvedValueOnce(ok);
    const { baseQuery, api, dispatch, onToken } = setup({ raw, refresh: async () => ({ status: 'ok', accessToken: 'NEW' }) });
    expect(await baseQuery('/orders', api, {})).toEqual(ok);
    expect(onToken).toHaveBeenCalledWith('NEW');
    expect(dispatch).toHaveBeenCalledWith({ type: 'token', payload: 'NEW' });
    expect(raw.mock.calls.length).toBe(2);
  });

  it('refresh denied -> logs out and returns the original 401', async () => {
    raw.mockResolvedValue(unauthorized);
    const { baseQuery, api, dispatch } = setup({ raw, refresh: async () => ({ status: 'denied' }) });
    const result = await baseQuery('/orders', api, {});
    expect(result.error.status).toBe(401);
    expect(dispatch).toHaveBeenCalledWith({ type: 'logout' });
    expect(raw.mock.calls.length).toBe(1);
  });

  it('refresh network error -> keeps the session (no logout)', async () => {
    raw.mockResolvedValue(unauthorized);
    const { baseQuery, api, dispatch } = setup({ raw, refresh: async () => ({ status: 'error' }) });
    expect((await baseQuery('/orders', api, {})).error.status).toBe(401);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('never loops: a second 401 after a successful refresh is returned as is', async () => {
    raw.mockResolvedValue(unauthorized);
    const { baseQuery, api, refresher } = setup({ raw, refresh: async () => ({ status: 'ok', accessToken: 'NEW' }) });
    const result = await baseQuery('/orders', api, {});
    expect(result.error.status).toBe(401);
    expect(refresher.refresh.mock.calls.length).toBe(1);
    expect(raw.mock.calls.length).toBe(2);
  });

  it('login / register / oauth / otp 401s are real errors: no refresh attempt', async () => {
    raw.mockResolvedValue(unauthorized);
    const { baseQuery, api, refresher } = setup({ raw, refresh: async () => ({ status: 'ok', accessToken: 'n' }) });
    for (const url of ['/auth/login', '/auth/register/user', '/auth/oauth', '/auth/otp/verify', '/auth/forgot-password', '/auth/reset-password', '/auth/refresh']) {
      await baseQuery({ url, method: 'POST' }, api, {});
    }
    expect(refresher.refresh).not.toHaveBeenCalled();
    expect(shouldSkipRefresh('/auth/me')).toBe(false);
    expect(shouldSkipRefresh({ url: '/orders' })).toBe(false);
  });

  it('concurrent 401s share the refresher (which is single-flight)', async () => {
    raw.mockResolvedValueOnce(unauthorized).mockResolvedValueOnce(unauthorized).mockResolvedValue(ok);
    const { baseQuery, api, refresher } = setup({ raw, refresh: () => new Promise(r => setTimeout(() => r({ status: 'ok', accessToken: 'N' }), 10)) });
    const [a, b] = await Promise.all([baseQuery('/a', api, {}), baseQuery('/b', api, {})]);
    expect(a).toEqual(ok);
    expect(b).toEqual(ok);
    expect(refresher.refresh.mock.calls.length).toBe(2); // each asks; the real refresher de-duplicates the network call
  });
});
