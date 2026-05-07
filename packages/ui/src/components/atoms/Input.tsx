import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-describedby={errorId}
        className={twMerge(clsx(
          'h-10 w-full rounded-xl bg-surface-3 border px-3 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors',
          error ? 'border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]' : 'border-border focus:border-green focus:ring-1 focus:ring-green',
          className,
        ))}
        {...props}
      />
      {error && <p id={errorId} className="text-xs text-[#FF3B30]">{error}</p>}
      {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  );
}
