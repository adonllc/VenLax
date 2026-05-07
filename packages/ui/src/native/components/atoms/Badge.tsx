import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type BadgeVariant = 'green' | 'lemon' | 'orange' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  green:   { bg: 'rgba(0,212,106,0.15)',  text: colors.green,              border: 'rgba(0,212,106,0.3)' },
  lemon:   { bg: 'rgba(255,230,0,0.15)',  text: colors.lemon,              border: 'rgba(255,230,0,0.3)' },
  orange:  { bg: 'rgba(255,107,0,0.15)',  text: colors.orange,             border: 'rgba(255,107,0,0.3)' },
  neutral: { bg: colors.dark.surface3,    text: colors.dark.textSecondary, border: colors.dark.border },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const v = variantMap[variant];
  return (
    <View style={[styles.base, { backgroundColor: v.bg, borderColor: v.border }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  text: { fontSize: 12, fontWeight: '600' },
});
