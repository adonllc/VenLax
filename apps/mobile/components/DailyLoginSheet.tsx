import { forwardRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface Props {
  streak: number;
  fpReward: number;
  multiplier: number;
  onClaim: () => void;
}

export const DailyLoginSheet = forwardRef<BottomSheet, Props>(
  ({ streak, fpReward, multiplier, onClaim }, ref) => {
    const qc = useQueryClient();

    const handleClaim = useCallback(async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await apiFetch("/auth/daily-login", { method: "POST" });
      qc.invalidateQueries({ queryKey: ["streak"] });
      onClaim();
    }, [qc, onClaim]);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={["40%"]}
        enablePanDownToClose
        backgroundStyle={styles.bg}
        handleIndicatorStyle={styles.indicator}
      >
        <BottomSheetView style={styles.content}>
          <Text style={styles.emoji}>🔥</Text>
          <Text style={styles.title}>Day {streak} Streak!</Text>
          <Text style={styles.sub}>{multiplier}× FP multiplier active</Text>
          <View style={styles.reward}>
            <Text style={styles.rewardLabel}>Today's reward</Text>
            <Text style={styles.rewardValue}>⚡ {fpReward} FP</Text>
          </View>
          <TouchableOpacity style={styles.claimBtn} onPress={handleClaim}>
            <Text style={styles.claimText}>Claim Daily FP</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

DailyLoginSheet.displayName = "DailyLoginSheet";

const styles = StyleSheet.create({
  bg: { backgroundColor: "#181818" },
  indicator: { backgroundColor: "#2E2E2E" },
  content: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 8 },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#F5F5F5", marginBottom: 4 },
  sub: { fontSize: 14, color: "#FFE600", fontWeight: "600", marginBottom: 20 },
  reward: {
    backgroundColor: "#242424",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rewardLabel: { fontSize: 13, color: "#8A8A8A" },
  rewardValue: { fontSize: 18, fontWeight: "700", color: "#00D46A" },
  claimBtn: {
    backgroundColor: "#FFE600",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
  },
  claimText: { textAlign: "center", fontWeight: "700", fontSize: 16, color: "#0D0D0D" },
});
