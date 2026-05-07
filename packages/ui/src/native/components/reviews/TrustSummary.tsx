import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface TrustSummaryProps {
  verifiedCount: number;
  totalCount: number;
  averageRating: number;
}

export function TrustSummary({ verifiedCount, totalCount, averageRating }: TrustSummaryProps) {
  return (
    <View style={styles.card}>
      <View style={styles.ratingBlock}>
        <Text style={styles.rating}>{averageRating.toFixed(1)}</Text>
        <Text style={styles.count}>{totalCount} reviews</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.verifiedBlock}>
        <Text style={styles.verified}>{verifiedCount} Verified</Text>
        <Text style={styles.unverified}>{totalCount - verifiedCount} unverified</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface3, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.dark.border, flexDirection: 'row', alignItems: 'center', gap: 24 },
  ratingBlock: { gap: 2 },
  rating: { color: colors.dark.textPrimary, fontWeight: '700', fontSize: 28, fontFamily: 'monospace' },
  count: { color: colors.dark.textSecondary, fontSize: 11 },
  divider: { width: 1, height: 40, backgroundColor: colors.dark.border },
  verifiedBlock: { gap: 2 },
  verified: { color: colors.green, fontWeight: '600', fontSize: 13 },
  unverified: { color: colors.dark.textSecondary, fontSize: 11 },
});
