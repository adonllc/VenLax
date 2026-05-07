import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, onPress, children }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[`size_${size}` as keyof typeof styles] as any,
        styles[`variant_${variant}` as keyof typeof styles] as any,
        (disabled || loading) && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? '#0D0D0D' : colors.green} style={styles.spinner} />}
      <Text style={[styles.text, styles[`text_${variant}` as keyof typeof styles] as any, styles[`textSize_${size}` as keyof typeof styles] as any]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  disabled: { opacity: 0.5 },
  spinner: { marginRight: 8 },
  variant_primary: { backgroundColor: colors.green },
  variant_secondary: { backgroundColor: colors.dark.surface3, borderWidth: 1, borderColor: colors.dark.border },
  variant_ghost: { backgroundColor: 'transparent' },
  variant_danger: { backgroundColor: '#FF3B30' },
  size_sm: { height: 32, paddingHorizontal: 12 },
  size_md: { height: 40, paddingHorizontal: 16 },
  size_lg: { height: 48, paddingHorizontal: 24 },
  text: { fontWeight: '600' },
  text_primary: { color: '#0D0D0D' },
  text_secondary: { color: colors.dark.textPrimary },
  text_ghost: { color: colors.dark.textPrimary },
  text_danger: { color: '#FFFFFF' },
  textSize_sm: { fontSize: 12 },
  textSize_md: { fontSize: 14 },
  textSize_lg: { fontSize: 16 },
});
