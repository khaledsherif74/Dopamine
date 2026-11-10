import { describe, it, expect } from 'vitest';
import { distanceKm, validCoords, mapsLink } from '../src/features/geo/geo.js';
import { toPosition, shouldSendLocation, geoErrorKey, availabilityBody, MIN_INTERVAL_MS, HEARTBEAT_MS } from '../src/features/geo/location.js';

describe('distance', () => {
  it('haversine: zero, Cairo -> Alexandria (~180 km), symmetric', () => {
    const cairo = { lat: 30.0444, lng: 31.2357 };
    const alex = { lat: 31.2001, lng: 29.9187 };
    expect(distanceKm(cairo, cairo)).toBe(0);
    expect(distanceKm(cairo, alex)).toBeGreaterThan(175);
    expect(distanceKm(cairo, alex)).toBeLessThan(185);
    expect(distanceKm(alex, cairo)).toBeCloseTo(distanceKm(cairo, alex), 6);
  });
  it('missing / invalid coordinates -> null', () => {
    expect(distanceKm(null, { lat: 1, lng: 1 })).toBeNull();
    expect(distanceKm({ lat: 1, lng: 1 }, { lat: null, lng: 1 })).toBeNull();
    expect(distanceKm({ lat: 'x', lng: 1 }, { lat: 1, lng: 1 })).toBeNull();
    expect(distanceKm({ lat: 91, lng: 1 }, { lat: 1, lng: 1 })).toBeNull();
  });
  it('validCoords', () => {
    expect(validCoords(30, 31)).toBe(true);
    expect(validCoords(-90, 180)).toBe(true);
    for (const [a, b] of [[91, 0], [0, 181], [NaN, 0], [null, 0], [undefined, 0], ['1', 1]]) expect(validCoords(a, b)).toBe(false);
  });
});

describe('maps links (opened in a new tab, built only from validated data)', () => {
  it('coordinates win', () => expect(mapsLink({ lat: 30.1, lng: 31.2, text: 'x' })).toBe('https://www.google.com/maps/dir/?api=1&destination=30.1,31.2'));
  it('falls back to an encoded address text', () => {
    expect(mapsLink({ text: ' 1 Nile St, Cairo ' })).toBe('https://www.google.com/maps/dir/?api=1&destination=1%20Nile%20St%2C%20Cairo');
    expect(mapsLink({ lat: 999, lng: 1, text: 'a&b=c' })).toBe('https://www.google.com/maps/dir/?api=1&destination=a%26b%3Dc');
  });
  it('nothing usable -> null; absurdly long text is cut', () => {
    expect(mapsLink({})).toBeNull();
    expect(mapsLink({ text: '   ' })).toBeNull();
    expect(mapsLink(null)).toBeNull();
    expect(decodeURIComponent(mapsLink({ text: 'x'.repeat(500) }).split('destination=')[1]).length).toBe(200);
  });
});

describe('browser position -> API body', () => {
  it('rounds to 5 decimals and keeps accuracy', () => {
    expect(toPosition({ coords: { latitude: 30.123456789, longitude: 31.987654321, accuracy: 12.3 } })).toEqual({ lat: 30.12346, lng: 31.98765, accuracy: 12.3 });
  });
  it('invalid or missing -> null', () => {
    expect(toPosition({ coords: { latitude: 100, longitude: 0 } })).toBeNull();
    expect(toPosition({ coords: { latitude: NaN, longitude: 0 } })).toBeNull();
    expect(toPosition(null)).toBeNull();
    expect(toPosition({})).toBeNull();
  });
  it('geolocation error codes -> i18n keys', () => {
    expect(geoErrorKey(1)).toBe('location.denied');
    expect(geoErrorKey(2)).toBe('location.unavailable');
    expect(geoErrorKey(3)).toBe('location.timeout');
    expect(geoErrorKey(99)).toBe('location.unavailable');
    expect(geoErrorKey(undefined)).toBe('location.unavailable');
  });
});

describe('when to send my location to the server (battery, data and rate-limit friendly)', () => {
  const t0 = 1_000_000;
  const last = { at: t0, lat: 30.0, lng: 31.0 };
  const near = { lat: 30.0001, lng: 31.0 };   // ~11 m
  const far = { lat: 30.01, lng: 31.0 };      // ~1.1 km
  it('first fix is always sent', () => expect(shouldSendLocation({ last: null, next: near, now: t0 })).toBe(true));
  it('never more often than the minimum interval, even when moving', () => {
    expect(shouldSendLocation({ last, next: far, now: t0 + MIN_INTERVAL_MS - 1 })).toBe(false);
  });
  it('after the interval: only if moved enough', () => {
    expect(shouldSendLocation({ last, next: near, now: t0 + MIN_INTERVAL_MS })).toBe(false);
    expect(shouldSendLocation({ last, next: far, now: t0 + MIN_INTERVAL_MS })).toBe(true);
  });
  it('a heartbeat is sent even when standing still (so dispatch knows the app is alive)', () => {
    expect(shouldSendLocation({ last, next: near, now: t0 + HEARTBEAT_MS })).toBe(true);
  });
  it('an unusable new fix is never sent', () => expect(shouldSendLocation({ last, next: null, now: t0 + HEARTBEAT_MS })).toBe(false));
  it('constants are sane', () => {
    expect(MIN_INTERVAL_MS).toBeGreaterThanOrEqual(30000);
    expect(HEARTBEAT_MS).toBeGreaterThan(MIN_INTERVAL_MS);
  });
});

describe('availability request body (mirrors updateAvailabilitySchema)', () => {
  it('online with a usable fix carries the coordinates; the accuracy is not sent', () => {
    expect(availabilityBody(true, { lat: 30.1, lng: 31.2, accuracy: 9 })).toEqual({ isOnline: true, lat: 30.1, lng: 31.2 });
  });
  it('online without a fix, or with a bad one, goes online without coordinates', () => {
    expect(availabilityBody(true, null)).toEqual({ isOnline: true });
    expect(availabilityBody(true, { lat: 999, lng: 1 })).toEqual({ isOnline: true });
  });
  it('offline never sends a position (the server keeps the last one)', () => {
    expect(availabilityBody(false, { lat: 30.1, lng: 31.2 })).toEqual({ isOnline: false });
  });
});
