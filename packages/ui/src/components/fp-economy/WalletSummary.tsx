export interface WalletSummaryProps {
  earnedFp: number;
  expiresAt: Date | null;
}

export function WalletSummary({ earnedFp, expiresAt }: WalletSummaryProps) {
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400_000)) : null;
  return (
    <div className="bg-surface-2 border border-lemon/20 rounded-xl p-5">
      <p className="text-text-secondary text-xs uppercase tracking-wide mb-1">Redeemable FP Balance</p>
      <p className="text-lemon font-mono font-bold text-3xl">⚡ {earnedFp.toLocaleString()}</p>
      {daysLeft != null && (
        <p className={`text-xs mt-2 ${daysLeft < 14 ? 'text-orange' : 'text-text-secondary'}`}>
          Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
