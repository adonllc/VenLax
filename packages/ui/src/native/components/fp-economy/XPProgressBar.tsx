import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type XpLevel = 'rookie' | 'analyst' | 'expert' | 'master' | 'legend';

export interface XPProgressBarProps {
  level: XpLevel;
  xp: number;
  nextLevelXp: number;
}

const levelLabels: Record<XpLevel, string> = {
  rookie: 'Rookie', analyst: 'Analyst', expert: 'Expert', master: 'Master', legend: 'Legend',
};

export function XPProgressBar({ level, xp, nextLevelXp }: XPProgressBarProps) {
  const pct = level === 'legend' ? 100 : Math.min(100, Math.round((xp / nextLevelXp) * 100));
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.level}>{levelLabels[level]}</Text>
        <Text style={styles.xp}>{xp.toLocaleString()} XP</Text>
      </View>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      {level !== 'legend' && <Text style={styles.next}>{nextLevelXp.toLocaleString()} XP to next level</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  level: { color: colors.orange, fontWeight: '600', fontSize: 12 },
  xp: { color: colors.dark.textSecondary, fontSize: 12, fontFamily: 'monospace' },
  track: { height: 8, backgroundColor: colors.dark.surface3, borderRadius: 4, overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: colors.orange, borderRadius: 4 },
  next: { color: colors.dark.textSecondary, fontSize: 10, marginTop: 4 },
});
