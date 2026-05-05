import { describe, it, expect } from "vitest";
import { colors, getSurface } from "../src/tokens";

describe("Design tokens", () => {
  it("green is #00D46A in both themes", () => {
    expect(colors.green).toBe("#00D46A");
  });

  it("dark theme surface is near-black", () => {
    expect(getSurface("dark").surface).toBe("#0D0D0D");
  });

  it("light theme surface is deep green-grey", () => {
    expect(getSurface("light").surface).toBe("#1A231A");
  });

  it("lemon is identical in both themes", () => {
    expect(colors.lemon).toBe("#FFE600");
  });
});
