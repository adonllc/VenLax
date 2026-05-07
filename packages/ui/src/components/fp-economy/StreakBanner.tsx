export interface StreakBannerProps {
  day: number;
  multiplier: number;
  dailyFp: number;
  onClaim?: () => void;
  claimed?: boolean;
  claimLoading?: boolean;
}

export function StreakBanner({ day, multiplier, dailyFp, onClaim, claimed, claimLoading }: StreakBannerProps) {
  const glowing = day >= 7;
  return (
    <div className={`rounded-xl p-4 border ${glowing ? 'border-lemon/40 bg-[rgba(255,230,0,0.08)]' : 'border-border bg-surface-2'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lemon text-xs font-bold uppercase tracking-wide mb-1">
            {glowing ? '🔥 ' : ''}Day {day} Streak
          </p>
          <p className="text-text-primary font-semibold">
            {multiplier}× multiplier · <span className="text-lemon font-mono">⚡ {dailyFp.toLocaleString()} FP</span>
          </p>
        </div>
        {onClaim && !claimed && (
          <button
            onClick={onClaim}
            disabled={claimLoading}
            className="bg-lemon text-[#0D0D0D] font-semibold text-sm px-4 py-2 rounded-lg hover:bg-yellow-300 disabled:opacity-50"
            aria-label="Claim daily streak reward"
          >
            {claimLoading ? '...' : 'Claim'}
          </button>
        )}
        {claimed && <span className="text-green text-sm font-semibold">✓ Claimed</span>}
      </div>
    </div>
  );
}
