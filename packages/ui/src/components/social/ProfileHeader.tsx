import { Avatar } from '../atoms/Avatar';
import { SubscriptionBadge, SubscriptionTier } from '../fp-economy/SubscriptionBadge';
import { FollowButton } from './FollowButton';
import { XpLevel } from '../fp-economy/XPProgressBar';

export interface ProfileHeaderProps {
  username: string;
  avatarUrl: string | null;
  tier: SubscriptionTier;
  xpLevel: XpLevel;
  accuracy: number;
  isOwnProfile: boolean;
  isFollowing: boolean;
  followerCount: number;
  followingCount?: number;
  onFollow: () => void;
  followLoading?: boolean;
}

export function ProfileHeader({ username, avatarUrl, tier, xpLevel, accuracy, isOwnProfile, isFollowing, followerCount, followingCount, onFollow, followLoading }: ProfileHeaderProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-5">
      <div className="flex items-start gap-4">
        <Avatar name={username} src={avatarUrl} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-text-primary font-bold text-lg">{username}</h2>
            <SubscriptionBadge tier={tier} />
            <span className="text-orange text-xs font-semibold capitalize">{xpLevel}</span>
          </div>
          <p className={`font-mono text-sm font-bold mb-2 ${accuracy >= 70 ? 'text-green' : 'text-orange'}`}>{accuracy}% accuracy</p>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span><strong className="text-text-primary">{followerCount}</strong> followers</span>
            {followingCount != null && <span><strong className="text-text-primary">{followingCount}</strong> following</span>}
          </div>
        </div>
        {!isOwnProfile && (
          <FollowButton isFollowing={isFollowing} onFollow={onFollow} loading={followLoading} />
        )}
      </div>
    </div>
  );
}
