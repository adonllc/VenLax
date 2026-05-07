import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface ProbabilityBarProps {
  yesProb: number;
}

export function ProbabilityBar({ yesProb }: ProbabilityBarProps) {
  const yesPct = Math.max(0, Math.min(100, Math.round(yesProb)));
  const noPct = 100 - yesPct;
  return (
    <View>
      <View style={styles.labels}>
        <Text style={styles.labelText}>YES {yesPct}%</Text>
        <Text style={styles.labelText}>NO {noPct}%</Text>
      </View>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: yesPct }}>
        <View style={[styles.fill, { width: `${yesPct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  labelText: { fontSize: 11, fontWeight: '700', color: colors.dark.textSecondary, fontFamily: 'monospace' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.orange },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: colors.green, borderRadius: 4 },
});
