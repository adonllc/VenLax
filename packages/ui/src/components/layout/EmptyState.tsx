import { Button } from '../atoms/Button';

export interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4" aria-hidden="true">{icon}</span>
      <h3 className="text-text-primary font-semibold text-lg mb-2">{title}</h3>
      <p className="text-text-secondary text-sm max-w-sm mb-4">{description}</p>
      {ctaLabel && onCta && (
        <Button variant="primary" onClick={onCta}>{ctaLabel}</Button>
      )}
    </div>
  );
}
