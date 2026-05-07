import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface BadgeDisplayProps {
  name: string;
  icon: string;
  fpReward: number;
  unlocked: boolean;
  earnedAt?: Date;
}

export function BadgeDisplay({ name, icon, fpReward, unlocked, earnedAt }: BadgeDisplayProps) {
  return (
    <View style={[styles.card, !unlocked && styles.locked]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.reward}>⚡ {fpReward.toLocaleString()}</Text>
      {unlocked && earnedAt && <Text style={styles.date}>{earnedAt.toLocaleDateString()}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,212,106,0.2)', backgroundColor: colors.dark.surface3, gap: 4 },
  locked: { opacity: 0.4, borderColor: colors.dark.border },
  icon: { fontSize: 28 },
  name: { color: colors.dark.textPrimary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  reward: { color: colors.lemon, fontSize: 11, fontFamily: 'monospace' },
  date: { color: colors.dark.textSecondary, fontSize: 10 },
});
