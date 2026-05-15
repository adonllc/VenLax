"use client";

import { useQuery } from "@tanstack/react-query";

const RANK_GLOW: Record<number, string> = {
  1: "0 0 16px rgba(255,214,0,0.3)",
  2: "0 0 12px rgba(192,192,192,0.25)",
  3: "0 0 10px rgba(205,127,50,0.2)",
};
const RANK_COLOR: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};
const RANK_LABEL: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export default function LeaderboardPage() {
  const { data: entries, isPending } = useQuery<any[]>({
    queryKey: ["leaderboard"],
    queryFn: () => fetch("/api/proxy/leaderboard").then((r) => r.json()),
  });

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            fontWeight: 800,
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "0.375rem",
          }}
        >
          Leaderboard
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          Top forecasters ranked by accuracy &amp; FP earned
        </p>
      </div>

      {isPending && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: "64px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {entries?.map((entry, idx) => {
          const rank = entry.rank ?? idx + 1;
          const isTop3 = rank <= 3;
          const isSelf = entry.isCurrentUser;

          return (
            <div
              key={entry.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                background: isSelf
                  ? "rgba(196,255,0,0.06)"
                  : isTop3
                  ? "rgba(17,22,32,0.8)"
                  : "rgba(17,22,32,0.5)",
                backdropFilter: "blur(12px)",
                border: isSelf
                  ? "1px solid rgba(196,255,0,0.2)"
                  : isTop3
                  ? `1px solid rgba(${rank === 1 ? "255,214,0" : rank === 2 ? "192,192,192" : "205,127,50"},0.15)`
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "14px",
                padding: "0.875rem 1.125rem",
                boxShadow: isTop3 ? RANK_GLOW[rank] : "none",
              }}
            >
              {/* Rank */}
              <div
                style={{
                  width: "36px",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {RANK_LABEL[rank] ? (
                  <span style={{ fontSize: "1.25rem" }}>{RANK_LABEL[rank]}</span>
                ) : (
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: isTop3
                    ? `rgba(${rank === 1 ? "255,214,0" : rank === 2 ? "192,192,192" : "205,127,50"},0.15)`
                    : "rgba(255,255,255,0.06)",
                  border: `2px solid ${isTop3 ? (RANK_COLOR[rank] ?? "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.08)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: isTop3 ? RANK_COLOR[rank] : "var(--color-text-secondary)" }}>
                    {(entry.username ?? "?")[0].toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color: isSelf ? "var(--color-green)" : "var(--color-text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {entry.username ?? "Unknown"}
                  {isSelf && <span style={{ marginLeft: "0.5rem", fontSize: "0.65rem", color: "var(--color-green)" }}>YOU</span>}
                </p>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: "1.5rem", flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: "0.1rem" }}>Accuracy</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "0.875rem", color: "var(--color-green)" }}>
                    {((entry.accuracy ?? 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: "0.1rem" }}>FP Earned</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                    {(entry.fpEarned ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
