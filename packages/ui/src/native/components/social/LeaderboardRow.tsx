import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
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
    <View style={[styles.row, isCurrentUser && styles.highlight]}>
      <Text style={styles.rank}>#{rank}</Text>
      <Avatar name={username} src={avatarUrl} size="sm" />
      <Text style={[styles.username, isCurrentUser && { color: colors.green }]} numberOfLines={1}>{username}</Text>
      <View style={styles.stats}>
        <Text style={[styles.accuracy, { color: accuracy >= 70 ? colors.green : colors.orange }]}>{accuracy}%</Text>
        <Text style={styles.fp}>⚡ {fpEarned.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.dark.border },
  highlight: { backgroundColor: 'rgba(0,212,106,0.05)', borderRadius: 8, paddingHorizontal: 8 },
  rank: { color: colors.dark.textSecondary, fontWeight: '700', fontSize: 13, fontFamily: 'monospace', width: 32 },
  username: { color: colors.dark.textPrimary, fontSize: 13, fontWeight: '500', flex: 1 },
  stats: { alignItems: 'flex-end' },
  accuracy: { fontWeight: '700', fontSize: 13, fontFamily: 'monospace' },
  fp: { color: colors.dark.textSecondary, fontSize: 11, fontFamily: 'monospace' },
});
