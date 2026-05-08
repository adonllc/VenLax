import { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ProfileHeader,
  BadgeDisplay,
} from "@venlaxiq/ui/native";
import type { XpLevel, SubscriptionTier } from "@venlaxiq/ui/native";
import { SkeletonCard } from "@/components/SkeletonCard";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

// ── API shapes ────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  tier: SubscriptionTier;
  xpLevel: XpLevel;
  accuracy: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface UserBadge {
  id: string;
  name: string;
  icon: string;
  fpReward: number;
  unlocked: boolean;
  earnedAt?: string | null;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => apiFetch<UserProfile>(`/profile/${userId}`),
    enabled: !!userId,
  });

  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ["badges", userId],
    queryFn: () => apiFetch<UserBadge[]>(`/badges?userId=${userId}`),
    enabled: !!userId,
  });

  const followMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/users/${userId}/follow`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/users/${userId}/follow`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });

  const handleFollow = useCallback(() => {
    if (!profile) return;
    if (profile.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  }, [profile, followMutation, unfollowMutation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      qc.invalidateQueries({ queryKey: ["profile", userId] }),
      qc.invalidateQueries({ queryKey: ["badges", userId] }),
    ]);
    setRefreshing(false);
  }, [qc, userId]);

  const isLoading = profileLoading || badgesLoading;
  const earnedBadges = (badges ?? []).filter((b) => b.unlocked);
  const isOwnProfile = currentUser?.id === userId;
  const followLoading = followMutation.isPending || unfollowMutation.isPending;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#00D46A"
        />
      }
    >
      <Stack.Screen
        options={{
          title: profile?.username ?? "Profile",
          headerStyle: { backgroundColor: "#0D0D0D" },
          headerTintColor: "#F5F5F5",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />

      {isLoading ? (
        <>
          <SkeletonCard height={120} />
          <SkeletonCard height={60} />
        </>
      ) : profile ? (
        <>
          <ProfileHeader
            username={profile.username}
            avatarUrl={profile.avatarUrl}
            tier={profile.tier}
            xpLevel={profile.xpLevel}
            accuracy={profile.accuracy}
            isOwnProfile={isOwnProfile}
            isFollowing={profile.isFollowing}
            followerCount={profile.followerCount}
            followingCount={profile.followingCount}
            onFollow={handleFollow}
            followLoading={followLoading}
          />

          {earnedBadges.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Badges Earned</Text>
              <View style={styles.badgeGrid}>
                {earnedBadges.map((badge) => (
                  <View key={badge.id} style={styles.badgeWrap}>
                    <BadgeDisplay
                      name={badge.name}
                      icon={badge.icon}
                      fpReward={badge.fpReward}
                      unlocked={badge.unlocked}
                      earnedAt={badge.earnedAt ? new Date(badge.earnedAt) : undefined}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 16 },
  section: { gap: 12 },
  sectionTitle: { color: "#F5F5F5", fontSize: 16, fontWeight: "700" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeWrap: { width: "30%" },
});
