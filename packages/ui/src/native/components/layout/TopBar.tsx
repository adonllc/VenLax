import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Avatar } from '../atoms/Avatar';
import { FPBadge } from '../fp-economy/FPBadge';

export interface TopBarProps {
  username?: string;
  avatarUrl?: string | null;
  fpBalance?: number;
  unreadCount?: number;
  onNotifications?: () => void;
  onProfile?: () => void;
  onSearch?: () => void;
}

export function TopBar({ username, avatarUrl, fpBalance, unreadCount = 0, onNotifications, onProfile, onSearch }: TopBarProps) {
  return (
    <View style={styles.bar}>
      <Text style={styles.brand}>VenlaxIQ</Text>
      <View style={styles.actions}>
        {onSearch && (
          <TouchableOpacity onPress={onSearch} accessibilityLabel="Search" style={styles.btn}>
            <Text style={styles.btnText}>🔍</Text>
          </TouchableOpacity>
        )}
        {fpBalance != null && <FPBadge amount={fpBalance} size="sm" />}
        {onNotifications && (
          <TouchableOpacity onPress={onNotifications} accessibilityLabel={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'} style={styles.btn}>
            <Text style={styles.btnText}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {username && (
          <TouchableOpacity onPress={onProfile} accessibilityLabel={`Profile: ${username}`}>
            <Avatar name={username} src={avatarUrl} size="sm" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 56, backgroundColor: colors.dark.surface3, borderBottomWidth: 1, borderBottomColor: colors.dark.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  brand: { color: colors.dark.textPrimary, fontWeight: '800', fontSize: 16, flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: { position: 'relative' },
  btnText: { fontSize: 18 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: colors.orange, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#0D0D0D', fontSize: 10, fontWeight: '700' },
});
