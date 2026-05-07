import { clsx } from 'clsx';
import { ProbabilityBar } from './ProbabilityBar';
import { MarketStatusChip, MarketStatus } from './MarketStatusChip';
import { CategoryPill, MarketCategory } from './CategoryPill';

export interface MarketCardProps {
  id: string;
  title: string;
  category: MarketCategory;
  status: MarketStatus;
  yesProb: number;
  closesAt: Date;
  totalVolumeFp?: number;
  onClick?: () => void;
  className?: string;
}

export function MarketCard({ id: _id, title, category, status, yesProb, closesAt, totalVolumeFp, onClick, className }: MarketCardProps) {
  const closingSoon = status === 'open' && (closesAt.getTime() - Date.now()) < 3_600_000;
  const probColor = yesProb >= 50 ? 'text-green' : 'text-orange';

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-surface-2 border border-border rounded-xl p-4 transition-colors',
        onClick && 'cursor-pointer hover:border-green/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-text-primary font-semibold text-sm leading-snug flex-1">{title}</h3>
        <MarketStatusChip status={status} />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <CategoryPill category={category} />
        {closingSoon && (
          <span className="text-orange text-xs font-semibold">Closing soon</span>
        )}
      </div>
      <ProbabilityBar yesProb={yesProb} />
      <div className="flex items-center justify-between mt-3">
        <span className={clsx('font-mono font-bold text-xl', probColor)}>{yesProb}%</span>
        {totalVolumeFp != null && (
          <span className="text-text-secondary text-xs font-mono">⚡ {totalVolumeFp.toLocaleString()} FP</span>
        )}
      </div>
    </div>
  );
}
