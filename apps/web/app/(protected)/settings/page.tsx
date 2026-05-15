"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useThemeMode } from "@/providers/ThemeProvider";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(17,22,32,0.6)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        padding: "1.25rem 1.5rem",
      }}
    >
      <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { theme } = useThemeMode();

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: "560px" }}>
      <h1
        style={{
          fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
          fontWeight: 800,
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          color: "var(--color-text-primary)",
          letterSpacing: "-0.02em",
          marginBottom: "1.75rem",
        }}
      >
        Settings
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <SettingsSection title="Appearance">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.25rem 0" }}>
            <div>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-primary)", fontWeight: 500 }}>Theme</p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                Currently: <strong>{theme === "dark" ? "Dark" : "Light (Frosted Mint)"}</strong>
              </p>
            </div>
            <ThemeToggle />
          </div>
        </SettingsSection>

        <SettingsSection title="Account">
          <Link
            href="/settings/subscription"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.625rem 0",
              fontSize: "0.875rem",
              color: "var(--color-text-primary)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            className="settings-link"
          >
            <span>Manage Subscription</span>
            <span style={{ color: "var(--color-text-secondary)" }}>→</span>
          </Link>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "1rem" }}>
            Get notified when forecasts settle or markets close.
          </p>
          <button
            onClick={async () => {
              if (!("Notification" in window)) return;
              const perm = await Notification.requestPermission();
              if (perm === "granted") alert("Push notifications enabled!");
            }}
            style={{
              padding: "0.5rem 1.125rem",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              fontSize: "0.8rem",
              color: "var(--color-text-secondary)",
              background: "transparent",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            className="settings-btn"
          >
            Enable push notifications
          </button>
        </SettingsSection>

        <button
          onClick={handleLogout}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "1px solid rgba(255,92,92,0.25)",
            borderRadius: "12px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#FF5C5C",
            background: "transparent",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "all 0.2s",
          }}
          className="signout-btn"
        >
          {loading ? "Signing out…" : "Sign out"}
        </button>
      </div>

      <style>{`
        .settings-link:hover { color: var(--color-green) !important; }
        .settings-btn:hover { border-color: var(--color-green) !important; color: var(--color-green) !important; }
        .signout-btn:hover { border-color: #FF5C5C !important; background: rgba(255,92,92,0.06) !important; }
      `}</style>
    </div>
  );
}
