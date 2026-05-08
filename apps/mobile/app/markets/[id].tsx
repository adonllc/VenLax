import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TIER_CONFIG } from "@venlaxiq/shared";
import {
  ProbabilityBar,
  MarketStatusChip,
  CategoryPill,
  SettlementBanner,
} from "@venlaxiq/ui/native";
import type { MarketStatus } from "@venlaxiq/ui/native";
import type { MarketCategory } from "@venlaxiq/ui/native";
import BottomSheet from "@gorhom/bottom-sheet";
import { ForecastBottomSheet } from "@/components/ForecastBottomSheet";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

// ── API shapes ─────────────────────────────────────────────────────────────────

interface Market {
  id: string;
  title: string;
  description: string;
  resolutionCriteria: string;
  category: MarketCategory;
  status: MarketStatus;
  yesShares: number;
  noShares: number;
  liquidityParam: number;
  resolvedOutcome?: boolean | null;
  settledAt?: string | null;
  createdAt: string;
  closesAt?: string | null;
}

interface FPBalanceResponse {
  balance: number;
}

interface ForecastPayload {
  side: boolean;
  fpAmount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Derive yes probability (0–100) from LMSR shares without importing lmsrProbability
 *  to avoid a circular dep — simple normalised share ratio used for display only. */
function deriveYesProb(yesShares: number, noShares: number): number {
  const total = yesShares + noShares;
  if (total === 0) return 50;
  return Math.round((yesShares / total) * 100);
}

const WS_BASE =
  (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001").replace(
    /^http/,
    "ws"
  );

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function MarketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const forecastSheetRef = useRef<BottomSheet>(null);

  const [liveYesProb, setLiveYesProb] = useState<number | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: market, isLoading: marketLoading } = useQuery({
    queryKey: ["market", id],
    queryFn: () => apiFetch<Market>(`/markets/${id}`),
    enabled: !!id,
  });

  const { data: fpBalanceData } = useQuery({
    queryKey: ["fp-balance"],
    queryFn: () => apiFetch<FPBalanceResponse>("/fp-ledger/balance"),
    enabled: !!user,
  });

  // ── WebSocket for live probability ─────────────────────────────────────────

  useEffect(() => {
    if (!id || !market || market.status !== "open") return;

    const ws = new WebSocket(`${WS_BASE}/markets/${id}/ws`);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { yesProb?: number };
        if (typeof payload.yesProb === "number") {
          setLiveYesProb(Math.round(payload.yesProb));
        }
      } catch {
        // Ignore malformed frames
      }
    };

    return () => {
      ws.close();
    };
  }, [id, market?.status]);

  // ── Forecast mutation ──────────────────────────────────────────────────────

  const forecastMutation = useMutation({
    mutationFn: (payload: ForecastPayload) =>
      apiFetch(`/forecast/${id}`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["fp-balance"] });
      qc.invalidateQueries({ queryKey: ["market", id] });
    },
  });

  const handleForecastSubmit = async (side: boolean, fpAmount: number) => {
    await forecastMutation.mutateAsync({ side, fpAmount });
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const yesProb =
    liveYesProb ??
    (market ? deriveYesProb(market.yesShares, market.noShares) : 50);

  const fpBalance = fpBalanceData?.balance ?? 0;

  const maxFP = user
    ? TIER_CONFIG[user.tier].dailyForecastFp
    : TIER_CONFIG.free.dailyForecastFp;

  // ── Loading state ──────────────────────────────────────────────────────────

  if (marketLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D46A" />
      </View>
    );
  }

  if (!market) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Market not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOpen = market.status === "open";
  const isSettled = market.status === "settled";

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Markets</Text>
        </TouchableOpacity>

        {/* Status + Category row */}
        <View style={styles.chipRow}>
          <MarketStatusChip status={market.status} />
          <CategoryPill category={market.category} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{market.title}</Text>

        {/* Probability bar */}
        <View style={styles.section}>
          <ProbabilityBar yesProb={yesProb} />
        </View>

        {/* Settlement banner */}
        {isSettled && market.resolvedOutcome != null && (
          <View style={styles.section}>
            <SettlementBanner
              fpEarned={0}
              outcome={market.resolvedOutcome}
            />
          </View>
        )}

        {/* Resolution criteria */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Resolution Criteria</Text>
          <Text style={styles.bodyText}>{market.resolutionCriteria}</Text>
        </View>

        {/* Description */}
        {!!market.description && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>About</Text>
            <Text style={styles.bodyText}>{market.description}</Text>
          </View>
        )}

        {/* Closes at */}
        {market.closesAt && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Closes</Text>
            <Text style={styles.metaValue}>
              {new Date(market.closesAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        )}

        {/* Spacer for bottom sheet */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Make a Forecast CTA */}
      {isOpen && !!user && (
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => forecastSheetRef.current?.expand()}
            accessibilityRole="button"
            accessibilityLabel="Make a Forecast"
          >
            <Text style={styles.ctaText}>Make a Forecast</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Forecast bottom sheet */}
      <ForecastBottomSheet
        ref={forecastSheetRef}
        marketTitle={market.title}
        yesProb={yesProb}
        fpBalance={fpBalance}
        maxFP={maxFP}
        onSubmit={handleForecastSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { color: "#F5F5F5", fontSize: 16, marginBottom: 16 },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
  },
  backBtnText: { color: "#00D46A", fontWeight: "600" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 24 },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  backArrow: { color: "#8A8A8A", fontSize: 18 },
  backLabel: { color: "#8A8A8A", fontSize: 14 },

  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    alignItems: "center",
  },

  title: {
    color: "#F5F5F5",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    marginBottom: 20,
  },

  section: { marginBottom: 20 },

  sectionHeading: {
    color: "#8A8A8A",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  bodyText: {
    color: "#C8C8C8",
    fontSize: 14,
    lineHeight: 22,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#2E2E2E",
  },
  metaLabel: { color: "#8A8A8A", fontSize: 12 },
  metaValue: { color: "#F5F5F5", fontSize: 13, fontWeight: "600" },

  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
    backgroundColor: "#0D0D0D",
    borderTopWidth: 1,
    borderTopColor: "#2E2E2E",
  },
  ctaBtn: {
    backgroundColor: "#00D46A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { color: "#0D0D0D", fontWeight: "700", fontSize: 16 },
});
