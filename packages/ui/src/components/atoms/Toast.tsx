import { clsx } from 'clsx';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
}

const variants: Record<ToastVariant, { cls: string; icon: string }> = {
  success: { cls: 'border-green bg-[rgba(0,212,106,0.10)] text-green', icon: '✓' },
  error: { cls: 'border-[#FF3B30] bg-[rgba(255,59,48,0.10)] text-[#FF3B30]', icon: '✕' },
  info: { cls: 'border-border bg-surface-2 text-text-primary', icon: 'ℹ' },
};

export function Toast({ message, variant = 'info', onClose }: ToastProps) {
  const { cls, icon } = variants[variant];
  return (
    <div className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg', cls)}>
      <span className="text-base">{icon}</span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
      )}
    </div>
  );
}
