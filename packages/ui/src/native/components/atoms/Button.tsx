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

const variantStyles: Record<ButtonVariant, object> = {
  primary: styles.variant_primary,
  secondary: styles.variant_secondary,
  ghost: styles.variant_ghost,
  danger: styles.variant_danger,
};

const sizeStyles: Record<ButtonSize, object> = {
  sm: styles.size_sm,
  md: styles.size_md,
  lg: styles.size_lg,
};

const textVariantStyles: Record<ButtonVariant, object> = {
  primary: styles.text_primary,
  secondary: styles.text_secondary,
  ghost: styles.text_ghost,
  danger: styles.text_danger,
};

const textSizeStyles: Record<ButtonSize, object> = {
  sm: styles.textSize_sm,
  md: styles.textSize_md,
  lg: styles.textSize_lg,
};

export function Button({ variant = 'primary', size = 'md', loading, disabled, onPress, children }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? '#0D0D0D' : colors.green} style={styles.spinner} />}
      <Text style={[styles.text, textVariantStyles[variant], textSizeStyles[size]]}>
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
