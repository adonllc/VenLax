/**
 * LMSR (Logarithmic Market Scoring Rule) pricing engine.
 *
 * All quantities (qYes, qNo, shares) are in share units.
 * All FP amounts are in integer Forecast Points.
 *
 * Reference: Hanson (2003) — "Combinatorial Information Market Design"
 */

/**
 * Returns the total cost to move from the current state (qYes, qNo)
 * to a new state after buying `shares` on the given side.
 *
 * Uses the log-sum-exp trick to avoid overflow at large share counts.
 */
export function lmsrCost(
  b: number,
  qYes: number,
  qNo: number,
  shares: number,
  side: "yes" | "no"
): number {
  const newQYes = side === "yes" ? qYes + shares : qYes;
  const newQNo = side === "no" ? qNo + shares : qNo;
  const before = logSumExp(qYes / b, qNo / b);
  const after = logSumExp(newQYes / b, newQNo / b);
  return b * (after - before);
}

/**
 * Returns the implied Yes probability at the current market state.
 *
 * Uses the log-sum-exp trick and clamps to (PROB_MIN, PROB_MAX) so the result
 * is always strictly within (0, 1) even at extreme share counts where
 * IEEE 754 double precision would otherwise saturate to 0 or 1.
 */
export function lmsrProbability(b: number, qYes: number, qNo: number): number {
  // softmax with numerical stabilisation
  const yScaled = qYes / b;
  const nScaled = qNo / b;
  const maxVal = Math.max(yScaled, nScaled);
  const eYes = Math.exp(yScaled - maxVal);
  const eNo = Math.exp(nScaled - maxVal);
  const raw = eYes / (eYes + eNo);
  // Clamp strictly inside (0, 1) — mirrors the theoretical LMSR guarantee
  return Math.min(PROB_MAX, Math.max(PROB_MIN, raw));
}

/** Smallest representable probability above 0 (1e-15 ≈ 100× machine epsilon) */
const PROB_MIN = 1e-15;
/** Largest representable probability below 1 */
const PROB_MAX = 1 - PROB_MIN;

/**
 * Binary search: returns the maximum integer number of shares purchasable
 * for `fpAmount` FP at the current market state.
 *
 * Upper bound derivation: in the worst case (shares all on one side, other
 * side is 0) the minimum cost per share approaches 0 as b→∞, but for a
 * fixed b the marginal cost of the first share is b*log(1 + exp(-0)) ≈ 0.693.
 * To be safe, use fpAmount / 0.001 as a generous upper bound, capped at 1e9.
 */
export function lmsrSharesForFp(
  b: number,
  qYes: number,
  qNo: number,
  fpAmount: number,
  side: "yes" | "no"
): number {
  let lo = 1;
  // Upper bound: even the cheapest possible share costs > 0 FP, so the
  // number of shares is at most fpAmount / (minimum marginal FP per share).
  // We use 2*fpAmount as a safe over-estimate since average cost >= 0.5 per
  // share (LMSR cost grows super-linearly with quantity).
  let hi = Math.ceil(2 * fpAmount);

  // Extend hi until lmsrCost(hi) > fpAmount (guarantees binary search is sound)
  while (lmsrCost(b, qYes, qNo, hi, side) <= fpAmount) {
    hi *= 2;
  }

  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (lmsrCost(b, qYes, qNo, mid, side) <= fpAmount) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return Math.max(1, lo);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Numerically stable log(exp(a) + exp(b)) */
function logSumExp(a: number, b: number): number {
  const maxVal = Math.max(a, b);
  return maxVal + Math.log(Math.exp(a - maxVal) + Math.exp(b - maxVal));
}
