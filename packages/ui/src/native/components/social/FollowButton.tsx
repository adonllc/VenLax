import React from 'react';
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
      onPress={onFollow}
      loading={loading}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
