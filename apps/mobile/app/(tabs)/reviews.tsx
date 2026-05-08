import { useCallback, useState } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
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

export default function ReviewsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reviews-browse"],
    queryFn: () =>
      apiFetch<ReviewsResponse>("/reviews?status=published&limit=20").then(
        (r) => r.reviews
      ),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["reviews-browse"] });
    setRefreshing(false);
  }, [qc]);

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Reviews</Text>
        <TouchableOpacity
          style={styles.writeBtn}
          onPress={() => router.push("/reviews/new" as any)}
          accessibilityRole="button"
          accessibilityLabel="Write a review"
        >
          <Text style={styles.writeBtnText}>+ Write</Text>
        </TouchableOpacity>
      </View>

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
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No reviews yet</Text>
              <Text style={styles.emptySubtext}>Be the first to write a review.</Text>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  heading: { color: "#F5F5F5", fontSize: 22, fontWeight: "700" },
  writeBtn: {
    backgroundColor: "rgba(0,212,106,0.12)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(0,212,106,0.3)",
  },
  writeBtnText: { color: "#00D46A", fontWeight: "700", fontSize: 13 },
  skeletonWrap: { gap: 12 },
  listContent: { paddingBottom: 32, flexGrow: 1 },
  separator: { height: 12 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyText: { color: "#F5F5F5", fontSize: 16, fontWeight: "600", marginBottom: 8 },
  emptySubtext: { color: "#8A8A8A", fontSize: 13, textAlign: "center" },
});
