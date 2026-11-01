export const THEME_MODES = ['light', 'dark', 'system'];

export function resolveTheme(mode, prefersDark) {
  if (mode === 'light' || mode === 'dark') return mode;
  return prefersDark ? 'dark' : 'light';
}

export function pickInitialMode(stored) {
  return THEME_MODES.includes(stored) ? stored : 'system';
}
