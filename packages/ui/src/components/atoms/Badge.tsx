import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 'green' | 'lemon' | 'orange' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  green: 'bg-[rgba(0,212,106,0.15)] text-green border-green/30',
  lemon: 'bg-[rgba(255,230,0,0.15)] text-lemon border-lemon/30',
  orange: 'bg-[rgba(255,107,0,0.15)] text-orange border-orange/30',
  neutral: 'bg-surface-3 text-text-secondary border-border',
};

export function Badge({ label, variant = 'neutral', className }: BadgeProps) {
  return (
    <span className={twMerge(clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border', variants[variant], className))}>
      {label}
    </span>
  );
}
