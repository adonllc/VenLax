import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { apiFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CheckoutResponse {
  url: string;
}

interface TierOption {
  id: "pro" | "elite";
  name: string;
  price: string;
  description: string;
  features: string[];
}

const TIERS: TierOption[] = [
  {
    id: "pro",
    name: "Pro",
    price: "$9/mo",
    description: "For serious forecasters",
    features: [
      "Unlimited daily forecasts",
      "AI insight signals",
      "Priority market access",
      "1.5x accuracy multiplier",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: "$19/mo",
    description: "For power users",
    features: [
      "Everything in Pro",
      "Elite badge",
      "2x accuracy multiplier",
      "Early access to new features",
      "Dedicated support",
    ],
  },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SubscriptionScreen() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleUpgrade = async (tierId: "pro" | "elite") => {
    setLoadingTier(tierId);
    try {
      const data = await apiFetch<CheckoutResponse>("/subscriptions/checkout", {
        method: "POST",
        body: JSON.stringify({ tier: tierId }),
      });
      await Linking.openURL(data.url);
    } catch (err: unknown) {
      Alert.alert(
        "Upgrade failed",
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Upgrade",
          headerStyle: { backgroundColor: "#0D0D0D" },
          headerTintColor: "#F5F5F5",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />

      <Text style={styles.heading}>Choose a Plan</Text>
      <Text style={styles.subheading}>Unlock more power with a premium tier.</Text>

      {TIERS.map((tier) => {
        const isLoading = loadingTier === tier.id;
        return (
          <View
            key={tier.id}
            style={[styles.card, tier.id === "elite" && styles.eliteCard]}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierDescription}>{tier.description}</Text>
              </View>
              <Text style={[styles.price, tier.id === "elite" && styles.elitePrice]}>
                {tier.price}
              </Text>
            </View>

            <View style={styles.features}>
              {tier.features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Text style={styles.checkmark}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.upgradeBtn,
                tier.id === "elite" && styles.eliteBtn,
                isLoading && styles.btnDisabled,
              ]}
              onPress={() => handleUpgrade(tier.id)}
              disabled={isLoading || loadingTier !== null}
              accessibilityRole="button"
              accessibilityLabel={`Upgrade to ${tier.name}`}
            >
              {isLoading ? (
                <ActivityIndicator color="#0D0D0D" />
              ) : (
                <Text style={styles.upgradeBtnText}>Upgrade to {tier.name}</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heading: { color: "#F5F5F5", fontSize: 22, fontWeight: "700", marginBottom: 4 },
  subheading: { color: "#8A8A8A", fontSize: 14, marginBottom: 24 },
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  eliteCard: {
    borderColor: "rgba(0,212,106,0.4)",
    backgroundColor: "rgba(0,212,106,0.04)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tierName: { color: "#F5F5F5", fontSize: 18, fontWeight: "700" },
  tierDescription: { color: "#8A8A8A", fontSize: 13, marginTop: 2 },
  price: { color: "#F5F5F5", fontSize: 20, fontWeight: "700", fontFamily: "monospace" },
  elitePrice: { color: "#00D46A" },
  features: { gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkmark: { color: "#00D46A", fontSize: 14, fontWeight: "700", width: 16 },
  featureText: { color: "#C8C8C8", fontSize: 13, flex: 1 },
  upgradeBtn: {
    backgroundColor: "#2E2E2E",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  eliteBtn: { backgroundColor: "#00D46A" },
  btnDisabled: { opacity: 0.5 },
  upgradeBtnText: { color: "#F5F5F5", fontWeight: "700", fontSize: 15 },
});
