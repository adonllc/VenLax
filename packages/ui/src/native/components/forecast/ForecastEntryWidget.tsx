import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Button } from '../atoms/Button';

export interface ForecastEntryWidgetProps {
  marketId: string;
  yesProb: number;
  fpBalance: number;
  maxFp: number;
  onSubmit: (side: boolean, fpAmount: number) => Promise<void>;
  isLoggedIn: boolean;
  onLoginPrompt?: () => void;
}

export function ForecastEntryWidget({ yesProb, fpBalance, maxFp, onSubmit, isLoggedIn, onLoginPrompt }: ForecastEntryWidgetProps) {
  const [side, setSide] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const fp = Math.min(100, Math.min(maxFp, fpBalance));

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
    try { await onSubmit(side, fp); } finally { setLoading(false); }
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.sideBtn, { borderColor: colors.green }, side === true && { backgroundColor: colors.green }]}
          onPress={() => setSide(true)}
          accessibilityLabel={`YES, ${yesProb}%`}
        >
          <Text style={[styles.sideBtnText, { color: side === true ? '#0D0D0D' : colors.green }]}>YES · {yesProb}%</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sideBtn, { borderColor: colors.orange }, side === false && { backgroundColor: colors.orange }]}
          onPress={() => setSide(false)}
          accessibilityLabel={`NO, ${100 - yesProb}%`}
        >
          <Text style={[styles.sideBtnText, { color: side === false ? '#0D0D0D' : colors.orange }]}>NO · {100 - yesProb}%</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.balance}>⚡ {fpBalance.toLocaleString()} FP balance</Text>
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
});
