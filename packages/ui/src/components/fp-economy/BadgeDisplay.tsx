import { clsx } from 'clsx';

export interface BadgeDisplayProps {
  name: string;
  icon: string;
  fpReward: number;
  unlocked: boolean;
  earnedAt?: Date;
}

export function BadgeDisplay({ name, icon, fpReward, unlocked, earnedAt }: BadgeDisplayProps) {
  return (
    <div className={clsx('flex flex-col items-center p-3 rounded-xl border', unlocked ? 'bg-surface-2 border-green/20' : 'bg-surface-2 border-border opacity-40')}>
      <span className="text-3xl mb-2" aria-hidden="true">{icon}</span>
      <p className="text-text-primary text-xs font-semibold text-center">{name}</p>
      <span className="text-lemon text-xs font-mono mt-1">⚡ {fpReward.toLocaleString()}</span>
      {unlocked && earnedAt && (
        <span className="text-text-secondary text-[10px] mt-1">{earnedAt.toLocaleDateString()}</span>
      )}
    </div>
  );
}
