import { FPBadge } from '../fp-economy/FPBadge';
import { Avatar } from '../atoms/Avatar';
import { NotificationBell } from './NotificationBell';

export interface TopBarProps {
  username?: string;
  avatarUrl?: string | null;
  fpBalance?: number;
  unreadCount?: number;
  onNotifications?: () => void;
  onProfile?: () => void;
  onSearch?: () => void;
  children?: React.ReactNode;
}

export function TopBar({ username, avatarUrl, fpBalance, unreadCount = 0, onNotifications, onProfile, onSearch, children }: TopBarProps) {
  return (
    <header className="h-14 bg-surface border-b border-border flex items-center px-4 gap-3 sticky top-0 z-40">
      <span className="font-heading font-extrabold text-text-primary text-lg tracking-tight">VenlaxIQ</span>
      <div className="flex-1">{children}</div>
      <div className="flex items-center gap-3">
        {onSearch && (
          <button onClick={onSearch} className="text-text-secondary hover:text-text-primary transition-colors p-1" aria-label="Search">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}
        {fpBalance != null && <FPBadge amount={fpBalance} size="sm" />}
        {onNotifications && <NotificationBell unreadCount={unreadCount} onClick={onNotifications} />}
        {username && (
          <button onClick={onProfile} className="flex items-center" aria-label={`Profile: ${username}`}>
            <Avatar name={username} src={avatarUrl} size="sm" />
          </button>
        )}
      </div>
    </header>
  );
}
