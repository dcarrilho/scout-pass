import { describe, it, expect } from "vitest";
import { getSeriesColor } from "@/lib/challenge-colors";

const KNOWN_KEYS = ["blue", "amber", "purple", "emerald", "orange", "rose", "slate"] as const;

describe("getSeriesColor", () => {
  it.each(KNOWN_KEYS)("returns correct color config for '%s'", (key) => {
    const color = getSeriesColor(key);
    expect(color).toHaveProperty("progress");
    expect(color).toHaveProperty("badge");
    expect(color).toHaveProperty("icon_bg");
    expect(color).toHaveProperty("header");
    expect(color.progress).toContain(key);
  });

  it("defaults to amber for null", () => {
    expect(getSeriesColor(null)).toEqual(getSeriesColor("amber"));
  });

  it("defaults to amber for undefined", () => {
    expect(getSeriesColor(undefined)).toEqual(getSeriesColor("amber"));
  });

  it("defaults to amber for unknown key", () => {
    expect(getSeriesColor("unknown-color")).toEqual(getSeriesColor("amber"));
  });
});
