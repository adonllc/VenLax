import { clsx } from 'clsx';
import { Button } from '../atoms/Button';

export interface InsightSignal {
  suggestedProbability: number;
  confidence: number; // 1–5
  keyFactors: string[];
  sourceUrls: string[];
}

export interface InsightCardProps {
  tier: 'free' | 'pro' | 'elite';
  signal?: InsightSignal;
  onFirstView?: () => void;
  onUpgrade?: () => void;
}

export function InsightCard({ tier, signal, onUpgrade }: InsightCardProps) {
  if (tier === 'free') {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lemon text-xs font-bold uppercase tracking-wide">AI Insight Signal</span>
          <span className="text-xs text-text-secondary">Pro+ only</span>
        </div>
        <p className="text-text-secondary text-sm mb-3">Upgrade to Pro to see AI-generated probability estimates and key factors.</p>
        <Button variant="primary" size="sm" onClick={onUpgrade}>Upgrade to Pro</Button>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <span className="text-lemon text-xs font-bold uppercase tracking-wide">AI Insight Signal</span>
        <p className="text-text-secondary text-sm mt-2">Signal generating — check back in a few hours.</p>
      </div>
    );
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < signal.confidence ? '★' : '☆').join('');

  return (
    <div className="bg-surface-2 border border-lemon/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lemon text-xs font-bold uppercase tracking-wide">AI Insight Signal</span>
        <span className="text-lemon text-sm font-mono">{stars}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className={clsx('font-mono font-bold text-2xl', signal.suggestedProbability >= 50 ? 'text-green' : 'text-orange')}>
          {signal.suggestedProbability}%
        </span>
        <span className="text-text-secondary text-xs">suggested probability</span>
      </div>
      <ul className="space-y-1 mb-3">
        {signal.keyFactors.map((f, i) => (
          <li key={i} className="text-text-primary text-xs flex gap-2">
            <span className="text-lemon">•</span>{f}
          </li>
        ))}
      </ul>
      <p className="text-text-secondary text-[10px]">Not financial advice. For educational purposes only.</p>
    </div>
  );
}
