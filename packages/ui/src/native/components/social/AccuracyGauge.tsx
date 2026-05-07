import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface AccuracyGaugeProps {
  accuracy: number;
  forecastCount: number;
}

export function AccuracyGauge({ accuracy, forecastCount }: AccuracyGaugeProps) {
  const color = accuracy >= 70 ? colors.green : colors.orange;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Accuracy Score</Text>
      <Text style={[styles.value, { color }]}>{accuracy}%</Text>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: accuracy }}>
        <View style={[styles.fill, { width: `${accuracy}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.count}>{forecastCount} forecasts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface3, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.dark.border, gap: 8 },
  label: { color: colors.dark.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontWeight: '700', fontSize: 28, fontFamily: 'monospace' },
  track: { height: 8, backgroundColor: colors.dark.surface, borderRadius: 4, overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 4 },
  count: { color: colors.dark.textSecondary, fontSize: 12 },
});
