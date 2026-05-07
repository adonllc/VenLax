export interface ProbabilityBarProps {
  yesProb: number; // 0–100
}

export function ProbabilityBar({ yesProb }: ProbabilityBarProps) {
  const noProb = 100 - yesProb;
  return (
    <div className="relative h-2 rounded-full overflow-hidden bg-orange">
      <div
        className="absolute inset-y-0 left-0 bg-green rounded-full transition-all duration-300"
        style={{ width: `${yesProb}%` }}
      />
      <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
        <span className="text-[9px] font-mono font-bold text-[#0D0D0D] leading-none">YES {yesProb}%</span>
        <span className="text-[9px] font-mono font-bold text-[#0D0D0D] leading-none">NO {noProb}%</span>
      </div>
    </div>
  );
}
