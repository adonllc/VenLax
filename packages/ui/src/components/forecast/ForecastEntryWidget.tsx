'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '../atoms/Button';

export interface ForecastEntryWidgetProps {
  marketId: string;
  yesProb: number;
  fpBalance: number;
  maxFp: number;
  onSubmit: (side: boolean, fpAmount: number) => Promise<void>;
  isLoggedIn: boolean;
  onLoginPrompt?: () => void;
}

export function ForecastEntryWidget({ yesProb, fpBalance, maxFp, onSubmit, isLoggedIn, onLoginPrompt }: ForecastEntryWidgetProps) {
  const [side, setSide] = useState<boolean | null>(null);
  const [fp, setFp] = useState(100);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4 text-center">
        <p className="text-text-secondary text-sm mb-3">Log in to make a forecast entry</p>
        <Button variant="primary" size="sm" onClick={onLoginPrompt}>Log in</Button>
      </div>
    );
  }

  const cost = Math.min(fp, fpBalance);
  const prob = side === true ? yesProb : side === false ? (100 - yesProb) : null;

  async function handleSubmit() {
    if (side === null) return;
    setLoading(true);
    try { await onSubmit(side, fp); } finally { setLoading(false); }
  }

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => setSide(true)}
          className={clsx('flex-1 h-12 rounded-xl font-semibold text-sm transition-all', side === true ? 'bg-green text-[#0D0D0D]' : 'bg-surface-3 text-green border border-green/40 hover:bg-green/10')}
        >
          YES · {yesProb}%
        </button>
        <button
          onClick={() => setSide(false)}
          className={clsx('flex-1 h-12 rounded-xl font-semibold text-sm transition-all', side === false ? 'bg-orange text-[#0D0D0D]' : 'bg-surface-3 text-orange border border-orange/40 hover:bg-orange/10')}
        >
          NO · {100 - yesProb}%
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-text-secondary">
          <span>FP to deploy</span>
          <span className="font-mono font-bold text-lemon">⚡ {fpBalance.toLocaleString()} FP balance</span>
        </div>
        <input
          type="range"
          min={50}
          max={Math.min(maxFp, fpBalance)}
          value={fp}
          onChange={(e) => setFp(Number(e.target.value))}
          className="w-full accent-green"
        />
        <div className="flex justify-between">
          <span className="font-mono text-lemon text-sm">⚡ {cost.toLocaleString()} FP</span>
          {prob != null && <span className="text-text-secondary text-xs">implied {prob}%</span>}
        </div>
      </div>
      <Button
        variant="primary"
        className="w-full"
        disabled={side === null || fp < 50}
        loading={loading}
        onClick={handleSubmit}
      >
        Enter Forecast
      </Button>
      <p className="text-text-secondary text-[10px] text-center">Y = Yes · N = No · Enter to confirm</p>
    </div>
  );
}
