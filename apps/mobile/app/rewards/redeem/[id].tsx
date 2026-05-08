import { View, Text, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SkeletonCard } from "@/components/SkeletonCard";
import { apiFetch } from "@/lib/api";

// ── API shape ─────────────────────────────────────────────────────────────────

interface RedemptionHistoryEntry {
  id: string;
  code: string;
  itemName: string;
  fpDebited: number;
  redeemedAt: string;
}

interface RedemptionHistoryResponse {
  redemptions: RedemptionHistoryEntry[];
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RedemptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: history, isLoading } = useQuery({
    queryKey: ["redemption-history"],
    queryFn: () =>
      apiFetch<RedemptionHistoryResponse>("/rewards/history").then(
        (r) => r.redemptions
      ),
  });

  const redemption = history?.find((r) => r.id === id);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Reward",
          headerStyle: { backgroundColor: "#0D0D0D" },
          headerTintColor: "#F5F5F5",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonCard height={180} />
        </View>
      ) : redemption ? (
        <View style={styles.card}>
          <Text style={styles.itemName}>{redemption.itemName}</Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Redemption Code</Text>
            <Text style={styles.code} selectable>{redemption.code}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.metaLabel}>FP Debited</Text>
            <Text style={styles.metaValue}>⚡ {redemption.fpDebited.toLocaleString()}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.metaLabel}>Redeemed</Text>
            <Text style={styles.metaValue}>
              {new Date(redemption.redeemedAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Redemption not found.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", paddingHorizontal: 16 },
  skeletonWrap: { paddingTop: 16 },
  card: {
    marginTop: 20,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    padding: 20,
    gap: 16,
  },
  itemName: { color: "#F5F5F5", fontSize: 20, fontWeight: "700", lineHeight: 28 },
  codeBox: {
    backgroundColor: "#0D0D0D",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,212,106,0.3)",
    padding: 16,
    gap: 6,
    alignItems: "center",
  },
  codeLabel: {
    color: "#8A8A8A",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  code: {
    color: "#00D46A",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2E2E2E",
  },
  metaLabel: { color: "#8A8A8A", fontSize: 13 },
  metaValue: { color: "#F5F5F5", fontSize: 13, fontWeight: "600", fontFamily: "monospace" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { color: "#8A8A8A", fontSize: 16 },
});
