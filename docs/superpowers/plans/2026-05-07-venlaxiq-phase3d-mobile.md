# VenlaxIQ Phase 3D — Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Expo 51 / React Native mobile app — auth flow, 5-tab bottom navigation, all screens, push notification registration, and deep link handling.

**Architecture:** Expo Router v3 (already configured via `"main": "expo-router/entry"`). JWT stored in `expo-secure-store`. TanStack Query v5 for all data fetching (same query key conventions as web). Push notifications via `expo-notifications` with deep link routing in the root `_layout.tsx`. Bottom sheets via `@gorhom/bottom-sheet` for forecast entry and daily login claim.

**Tech Stack:** Expo 51 · React Native 0.74 · Expo Router v3 · TanStack Query v5 · `@gorhom/bottom-sheet` · `expo-secure-store` · `expo-notifications` · `expo-haptics` · `expo-image-picker` · `packages/ui/native` components

---

## File Map

**New dependencies (apps/mobile/package.json):**
- `@tanstack/react-query` ^5.0.0
- `@gorhom/bottom-sheet` ^4.0.0
- `expo-secure-store` ~13.0.0
- `expo-notifications` ~0.28.0
- `expo-haptics` ~13.0.0
- `expo-image-picker` ~15.0.0
- `react-native-reanimated` ~3.10.0
- `react-native-gesture-handler` ~2.16.0
- `react-native-safe-area-context` ^4.0.0
- `react-native-screens` ~3.31.0

**New files:**
- `apps/mobile/lib/api.ts` — authenticated fetch helper (reads token from SecureStore)
- `apps/mobile/lib/auth.ts` — login, register, logout, getToken helpers
- `apps/mobile/lib/query-client.ts` — shared QueryClient instance
- `apps/mobile/providers/AuthProvider.tsx` — React context with user + token state
- `apps/mobile/providers/QueryProvider.tsx` — TanStack Query provider
- `apps/mobile/app/_layout.tsx` — root layout: providers + push notification setup + deep link handler
- `apps/mobile/app/(auth)/_layout.tsx` — redirect if authed
- `apps/mobile/app/(auth)/login.tsx`
- `apps/mobile/app/(auth)/register.tsx`
- `apps/mobile/app/(tabs)/_layout.tsx` — BottomTabBar
- `apps/mobile/app/(tabs)/index.tsx` — Home feed
- `apps/mobile/app/(tabs)/forecast.tsx` — Market browser + positions
- `apps/mobile/app/(tabs)/reviews.tsx` — Review browse
- `apps/mobile/app/(tabs)/rewards.tsx` — Wallet + catalog
- `apps/mobile/app/(tabs)/profile.tsx` — Own profile
- `apps/mobile/app/markets/[id].tsx` — Market detail + ForecastEntry BottomSheet
- `apps/mobile/app/reviews/[productId].tsx` — Product reviews FlatList
- `apps/mobile/app/reviews/new.tsx` — Review form + camera upload
- `apps/mobile/app/profile/[userId].tsx` — Public profile + FollowButton
- `apps/mobile/app/leaderboard.tsx`
- `apps/mobile/app/rewards/redeem/[id].tsx` — Redemption confirmation
- `apps/mobile/app/settings/index.tsx` — Account + theme + notifications
- `apps/mobile/app/settings/subscription.tsx` — Tier upgrade
- `apps/mobile/components/ForecastBottomSheet.tsx` — YES/NO sheet with FP slider
- `apps/mobile/components/DailyLoginSheet.tsx` — Daily claim sheet
- `apps/mobile/components/SkeletonCard.tsx` — Loading skeleton

---

## Task 1: Install mobile dependencies

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/app.json`

- [ ] **Step 1: Update package.json**

Replace the entire `apps/mobile/package.json`:

```json
{
  "name": "mobile",
  "version": "0.1.0",
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "build": "expo export",
    "android": "expo run:android",
    "ios": "expo run:ios"
  },
  "dependencies": {
    "@gorhom/bottom-sheet": "^4.6.0",
    "@tanstack/react-query": "^5.0.0",
    "@venlaxiq/shared": "workspace:*",
    "@venlaxiq/ui": "workspace:*",
    "expo": "~51.0.0",
    "expo-haptics": "~13.0.0",
    "expo-image-picker": "~15.0.0",
    "expo-notifications": "~0.28.0",
    "expo-router": "~3.5.0",
    "expo-secure-store": "~13.0.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "react-native-gesture-handler": "~2.16.0",
    "react-native-reanimated": "~3.10.0",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "~3.31.0"
  },
  "devDependencies": {
    "@types/react": "~18.2.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Update app.json to add expo-secure-store and expo-notifications plugins**

Replace the entire `apps/mobile/app.json`:

```json
{
  "expo": {
    "name": "VenlaxIQ",
    "slug": "venlaxiq",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "scheme": "venlaxiq",
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.venlaxiq"
    },
    "android": {
      "adaptiveIcon": {},
      "package": "com.venlaxiq"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#00D46A"
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#00D46A"
    }
  }
}
```

Note: Create placeholder icon files if they don't exist:

```bash
mkdir -p apps/mobile/assets
# Copy any PNG as placeholder for icon.png and notification-icon.png if they don't exist
```

- [ ] **Step 3: Install dependencies**

```bash
pnpm --filter mobile install
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/package.json apps/mobile/app.json
git commit -m "feat(mobile): add React Query, bottom-sheet, expo-notifications, secure-store deps"
```

---

## Task 2: lib/api.ts + lib/auth.ts + providers

**Files:**
- Create: `apps/mobile/lib/api.ts`
- Create: `apps/mobile/lib/auth.ts`
- Create: `apps/mobile/lib/query-client.ts`
- Create: `apps/mobile/providers/AuthProvider.tsx`
- Create: `apps/mobile/providers/QueryProvider.tsx`

- [ ] **Step 1: Create lib/api.ts**

Create `apps/mobile/lib/api.ts`:

```typescript
import * as SecureStore from "expo-secure-store";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await SecureStore.getItemAsync("auth_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "API error");
  }
  return res.json();
}
```

- [ ] **Step 2: Create lib/auth.ts**

Create `apps/mobile/lib/auth.ts`:

```typescript
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "./api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export interface AuthUser {
  id: string;
  email: string;
  tier: "free" | "pro" | "elite";
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{ token: string; user?: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  // Decode user from JWT payload
  const payload = JSON.parse(atob(data.token.split(".")[1]));
  const user: AuthUser = { id: payload.sub, email: payload.email, tier: payload.tier };
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  return user;
}

export async function register(email: string, username: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{ token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  const payload = JSON.parse(atob(data.token.split(".")[1]));
  const user: AuthUser = { id: payload.sub, email: payload.email, tier: payload.tier };
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  return user;
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}
```

- [ ] **Step 3: Create lib/query-client.ts**

Create `apps/mobile/lib/query-client.ts`:

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
```

- [ ] **Step 4: Create AuthProvider**

Create `apps/mobile/providers/AuthProvider.tsx`:

```tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { getStoredUser, AuthUser } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStoredUser().then((u) => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 5: Create QueryProvider**

Create `apps/mobile/providers/QueryProvider.tsx`:

```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/lib/ apps/mobile/providers/
git commit -m "feat(mobile): API fetch helper, auth helpers (SecureStore), AuthProvider, QueryProvider"
```

---

## Task 3: Root layout + push notifications + deep links

**Files:**
- Create: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Create root layout**

Create `apps/mobile/app/_layout.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

// Configure how notifications are presented when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerPushToken() {
  const token = await getToken();
  if (!token) return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
    await apiFetch("/notifications/push-token", {
      method: "POST",
      body: JSON.stringify({ token: pushToken, platform: "ios" }),
    });
  } catch {
    // Non-fatal — user may have denied permissions
  }
}

export default function RootLayout() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerPushToken();

    // Handle notification tap → deep link
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (data.marketId) router.push(`/markets/${data.marketId}` as any);
      else if (data.redemptionId) router.push(`/rewards/redeem/${data.redemptionId}` as any);
      else if (data.type === "daily_fp") router.push("/(tabs)");
      else if (data.type === "leaderboard") router.push("/leaderboard" as any);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): root layout with push notification setup + deep link handler"
```

---

## Task 4: Auth screens (login + register)

**Files:**
- Create: `apps/mobile/app/(auth)/_layout.tsx`
- Create: `apps/mobile/app/(auth)/login.tsx`
- Create: `apps/mobile/app/(auth)/register.tsx`

- [ ] **Step 1: Create auth layout (redirect if already authed)**

Create `apps/mobile/app/(auth)/_layout.tsx`:

```tsx
import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";

export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.replace("/(tabs)");
  }, [user, isLoading, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Create login screen**

Create `apps/mobile/app/(auth)/login.tsx`:

```tsx
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
```

- [ ] **Step 3: Create register screen**

Create `apps/mobile/app/(auth)/register.tsx`:

```tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/\(auth\)/
git commit -m "feat(mobile): auth screens — login and register with age gate"
```

---

## Task 5: Bottom tab layout + Home screen

**Files:**
- Create: `apps/mobile/app/(tabs)/_layout.tsx`
- Create: `apps/mobile/app/(tabs)/index.tsx`
- Create: `apps/mobile/components/DailyLoginSheet.tsx`
- Create: `apps/mobile/components/SkeletonCard.tsx`

- [ ] **Step 1: Create SkeletonCard**

Create `apps/mobile/components/SkeletonCard.tsx`:

```tsx
import { View, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";

export function SkeletonCard({ height = 100 }: { height?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeleton, { height, opacity }]} />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#2E2E2E",
    borderRadius: 12,
    width: "100%",
    marginBottom: 12,
  },
});
```

- [ ] **Step 2: Create DailyLoginSheet**

Create `apps/mobile/components/DailyLoginSheet.tsx`:

```tsx
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
      <BottomSheet ref={ref} index={-1} snapPoints={["40%"]} enablePanDownToClose backgroundStyle={styles.bg} handleIndicatorStyle={styles.indicator}>
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
  reward: { backgroundColor: "#242424", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 24, flexDirection: "row", alignItems: "center", gap: 12 },
  rewardLabel: { fontSize: 13, color: "#8A8A8A" },
  rewardValue: { fontSize: 18, fontWeight: "700", color: "#00D46A" },
  claimBtn: { backgroundColor: "#FFE600", borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, width: "100%" },
  claimText: { textAlign: "center", fontWeight: "700", fontSize: 16, color: "#0D0D0D" },
});
```

- [ ] **Step 3: Create bottom tab layout**

Create `apps/mobile/app/(tabs)/_layout.tsx`:

```tsx
import { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { BottomTabBar } from "@venlaxiq/ui/native";

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/(auth)/login");
  }, [user, isLoading, router]);

  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: () => "🏠" }} />
      <Tabs.Screen name="forecast" options={{ title: "Forecast", tabBarIcon: () => "📈" }} />
      <Tabs.Screen name="reviews" options={{ title: "Reviews", tabBarIcon: () => "⭐" }} />
      <Tabs.Screen name="rewards" options={{ title: "Rewards", tabBarIcon: () => "🎁" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: () => "👤" }} />
    </Tabs>
  );
}
```

- [ ] **Step 4: Create Home tab screen**

Create `apps/mobile/app/(tabs)/index.tsx`:

```tsx
import { useRef, useEffect } from "react";
import { ScrollView, RefreshControl, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import BottomSheet from "@gorhom/bottom-sheet";
import { apiFetch } from "@/lib/api";
import { MarketCard, MissionCard, StreakBanner } from "@venlaxiq/ui/native";
import { DailyLoginSheet } from "@/components/DailyLoginSheet";
import { SkeletonCard } from "@/components/SkeletonCard";

export default function HomeScreen() {
  const router = useRouter();
  const dailySheetRef = useRef<BottomSheet>(null);

  const { data: streak, refetch: refetchStreak } = useQuery({
    queryKey: ["streak"],
    queryFn: () => apiFetch<any>("/auth/daily-login/status"),
  });

  const { data: missions } = useQuery({
    queryKey: ["missions"],
    queryFn: () => apiFetch<any[]>("/missions/today"),
  });

  const { data: marketsData, isLoading: marketsLoading, refetch: refetchMarkets } = useQuery({
    queryKey: ["home-markets"],
    queryFn: () => apiFetch<{ markets: any[] }>("/markets?status=open&limit=10"),
  });

  // Auto-show daily login sheet if streak not claimed
  useEffect(() => {
    if (streak && !streak.claimed) {
      dailySheetRef.current?.expand();
    }
  }, [streak]);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => { refetchStreak(); refetchMarkets(); }}
            tintColor="#00D46A"
          />
        }
      >
        <Text style={styles.heading}>Home</Text>

        {streak && streak.currentStreak > 0 && (
          <View style={styles.section}>
            <StreakBanner
              currentDay={streak.currentStreak}
              multiplier={streak.multiplier}
              fpToday={streak.fpToday}
              claimed={streak.claimed}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Missions</Text>
          {missions?.map((m) => (
            <MissionCard key={m.id} title={m.title} fpReward={m.fpReward} completed={m.completed} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Markets</Text>
          {marketsLoading ? (
            <>
              <SkeletonCard height={90} />
              <SkeletonCard height={90} />
            </>
          ) : (
            marketsData?.markets.map((m) => (
              <TouchableOpacity key={m.id} onPress={() => router.push(`/markets/${m.id}`)}>
                <MarketCard
                  title={m.title}
                  category={m.category}
                  yesProb={Math.round((m.qYes / Math.max(m.qYes + m.qNo, 1)) * 100)}
                  closesAt={new Date(m.closesAt)}
                  status={m.status}
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {streak && !streak.claimed && (
        <DailyLoginSheet
          ref={dailySheetRef}
          streak={streak.currentStreak}
          fpReward={streak.fpToday}
          multiplier={streak.multiplier}
          onClaim={() => dailySheetRef.current?.close()}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { padding: 16, paddingTop: 52 },
  heading: { fontSize: 28, fontWeight: "800", color: "#F5F5F5", marginBottom: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
});
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/\(tabs\)/ apps/mobile/components/
git commit -m "feat(mobile): bottom tabs layout, home screen with daily login sheet + skeleton loaders"
```

---

## Task 6: Forecast + Reviews + Rewards + Profile tabs

**Files:**
- Create: `apps/mobile/app/(tabs)/forecast.tsx`
- Create: `apps/mobile/app/(tabs)/reviews.tsx`
- Create: `apps/mobile/app/(tabs)/rewards.tsx`
- Create: `apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Create Forecast tab**

Create `apps/mobile/app/(tabs)/forecast.tsx`:

```tsx
import { ScrollView, RefreshControl, Text, View, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PositionRow } from "@venlaxiq/ui/native";
import { SkeletonCard } from "@/components/SkeletonCard";

export default function ForecastScreen() {
  const { data: positions, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["positions"],
    queryFn: () => apiFetch("/forecast/positions"),
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#00D46A" />}
    >
      <Text style={styles.heading}>My Forecasts</Text>
      {isLoading ? (
        <><SkeletonCard height={70} /><SkeletonCard height={70} /></>
      ) : positions?.length ? (
        positions.map((p) => (
          <PositionRow
            key={p.id}
            marketTitle={p.marketTitle ?? "Market"}
            side={p.side}
            fpDeployed={p.fpDeployed}
            shares={p.shares}
            isSettled={p.isSettled}
            fpEarned={p.fpEarned}
          />
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No forecasts yet</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { padding: 16, paddingTop: 52 },
  heading: { fontSize: 28, fontWeight: "800", color: "#F5F5F5", marginBottom: 16 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: "#8A8A8A", fontSize: 14 },
});
```

- [ ] **Step 2: Create Reviews tab**

Create `apps/mobile/app/(tabs)/reviews.tsx`:

```tsx
import { FlatList, TouchableOpacity, Text, View, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ReviewCard } from "@venlaxiq/ui/native";
import { SkeletonCard } from "@/components/SkeletonCard";

export default function ReviewsScreen() {
  const router = useRouter();
  const { data: reviews, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["reviews-browse"],
    queryFn: () => apiFetch("/reviews?status=published&limit=20"),
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Reviews</Text>
        <TouchableOpacity onPress={() => router.push("/reviews/new")} style={styles.addBtn}>
          <Text style={styles.addText}>+ Write</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={{ padding: 16 }}>
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#00D46A" />}
          renderItem={({ item }) => (
            <ReviewCard
              reviewer={{ username: item.username ?? "User", avatarUrl: item.avatarUrl }}
              rating={item.rating}
              title={item.title}
              body={item.body}
              badge={item.badge}
              helpfulVotes={item.helpfulVotes}
              totalVotes={item.totalVotes}
              createdAt={new Date(item.createdAt)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No reviews yet</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 52, paddingBottom: 8 },
  heading: { fontSize: 28, fontWeight: "800", color: "#F5F5F5" },
  addBtn: { backgroundColor: "#00D46A", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addText: { color: "#0D0D0D", fontWeight: "700", fontSize: 13 },
  empty: { color: "#8A8A8A", textAlign: "center", marginTop: 60 },
});
```

- [ ] **Step 3: Create Rewards tab**

Create `apps/mobile/app/(tabs)/rewards.tsx`:

```tsx
import { FlatList, Text, View, TouchableOpacity, StyleSheet, Alert, RefreshControl } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { WalletSummary, RewardCard } from "@venlaxiq/ui/native";

export default function RewardsScreen() {
  const qc = useQueryClient();

  const { data: balance, refetch: refetchBalance } = useQuery<{ balance: number }>({
    queryKey: ["fp-balance"],
    queryFn: () => apiFetch("/fp-ledger/balance"),
  });

  const { data: catalog, isLoading, refetch: refetchCatalog } = useQuery<any[]>({
    queryKey: ["reward-catalog"],
    queryFn: () => apiFetch("/rewards/catalog"),
  });

  const redeem = useMutation({
    mutationFn: (catalogItemId: string) =>
      apiFetch<any>("/rewards/redeem", { method: "POST", body: JSON.stringify({ catalogItemId }) }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["fp-balance"] });
      Alert.alert("Redeemed!", `Your code: ${data.code}`);
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  });

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: "#0D0D0D" }}
      contentContainerStyle={{ padding: 16, paddingTop: 52 }}
      ListHeaderComponent={() => (
        <>
          <Text style={styles.heading}>Rewards</Text>
          <WalletSummary fpBalance={balance?.balance ?? 0} style={styles.wallet} />
          <Text style={styles.sectionTitle}>Reward Catalog</Text>
        </>
      )}
      data={catalog}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <RewardCard
          name={item.name}
          category={item.category}
          fpCost={item.fpCost}
          description={item.description}
          canAfford={(balance?.balance ?? 0) >= item.fpCost}
          onRedeem={() => redeem.mutate(item.id)}
          isLoading={redeem.isPending}
        />
      )}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetchBalance(); refetchCatalog(); }} tintColor="#00D46A" />}
    />
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 28, fontWeight: "800", color: "#F5F5F5", marginBottom: 16 },
  wallet: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
});
```

- [ ] **Step 4: Create Profile tab**

Create `apps/mobile/app/(tabs)/profile.tsx`:

```tsx
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Alert, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { logout } from "@/lib/auth";
import { useAuth } from "@/providers/AuthProvider";
import { ProfileHeader, BadgeDisplay, XPProgressBar } from "@venlaxiq/ui/native";

export default function ProfileScreen() {
  const router = useRouter();
  const { setUser } = useAuth();

  const { data: profile, refetch } = useQuery<any>({
    queryKey: ["profile-me"],
    queryFn: () => apiFetch("/profile/me"),
  });

  const { data: badges } = useQuery<any[]>({
    queryKey: ["badges"],
    queryFn: () => apiFetch("/badges"),
  });

  async function handleLogout() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
          setUser(null);
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#00D46A" />}
    >
      <Text style={styles.heading}>Profile</Text>

      {profile && (
        <>
          <ProfileHeader
            username={profile.user.username}
            avatarUrl={profile.user.avatarUrl}
            subscriptionTier={profile.user.subscriptionTier}
            totalForecasts={profile.totalForecasts}
            reputationScore={profile.user.reputationScore}
          />
          <View style={styles.section}>
            <XPProgressBar xpTotal={profile.user.xpTotal} xpLevel={profile.user.xpLevel} />
          </View>
        </>
      )}

      {badges && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badges}>
            {badges.filter((b) => b.earned).map((b) => <BadgeDisplay key={b.id} badge={b} />)}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity onPress={() => router.push("/settings")} style={styles.settingsBtn}>
          <Text style={styles.settingsBtnText}>⚙ Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { padding: 16, paddingTop: 52 },
  heading: { fontSize: 28, fontWeight: "800", color: "#F5F5F5", marginBottom: 16 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  settingsBtn: { backgroundColor: "#181818", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#2E2E2E", marginBottom: 10 },
  settingsBtnText: { color: "#F5F5F5", fontSize: 14, fontWeight: "600" },
  logoutBtn: { padding: 14, alignItems: "center" },
  logoutText: { color: "#FF6B00", fontSize: 14, fontWeight: "600" },
});
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/\(tabs\)/forecast.tsx apps/mobile/app/\(tabs\)/reviews.tsx apps/mobile/app/\(tabs\)/rewards.tsx apps/mobile/app/\(tabs\)/profile.tsx
git commit -m "feat(mobile): forecast, reviews, rewards, profile tab screens"
```

---

## Task 7: Market detail screen + ForecastBottomSheet

**Files:**
- Create: `apps/mobile/components/ForecastBottomSheet.tsx`
- Create: `apps/mobile/app/markets/[id].tsx`

- [ ] **Step 1: Create ForecastBottomSheet**

Create `apps/mobile/components/ForecastBottomSheet.tsx`:

```tsx
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
      <BottomSheet ref={ref} index={-1} snapPoints={["55%"]} enablePanDownToClose backgroundStyle={styles.bg} handleIndicatorStyle={styles.indicator}>
        <BottomSheetView style={styles.content}>
          <Text style={styles.label}>Make a Forecast</Text>
          <Text style={styles.market} numberOfLines={2}>{marketTitle}</Text>

          <View style={styles.probRow}>
            <Text style={styles.probLabel}>Current probability</Text>
            <Text style={[styles.probValue, { color: yesProb >= 50 ? "#00D46A" : "#FF6B00" }]}>{yesProb}%</Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.sideBtn, styles.yesBtn, side === true && styles.selectedYes]}
              onPress={() => handleSelect(true)}
            >
              <Text style={styles.sideBtnText}>YES</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sideBtn, styles.noBtn, side === false && styles.selectedNo]}
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
            style={[styles.submitBtn, (side === null || loading) && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={side === null || loading}
          >
            <Text style={styles.submitText}>{loading ? "Submitting…" : "Confirm Forecast"}</Text>
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
  label: { fontSize: 11, fontWeight: "700", color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  market: { fontSize: 16, fontWeight: "700", color: "#F5F5F5", marginBottom: 12 },
  probRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  probLabel: { fontSize: 13, color: "#8A8A8A" },
  probValue: { fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  buttons: { flexDirection: "row", gap: 12, marginBottom: 20 },
  sideBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 2 },
  yesBtn: { borderColor: "#00D46A22", backgroundColor: "#00D46A11" },
  noBtn: { borderColor: "#FF6B0022", backgroundColor: "#FF6B0011" },
  selectedYes: { borderColor: "#00D46A", backgroundColor: "#00D46A33" },
  selectedNo: { borderColor: "#FF6B00", backgroundColor: "#FF6B0033" },
  sideBtnText: { fontWeight: "800", fontSize: 16, color: "#F5F5F5" },
  sliderSection: { marginBottom: 20 },
  sliderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  sliderLabel: { fontSize: 13, color: "#8A8A8A" },
  sliderValue: { fontSize: 14, fontWeight: "700", color: "#00D46A" },
  balanceNote: { fontSize: 11, color: "#8A8A8A", textAlign: "right", marginTop: 4 },
  submitBtn: { backgroundColor: "#00D46A", borderRadius: 14, paddingVertical: 16 },
  submitDisabled: { opacity: 0.4 },
  submitText: { textAlign: "center", fontWeight: "700", fontSize: 16, color: "#0D0D0D" },
});
```

Note: `@react-native-community/slider` needs to be installed:

```bash
pnpm --filter mobile add @react-native-community/slider
```

- [ ] **Step 2: Create market detail screen**

Create `apps/mobile/app/markets/[id].tsx`:

```tsx
import { useRef, useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BottomSheet from "@gorhom/bottom-sheet";
import { apiFetch } from "@/lib/api";
import { ProbabilityBar, MarketStatusChip, CategoryPill, SettlementBanner } from "@venlaxiq/ui/native";
import { ForecastBottomSheet } from "@/components/ForecastBottomSheet";
import { TIER_CONFIG } from "@venlaxiq/shared";
import { useAuth } from "@/providers/AuthProvider";

export default function MarketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const forecastSheetRef = useRef<BottomSheet>(null);
  const [liveProb, setLiveProb] = useState<number | null>(null);

  const { data: market, isLoading, refetch } = useQuery<any>({
    queryKey: ["market", id],
    queryFn: () => apiFetch(`/markets/${id}`),
  });

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["fp-balance"],
    queryFn: () => apiFetch("/fp-ledger/balance"),
  });

  // WebSocket for live probability
  useEffect(() => {
    const WS_BASE = (process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:3001").replace("http", "ws");
    const ws = new WebSocket(`${WS_BASE}/markets/${id}/ws`);
    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.type === "probability_update") setLiveProb(data.prob);
    };
    return () => ws.close();
  }, [id]);

  const forecastMutation = useMutation({
    mutationFn: (payload: { side: boolean; fpAmount: number }) =>
      apiFetch(`/forecast/${id}`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["fp-balance"] });
    },
  });

  if (!market) return <View style={styles.loading}><Text style={styles.loadingText}>Loading…</Text></View>;

  const prob = liveProb ?? Math.round((market.qYes / Math.max(market.qYes + market.qNo, 1)) * 100);
  const maxFP = user ? TIER_CONFIG[user.tier]?.dailyFPCap ?? 500 : 500;

  return (
    <>
      <Stack.Screen options={{ title: market.title, headerStyle: { backgroundColor: "#0D0D0D" }, headerTintColor: "#F5F5F5" }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#00D46A" />}
      >
        <View style={styles.chips}>
          <CategoryPill category={market.category} />
          <MarketStatusChip status={market.status} />
        </View>

        <Text style={styles.title}>{market.title}</Text>
        <Text style={styles.desc}>{market.description}</Text>

        <View style={styles.probSection}>
          <ProbabilityBar yesProb={prob} />
        </View>

        {market.status === "open" && user && (
          <TouchableOpacity
            style={styles.forecastBtn}
            onPress={() => forecastSheetRef.current?.expand()}
          >
            <Text style={styles.forecastBtnText}>Make a Forecast</Text>
          </TouchableOpacity>
        )}

        {market.status === "settled" && (
          <SettlementBanner outcome={market.resolvedOutcome} />
        )}

        <View style={styles.details}>
          <Text style={styles.detailsTitle}>Resolution Criteria</Text>
          <Text style={styles.detailsText}>{market.resolutionCriteria}</Text>
          <Text style={styles.closesAt}>
            Closes: {new Date(market.closesAt).toLocaleDateString("en-US", { dateStyle: "long" })}
          </Text>
        </View>
      </ScrollView>

      <ForecastBottomSheet
        ref={forecastSheetRef}
        marketTitle={market.title}
        yesProb={prob}
        fpBalance={balance?.balance ?? 0}
        maxFP={maxFP}
        onSubmit={async (side, fpAmount) => {
          await forecastMutation.mutateAsync({ side, fpAmount });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { padding: 16 },
  loading: { flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#8A8A8A" },
  chips: { flexDirection: "row", gap: 8, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#F5F5F5", marginBottom: 8 },
  desc: { fontSize: 14, color: "#8A8A8A", lineHeight: 21, marginBottom: 20 },
  probSection: { marginBottom: 20 },
  forecastBtn: { backgroundColor: "#00D46A", borderRadius: 14, paddingVertical: 16, marginBottom: 20 },
  forecastBtnText: { textAlign: "center", fontWeight: "700", fontSize: 16, color: "#0D0D0D" },
  details: { backgroundColor: "#181818", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#2E2E2E" },
  detailsTitle: { fontSize: 11, fontWeight: "700", color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  detailsText: { fontSize: 13, color: "#F5F5F5", lineHeight: 20, marginBottom: 8 },
  closesAt: { fontSize: 11, color: "#8A8A8A" },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/components/ForecastBottomSheet.tsx apps/mobile/app/markets/
git commit -m "feat(mobile): market detail screen + ForecastBottomSheet with haptic feedback"
```

---

## Task 8: Remaining screens

**Files:**
- Create: `apps/mobile/app/reviews/[productId].tsx`
- Create: `apps/mobile/app/reviews/new.tsx`
- Create: `apps/mobile/app/profile/[userId].tsx`
- Create: `apps/mobile/app/leaderboard.tsx`
- Create: `apps/mobile/app/rewards/redeem/[id].tsx`
- Create: `apps/mobile/app/settings/index.tsx`
- Create: `apps/mobile/app/settings/subscription.tsx`

- [ ] **Step 1: Create product reviews screen**

Create `apps/mobile/app/reviews/[productId].tsx`:

```tsx
import { FlatList, Text, View, StyleSheet, RefreshControl } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ReviewCard } from "@venlaxiq/ui/native";
import { SkeletonCard } from "@/components/SkeletonCard";

export default function ProductReviewsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { data: reviews, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["reviews", productId],
    queryFn: () => apiFetch(`/reviews/${productId}`),
  });

  return (
    <>
      <Stack.Screen options={{ title: "Reviews", headerStyle: { backgroundColor: "#0D0D0D" }, headerTintColor: "#F5F5F5" }} />
      {isLoading ? (
        <View style={{ padding: 16, backgroundColor: "#0D0D0D", flex: 1 }}>
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: "#0D0D0D" }}
          contentContainerStyle={{ padding: 16 }}
          data={reviews}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#00D46A" />}
          renderItem={({ item }) => (
            <ReviewCard
              reviewer={{ username: item.username ?? "User", avatarUrl: item.avatarUrl }}
              rating={item.rating}
              title={item.title}
              body={item.body}
              badge={item.badge}
              helpfulVotes={item.helpfulVotes}
              totalVotes={item.totalVotes}
              createdAt={new Date(item.createdAt)}
            />
          )}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Create new review screen with camera**

Create `apps/mobile/app/reviews/new.tsx`:

```tsx
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { apiFetch } from "@/lib/api";
import * as SecureStore from "expo-secure-store";

export default function NewReviewScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", body: "", rating: 5 });
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickReceipt() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setReceiptUri(result.assets[0].uri);
  }

  async function takeReceiptPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission required", "Camera access needed to take receipt photo."); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setReceiptUri(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!form.title || !form.body) { Alert.alert("Missing fields", "Please fill in all fields."); return; }
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("body", form.body);
      formData.append("rating", String(form.rating));
      if (receiptUri) {
        formData.append("receipt", { uri: receiptUri, name: "receipt.jpg", type: "image/jpeg" } as any);
      }
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001"}/reviews`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Submission failed");
      }
      Alert.alert("Submitted!", "Your review is pending approval.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Write Review", headerStyle: { backgroundColor: "#0D0D0D" }, headerTintColor: "#F5F5F5" }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Review title" placeholderTextColor="#8A8A8A" />

        <Text style={styles.label}>Review</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.body} onChangeText={(v) => setForm((f) => ({ ...f, body: v }))} placeholder="Share your experience…" placeholderTextColor="#8A8A8A" multiline numberOfLines={5} />

        <Text style={styles.label}>Rating</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setForm((f) => ({ ...f, rating: s }))}>
              <Text style={[styles.star, s <= form.rating && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Receipt (optional — boosts Verified badge)</Text>
        <View style={styles.receiptRow}>
          <TouchableOpacity style={styles.receiptBtn} onPress={pickReceipt}>
            <Text style={styles.receiptBtnText}>Photo Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.receiptBtn} onPress={takeReceiptPhoto}>
            <Text style={styles.receiptBtnText}>Camera</Text>
          </TouchableOpacity>
        </View>
        {receiptUri && <Image source={{ uri: receiptUri }} style={styles.preview} />}

        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitDisabled]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitText}>{loading ? "Submitting…" : "Submit Review"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { padding: 16 },
  label: { fontSize: 11, fontWeight: "700", color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: "#181818", borderRadius: 10, borderWidth: 1, borderColor: "#2E2E2E", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#F5F5F5" },
  textArea: { height: 120, textAlignVertical: "top" },
  stars: { flexDirection: "row", gap: 8 },
  star: { fontSize: 28, color: "#2E2E2E" },
  starActive: { color: "#FFE600" },
  receiptRow: { flexDirection: "row", gap: 10 },
  receiptBtn: { flex: 1, backgroundColor: "#181818", borderRadius: 10, borderWidth: 1, borderColor: "#2E2E2E", padding: 12, alignItems: "center" },
  receiptBtnText: { color: "#8A8A8A", fontSize: 13 },
  preview: { width: "100%", height: 180, borderRadius: 10, marginTop: 10 },
  submitBtn: { backgroundColor: "#00D46A", borderRadius: 14, paddingVertical: 16, marginTop: 24 },
  submitDisabled: { opacity: 0.5 },
  submitText: { textAlign: "center", fontWeight: "700", fontSize: 16, color: "#0D0D0D" },
});
```

- [ ] **Step 3: Create leaderboard screen**

Create `apps/mobile/app/leaderboard.tsx`:

```tsx
import { FlatList, Text, StyleSheet, RefreshControl } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { LeaderboardRow } from "@venlaxiq/ui/native";
import { SkeletonCard } from "@/components/SkeletonCard";

export default function LeaderboardScreen() {
  const { data: entries, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["leaderboard"],
    queryFn: () => apiFetch("/leaderboard"),
  });

  return (
    <>
      <Stack.Screen options={{ title: "Leaderboard", headerStyle: { backgroundColor: "#0D0D0D" }, headerTintColor: "#F5F5F5" }} />
      <FlatList
        style={{ flex: 1, backgroundColor: "#0D0D0D" }}
        contentContainerStyle={{ padding: 16 }}
        data={entries}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#00D46A" />}
        ListHeaderComponent={() => <Text style={styles.heading}>Leaderboard</Text>}
        renderItem={({ item }) => (
          <LeaderboardRow
            rank={item.rank}
            username={item.username}
            avatarUrl={item.avatarUrl}
            reputationScore={item.reputationScore}
            xpLevel={item.xpLevel}
            subscriptionTier={item.subscriptionTier}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: "800", color: "#F5F5F5", marginBottom: 12 },
});
```

- [ ] **Step 4: Create public profile screen**

Create `apps/mobile/app/profile/[userId].tsx`:

```tsx
import { ScrollView, Text, View, StyleSheet, RefreshControl } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ProfileHeader, BadgeDisplay, FollowButton } from "@venlaxiq/ui/native";

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const qc = useQueryClient();

  const { data: profile, refetch } = useQuery<any>({
    queryKey: ["profile", userId],
    queryFn: () => apiFetch(`/profile/${userId}`),
  });

  const follow = useMutation({
    mutationFn: (isFollowing: boolean) =>
      apiFetch(`/users/${userId}/follow`, { method: isFollowing ? "DELETE" : "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", userId] }),
  });

  if (!profile) return null;

  return (
    <>
      <Stack.Screen options={{ title: profile.user.username, headerStyle: { backgroundColor: "#0D0D0D" }, headerTintColor: "#F5F5F5" }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#00D46A" />}>
        <View style={styles.header}>
          <ProfileHeader
            username={profile.user.username}
            avatarUrl={profile.user.avatarUrl}
            subscriptionTier={profile.user.subscriptionTier}
            totalForecasts={profile.totalForecasts}
            reputationScore={profile.user.reputationScore}
          />
          <FollowButton
            isFollowing={profile.isFollowing ?? false}
            onToggle={(isFollowing) => follow.mutate(isFollowing)}
            isLoading={follow.isPending}
          />
        </View>
        <View style={styles.badges}>
          {profile.badges?.filter((b: any) => b.earned).map((b: any) => (
            <BadgeDisplay key={b.id} badge={b} />
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
```

- [ ] **Step 5: Create redemption screen**

Create `apps/mobile/app/rewards/redeem/[id].tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export default function RedemptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: history } = useQuery<any[]>({
    queryKey: ["redemption-history"],
    queryFn: () => apiFetch("/rewards/history"),
  });

  const redemption = history?.find((r) => r.id === id);

  return (
    <>
      <Stack.Screen options={{ title: "Reward", headerStyle: { backgroundColor: "#0D0D0D" }, headerTintColor: "#F5F5F5" }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🎁</Text>
        <Text style={styles.title}>Reward Redeemed!</Text>
        {redemption && (
          <>
            <Text style={styles.itemName}>{redemption.itemName}</Text>
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Your code</Text>
              <Text style={styles.code}>{redemption.code}</Text>
              <Text style={styles.debit}>-{redemption.fpDebited} FP</Text>
            </View>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center", padding: 24 },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", color: "#F5F5F5", marginBottom: 8 },
  itemName: { fontSize: 14, color: "#8A8A8A", marginBottom: 24 },
  codeCard: { backgroundColor: "#181818", borderRadius: 16, borderWidth: 1, borderColor: "#00D46A44", padding: 24, alignItems: "center", width: "100%" },
  codeLabel: { fontSize: 11, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  code: { fontSize: 24, fontWeight: "800", color: "#00D46A", fontVariant: ["tabular-nums"] },
  debit: { fontSize: 12, color: "#8A8A8A", marginTop: 8 },
});
```

- [ ] **Step 6: Create settings screens**

Create `apps/mobile/app/settings/index.tsx`:

```tsx
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, Stack } from "expo-router";
import * as Notifications from "expo-notifications";

export default function SettingsScreen() {
  const router = useRouter();

  async function enableNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    Alert.alert(status === "granted" ? "Notifications enabled!" : "Permission denied");
  }

  return (
    <>
      <Stack.Screen options={{ title: "Settings", headerStyle: { backgroundColor: "#0D0D0D" }, headerTintColor: "#F5F5F5" }} />
      <View style={styles.container}>
        <TouchableOpacity style={styles.item} onPress={() => router.push("/settings/subscription")}>
          <Text style={styles.itemText}>Manage Subscription</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={enableNotifications}>
          <Text style={styles.itemText}>Enable Push Notifications</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", padding: 16 },
  item: { backgroundColor: "#181818", borderRadius: 12, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: "#2E2E2E" },
  itemText: { color: "#F5F5F5", fontSize: 15 },
  arrow: { color: "#8A8A8A" },
});
```

Create `apps/mobile/app/settings/subscription.tsx`:

```tsx
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from "react-native";
import { Stack } from "expo-router";
import { apiFetch } from "@/lib/api";
import { useState } from "react";

export default function SubscriptionScreen() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(tier: "pro" | "elite") {
    setLoading(tier);
    try {
      const { url } = await apiFetch<{ url: string }>("/subscriptions/checkout", {
        method: "POST",
        body: JSON.stringify({ tier }),
      });
      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(null);
    }
  }

  const tiers = [
    { id: "pro" as const, name: "Pro", price: "$9/mo", color: "#FF6B00", features: ["500 daily FP", "AI signals", "1.2× multiplier"] },
    { id: "elite" as const, name: "Elite", price: "$19/mo", color: "#FFE600", features: ["2000 daily FP", "Unlimited positions", "1.5× multiplier"] },
  ];

  return (
    <>
      <Stack.Screen options={{ title: "Upgrade", headerStyle: { backgroundColor: "#0D0D0D" }, headerTintColor: "#F5F5F5" }} />
      <View style={styles.container}>
        {tiers.map((t) => (
          <View key={t.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.tierName, { color: t.color }]}>{t.name}</Text>
              <Text style={styles.price}>{t.price}</Text>
            </View>
            {t.features.map((f) => <Text key={f} style={styles.feature}>✓ {f}</Text>)}
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: "#00D46A" }, loading === t.id && styles.disabled]}
              onPress={() => handleUpgrade(t.id)}
              disabled={loading === t.id}
            >
              <Text style={styles.upgradeBtnText}>{loading === t.id ? "Opening…" : `Upgrade to ${t.name}`}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", padding: 16 },
  card: { backgroundColor: "#181818", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#2E2E2E" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  tierName: { fontSize: 20, fontWeight: "800" },
  price: { fontSize: 16, fontWeight: "700", color: "#FFE600" },
  feature: { color: "#8A8A8A", fontSize: 13, marginBottom: 6 },
  upgradeBtn: { borderRadius: 12, paddingVertical: 14, marginTop: 12 },
  disabled: { opacity: 0.5 },
  upgradeBtnText: { textAlign: "center", fontWeight: "700", fontSize: 15, color: "#0D0D0D" },
});
```

- [ ] **Step 7: Commit all remaining screens**

```bash
git add apps/mobile/app/reviews/ apps/mobile/app/leaderboard.tsx apps/mobile/app/profile/ apps/mobile/app/rewards/ apps/mobile/app/settings/
git commit -m "feat(mobile): all remaining screens — reviews, leaderboard, profiles, redemption, settings"
```

---

## Task 9: End-to-end smoke test on Expo Go

- [ ] **Step 1: Start all backend services**

```bash
docker compose -f infrastructure/docker-compose.yml up -d
pnpm --filter api dev
```

- [ ] **Step 2: Start Expo dev server**

```bash
pnpm --filter mobile dev
```

Expected: QR code displayed in terminal.

- [ ] **Step 3: Open on iOS Simulator**

```bash
pnpm --filter mobile ios
```

Or scan the QR code with the Expo Go app on a physical device.

- [ ] **Step 4: Full user journey**

1. App opens on login screen
2. Register a new account → lands on Home tab
3. Streak banner appears if streak > 0 — tap (auto-shown) DailyLoginSheet and claim
4. Mission cards render below streak
5. Market cards render — tap one → navigates to market detail
6. Tap "Make a Forecast" → ForecastBottomSheet slides up with YES/NO buttons + FP slider
7. Select YES, set FP to 100, tap "Confirm Forecast" → haptic + success → sheet closes
8. Navigate to Forecast tab → position appears
9. Navigate to Rewards tab → FP balance updates, catalog items visible
10. Navigate to Leaderboard → user rows render
11. Navigate to Profile → badges, XP bar, profile header
12. Navigate to Settings → push notification permission request → notifications enabled

- [ ] **Step 5: Test deep link routing**

Simulate a notification response with data `{ marketId: "<some-id>" }`:

In the Expo Go terminal, the deep link `venlaxiq://markets/[id]` should navigate to the market detail screen.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat(mobile): Phase 3D complete — full Expo React Native app with all screens, push notifications, deep links"
```
