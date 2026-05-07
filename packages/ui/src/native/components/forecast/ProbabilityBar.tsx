import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface ProbabilityBarProps {
  yesProb: number;
}

export function ProbabilityBar({ yesProb }: ProbabilityBarProps) {
  const noProb = 100 - yesProb;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${yesProb}%` as any }]} />
      <View style={styles.labels}>
        <Text style={styles.label}>YES {yesProb}%</Text>
        <Text style={styles.label}>NO {noProb}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.orange, position: 'relative' },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: colors.green, borderRadius: 4 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center' },
  label: { fontSize: 9, fontWeight: '700', color: '#0D0D0D', fontFamily: 'monospace' },
});
