import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { register } from "@/lib/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ email: "", username: "", password: "", ageConfirm: false });
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleRegister() {
    if (!form.ageConfirm) { Alert.alert("Age requirement", "You must be 18 or older to register."); return; }
    if (!form.email || !form.username || !form.password) { Alert.alert("Missing fields", "Please fill in all fields."); return; }
    setLoading(true);
    try {
      const user = await register(form.email, form.username, form.password);
      setUser(user);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Registration failed", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.inner}>
        <Text style={styles.logo}>VenlaxIQ</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create account</Text>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#8A8A8A" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#8A8A8A" value={form.username} onChangeText={(v) => set("username", v)} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#8A8A8A" value={form.password} onChangeText={(v) => set("password", v)} secureTextEntry />
          <View style={styles.row}>
            <Switch value={form.ageConfirm} onValueChange={(v) => set("ageConfirm", v)} trackColor={{ true: "#00D46A" }} />
            <Text style={styles.switchLabel}>I am 18 years of age or older</Text>
          </View>
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Creating account…" : "Create account"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.link}>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  inner: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  logo: { fontSize: 36, fontWeight: "800", color: "#F5F5F5", marginBottom: 20 },
  card: { width: "100%", backgroundColor: "#181818", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2E2E2E" },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#F5F5F5", marginBottom: 16 },
  input: { backgroundColor: "#242424", borderRadius: 10, borderWidth: 1, borderColor: "#2E2E2E", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 14, color: "#F5F5F5" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  switchLabel: { fontSize: 13, color: "#8A8A8A", flex: 1 },
  button: { backgroundColor: "#00D46A", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#0D0D0D", fontWeight: "700", fontSize: 15 },
  link: { alignItems: "center", marginTop: 14 },
  linkText: { color: "#8A8A8A", fontSize: 13 },
});
