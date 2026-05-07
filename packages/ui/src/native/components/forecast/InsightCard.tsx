import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Button } from '../atoms/Button';

export interface InsightSignal {
  suggestedProbability: number;
  confidence: number;
  keyFactors: string[];
  sourceUrls: string[];
}

export interface InsightCardProps {
  tier: 'free' | 'pro' | 'elite';
  signal?: InsightSignal;
  onUpgrade?: () => void;
}

export function InsightCard({ tier, signal, onUpgrade }: InsightCardProps) {
  if (tier === 'free') {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>AI Insight Signal</Text>
          <Text style={styles.gated}>Pro+ only</Text>
        </View>
        <Text style={styles.secondary}>Upgrade to Pro to see AI-generated probability estimates.</Text>
        <Button variant="primary" size="sm" onPress={onUpgrade}>Upgrade to Pro</Button>
      </View>
    );
  }
  if (!signal) {
    return (
      <View style={styles.card}>
        <Text style={styles.label}>AI Insight Signal</Text>
        <Text style={styles.secondary}>Signal generating — check back in a few hours.</Text>
      </View>
    );
  }
  const stars = Array.from({ length: 5 }, (_, i) => i < signal.confidence ? '★' : '☆').join('');
  const probColor = signal.suggestedProbability >= 50 ? colors.green : colors.orange;
  return (
    <View style={[styles.card, styles.cardSignal]}>
      <View style={styles.row}>
        <Text style={styles.label}>AI Insight Signal</Text>
        <Text style={styles.stars}>{stars}</Text>
      </View>
      <Text style={[styles.prob, { color: probColor }]}>{signal.suggestedProbability}%</Text>
      {signal.keyFactors.map((f, i) => (
        <Text key={i} style={styles.factor}>• {f}</Text>
      ))}
      <Text style={styles.disclaimer}>Not financial advice. For educational purposes only.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface3, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.dark.border, gap: 8 },
  cardSignal: { borderColor: 'rgba(255,230,0,0.2)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: colors.lemon, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  gated: { color: colors.dark.textSecondary, fontSize: 11 },
  secondary: { color: colors.dark.textSecondary, fontSize: 13 },
  prob: { fontSize: 24, fontWeight: '700', fontFamily: 'monospace' },
  stars: { color: colors.lemon, fontSize: 14 },
  factor: { color: colors.dark.textPrimary, fontSize: 12 },
  disclaimer: { color: colors.dark.textSecondary, fontSize: 10 },
});
