import "server-only";
import { getAdminToken } from "./auth";

const API_BASE = process.env.API_URL ?? "http://localhost:3001";

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: "no-store",
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

export const adminApi = {
  login: (email: string, password: string) =>
    adminFetch<{ partialToken: string }>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verify2fa: (partialToken: string, totpCode: string) =>
    adminFetch<{ token: string; admin: { id: string; email: string; role: string } }>("/admin/auth/verify-2fa", {
      method: "POST",
      body: JSON.stringify({ partialToken, totpCode }),
    }),

  users: (params: Record<string, string>) =>
    adminFetch<any>(`/admin/users?${new URLSearchParams(params)}`),

  userDetail: (id: string) => adminFetch<any>(`/admin/users/${id}`),

  suspendUser: (id: string, suspend: boolean) =>
    adminFetch<any>(`/admin/users/${id}/suspend`, { method: "PATCH", body: JSON.stringify({ suspend }) }),

  markets: (params: Record<string, string>) =>
    adminFetch<any>(`/admin/markets?${new URLSearchParams(params)}`),

  createMarket: (data: any) =>
    adminFetch<any>("/admin/markets", { method: "POST", body: JSON.stringify(data) }),

  resolveMarket: (id: string, outcome: "yes" | "no") =>
    adminFetch<any>(`/admin/markets/${id}/resolve`, { method: "PATCH", body: JSON.stringify({ outcome }) }),

  generateMarket: () =>
    adminFetch<any>("/admin/markets/generate", { method: "POST" }),

  adjustFP: (data: any) =>
    adminFetch<any>("/admin/fp/adjust", { method: "POST", body: JSON.stringify(data) }),

  reviewQueue: (page: string) =>
    adminFetch<any>(`/admin/reviews/queue?page=${page}`),

  moderateReview: (id: string, action: "approved" | "rejected") =>
    adminFetch<any>(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }),

  analytics: () => adminFetch<any>("/admin/analytics"),
};
