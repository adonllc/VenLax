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
