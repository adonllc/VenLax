export type ReviewBadge = 'none' | 'verified' | 'community_trusted';

export interface VerifiedBadgeProps {
  type: ReviewBadge;
}

export function VerifiedBadge({ type }: VerifiedBadgeProps) {
  if (type === 'none') return null;
  if (type === 'community_trusted') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[rgba(255,230,0,0.15)] text-lemon border border-lemon/30">
        <span aria-hidden="true">★</span>
        <span>Community Trusted</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[rgba(0,212,106,0.15)] text-green border border-green/30">
      <span aria-hidden="true">✓</span>
      <span>Verified</span>
    </span>
  );
}
