import { clsx } from 'clsx';

export interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  active?: boolean;
  badge?: number;
}

export interface SidebarProps {
  items: SidebarItem[];
  onNavigate: (href: string) => void;
  username?: string;
  onLogout?: () => void;
  logo?: string;
}

export function Sidebar({ items, onNavigate, username, onLogout, logo = 'VenlaxIQ' }: SidebarProps) {
  return (
    <aside className="w-56 bg-surface-2 border-r border-border h-screen flex flex-col sticky top-0">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <span className="font-heading font-extrabold text-text-primary text-base">{logo}</span>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto" aria-label="Sidebar navigation">
        {items.map((item) => (
          <button
            key={item.href}
            onClick={() => onNavigate(item.href)}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left',
              item.active ? 'text-green bg-[rgba(0,212,106,0.08)] border-r-2 border-green' : 'text-text-secondary hover:text-text-primary hover:bg-surface-3',
            )}
            aria-current={item.active ? 'page' : undefined}
          >
            <span className="text-base w-5 text-center" aria-hidden="true">{item.icon}</span>
            {item.label}
            {item.badge != null && item.badge > 0 && (
              <span className="ml-auto bg-orange text-[#0D0D0D] text-[10px] font-bold rounded-full px-1.5 py-0.5" aria-label={`${item.badge} items`}>{item.badge}</span>
            )}
          </button>
        ))}
      </nav>
      {username && (
        <div className="border-t border-border p-4">
          <p className="text-text-secondary text-xs truncate mb-2">{username}</p>
          {onLogout && (
            <button onClick={onLogout} className="text-xs text-text-secondary hover:text-[#FF3B30] transition-colors">
              Log out
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
