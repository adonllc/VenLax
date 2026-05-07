import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface StreakBannerProps {
  day: number;
  multiplier: number;
  dailyFp: number;
  onClaim?: () => void;
  claimed?: boolean;
  claimLoading?: boolean;
}

export function StreakBanner({ day, multiplier, dailyFp, onClaim, claimed, claimLoading }: StreakBannerProps) {
  const glowing = day >= 7;
  return (
    <View style={[styles.card, glowing && styles.cardGlowing]}>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>{glowing ? '🔥 ' : ''}Day {day} Streak</Text>
          <Text style={styles.detail}>
            {multiplier}× <Text style={styles.fp}>⚡ {dailyFp.toLocaleString()} FP</Text>
          </Text>
        </View>
        {onClaim && !claimed && (
          <TouchableOpacity onPress={onClaim} disabled={claimLoading} style={styles.claimBtn} accessibilityLabel="Claim daily streak reward">
            <Text style={styles.claimText}>{claimLoading ? '...' : 'Claim'}</Text>
          </TouchableOpacity>
        )}
        {claimed && <Text style={styles.claimed}>✓ Claimed</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.dark.border, backgroundColor: colors.dark.surface3 },
  cardGlowing: { backgroundColor: 'rgba(255,230,0,0.08)', borderColor: 'rgba(255,230,0,0.4)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: colors.lemon, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detail: { color: colors.dark.textPrimary, fontWeight: '600', fontSize: 14 },
  fp: { color: colors.lemon, fontFamily: 'monospace' },
  claimBtn: { backgroundColor: colors.lemon, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  claimText: { color: '#0D0D0D', fontWeight: '600', fontSize: 14 },
  claimed: { color: colors.green, fontWeight: '600', fontSize: 14 },
});
