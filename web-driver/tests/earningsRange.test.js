import { describe, it, expect } from "vitest";
import {
  presetRange,
  validateRange,
  RANGE_PRESETS,
} from "../src/features/earnings/earningsRange.js";

const now = new Date(2026, 10, 15, 14, 30);
const ymd = (iso) => {
  const d = new Date(iso);
  return [
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
  ];
};

describe("earnings range presets (local-day boundaries, sent as ISO)", () => {
  it("lists the presets", () =>
    expect(RANGE_PRESETS).toEqual(["today", "7d", "30d", "month", "all"]));
  it("today = local midnight .. end of day", () => {
    const r = presetRange("today", now);
    expect(ymd(r.from)).toEqual([2026, 11, 15, 0, 0]);
    expect(ymd(r.to)).toEqual([2026, 11, 15, 23, 59]);
  });
  it("7d / 30d include today and the days before it", () => {
    expect(ymd(presetRange("7d", now).from)).toEqual([2026, 11, 9, 0, 0]);
    expect(ymd(presetRange("30d", now).from)).toEqual([2026, 10, 17, 0, 0]);
  });
  it("month = first of this month .. end of today", () => {
    expect(ymd(presetRange("month", now).from)).toEqual([2026, 11, 1, 0, 0]);
    expect(ymd(presetRange("month", now).to)).toEqual([2026, 11, 15, 23, 59]);
  });
  it("all = no bounds; unknown preset = all", () => {
    expect(presetRange("all", now)).toEqual({});
    expect(presetRange("???", now)).toEqual({});
  });
});

describe('custom range from <input type="date"> values', () => {
  it("valid range -> start of the first day .. end of the last day", () => {
    const r = validateRange({ from: "2026-11-01", to: "2026-11-10" });
    expect(r.ok).toBe(true);
    expect(ymd(r.range.from)).toEqual([2026, 11, 1, 0, 0]);
    expect(ymd(r.range.to)).toEqual([2026, 11, 10, 23, 59]);
  });
  it("one side only is fine; both empty = all", () => {
    expect(
      validateRange({ from: "2026-11-01", to: "" }).range.to,
    ).toBeUndefined();
    expect(validateRange({ from: "", to: "" })).toEqual({
      ok: true,
      range: {},
      error: null,
    });
  });
  it("rejects reversed ranges and malformed dates (incl. impossible days)", () => {
    expect(validateRange({ from: "2026-11-10", to: "2026-11-01" }).error).toBe(
      "earnings.errors.order",
    );
    expect(validateRange({ from: "x", to: "" }).error).toBe(
      "earnings.errors.date",
    );
    expect(validateRange({ from: "2026-02-30", to: "" }).error).toBe(
      "earnings.errors.date",
    );
  });
});
