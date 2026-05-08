import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();

  const requestPushPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      Alert.alert("Notifications enabled", "You will now receive push notifications.");
    } else {
      Alert.alert("Permission denied", "Push notification permission was not granted.");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Settings",
          headerStyle: { backgroundColor: "#0D0D0D" },
          headerTintColor: "#F5F5F5",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/settings/subscription" as any)}
          accessibilityRole="button"
          accessibilityLabel="Manage subscription"
        >
          <Text style={styles.rowText}>Manage Subscription</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={requestPushPermissions}
          accessibilityRole="button"
          accessibilityLabel="Enable push notifications"
        >
          <Text style={styles.rowText}>Enable Push Notifications</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", paddingHorizontal: 16, paddingTop: 16 },
  section: {
    marginBottom: 24,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    overflow: "hidden",
  },
  sectionTitle: {
    color: "#8A8A8A",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#2E2E2E",
  },
  rowText: { color: "#F5F5F5", fontSize: 14 },
  chevron: { color: "#8A8A8A", fontSize: 18 },
});
