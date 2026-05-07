import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type ReviewBadge = 'none' | 'verified' | 'community_trusted';

export interface VerifiedBadgeProps {
  type: ReviewBadge;
}

export function VerifiedBadge({ type }: VerifiedBadgeProps) {
  if (type === 'none') return null;
  if (type === 'community_trusted') {
    return (
      <View style={[styles.base, { backgroundColor: 'rgba(255,230,0,0.15)', borderColor: 'rgba(255,230,0,0.3)' }]}>
        <Text style={[styles.text, { color: colors.lemon }]}>★ Community Trusted</Text>
      </View>
    );
  }
  return (
    <View style={[styles.base, { backgroundColor: 'rgba(0,212,106,0.15)', borderColor: 'rgba(0,212,106,0.3)' }]}>
      <Text style={[styles.text, { color: colors.green }]}>✓ Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  text: { fontSize: 11, fontWeight: '600' },
});
