import { useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

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
