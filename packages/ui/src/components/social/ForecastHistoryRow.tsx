import { clsx } from 'clsx';

export interface ForecastHistoryRowProps {
  marketTitle: string;
  side: boolean;
  outcome: boolean | null;
  fpEarned: number | null;
  settledAt: Date | null;
}

export function ForecastHistoryRow({ marketTitle, side, outcome, fpEarned, settledAt }: ForecastHistoryRowProps) {
  const won = outcome !== null && side === outcome;
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-sm font-medium truncate">{marketTitle}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={clsx('text-xs font-semibold', side ? 'text-green' : 'text-orange')}>{side ? 'YES' : 'NO'}</span>
          {outcome !== null && (
            <span className="text-text-secondary text-xs">→ Settled {outcome ? 'YES' : 'NO'}</span>
          )}
          {settledAt && <span className="text-text-secondary text-xs">{settledAt.toLocaleDateString()}</span>}
        </div>
      </div>
      {fpEarned != null && (
        <span className={clsx('text-sm font-mono font-bold shrink-0', won ? 'text-lemon' : 'text-text-secondary')}>
          {won ? '+' : ''}{fpEarned.toLocaleString()} FP
        </span>
      )}
      {outcome === null && <span className="text-text-secondary text-xs shrink-0">Pending</span>}
    </div>
  );
}
