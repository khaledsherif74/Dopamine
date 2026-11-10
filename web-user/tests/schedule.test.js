import { describe, it, expect } from "vitest";
import {
  minScheduleDate,
  parseScheduleInput,
  toLocalInputValue,
  MIN_LEAD_MINUTES,
} from "../src/features/checkout/schedule.js";

const now = new Date(2026, 9, 22, 10, 3, 20);

describe("schedule", () => {
  it("earliest time = now + lead, rounded up to 5 minutes", () => {
    const d = minScheduleDate(now);
    expect(d.getHours()).toBe(11);
    expect(d.getMinutes()).toBe(5);
    expect(d.getSeconds()).toBe(0);
    expect(MIN_LEAD_MINUTES).toBe(60);
  });
  it('formats a local value for <input type="datetime-local">', () => {
    expect(toLocalInputValue(new Date(2026, 0, 5, 7, 4))).toBe(
      "2026-01-05T07:04",
    );
  });
  it("requires a value", () => {
    expect(parseScheduleInput("", now)).toEqual({
      ok: false,
      error: "required",
    });
    expect(parseScheduleInput(undefined, now)).toEqual({
      ok: false,
      error: "required",
    });
  });
  it("rejects garbage", () => {
    expect(parseScheduleInput("tomorrow-ish", now)).toEqual({
      ok: false,
      error: "invalid",
    });
  });
  it("rejects times sooner than the lead time", () => {
    expect(
      parseScheduleInput(toLocalInputValue(new Date(2026, 9, 22, 10, 30)), now),
    ).toEqual({ ok: false, error: "tooSoon" });
    expect(
      parseScheduleInput(toLocalInputValue(new Date(2026, 9, 21, 10, 30)), now),
    ).toEqual({ ok: false, error: "tooSoon" });
  });
  it("accepts a later time and returns an ISO string for the API", () => {
    const r = parseScheduleInput(
      toLocalInputValue(new Date(2026, 9, 24, 15, 0)),
      now,
    );
    expect(r.ok).toBe(true);
    expect(new Date(r.iso).getTime()).toBe(
      new Date(2026, 9, 24, 15, 0).getTime(),
    );
  });
  it("accepts exactly now + lead", () => {
    expect(
      parseScheduleInput(toLocalInputValue(new Date(2026, 9, 22, 11, 5)), now)
        .ok,
    ).toBe(true);
  });
});
