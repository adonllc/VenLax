import { Button } from '../atoms/Button';

export interface FollowButtonProps {
  isFollowing: boolean;
  onFollow: () => void;
  loading?: boolean;
}

export function FollowButton({ isFollowing, onFollow, loading }: FollowButtonProps) {
  return (
    <Button
      variant={isFollowing ? 'secondary' : 'primary'}
      size="sm"
      onClick={onFollow}
      loading={loading}
      aria-pressed={isFollowing}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
