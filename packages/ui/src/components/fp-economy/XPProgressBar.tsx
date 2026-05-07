export type XpLevel = 'rookie' | 'analyst' | 'expert' | 'master' | 'legend';

export interface XPProgressBarProps {
  level: XpLevel;
  xp: number;
  nextLevelXp: number;
}

const levelLabels: Record<XpLevel, string> = {
  rookie: 'Rookie', analyst: 'Analyst', expert: 'Expert', master: 'Master', legend: 'Legend',
};

export function XPProgressBar({ level, xp, nextLevelXp }: XPProgressBarProps) {
  const pct = level === 'legend' ? 100 : Math.min(100, Math.round((xp / nextLevelXp) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-orange font-semibold">{levelLabels[level]}</span>
        <span className="text-text-secondary font-mono">{xp.toLocaleString()} XP</span>
      </div>
      <div className="h-2 bg-surface-3 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${levelLabels[level]} XP progress`}>
        <div className="h-full bg-orange transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      {level !== 'legend' && (
        <p className="text-text-secondary text-[10px] mt-1">{nextLevelXp.toLocaleString()} XP to next level</p>
      )}
    </div>
  );
}
