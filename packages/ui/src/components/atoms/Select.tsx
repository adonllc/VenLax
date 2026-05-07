import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  const errorId = error ? `${selectId}-error` : undefined;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-describedby={errorId}
        className={twMerge(clsx(
          'h-10 w-full rounded-xl bg-surface-3 border px-3 text-sm text-text-primary outline-none',
          error ? 'border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]' : 'border-border focus:border-green focus:ring-1 focus:ring-green',
          className,
        ))}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p id={errorId} className="text-xs text-[#FF3B30]">{error}</p>}
    </div>
  );
}
