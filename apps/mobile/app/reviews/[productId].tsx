import { useCallback, useState } from "react";
import {
  FlatList,
  View,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewCard } from "@venlaxiq/ui/native";
import type { ReviewBadge } from "@venlaxiq/ui/native";
import { SkeletonCard } from "@/components/SkeletonCard";
import { apiFetch } from "@/lib/api";

// ── API shape ─────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar: string | null;
  rating: number;
  title: string;
  body: string;
  badge: ReviewBadge;
  helpfulVotes: number;
  totalVotes: number;
  createdAt: string;
}

interface ReviewsResponse {
  reviews: Review[];
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ProductReviewsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () =>
      apiFetch<ReviewsResponse>(`/reviews/${productId}`).then((r) => r.reviews),
    enabled: !!productId,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["reviews", productId] });
    setRefreshing(false);
  }, [qc, productId]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Reviews",
          headerStyle: { backgroundColor: "#0D0D0D" },
          headerTintColor: "#F5F5F5",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonCard height={140} />
          <SkeletonCard height={140} />
          <SkeletonCard height={140} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReviewCard
              reviewerName={item.reviewerName}
              reviewerAvatar={item.reviewerAvatar}
              rating={item.rating}
              title={item.title}
              body={item.body}
              badge={item.badge}
              helpfulVotes={item.helpfulVotes}
              totalVotes={item.totalVotes}
              createdAt={new Date(item.createdAt)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  container: { flex: 1, backgroundColor: "#0D0D0D", paddingHorizontal: 16 },
  skeletonWrap: { gap: 12, paddingTop: 16 },
  listContent: { paddingVertical: 16, flexGrow: 1 },
  separator: { height: 12 },
});
