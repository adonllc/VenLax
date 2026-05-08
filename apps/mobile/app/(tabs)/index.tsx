import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BottomSheet from "@gorhom/bottom-sheet";
import { MarketCard } from "@venlaxiq/ui/native";
import { StreakBanner } from "@venlaxiq/ui/native";
import { MissionCard } from "@venlaxiq/ui/native";
import { SkeletonCard } from "@/components/SkeletonCard";
import { DailyLoginSheet } from "@/components/DailyLoginSheet";
import { apiFetch } from "@/lib/api";

// ── API shape types ────────────────────────────────────────────────────────────

interface StreakStatus {
  day: number;
  multiplier: number;
  dailyFp: number;
  claimed: boolean;
}

interface Mission {
  id: string;
  title: string;
  fpReward: number;
  progress: number;
  total: number;
  completed: boolean;
}

interface Market {
  id: string;
  title: string;
  category: string;
  status: string;
  yesProb: number;
  closesAt: string;
  totalVolumeFp?: number;
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

const fetchStreak = () => apiFetch<StreakStatus>("/auth/daily-login/status");
const fetchMissions = () => apiFetch<Mission[]>("/missions/today");
const fetchMarkets = () =>
  apiFetch<{ markets: Market[] }>("/markets?status=open&limit=10").then(
    (r) => r.markets
  );

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const sheetRef = useRef<BottomSheet>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  const {
    data: streak,
    isLoading: streakLoading,
  } = useQuery({ queryKey: ["streak"], queryFn: fetchStreak });

  const { data: missions } = useQuery({
    queryKey: ["missions"],
    queryFn: fetchMissions,
  });

  const {
    data: markets,
    isLoading: marketsLoading,
  } = useQuery({ queryKey: ["home-markets"], queryFn: fetchMarkets });

  // Auto-show bottom sheet when streak is unclaimed
  useEffect(() => {
    if (streak && !streak.claimed) {
      sheetRef.current?.expand();
    }
  }, [streak]);

  const handleClaim = useCallback(async () => {
    setClaimLoading(true);
    try {
      await apiFetch("/auth/daily-login", { method: "POST" });
      qc.invalidateQueries({ queryKey: ["streak"] });
    } finally {
      setClaimLoading(false);
      sheetRef.current?.close();
    }
  }, [qc]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      qc.invalidateQueries({ queryKey: ["streak"] }),
      qc.invalidateQueries({ queryKey: ["missions"] }),
      qc.invalidateQueries({ queryKey: ["home-markets"] }),
    ]);
    setRefreshing(false);
  }, [qc]);

  return (
    <>
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
        {/* Streak Banner */}
        <View style={styles.section}>
          {streakLoading || !streak ? (
            <SkeletonCard height={80} />
          ) : (
            <StreakBanner
              day={streak.day}
              multiplier={streak.multiplier}
              dailyFp={streak.dailyFp}
              claimed={streak.claimed}
              claimLoading={claimLoading}
              onClaim={() => sheetRef.current?.expand()}
            />
          )}
        </View>

        {/* Daily Missions */}
        {missions && missions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Missions</Text>
            {missions.map((m) => (
              <View key={m.id} style={styles.missionItem}>
                <MissionCard
                  title={m.title}
                  fpReward={m.fpReward}
                  progress={m.progress}
                  total={m.total}
                  completed={m.completed}
                />
              </View>
            ))}
          </View>
        )}

        {/* Open Markets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Open Markets</Text>
          {marketsLoading || !markets ? (
            <>
              <SkeletonCard height={120} />
              <SkeletonCard height={120} />
              <SkeletonCard height={120} />
            </>
          ) : markets.length === 0 ? (
            <Text style={styles.empty}>No open markets right now.</Text>
          ) : (
            markets.map((m) => (
              <View key={m.id} style={styles.marketItem}>
                <MarketCard
                  id={m.id}
                  title={m.title}
                  category={m.category as any}
                  status={m.status as any}
                  yesProb={m.yesProb}
                  closesAt={new Date(m.closesAt)}
                  totalVolumeFp={m.totalVolumeFp}
                  onPress={() => router.push(`/markets/${m.id}` as any)}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Daily Login Bottom Sheet */}
      {streak && !streak.claimed && (
        <DailyLoginSheet
          ref={sheetRef}
          streak={streak.day}
          fpReward={streak.dailyFp}
          multiplier={streak.multiplier}
          onClaim={() => {
            qc.invalidateQueries({ queryKey: ["streak"] });
            sheetRef.current?.close();
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 32 },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: "#F5F5F5",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  missionItem: { marginBottom: 8 },
  marketItem: { marginBottom: 12 },
  empty: { color: "#8A8A8A", fontSize: 14, textAlign: "center", paddingVertical: 24 },
});
