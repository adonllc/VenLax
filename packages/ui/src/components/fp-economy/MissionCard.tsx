export interface MissionCardProps {
  title: string;
  fpReward: number;
  progress: number;
  total: number;
  completed: boolean;
  onComplete?: () => void;
}

export function MissionCard({ title, fpReward, progress, total, completed }: MissionCardProps) {
  const pct = Math.min(100, Math.round((progress / total) * 100));
  return (
    <div className={`bg-surface-2 border rounded-xl p-3 ${completed ? 'border-green/30' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-text-primary text-sm font-medium">{title}</p>
        <span className="text-lemon text-xs font-mono font-bold shrink-0">+{fpReward.toLocaleString()} FP</span>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div className="h-full bg-green transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-text-secondary text-xs mt-1">{progress}/{total}</p>
    </div>
  );
}
