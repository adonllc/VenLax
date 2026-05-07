import { clsx } from 'clsx';

export interface TabItem {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

export interface BottomTabBarProps {
  items: TabItem[];
  onNavigate: (href: string) => void;
}

export function BottomTabBar({ items, onNavigate }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-surface-2 border-t border-border flex h-16 z-50" aria-label="Bottom navigation">
      {items.map((item) => (
        <button
          key={item.href}
          onClick={() => onNavigate(item.href)}
          className={clsx(
            'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
            item.active ? 'text-green' : 'text-text-secondary hover:text-text-primary',
          )}
          aria-current={item.active ? 'page' : undefined}
          aria-label={item.label}
        >
          <span className="text-xl leading-none" aria-hidden="true">{item.icon}</span>
          <span className="text-[10px] font-semibold">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
