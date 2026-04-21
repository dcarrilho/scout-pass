import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignores falsy values", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles conditional objects", () => {
    expect(cn({ "font-bold": true, italic: false })).toBe("font-bold");
  });

  it("handles arrays", () => {
    expect(cn(["text-sm", "text-red-500"])).toBe("text-sm text-red-500");
  });

  it("returns empty string with no arguments", () => {
    expect(cn()).toBe("");
  });
});
