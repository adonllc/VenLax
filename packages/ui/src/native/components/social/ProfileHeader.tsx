import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
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
    <View style={styles.card}>
      <View style={styles.row}>
        <Avatar name={username} src={avatarUrl} size="lg" />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{username}</Text>
            <SubscriptionBadge tier={tier} />
            <Text style={styles.level}>{xpLevel}</Text>
          </View>
          <Text style={[styles.accuracy, { color: accuracy >= 70 ? colors.green : colors.orange }]}>{accuracy}% accuracy</Text>
          <View style={styles.counts}>
            <Text style={styles.count}><Text style={styles.bold}>{followerCount}</Text> followers</Text>
            {followingCount != null && <Text style={styles.count}><Text style={styles.bold}>{followingCount}</Text> following</Text>}
          </View>
        </View>
        {!isOwnProfile && <FollowButton isFollowing={isFollowing} onFollow={onFollow} loading={followLoading} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface3, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: colors.dark.border },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  username: { color: colors.dark.textPrimary, fontWeight: '700', fontSize: 16 },
  level: { color: colors.orange, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  accuracy: { fontWeight: '700', fontSize: 13, fontFamily: 'monospace' },
  counts: { flexDirection: 'row', gap: 16 },
  count: { color: colors.dark.textSecondary, fontSize: 12 },
  bold: { color: colors.dark.textPrimary, fontWeight: '600' },
});
