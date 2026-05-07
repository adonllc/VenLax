import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface FPBadgeProps {
  amount: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const fontSizes = { sm: 12, md: 14, lg: 16 };

export function FPBadge({ amount, label, size = 'md' }: FPBadgeProps) {
  return (
    <Text style={[styles.base, { fontSize: fontSizes[size] }]}>
      ⚡ {amount.toLocaleString()} FP{label ? ` ${label}` : ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.lemon,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
