import { useCallback, useState } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WalletSummary, RewardCard } from "@venlaxiq/ui/native";
import { SkeletonCard } from "@/components/SkeletonCard";
import { apiFetch } from "@/lib/api";

// ── API shapes ────────────────────────────────────────────────────────────────

interface FpBalance {
  balance: number;
  expiresAt: string | null;
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  fpCost: number;
  imageUrl: string | null;
}

interface RedeemResponse {
  code: string;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RewardsScreen() {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["fp-balance"],
    queryFn: () => apiFetch<FpBalance>("/fp-ledger/balance"),
  });

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ["reward-catalog"],
    queryFn: () => apiFetch<CatalogItem[]>("/rewards/catalog"),
  });

  const { mutate: redeem } = useMutation({
    mutationFn: (catalogItemId: string) =>
      apiFetch<RedeemResponse>("/rewards/redeem", {
        method: "POST",
        body: JSON.stringify({ catalogItemId }),
      }),
    onMutate: (catalogItemId) => setRedeemingId(catalogItemId),
    onSettled: () => setRedeemingId(null),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["fp-balance"] });
      Alert.alert("Redeemed!", "Your code: " + data.code);
    },
    onError: (err: Error) => {
      Alert.alert("Redemption failed", err.message);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      qc.invalidateQueries({ queryKey: ["fp-balance"] }),
      qc.invalidateQueries({ queryKey: ["reward-catalog"] }),
    ]);
    setRefreshing(false);
  }, [qc]);

  const balance = balanceData?.balance ?? 0;
  const expiresAt = balanceData?.expiresAt ? new Date(balanceData.expiresAt) : null;

  const isLoading = balanceLoading || catalogLoading;

  const ListHeader = (
    <View style={styles.headerWrap}>
      <Text style={styles.heading}>Rewards</Text>
      {balanceLoading ? (
        <SkeletonCard height={96} />
      ) : (
        <WalletSummary earnedFp={balance} expiresAt={expiresAt} />
      )}
      <Text style={styles.catalogTitle}>Reward Catalog</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading && !catalog ? (
        <View style={styles.skeletonWrap}>
          {ListHeader}
          <SkeletonCard height={180} />
          <SkeletonCard height={180} />
        </View>
      ) : (
        <FlatList
          data={catalog ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <RewardCard
                name={item.name}
                category={item.category}
                fpCost={item.fpCost}
                imageUrl={item.imageUrl}
                onRedeem={() => redeem(item.id)}
                redeemLoading={redeemingId === item.id}
                canAfford={balance >= item.fpCost}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No rewards available</Text>
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
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  headerWrap: { paddingHorizontal: 16, paddingTop: 52, marginBottom: 16, gap: 12 },
  heading: { color: "#F5F5F5", fontSize: 22, fontWeight: "700" },
  catalogTitle: { color: "#F5F5F5", fontSize: 16, fontWeight: "700", marginTop: 4 },
  skeletonWrap: { flex: 1 },
  listContent: { paddingBottom: 32, flexGrow: 1 },
  columnWrapper: { paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  cardWrap: { flex: 1 },
  emptyWrap: { alignItems: "center", paddingTop: 40 },
  emptyText: { color: "#8A8A8A", fontSize: 14 },
});
