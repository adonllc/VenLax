import React from 'react';
import { ActivityIndicator } from 'react-native';
import { colors } from '../../../tokens';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'small' as const, md: 'small' as const, lg: 'large' as const };

export function Spinner({ size = 'md' }: SpinnerProps) {
  return <ActivityIndicator size={sizeMap[size]} color={colors.green} accessibilityLabel="Loading" />;
}
