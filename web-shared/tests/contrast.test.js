import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(
  path.resolve(process.cwd(), "src/theme/theme.css"),
  "utf8",
);

function tokens(selectorRegex) {
  const block = css.match(selectorRegex)?.[1];
  if (!block) throw new Error(`block not found: ${selectorRegex}`);
  return Object.fromEntries(
    [...block.matchAll(/--c-([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
}
const light = tokens(/:root\s*\{([^}]*)\}/);
const dark = {
  ...light,
  ...tokens(/:root\[data-theme='dark'\]\s*\{([^}]*)\}/),
};

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const [r, g, b] = rgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const over = (fg, bg, alpha) =>
  "#" +
  rgb(fg)
    .map((c, i) =>
      Math.round(c * alpha + rgb(bg)[i] * (1 - alpha))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

const THEMES = { light, dark };
const check = (name, fn) => {
  for (const [themeName, t] of Object.entries(THEMES)) {
    it(`${name} (${themeName})`, () => {
      const failures = fn(t)
        .filter(([, ratio]) => ratio < 4.5)
        .map(([label, ratio]) => `${label}: ${ratio.toFixed(2)}`);
      expect(failures).toEqual([]);
    });
  }
};

describe("contrast >= 4.5:1 for normal text", () => {
  check("body and secondary text on every surface", (t) =>
    ["background", "surface", "surface-alt", "primary-tint"].flatMap((bg) => [
      [`text-primary on ${bg}`, contrast(t["text-primary"], t[bg])],
      [`text-secondary on ${bg}`, contrast(t["text-secondary"], t[bg])],
    ]),
  );
  check("brand colour as text/links", (t) =>
    ["background", "surface", "primary-tint"].map((bg) => [
      `primary on ${bg}`,
      contrast(t.primary, t[bg]),
    ]),
  );
  check("text on filled buttons", (t) => [
    ["text-inverse on primary", contrast(t["text-inverse"], t.primary)],
    ["text-inverse on danger", contrast(t["text-inverse"], t.danger)],
  ]);
  check("status colours as text on the surface", (t) =>
    ["success", "warning", "danger"].map((k) => [
      `${k} on surface`,
      contrast(t[k], t.surface),
    ]),
  );
  check("status badges and alerts (tinted backgrounds)", (t) =>
    ["success", "warning", "danger"].flatMap((k) =>
      [0.1, 0.15].flatMap((a) =>
        ["surface", "surface-alt", "background"].map((bg) => [
          `${k} on ${k}/${a * 100}% over ${bg}`,
          contrast(t[k], over(t[k], t[bg], a)),
        ]),
      ),
    ),
  );
});
