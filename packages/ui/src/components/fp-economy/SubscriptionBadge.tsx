export type SubscriptionTier = 'free' | 'pro' | 'elite';

export interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
}

const config: Record<SubscriptionTier, { label: string; cls: string }> = {
  free:  { label: 'Free',  cls: 'bg-surface-3 text-text-secondary border-border' },
  pro:   { label: 'Pro',   cls: 'bg-[rgba(0,212,106,0.15)] text-green border-green/30' },
  elite: { label: 'Elite', cls: 'bg-[rgba(255,230,0,0.15)] text-lemon border-lemon/30' },
};

export function SubscriptionBadge({ tier }: SubscriptionBadgeProps) {
  const { label, cls } = config[tier];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {label}
    </span>
  );
}
