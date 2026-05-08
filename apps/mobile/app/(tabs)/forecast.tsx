import { useCallback, useState } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SkeletonCard } from "@/components/SkeletonCard";
import { apiFetch } from "@/lib/api";

// ── API shape ─────────────────────────────────────────────────────────────────

interface Position {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: "yes" | "no";
  shares: number;
  costFp: number;
  currentValue: number;
  status: "open" | "closed" | "resolved" | "settled";
  resolvedOutcome?: "yes" | "no" | null;
  createdAt: string;
}

// ── Inline PositionRow (not in UI package) ────────────────────────────────────

function PositionRow({ position, onPress }: { position: Position; onPress: () => void }) {
  const isWin =
    position.resolvedOutcome != null &&
    position.resolvedOutcome === position.outcome;
  const isLoss =
    position.resolvedOutcome != null &&
    position.resolvedOutcome !== position.outcome;
  const pnl = position.currentValue - position.costFp;
  const pnlColor = pnl >= 0 ? "#00D46A" : "#FF6B6B";

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {position.marketTitle}
        </Text>
        <View style={styles.rowMeta}>
          <View
            style={[
              styles.outcomePill,
              { backgroundColor: position.outcome === "yes" ? "rgba(0,212,106,0.15)" : "rgba(255,107,107,0.15)" },
            ]}
          >
            <Text
              style={[
                styles.outcomeText,
                { color: position.outcome === "yes" ? "#00D46A" : "#FF6B6B" },
              ]}
            >
              {position.outcome.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.statusText}>{position.status}</Text>
          {isWin && <Text style={styles.winBadge}>Won</Text>}
          {isLoss && <Text style={styles.lossBadge}>Lost</Text>}
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.sharesLabel}>{position.shares.toFixed(2)} shares</Text>
        <Text style={[styles.pnlText, { color: pnlColor }]}>
          {pnl >= 0 ? "+" : ""}
          {pnl.toFixed(0)} FP
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ForecastScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: positions, isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: () => apiFetch<Position[]>("/forecast/positions"),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["positions"] });
    setRefreshing(false);
  }, [qc]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Forecasts</Text>

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
        </View>
      ) : (
        <FlatList
          data={positions ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PositionRow
              position={item}
              onPress={() => router.push(`/markets/${item.marketId}` as any)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No forecasts yet</Text>
              <Text style={styles.emptySubtext}>
                Browse open markets and make your first prediction.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00D46A"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", paddingHorizontal: 16, paddingTop: 52 },
  heading: { color: "#F5F5F5", fontSize: 22, fontWeight: "700", marginBottom: 16 },
  skeletonWrap: { gap: 8 },
  listContent: { paddingBottom: 32, flexGrow: 1 },
  row: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2E2E2E",
  },
  rowLeft: { flex: 1, gap: 6 },
  rowTitle: { color: "#F5F5F5", fontSize: 13, fontWeight: "600", lineHeight: 18 },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  outcomePill: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  outcomeText: { fontSize: 10, fontWeight: "700" },
  statusText: { color: "#8A8A8A", fontSize: 11, textTransform: "capitalize" },
  winBadge: { color: "#00D46A", fontSize: 11, fontWeight: "700" },
  lossBadge: { color: "#FF6B6B", fontSize: 11, fontWeight: "700" },
  rowRight: { alignItems: "flex-end", gap: 4, marginLeft: 12 },
  sharesLabel: { color: "#8A8A8A", fontSize: 11 },
  pnlText: { fontSize: 13, fontWeight: "700", fontFamily: "monospace" },
  separator: { height: 8 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyText: { color: "#F5F5F5", fontSize: 16, fontWeight: "600", marginBottom: 8 },
  emptySubtext: { color: "#8A8A8A", fontSize: 13, textAlign: "center" },
});
