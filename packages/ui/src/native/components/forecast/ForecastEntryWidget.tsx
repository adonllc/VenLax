import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '../../../tokens';
import { Button } from '../atoms/Button';

export interface ForecastEntryWidgetProps {
  marketId: string;
  yesProb: number;
  fpBalance: number;
  maxFp: number;
  onSubmit: (payload: { side: 'YES' | 'NO'; fp: number }) => Promise<void>;
  isLoggedIn: boolean;
  onLoginPrompt?: () => void;
}

export function ForecastEntryWidget({ yesProb, fpBalance, maxFp, onSubmit, isLoggedIn, onLoginPrompt }: ForecastEntryWidgetProps) {
  const [side, setSide] = useState<null | 'YES' | 'NO'>(null);
  const [fp, setFp] = useState(() => Math.min(100, Math.min(maxFp, fpBalance)));
  const [loading, setLoading] = useState(false);

  const maxSlider = Math.max(1, Math.min(maxFp, fpBalance));

  if (!isLoggedIn) {
    return (
      <View style={styles.card}>
        <Text style={styles.secondary}>Log in to make a forecast entry</Text>
        <Button variant="primary" size="sm" onPress={onLoginPrompt}>Log in</Button>
      </View>
    );
  }

  async function handleSubmit() {
    if (side === null) return;
    setLoading(true);
    try { await onSubmit({ side, fp }); } finally { setLoading(false); }
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.sideBtn, { borderColor: colors.green }, side === 'YES' && { backgroundColor: colors.green }]}
          onPress={() => setSide('YES')}
          accessibilityLabel={`YES, ${yesProb}%`}
        >
          <Text style={[styles.sideBtnText, { color: side === 'YES' ? '#0D0D0D' : colors.green }]}>YES · {yesProb}%</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sideBtn, { borderColor: colors.orange }, side === 'NO' && { backgroundColor: colors.orange }]}
          onPress={() => setSide('NO')}
          accessibilityLabel={`NO, ${100 - yesProb}%`}
        >
          <Text style={[styles.sideBtnText, { color: side === 'NO' ? '#0D0D0D' : colors.orange }]}>NO · {100 - yesProb}%</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.balance}>⚡ {fpBalance.toLocaleString()} FP balance</Text>
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>FP Amount: <Text style={styles.sliderValue}>{fp}</Text></Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={maxSlider}
          step={1}
          value={fp}
          onValueChange={(v: number) => setFp(Math.round(v))}
          minimumTrackTintColor={colors.lemon}
          maximumTrackTintColor={colors.dark.border}
          thumbTintColor={colors.lemon}
          accessibilityLabel="FP amount slider"
        />
      </View>
      <Button variant="primary" onPress={handleSubmit} loading={loading} disabled={side === null}>Enter Forecast</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface3, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.dark.border, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  sideBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dark.surface3 },
  sideBtnText: { fontWeight: '600', fontSize: 14 },
  balance: { color: colors.lemon, fontFamily: 'monospace', fontWeight: '700', fontSize: 13 },
  secondary: { color: colors.dark.textSecondary, fontSize: 13 },
  sliderContainer: { gap: 4 },
  sliderLabel: { color: colors.dark.textSecondary, fontSize: 13 },
  sliderValue: { color: colors.lemon, fontWeight: '700', fontFamily: 'monospace' },
  slider: { width: '100%', height: 40 },
});
