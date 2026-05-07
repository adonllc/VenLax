import { clsx } from 'clsx';

export type MarketCategory = 'sports' | 'politics' | 'open';

export interface CategoryPillProps {
  category: MarketCategory;
  className?: string;
}

const config: Record<MarketCategory, { label: string; cls: string }> = {
  sports:   { label: 'Sports',   cls: 'text-green bg-[rgba(0,212,106,0.10)]' },
  politics: { label: 'Politics', cls: 'text-lemon bg-[rgba(255,230,0,0.10)]' },
  open:     { label: 'Open',     cls: 'text-text-secondary bg-surface-3' },
};

export function CategoryPill({ category, className }: CategoryPillProps) {
  const { label, cls } = config[category];
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', cls, className)}>
      {label}
    </span>
  );
}
