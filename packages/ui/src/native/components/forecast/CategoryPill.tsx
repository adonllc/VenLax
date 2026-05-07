import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type MarketCategory = 'sports' | 'politics' | 'open';

export interface CategoryPillProps {
  category: MarketCategory;
}

const config: Record<MarketCategory, { label: string; bg: string; text: string }> = {
  sports:   { label: 'Sports',   bg: 'rgba(0,212,106,0.10)',  text: colors.green },
  politics: { label: 'Politics', bg: 'rgba(255,230,0,0.10)',  text: colors.lemon },
  open:     { label: 'Open',     bg: colors.dark.surface3,    text: colors.dark.textSecondary },
};

export function CategoryPill({ category }: CategoryPillProps) {
  const c = config[category];
  return (
    <View style={[styles.base, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  text: { fontSize: 11, fontWeight: '600' },
});
