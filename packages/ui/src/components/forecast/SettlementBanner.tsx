export interface SettlementBannerProps {
  fpEarned: number;
  outcome: boolean;
  userSide?: boolean;
}

export function SettlementBanner({ fpEarned, outcome, userSide }: SettlementBannerProps) {
  const won = userSide === outcome;
  return (
    <div className={`rounded-xl p-4 border ${won ? 'bg-[rgba(0,212,106,0.10)] border-green/30' : 'bg-surface-2 border-border'}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1">Market Settled</p>
      <p className="text-text-primary font-semibold">
        Outcome: <span className={outcome ? 'text-green' : 'text-orange'}>{outcome ? 'YES' : 'NO'}</span>
      </p>
      {fpEarned > 0 && (
        <p className="text-lemon font-mono font-bold text-lg mt-1">
          +{fpEarned.toLocaleString()} FP earned
        </p>
      )}
    </div>
  );
}
