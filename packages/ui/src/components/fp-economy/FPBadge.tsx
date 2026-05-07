export interface FPBadgeProps {
  amount: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

export function FPBadge({ amount, label, size = 'md' }: FPBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold text-lemon ${sizes[size]}`}>
      ⚡ {amount.toLocaleString()} FP
      {label && <span className="text-text-secondary font-normal text-xs ml-1">{label}</span>}
    </span>
  );
}
