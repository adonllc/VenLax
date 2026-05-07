export interface AccuracyGaugeProps {
  accuracy: number; // 0–100
  forecastCount: number;
}

export function AccuracyGauge({ accuracy, forecastCount }: AccuracyGaugeProps) {
  const color = accuracy >= 70 ? 'text-green' : 'text-orange';
  const barColor = accuracy >= 70 ? 'bg-green' : 'bg-orange';
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <p className="text-text-secondary text-xs uppercase tracking-wide mb-2">Accuracy Score</p>
      <p className={`font-mono font-bold text-3xl mb-2 ${color}`}>{accuracy}%</p>
      <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-1" role="progressbar" aria-valuenow={accuracy} aria-valuemin={0} aria-valuemax={100} aria-label="Forecast accuracy">
        <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${accuracy}%` }} />
      </div>
      <p className="text-text-secondary text-xs">{forecastCount} forecasts</p>
    </div>
  );
}
