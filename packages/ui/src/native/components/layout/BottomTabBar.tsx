import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';

export interface TabItem {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

export interface BottomTabBarProps {
  items: TabItem[];
  onNavigate: (href: string) => void;
}

export function BottomTabBar({ items, onNavigate }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.href}
          onPress={() => onNavigate(item.href)}
          style={styles.tab}
          accessibilityLabel={item.label}
          accessibilityState={{ selected: item.active }}
        >
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={[styles.label, item.active && { color: colors.green }]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: 64, backgroundColor: colors.dark.surface3, borderTopWidth: 1, borderTopColor: colors.dark.border },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { fontSize: 20 },
  label: { fontSize: 10, fontWeight: '600', color: colors.dark.textSecondary },
});
