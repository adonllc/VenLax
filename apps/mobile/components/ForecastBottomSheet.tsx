import { forwardRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";

interface Props {
  marketTitle: string;
  yesProb: number;
  fpBalance: number;
  maxFP: number;
  onSubmit: (side: boolean, fpAmount: number) => Promise<void>;
}

export const ForecastBottomSheet = forwardRef<BottomSheet, Props>(
  ({ marketTitle, yesProb, fpBalance, maxFP, onSubmit }, ref) => {
    const [side, setSide] = useState<boolean | null>(null);
    const [fpAmount, setFpAmount] = useState(50);
    const [loading, setLoading] = useState(false);

    const handleSelect = async (selectedSide: boolean) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSide(selectedSide);
    };

    const handleSubmit = useCallback(async () => {
      if (side === null) return;
      setLoading(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
        await onSubmit(side, fpAmount);
        (ref as any)?.current?.close();
      } finally {
        setLoading(false);
      }
    }, [side, fpAmount, onSubmit, ref]);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={["55%"]}
        enablePanDownToClose
        backgroundStyle={styles.bg}
        handleIndicatorStyle={styles.indicator}
      >
        <BottomSheetView style={styles.content}>
          <Text style={styles.label}>Make a Forecast</Text>
          <Text style={styles.market} numberOfLines={2}>
            {marketTitle}
          </Text>

          <View style={styles.probRow}>
            <Text style={styles.probLabel}>Current probability</Text>
            <Text
              style={[
                styles.probValue,
                { color: yesProb >= 50 ? "#00D46A" : "#FF6B00" },
              ]}
            >
              {yesProb}%
            </Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[
                styles.sideBtn,
                styles.yesBtn,
                side === true && styles.selectedYes,
              ]}
              onPress={() => handleSelect(true)}
            >
              <Text style={styles.sideBtnText}>YES</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sideBtn,
                styles.noBtn,
                side === false && styles.selectedNo,
              ]}
              onPress={() => handleSelect(false)}
            >
              <Text style={styles.sideBtnText}>NO</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sliderSection}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>FP to deploy</Text>
              <Text style={styles.sliderValue}>⚡ {fpAmount}</Text>
            </View>
            <Slider
              minimumValue={50}
              maximumValue={Math.min(maxFP, fpBalance)}
              step={50}
              value={fpAmount}
              onValueChange={(v) => setFpAmount(v)}
              minimumTrackTintColor="#00D46A"
              maximumTrackTintColor="#2E2E2E"
              thumbTintColor="#00D46A"
            />
            <Text style={styles.balanceNote}>Balance: ⚡ {fpBalance}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              (side === null || loading) && styles.submitDisabled,
            ]}
            onPress={handleSubmit}
            disabled={side === null || loading}
          >
            <Text style={styles.submitText}>
              {loading ? "Submitting…" : "Confirm Forecast"}
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

ForecastBottomSheet.displayName = "ForecastBottomSheet";

const styles = StyleSheet.create({
  bg: { backgroundColor: "#181818" },
  indicator: { backgroundColor: "#2E2E2E" },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 4 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A8A8A",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  market: { fontSize: 16, fontWeight: "700", color: "#F5F5F5", marginBottom: 12 },
  probRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  probLabel: { fontSize: 13, color: "#8A8A8A" },
  probValue: { fontSize: 20, fontWeight: "800" },
  buttons: { flexDirection: "row", gap: 12, marginBottom: 20 },
  sideBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
  },
  yesBtn: { borderColor: "#00D46A22", backgroundColor: "#00D46A11" },
  noBtn: { borderColor: "#FF6B0022", backgroundColor: "#FF6B0011" },
  selectedYes: { borderColor: "#00D46A", backgroundColor: "#00D46A33" },
  selectedNo: { borderColor: "#FF6B00", backgroundColor: "#FF6B0033" },
  sideBtnText: { fontWeight: "800", fontSize: 16, color: "#F5F5F5" },
  sliderSection: { marginBottom: 20 },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sliderLabel: { fontSize: 13, color: "#8A8A8A" },
  sliderValue: { fontSize: 14, fontWeight: "700", color: "#00D46A" },
  balanceNote: { fontSize: 11, color: "#8A8A8A", textAlign: "right", marginTop: 4 },
  submitBtn: { backgroundColor: "#00D46A", borderRadius: 14, paddingVertical: 16 },
  submitDisabled: { opacity: 0.4 },
  submitText: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    color: "#0D0D0D",
  },
});
