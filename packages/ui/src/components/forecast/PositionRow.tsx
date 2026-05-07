import { clsx } from 'clsx';
import { Button } from '../atoms/Button';

export interface PositionRowProps {
  side: boolean; // true = Yes, false = No
  shares: number;
  fpDeployed: number;
  priceAtEntry: number;
  marketTitle: string;
  isWithdrawn: boolean;
  onWithdraw?: () => void;
  withdrawLoading?: boolean;
}

export function PositionRow({ side, shares, fpDeployed, priceAtEntry, marketTitle, isWithdrawn, onWithdraw, withdrawLoading }: PositionRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-sm font-medium truncate">{marketTitle}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className={clsx('text-xs font-semibold font-mono', side ? 'text-green' : 'text-orange')}>
            {side ? 'YES' : 'NO'}
          </span>
          <span className="text-text-secondary text-xs">{shares} shares</span>
          <span className="text-text-secondary text-xs">@ {priceAtEntry}%</span>
          <span className="text-text-secondary text-xs font-mono">⚡ {fpDeployed.toLocaleString()} FP deployed</span>
        </div>
      </div>
      {!isWithdrawn && onWithdraw && (
        <Button variant="secondary" size="sm" onClick={onWithdraw} loading={withdrawLoading}>
          Withdraw
        </Button>
      )}
      {isWithdrawn && (
        <span className="text-text-secondary text-xs">Withdrawn</span>
      )}
    </div>
  );
}
