import { clsx } from 'clsx';
import { Avatar } from '../atoms/Avatar';

export interface LeaderboardRowProps {
  rank: number;
  username: string;
  accuracy: number;
  fpEarned: number;
  avatarUrl: string | null;
  isCurrentUser: boolean;
}

export function LeaderboardRow({ rank, username, accuracy, fpEarned, avatarUrl, isCurrentUser }: LeaderboardRowProps) {
  return (
    <div className={clsx('flex items-center gap-3 py-3 border-b border-border last:border-0', isCurrentUser && 'bg-[rgba(0,212,106,0.05)] rounded-lg px-2')}>
      <span className="font-mono font-bold text-sm text-text-secondary w-8 shrink-0">#{rank}</span>
      <Avatar name={username} src={avatarUrl} size="sm" />
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium truncate', isCurrentUser ? 'text-green' : 'text-text-primary')}>{username}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={clsx('font-mono text-sm font-bold', accuracy >= 70 ? 'text-green' : 'text-orange')}>{accuracy}%</p>
        <p className="text-text-secondary text-xs font-mono">⚡ {fpEarned.toLocaleString()}</p>
      </div>
    </div>
  );
}
