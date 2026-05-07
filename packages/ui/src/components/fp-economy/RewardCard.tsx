import { Button } from '../atoms/Button';

export interface RewardCardProps {
  name: string;
  category: string;
  fpCost: number;
  imageUrl: string | null;
  onRedeem: () => void;
  redeemLoading?: boolean;
  canAfford?: boolean;
}

export function RewardCard({ name, category, fpCost, imageUrl, onRedeem, redeemLoading, canAfford = true }: RewardCardProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
      <div className="h-28 bg-surface-3 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl" aria-hidden="true">🎁</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-text-secondary text-[10px] uppercase tracking-wide mb-0.5">{category}</p>
        <p className="text-text-primary text-sm font-semibold mb-2">{name}</p>
        <div className="flex items-center justify-between">
          <span className="text-lemon font-mono text-sm font-bold">⚡ {fpCost.toLocaleString()} FP</span>
          <Button variant="primary" size="sm" onClick={onRedeem} loading={redeemLoading} disabled={!canAfford}>
            Redeem
          </Button>
        </div>
        {!canAfford && <p className="text-text-secondary text-[10px] mt-1">Insufficient FP</p>}
      </div>
    </div>
  );
}
