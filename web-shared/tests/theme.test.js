import { describe, it, expect } from 'vitest';
import { resolveTheme, pickInitialMode } from '../src/theme/theme.js';

describe('theme', () => {
  it('system follows the OS, explicit modes win', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
  it('unknown stored values fall back to system', () => {
    expect(pickInitialMode('dark')).toBe('dark');
    expect(pickInitialMode('purple')).toBe('system');
    expect(pickInitialMode(null)).toBe('system');
  });
});
