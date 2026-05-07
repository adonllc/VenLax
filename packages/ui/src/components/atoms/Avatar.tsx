import { clsx } from 'clsx';

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover bg-surface-3', sizes[size], className)}
      />
    );
  }
  return (
    <div className={clsx('rounded-full bg-surface-3 border border-border flex items-center justify-center font-semibold text-text-primary', sizes[size], className)}>
      {initials(name)}
    </div>
  );
}
