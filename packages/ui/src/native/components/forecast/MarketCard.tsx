import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { ProbabilityBar } from './ProbabilityBar';
import { MarketStatusChip, MarketStatus } from './MarketStatusChip';
import { CategoryPill, MarketCategory } from './CategoryPill';

export interface MarketCardProps {
  id: string;
  title: string;
  category: MarketCategory;
  status: MarketStatus;
  yesProb: number;
  closesAt: Date;
  totalVolumeFp?: number;
  onPress?: () => void;
}

export function MarketCard({ id: _id, title, category, status, yesProb, closesAt, totalVolumeFp, onPress }: MarketCardProps) {
  const closingSoon = status === 'open' && (closesAt.getTime() - Date.now()) < 3_600_000;
  const probColor = yesProb >= 50 ? colors.green : colors.orange;

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <MarketStatusChip status={status} />
      </View>
      <View style={styles.pills}>
        <CategoryPill category={category} />
        {closingSoon && <Text style={styles.closingSoon}>Closing soon</Text>}
      </View>
      <ProbabilityBar yesProb={yesProb} />
      <View style={styles.footer}>
        <Text style={[styles.prob, { color: probColor }]}>{yesProb}%</Text>
        {totalVolumeFp != null && <Text style={styles.volume}>⚡ {totalVolumeFp.toLocaleString()} FP</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface3, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.dark.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  title: { color: colors.dark.textPrimary, fontWeight: '600', fontSize: 14, flex: 1, lineHeight: 20 },
  pills: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  closingSoon: { color: colors.orange, fontSize: 12, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  prob: { fontWeight: '700', fontSize: 20, fontFamily: 'monospace' },
  volume: { color: colors.dark.textSecondary, fontSize: 11, fontFamily: 'monospace' },
});
