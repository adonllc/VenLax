import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type MarketStatus = 'draft' | 'open' | 'closed' | 'resolved' | 'settled';

export interface MarketStatusChipProps {
  status: MarketStatus;
}

const config: Record<MarketStatus, { label: string; bg: string; text: string; border: string }> = {
  draft:    { label: 'Draft',    bg: colors.dark.surface3, text: colors.dark.textSecondary, border: colors.dark.border },
  open:     { label: 'Open',     bg: 'rgba(0,212,106,0.15)', text: colors.green, border: 'rgba(0,212,106,0.3)' },
  closed:   { label: 'Closed',   bg: 'rgba(255,107,0,0.15)', text: colors.orange, border: 'rgba(255,107,0,0.3)' },
  resolved: { label: 'Resolved', bg: 'rgba(255,230,0,0.15)', text: colors.lemon, border: 'rgba(255,230,0,0.3)' },
  settled:  { label: 'Settled',  bg: colors.dark.surface3, text: colors.dark.textSecondary, border: colors.dark.border },
};

export function MarketStatusChip({ status }: MarketStatusChipProps) {
  const c = config[status];
  return (
    <View style={[styles.base, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  text: { fontSize: 11, fontWeight: '600' },
});
