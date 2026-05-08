import { useCallback, useState } from "react";
import {
  FlatList,
  View,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Stack } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LeaderboardRow } from "@venlaxiq/ui/native";
import { SkeletonCard } from "@/components/SkeletonCard";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

// ── API shape ─────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  accuracy: number;
  fpEarned: number;
  avatarUrl: string | null;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () =>
      apiFetch<LeaderboardResponse>("/leaderboard").then((r) => r.entries),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["leaderboard"] });
    setRefreshing(false);
  }, [qc]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Leaderboard",
          headerStyle: { backgroundColor: "#0D0D0D" },
          headerTintColor: "#F5F5F5",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonCard height={60} />
          <SkeletonCard height={60} />
          <SkeletonCard height={60} />
          <SkeletonCard height={60} />
          <SkeletonCard height={60} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <LeaderboardRow
              rank={item.rank}
              username={item.username}
              accuracy={item.accuracy}
              fpEarned={item.fpEarned}
              avatarUrl={item.avatarUrl}
              isCurrentUser={user?.id === item.userId}
            />
          )}
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
  skeletonWrap: { gap: 10, paddingTop: 16 },
  listContent: { paddingVertical: 8, flexGrow: 1 },
});
