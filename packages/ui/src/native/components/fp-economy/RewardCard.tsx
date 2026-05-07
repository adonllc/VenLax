import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../../tokens';
import { Button } from '../atoms/Button';

export interface RewardCardProps {
  name: string;
  category: string;
  fpCost: number;
  imageUrl: string | null;
  onRedeem: () => void;
  redeemLoading?: boolean;
  canAfford?: boolean;
}

export function RewardCard({ name, category, fpCost, imageUrl, onRedeem, redeemLoading, canAfford = true }: RewardCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.imageArea}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} accessibilityLabel={name} />
        ) : (
          <Text style={styles.placeholder}>🎁</Text>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.row}>
          <Text style={styles.cost}>⚡ {fpCost.toLocaleString()} FP</Text>
          <Button variant="primary" size="sm" onPress={onRedeem} loading={redeemLoading} disabled={!canAfford}>Redeem</Button>
        </View>
        {!canAfford && <Text style={styles.insufficient}>Insufficient FP</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.dark.surface3, borderRadius: 12, borderWidth: 1, borderColor: colors.dark.border, overflow: 'hidden' },
  imageArea: { height: 112, backgroundColor: colors.dark.surface3, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: 112 } as any,
  placeholder: { fontSize: 28 },
  body: { padding: 12, gap: 4 },
  category: { color: colors.dark.textSecondary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { color: colors.dark.textPrimary, fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cost: { color: colors.lemon, fontWeight: '700', fontSize: 13, fontFamily: 'monospace' },
  insufficient: { color: colors.dark.textSecondary, fontSize: 10 },
});
