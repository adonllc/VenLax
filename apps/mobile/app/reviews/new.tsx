import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  body: string;
  rating: number;
}

// ── Screen ────────────────────────────────────────────────────────────────────

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export default function NewReviewScreen() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ title: "", body: "", rating: 5 });
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Image pickers ──────────────────────────────────────────────────────────

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Camera access is required to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      Alert.alert("Missing fields", "Please fill in a title and review body.");
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("body", form.body);
      formData.append("rating", String(form.rating));

      if (receiptUri) {
        const filename = receiptUri.split("/").pop() ?? "receipt.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        formData.append("receipt", { uri: receiptUri, name: filename, type } as any);
      }

      const res = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Submission failed");
      }

      Alert.alert(
        "Submitted!",
        "Your review is pending approval.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen
        options={{
          title: "Write Review",
          headerStyle: { backgroundColor: "#0D0D0D" },
          headerTintColor: "#F5F5F5",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />

      {/* Star rating */}
      <Text style={styles.label}>Rating</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setForm((f) => ({ ...f, rating: star }))}
            accessibilityLabel={`Rate ${star} star${star > 1 ? "s" : ""}`}
            accessibilityRole="button"
          >
            <Text style={[styles.star, form.rating >= star && styles.starFilled]}>
              {form.rating >= star ? "★" : "☆"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Summary of your experience"
        placeholderTextColor="#5A5A5A"
        value={form.title}
        onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
        returnKeyType="next"
        maxLength={120}
      />

      {/* Body */}
      <Text style={styles.label}>Review</Text>
      <TextInput
        style={[styles.input, styles.bodyInput]}
        placeholder="Share your experience in detail"
        placeholderTextColor="#5A5A5A"
        value={form.body}
        onChangeText={(t) => setForm((f) => ({ ...f, body: t }))}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        maxLength={2000}
      />

      {/* Receipt photo */}
      <Text style={styles.label}>Receipt Photo (optional)</Text>
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.photoBtn} onPress={pickFromLibrary} accessibilityRole="button">
          <Text style={styles.photoBtnText}>Choose from Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={pickFromCamera} accessibilityRole="button">
          <Text style={styles.photoBtnText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
      {receiptUri && (
        <Text style={styles.photoSelected} numberOfLines={1}>
          Selected: {receiptUri.split("/").pop()}
        </Text>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Submit review"
      >
        {loading ? (
          <ActivityIndicator color="#0D0D0D" />
        ) : (
          <Text style={styles.submitText}>Submit Review</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 8 },
  label: { color: "#8A8A8A", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 12 },
  starRow: { flexDirection: "row", gap: 8, marginVertical: 8 },
  star: { fontSize: 32, color: "#3A3A3A" },
  starFilled: { color: "#F5C518" },
  input: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    color: "#F5F5F5",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  bodyInput: { minHeight: 120 },
  photoRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  photoBtn: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    paddingVertical: 12,
    alignItems: "center",
  },
  photoBtnText: { color: "#00D46A", fontWeight: "600", fontSize: 13 },
  photoSelected: { color: "#8A8A8A", fontSize: 12, marginTop: 4 },
  submitBtn: {
    backgroundColor: "#00D46A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: "#0D0D0D", fontWeight: "700", fontSize: 16 },
});
