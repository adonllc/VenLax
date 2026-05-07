import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface WalletSummaryProps {
  earnedFp: number;
  expiresAt: Date | null;
}

export function WalletSummary({ earnedFp, expiresAt }: WalletSummaryProps) {
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400_000)) : null;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Redeemable FP Balance</Text>
      <Text style={styles.balance}>⚡ {earnedFp.toLocaleString()}</Text>
      {daysLeft != null && (
        <Text style={[styles.expiry, { color: daysLeft < 14 ? colors.orange : colors.dark.textSecondary }]}>
          Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface3, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: 'rgba(255,230,0,0.2)' },
  label: { color: colors.dark.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  balance: { color: colors.lemon, fontWeight: '700', fontSize: 28, fontFamily: 'monospace' },
  expiry: { fontSize: 12, marginTop: 8 },
});
