import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSetAvailabilityMutation } from '@/api/endpoints.js';
import { availabilityBody, geoErrorKey, MIN_INTERVAL_MS, shouldSendLocation, toPosition } from './location.js';

const PositionContext = createContext({ position: null, errorKey: null, locate: async () => null, markSent: () => {} });
export const usePosition = () => useContext(PositionContext);

// One-shot browser fix. Resolves { position } or { errorKey }; never rejects.
export function getFix(options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }) {
  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ errorKey: 'location.unavailable' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      geo => {
        const position = toPosition(geo);
        resolve(position ? { position } : { errorKey: 'location.unavailable' });
      },
      err => resolve({ errorKey: geoErrorKey(err?.code) }),
      options,
    );
  });
}

// While the driver is online: refresh the position on a timer (no continuous watch: battery) and
// tell the server only when shouldSendLocation says so. The position also feeds distance sorting.
export function PositionProvider({ online, children }) {
  const [position, setPosition] = useState(null);
  const [errorKey, setErrorKey] = useState(null);
  const [setAvailability] = useSetAvailabilityMutation();
  const lastSent = useRef(null);

  // Whoever already told the server the position (going online, Profile) records it here, so the timer does not repeat it.
  const markSent = useCallback(pos => {
    lastSent.current = pos ? { at: Date.now(), lat: pos.lat, lng: pos.lng } : null;
  }, []);

  const locate = useCallback(async () => {
    const fix = await getFix();
    if (fix.position) {
      setPosition(fix.position);
      setErrorKey(null);
    } else {
      setErrorKey(fix.errorKey);
    }
    return fix.position ?? null;
  }, []);

  useEffect(() => {
    if (!online) {
      lastSent.current = null; // a new online session starts with a fresh report
      return undefined;
    }
    let cancelled = false;
    async function tick() {
      if (document.visibilityState === 'hidden') return;
      const next = await locate();
      if (cancelled || !next) return;
      const now = Date.now();
      if (shouldSendLocation({ last: lastSent.current, next, now })) {
        lastSent.current = { at: now, lat: next.lat, lng: next.lng };
        setAvailability(availabilityBody(true, next)).unwrap().catch(() => {
          lastSent.current = null; // try again on the next tick
        });
      }
    }
    tick();
    const id = setInterval(tick, MIN_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [online, locate, setAvailability]);

  const value = useMemo(() => ({ position, errorKey, locate, markSent }), [position, errorKey, locate, markSent]);
  return <PositionContext.Provider value={value}>{children}</PositionContext.Provider>;
}
