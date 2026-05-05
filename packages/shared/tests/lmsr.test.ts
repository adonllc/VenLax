import { describe, it, expect } from "vitest";
import { lmsrCost, lmsrProbability, lmsrSharesForFp } from "../src/lmsr";

describe("LMSR pricing engine", () => {
  const b = 100;

  it("initial probability is 50% when no shares exist", () => {
    expect(lmsrProbability(b, 0, 0)).toBeCloseTo(0.5, 5);
  });

  it("buying Yes shares increases Yes probability", () => {
    const before = lmsrProbability(b, 0, 0);
    const after = lmsrProbability(b, 50, 0);
    expect(after).toBeGreaterThan(before);
  });

  it("cost to buy shares is positive and grows with quantity", () => {
    const cost10 = lmsrCost(b, 0, 0, 10, "yes");
    const cost20 = lmsrCost(b, 0, 0, 20, "yes");
    expect(cost10).toBeGreaterThan(0);
    expect(cost20).toBeGreaterThan(cost10);
  });

  it("lmsrSharesForFp: actual cost is within fpAmount", () => {
    const shares = lmsrSharesForFp(b, 0, 0, 1000, "yes");
    const cost = lmsrCost(b, 0, 0, shares, "yes");
    expect(shares).toBeGreaterThan(0);
    expect(cost).toBeLessThanOrEqual(1000);
  });

  it("lmsrSharesForFp: buying one more share would exceed fpAmount", () => {
    const shares = lmsrSharesForFp(b, 0, 0, 1000, "yes");
    const costOneMore = lmsrCost(b, 0, 0, shares + 1, "yes");
    expect(costOneMore).toBeGreaterThan(1000);
  });

  it("probability stays within (0, 1) at extreme share counts", () => {
    expect(lmsrProbability(b, 10000, 0)).toBeLessThan(1);
    expect(lmsrProbability(b, 0, 10000)).toBeGreaterThan(0);
  });
});
