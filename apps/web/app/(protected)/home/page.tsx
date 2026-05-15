"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";

function useProxy<T>(key: string[], path: string) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => fetch(`/api/proxy/${path}`).then((r) => r.json()),
  });
}

function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      style={{
        background: accent ? "rgba(196,255,0,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${accent ? "rgba(196,255,0,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "12px",
        padding: "0.875rem 1.25rem",
      }}
    >
      <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)", fontWeight: 700, fontSize: "1.5rem", color: accent ? "var(--color-green)" : "var(--color-text-primary)" }}>{value}</p>
    </div>
  );
}

function MarketTile({ id, category, title, closesAt }: { id: string; category: string; title: string; closesAt: string }) {
  return (
    <Link href={`/markets/${id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        className="glass glass-hover"
        style={{
          borderRadius: "14px",
          padding: "1.125rem",
          transition: "all 0.2s",
          cursor: "pointer",
        }}
      >
        <p style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-green)", marginBottom: "0.5rem" }}>{category}</p>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.45, marginBottom: "0.625rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</p>
        <p style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>
          Closes {new Date(closesAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </Link>
  );
}

function MissionTile({ title, description, fpReward, completed }: { title: string; description: string; fpReward: number; completed: boolean }) {
  return (
    <div
      style={{
        background: completed ? "rgba(196,255,0,0.04)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${completed ? "rgba(196,255,0,0.15)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "14px",
        padding: "1rem",
        opacity: completed ? 0.7 : 1,
      }}
    >
      <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>{title}</p>
      <p style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", marginBottom: "0.625rem", lineHeight: 1.4 }}>{description}</p>
      <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-green)" }}>
        +{fpReward} FP{completed ? " ✓" : ""}
      </p>
    </div>
  );
}

export default function HomePage() {
  const { data: missions } = useProxy<any[]>(["missions"], "missions/today");
  const { data: streak } = useProxy<any>(["streak"], "auth/daily-login/status");
  const { data: markets } = useProxy<{ markets: any[] }>(["home-markets"], "markets?status=open&limit=6");

  const claimMutation = useMutation({
    mutationFn: () =>
      fetch("/api/proxy/auth/daily-login", { method: "POST" }).then((r) => r.json()),
  });

  const currentStreak = streak?.currentStreak ?? 0;
  const claimed = streak?.claimed ?? false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Hero row — streak + stats */}
      {streak && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.875rem" }}>
          <StatPill label="Streak" value={`${currentStreak}d`} accent />
          <StatPill label="Multiplier" value={`${streak.multiplier ?? 1}×`} />
          <StatPill label="Daily FP" value={streak.dailyFp ?? 0} />
          <div
            style={{
              background: claimed ? "rgba(196,255,0,0.06)" : "var(--color-green)",
              border: `1px solid ${claimed ? "rgba(196,255,0,0.2)" : "transparent"}`,
              borderRadius: "12px",
              padding: "0.875rem 1.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              cursor: claimed ? "default" : "pointer",
              transition: "all 0.2s",
              boxShadow: claimed ? "none" : "var(--glow-green-sm)",
            }}
            onClick={() => !claimed && claimMutation.mutate()}
          >
            <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: claimed ? "var(--color-green)" : "#080B0F", marginBottom: "0.25rem" }}>
              Daily Claim
            </p>
            <p style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)", fontWeight: 700, fontSize: "1rem", color: claimed ? "var(--color-green)" : "#080B0F" }}>
              {claimMutation.isPending ? "Claiming…" : claimed ? "Claimed ✓" : "Claim FP"}
            </p>
          </div>
        </div>
      )}

      {/* Missions */}
      <section>
        <h2
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--color-text-secondary)",
            marginBottom: "0.875rem",
          }}
        >
          Today&apos;s Missions
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
          {missions?.map((m) => (
            <MissionTile key={m.id} title={m.title} description={m.description} fpReward={m.fpReward} completed={m.completed} />
          ))}
          {!missions?.length && (
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>No missions today</p>
          )}
        </div>
      </section>

      {/* Active Markets */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
          <h2 style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-text-secondary)" }}>
            Active Markets
          </h2>
          <Link href="/markets" style={{ fontSize: "0.75rem", color: "var(--color-green)", textDecoration: "none", fontWeight: 600 }}>
            View all →
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.875rem" }}>
          {markets?.markets?.map((m) => (
            <MarketTile key={m.id} id={m.id} category={m.category} title={m.title} closesAt={m.closesAt} />
          ))}
          {!markets?.markets?.length && (
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>No open markets yet</p>
          )}
        </div>
      </section>
    </div>
  );
}
