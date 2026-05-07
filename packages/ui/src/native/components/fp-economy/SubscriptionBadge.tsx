import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type SubscriptionTier = 'free' | 'pro' | 'elite';

export interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
}

const config: Record<SubscriptionTier, { label: string; bg: string; text: string; border: string }> = {
  free:  { label: 'Free',  bg: colors.dark.surface3, text: colors.dark.textSecondary, border: colors.dark.border },
  pro:   { label: 'Pro',   bg: 'rgba(0,212,106,0.15)', text: colors.green, border: 'rgba(0,212,106,0.3)' },
  elite: { label: 'Elite', bg: 'rgba(255,230,0,0.15)', text: colors.lemon, border: 'rgba(255,230,0,0.3)' },
};

export function SubscriptionBadge({ tier }: SubscriptionBadgeProps) {
  const c = config[tier];
  return (
    <View style={[styles.base, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  text: { fontSize: 11, fontWeight: '700' },
});
