import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { login } from "@/lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    try {
      const user = await login(email, password);
      setUser(user);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.inner}>
        <Text style={styles.logo}>VenlaxIQ</Text>
        <Text style={styles.subtitle}>Predict. Review. Earn.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8A8A8A"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#8A8A8A"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Signing in…" : "Sign in"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={styles.link}>
            <Text style={styles.linkText}>No account? Create one</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  inner: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  logo: { fontSize: 36, fontWeight: "800", color: "#F5F5F5", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#8A8A8A", marginBottom: 32 },
  card: { width: "100%", backgroundColor: "#181818", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2E2E2E" },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#F5F5F5", marginBottom: 16 },
  input: { backgroundColor: "#242424", borderRadius: 10, borderWidth: 1, borderColor: "#2E2E2E", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 14, color: "#F5F5F5" },
  button: { backgroundColor: "#00D46A", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#0D0D0D", fontWeight: "700", fontSize: 15 },
  link: { alignItems: "center", marginTop: 14 },
  linkText: { color: "#8A8A8A", fontSize: 13 },
});
