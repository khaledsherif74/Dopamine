import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Each of these apps is deployed as its own Vercel project (Root Directory = web/<app>).
const WEB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APPS = ['support-app', 'web-supplier', 'web-driver'];

const config = app => JSON.parse(fs.readFileSync(path.join(WEB, app, 'vercel.json'), 'utf8'));
const headersOf = (cfg, source) => Object.fromEntries((cfg.headers.find(h => h.source === source)?.headers ?? []).map(h => [h.key, h.value]));

for (const app of APPS) {
  describe(`${app}/vercel.json`, () => {
    it('is valid JSON with a single-page-app rewrite', () => {
      const cfg = config(app);
      expect(cfg.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
    });
    it('sends the baseline security headers on every route', () => {
      const h = headersOf(config(app), '/(.*)');
      expect(h['X-Content-Type-Options']).toBe('nosniff');
      expect(h['X-Frame-Options']).toBe('DENY');
      expect(h['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(h['Strict-Transport-Security']).toMatch(/max-age=\d{7,}/);
    });
    it('ships a Content-Security-Policy in REPORT-ONLY mode (cannot break the app; tighten once seen in a browser)', () => {
      const h = headersOf(config(app), '/(.*)');
      expect(h['Content-Security-Policy']).toBeUndefined();
      const csp = h['Content-Security-Policy-Report-Only'];
      for (const directive of ["default-src 'self'", "script-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'"]) expect(csp).toContain(directive);
      expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
      expect(csp).not.toMatch(/script-src[^;]*unsafe-eval/);
    });
    it('hashed build assets are cached for a year', () => {
      expect(headersOf(config(app), '/assets/(.*)')['Cache-Control']).toBe('public, max-age=31536000, immutable');
    });
    it('only the driver app may use geolocation; camera and microphone are never allowed', () => {
      const policy = headersOf(config(app), '/(.*)')['Permissions-Policy'];
      expect(policy).toContain('camera=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain(app === 'web-driver' ? 'geolocation=(self)' : 'geolocation=()');
    });
  });
}
