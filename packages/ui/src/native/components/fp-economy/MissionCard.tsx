import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface MissionCardProps {
  title: string;
  fpReward: number;
  progress: number;
  total: number;
  completed: boolean;
}

export function MissionCard({ title, fpReward, progress, total, completed }: MissionCardProps) {
  const pct = Math.min(100, Math.round((progress / total) * 100));
  return (
    <View style={[styles.card, completed && styles.completed]}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.reward}>+{fpReward.toLocaleString()} FP</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={styles.progress}>{progress}/{total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface3, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.dark.border, gap: 8 },
  completed: { borderColor: 'rgba(0,212,106,0.3)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { color: colors.dark.textPrimary, fontSize: 13, fontWeight: '500', flex: 1 },
  reward: { color: colors.lemon, fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  track: { height: 6, backgroundColor: colors.dark.surface3, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: colors.dark.border },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: colors.green, borderRadius: 3 },
  progress: { color: colors.dark.textSecondary, fontSize: 11 },
});
