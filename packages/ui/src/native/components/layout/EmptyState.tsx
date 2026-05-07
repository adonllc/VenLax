import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Button } from '../atoms/Button';

export interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {ctaLabel && onCta && <Button variant="primary" onPress={onCta}>{ctaLabel}</Button>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 12 },
  icon: { fontSize: 48 },
  title: { color: colors.dark.textPrimary, fontWeight: '600', fontSize: 16, textAlign: 'center' },
  description: { color: colors.dark.textSecondary, fontSize: 13, textAlign: 'center', maxWidth: 280 },
});
