interface PolymarketComparisonCardProps {
  polyQuestion: string;
  polyYesPercent: number;
  venlaxYesPercent: number;
  polyUrl: string;
}

export function PolymarketComparisonCard({
  polyQuestion,
  polyYesPercent,
  venlaxYesPercent,
  polyUrl,
}: PolymarketComparisonCardProps) {
  return (
    <div className="mt-4 bg-surface-2 border border-border rounded-xl p-5">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Also trading on Polymarket
      </p>
      <p className="text-sm text-text-primary mb-4 line-clamp-2">{polyQuestion}</p>
      <div className="flex gap-6 items-center">
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-green">{venlaxYesPercent}%</p>
          <p className="text-xs text-text-secondary mt-0.5">VenlaxIQ</p>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-text-primary">{polyYesPercent}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Polymarket</p>
        </div>
      </div>
      <a
        href={polyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-4 text-xs text-text-secondary hover:text-green transition-colors"
      >
        View on Polymarket →
      </a>
    </div>
  );
}
