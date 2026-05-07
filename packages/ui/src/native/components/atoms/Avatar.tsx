import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 32, md: 40, lg: 56 };
const fontMap = { sm: 12, md: 14, lg: 18 };

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const dim = sizeMap[size];
  const fs = fontMap[size];
  if (src) {
    return <Image source={{ uri: src }} style={[styles.base, { width: dim, height: dim, borderRadius: dim / 2 }]} accessibilityLabel={name} />;
  }
  return (
    <View style={[styles.base, styles.fallback, { width: dim, height: dim, borderRadius: dim / 2 }]} accessibilityLabel={name} accessibilityRole="image">
      <Text style={[styles.initials, { fontSize: fs }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  fallback: { backgroundColor: colors.dark.surface3, borderWidth: 1, borderColor: colors.dark.border, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.dark.textPrimary, fontWeight: '600' },
});
