import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { pickInitialMode, resolveTheme } from './theme.js';
import { readString, writeString } from '../utils/storage.js';

const ThemeContext = createContext(null);
const query = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null);

export function ThemeProvider({ storageKey = 'dopamine.theme', children }) {
  const [mode, setModeState] = useState(() => pickInitialMode(readString(storageKey)));
  const [prefersDark, setPrefersDark] = useState(() => !!query()?.matches);

  useEffect(() => {
    const mq = query();
    if (!mq) return undefined;
    const onChange = e => setPrefersDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved = resolveTheme(mode, prefersDark);
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const setMode = useCallback(
    next => {
      writeString(storageKey, next);
      setModeState(next);
    },
    [storageKey],
  );

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
