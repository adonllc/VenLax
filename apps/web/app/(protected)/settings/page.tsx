"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Settings</h1>

      <div className="bg-surface-2 border border-border rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Account</h2>
        <Link
          href="/settings/subscription"
          className="flex items-center justify-between py-2 text-sm text-text-primary hover:text-green transition-colors"
        >
          <span>Manage Subscription</span>
          <span className="text-text-secondary">→</span>
        </Link>
      </div>

      <div className="bg-surface-2 border border-border rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Web Push Notifications</h2>
        <p className="text-sm text-text-secondary mb-3">Get notified when your forecasts settle or markets close soon.</p>
        <button
          onClick={async () => {
            if (!("Notification" in window)) return;
            const perm = await Notification.requestPermission();
            if (perm === "granted") alert("Push notifications enabled!");
          }}
          className="px-4 py-2 border border-border text-sm text-text-secondary hover:border-green hover:text-green rounded-lg transition-colors"
        >
          Enable push notifications
        </button>
      </div>

      <button
        onClick={handleLogout}
        disabled={loading}
        className="w-full py-2.5 text-sm font-semibold text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
