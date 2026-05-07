import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface InputProps {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

export function Input({ label, value, onChangeText, placeholder, error, hint, secureTextEntry, keyboardType }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : styles.inputDefault]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.dark.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        accessibilityLabel={label}
        accessibilityHint={hint}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.dark.textSecondary },
  input: { height: 40, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 14, color: colors.dark.textPrimary, backgroundColor: colors.dark.surface3 },
  inputDefault: { borderColor: colors.dark.border },
  inputError: { borderColor: '#FF3B30' },
  error: { fontSize: 12, color: '#FF3B30' },
  hint: { fontSize: 12, color: colors.dark.textSecondary },
});
