import { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ProfileHeader,
  XPProgressBar,
  BadgeDisplay,
} from "@venlaxiq/ui/native";
import type { XpLevel, SubscriptionTier } from "@venlaxiq/ui/native";
import { SkeletonCard } from "@/components/SkeletonCard";
import { logout } from "@/lib/auth";
import { useAuth } from "@/providers/AuthProvider";
import { apiFetch } from "@/lib/api";

// ── API shapes ────────────────────────────────────────────────────────────────

interface ProfileMe {
  id: string;
  username: string;
  avatarUrl: string | null;
  tier: SubscriptionTier;
  xpLevel: XpLevel;
  xp: number;
  nextLevelXp: number;
  accuracy: number;
  followerCount: number;
  followingCount: number;
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

export default function ProfileScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { setUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-me"],
    queryFn: () => apiFetch<ProfileMe>("/profile/me"),
  });

  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ["badges"],
    queryFn: () => apiFetch<UserBadge[]>("/badges"),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      qc.invalidateQueries({ queryKey: ["profile-me"] }),
      qc.invalidateQueries({ queryKey: ["badges"] }),
    ]);
    setRefreshing(false);
  }, [qc]);

  const handleLogout = useCallback(async () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          setUser(null);
          router.replace("/(auth)/login");
        },
      },
    ]);
  }, [logout, setUser, router]);

  const isLoading = profileLoading || badgesLoading;
  const earnedBadges = (badges ?? []).filter((b) => b.unlocked);

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
      <Text style={styles.heading}>Profile</Text>

      {isLoading ? (
        <>
          <SkeletonCard height={120} />
          <SkeletonCard height={48} />
        </>
      ) : profile ? (
        <>
          {/* Profile header */}
          <ProfileHeader
            username={profile.username}
            avatarUrl={profile.avatarUrl}
            tier={profile.tier}
            xpLevel={profile.xpLevel}
            accuracy={profile.accuracy}
            isOwnProfile={true}
            isFollowing={false}
            followerCount={profile.followerCount}
            followingCount={profile.followingCount}
            onFollow={() => {}}
          />

          {/* XP Progress */}
          <View style={styles.xpWrap}>
            <XPProgressBar
              level={profile.xpLevel}
              xp={profile.xp}
              nextLevelXp={profile.nextLevelXp}
            />
          </View>

          {/* Earned Badges */}
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

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push("/settings" as any)}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>Settings</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, styles.logoutRow]}
          onPress={handleLogout}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 40, gap: 16 },
  heading: { color: "#F5F5F5", fontSize: 22, fontWeight: "700" },
  xpWrap: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2E2E2E",
  },
  section: { gap: 12 },
  sectionTitle: { color: "#F5F5F5", fontSize: 16, fontWeight: "700" },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeWrap: { width: "30%" },
  actionsSection: {
    marginTop: 8,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2E2E2E",
  },
  actionText: { color: "#F5F5F5", fontSize: 14 },
  actionChevron: { color: "#8A8A8A", fontSize: 18 },
  logoutRow: { borderBottomWidth: 0 },
  logoutText: { color: "#FF6B6B", fontSize: 14, fontWeight: "600" },
});
