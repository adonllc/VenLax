import { clsx } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export function Select({ label, options, error, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'h-10 w-full rounded-xl bg-surface-3 border border-border px-3 text-sm text-text-primary outline-none focus:border-green focus:ring-1 focus:ring-green',
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-[#FF3B30]">{error}</p>}
    </div>
  );
}
