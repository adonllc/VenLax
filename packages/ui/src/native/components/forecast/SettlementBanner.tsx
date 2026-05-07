import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface SettlementBannerProps {
  fpEarned: number;
  outcome: boolean;
  userSide?: boolean;
}

export function SettlementBanner({ fpEarned, outcome, userSide }: SettlementBannerProps) {
  const won = userSide === outcome;
  return (
    <View style={[styles.card, won && styles.cardWon]}>
      <Text style={styles.label}>Market Settled</Text>
      <Text style={styles.outcome}>
        Outcome: <Text style={{ color: outcome ? colors.green : colors.orange }}>{outcome ? 'YES' : 'NO'}</Text>
      </Text>
      {fpEarned > 0 && <Text style={styles.earned}>+{fpEarned.toLocaleString()} FP earned</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.dark.border, backgroundColor: colors.dark.surface3 },
  cardWon: { backgroundColor: 'rgba(0,212,106,0.10)', borderColor: 'rgba(0,212,106,0.3)' },
  label: { color: colors.dark.textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  outcome: { color: colors.dark.textPrimary, fontWeight: '600', fontSize: 14 },
  earned: { color: colors.lemon, fontWeight: '700', fontSize: 18, fontFamily: 'monospace', marginTop: 4 },
});
