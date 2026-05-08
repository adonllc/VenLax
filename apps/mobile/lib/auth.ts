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
