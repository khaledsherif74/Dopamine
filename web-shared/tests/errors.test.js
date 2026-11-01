import { describe, it, expect } from 'vitest';
import { apiErrorMessage, apiErrorCode } from '../src/api/errors.js';
import { translate } from '../src/i18n/translate.js';
import { sharedDictionaries } from '../src/i18n/dictionaries.js';

const t = (k, p) => translate(sharedDictionaries, 'en', k, p);

describe('apiErrorMessage', () => {
  it('network problems and timeouts', () => {
    expect(apiErrorMessage({ status: 'FETCH_ERROR' }, t)).toBe(t('errors.network'));
    expect(apiErrorMessage({ status: 'TIMEOUT_ERROR' }, t)).toBe(t('errors.network'));
  });
  it('rate limit and maintenance', () => {
    expect(apiErrorMessage({ status: 429, data: { message: 'x' } }, t)).toBe(t('errors.tooMany'));
    expect(apiErrorMessage({ status: 503, data: { message: 'x' } }, t)).toBe(t('errors.maintenance'));
  });
  it('shows the server message for 4xx', () => {
    expect(apiErrorMessage({ status: 400, data: { message: 'Minimum order amount is EGP 50' } }, t)).toBe('Minimum order amount is EGP 50');
    expect(apiErrorMessage({ status: 400, data: { message: 'Validation failed', details: [{ path: 'phone', message: 'Phone must be in E.164 format' }] } }, t)).toBe('Phone must be in E.164 format');
  });
  it('ignores machine reason codes in details and falls back to the message', () => {
    expect(apiErrorMessage({ status: 400, data: { message: 'The cancellation window has passed', details: [{ message: 'GRACE_EXPIRED' }] } }, t)).toBe('The cancellation window has passed');
  });
  it('generic fallbacks', () => {
    expect(apiErrorMessage({ status: 500, data: { message: 'boom' } }, t)).toBe(t('errors.generic'));
    expect(apiErrorMessage(undefined, t)).toBe(t('errors.generic'));
    expect(apiErrorMessage({ status: 404, data: {} }, t)).toBe(t('errors.notFound'));
  });
  it('apiErrorCode extracts the reason code', () => {
    expect(apiErrorCode({ data: { details: [{ path: 'order', message: 'GRACE_EXPIRED' }] } })).toBe('GRACE_EXPIRED');
    expect(apiErrorCode({ data: { details: [{ message: 'Too short' }] } })).toBe(null);
    expect(apiErrorCode(undefined)).toBe(null);
  });
});
