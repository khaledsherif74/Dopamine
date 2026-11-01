// Cheap regression guards over the web sources (no bundler needed): RTL-safe classes,
// accessible images/links, no unsafe DOM/storage patterns.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const roots = [path.resolve(process.cwd(), 'src'), path.resolve(process.cwd(), '../web-shared/src')];
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = roots.flatMap(r => {
  if (!fs.existsSync(r)) throw new Error(`source root not found: ${r} (run the tests from the web-user directory)`);
  return walk(r).filter(f => /\.(jsx?|css)$/.test(f));
});
// comments may mention localStorage etc.; only real code is scanned
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/\s.*$/gm, '');
const read = f => (/\.jsx?$/.test(f) ? stripComments(fs.readFileSync(f, 'utf8')) : fs.readFileSync(f, 'utf8'));
const rel = f => path.relative(path.resolve(process.cwd(), '..'), f);
const offenders = (regex, { only = /\.jsx?$/ , skip } = {}) =>
  files.filter(f => only.test(f) && !(skip && skip.test(f))).flatMap(f => (read(f).match(regex) ? [rel(f)] : []));

describe('RTL safety (logical utilities only)', () => {
  it('no physical left/right Tailwind classes', () => {
    const physical = /\b(?:-?(?:ml|mr|pl|pr)-(?:\d|\[|px|auto)|text-(?:left|right)\b|(?:left|right)-(?:\d|\[|auto|full|1\/2)|-(?:left|right)-\d|rounded-(?:l|r|tl|tr|bl|br)(?:-|\b)|border-(?:l|r)(?:-|\b)|float-(?:left|right))/;
    expect(offenders(physical)).toEqual([]);
  });
});

describe('accessibility basics', () => {
  it('every <img> has an alt attribute', () => {
    const bad = files.filter(f => /\.jsx$/.test(f)).filter(f => (read(f).match(/<img\b[^>]*>/g) || []).some(tag => !/\balt=/.test(tag)));
    expect(bad.map(rel)).toEqual([]);
  });
  it('external links opened in a new tab carry rel="noreferrer"', () => {
    const bad = files.filter(f => /\.jsx$/.test(f)).filter(f => (read(f).match(/<a\b[^>]*target="_blank"[^>]*>/g) || []).some(tag => !/rel="[^"]*(noreferrer|noopener)/.test(tag)));
    expect(bad.map(rel)).toEqual([]);
  });
  it('icon-only buttons are labelled: every <button> has text, aria-label or a label prop', () => {
    // heuristic: a self-contained <button ...> opening tag with an <svg> child must have aria-label
    const bad = files.filter(f => /\.jsx$/.test(f)).filter(f => (read(f).match(/<button\b[^>]*>\s*<svg/g) || []).some(m => !/aria-label=/.test(m)));
    expect(bad.map(rel)).toEqual([]);
  });
});

describe('unsafe patterns', () => {
  it('no dangerouslySetInnerHTML, eval or document.write', () => {
    expect(offenders(/dangerouslySetInnerHTML|\beval\(|document\.write\(|new Function\(/)).toEqual([]);
  });
  it("innerHTML is only ever cleared (= '')", () => {
    const bad = files.filter(f => /\.jsx?$/.test(f)).filter(f => (read(f).match(/\.innerHTML\s*=\s*[^;]+/g) || []).some(m => !/=\s*''/.test(m)));
    expect(bad.map(rel)).toEqual([]);
  });
  it('browser storage is only touched through the guarded helpers (and never for tokens)', () => {
    const bad = offenders(/\b(?:localStorage|sessionStorage)\b/, { skip: /utils[\\/]storage\.js$/ });
    expect(bad).toEqual([]);
    expect(offenders(/(?:writeJson|writeString)\([^)]*(?:accessToken|refreshToken|token)/i)).toEqual([]);
  });
  it('no console.log left behind', () => {
    expect(offenders(/console\.log\(/)).toEqual([]);
  });
});
