export interface TrustSummaryProps {
  verifiedCount: number;
  totalCount: number;
  averageRating: number;
}

export function TrustSummary({ verifiedCount, totalCount, averageRating }: TrustSummaryProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4 flex items-center gap-6">
      <div>
        <p className="text-text-primary font-mono font-bold text-3xl">{averageRating.toFixed(1)}</p>
        <p className="text-text-secondary text-xs">{totalCount} reviews</p>
      </div>
      <div className="border-l border-border pl-6">
        <p className="text-green font-semibold text-sm">{verifiedCount} Verified</p>
        <p className="text-text-secondary text-xs">{totalCount - verifiedCount} unverified</p>
      </div>
    </div>
  );
}
