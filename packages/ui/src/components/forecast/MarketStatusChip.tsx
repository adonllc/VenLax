import { clsx } from 'clsx';

export type MarketStatus = 'draft' | 'open' | 'closed' | 'resolved' | 'settled';

export interface MarketStatusChipProps {
  status: MarketStatus;
}

const config: Record<MarketStatus, { label: string; cls: string }> = {
  draft:    { label: 'Draft',    cls: 'bg-surface-3 text-text-secondary border-border' },
  open:     { label: 'Open',     cls: 'bg-[rgba(0,212,106,0.15)] text-green border-green/30' },
  closed:   { label: 'Closed',   cls: 'bg-[rgba(255,107,0,0.15)] text-orange border-orange/30' },
  resolved: { label: 'Resolved', cls: 'bg-[rgba(255,230,0,0.15)] text-lemon border-lemon/30' },
  settled:  { label: 'Settled',  cls: 'bg-surface-3 text-text-secondary border-border' },
};

export function MarketStatusChip({ status }: MarketStatusChipProps) {
  const { label, cls } = config[status];
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0', cls)}>
      {label}
    </span>
  );
}
