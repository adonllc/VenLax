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
