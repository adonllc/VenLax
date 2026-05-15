import { serverFetch } from "@/lib/server-api";

const TIER_COLORS: Record<string, string> = {
  free: "rgba(107,122,153,0.2)",
  pro: "rgba(196,255,0,0.12)",
  elite: "rgba(255,214,0,0.12)",
};
const TIER_TEXT: Record<string, string> = {
  free: "var(--color-text-secondary)",
  pro: "var(--color-green)",
  elite: "#FFD700",
};

export default async function ProfilePage() {
  const profile = await serverFetch<any>("/profile/me").catch(() => null);
  const badges = await serverFetch<any[]>("/badges").catch(() => []);

  if (!profile) {
    return (
      <div style={{ padding: "3rem 0", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Unable to load profile.</p>
      </div>
    );
  }

  const user = profile.user;
  const tier = user.subscriptionTier ?? "free";
  const accuracy = user.accuracy ?? 0;
  const xp = user.xpTotal ?? 0;
  const nextLevelXp = user.nextLevelXp ?? 1000;
  const xpPct = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "720px" }}>
      {/* Profile card */}
      <div
        style={{
          background: "rgba(17,22,32,0.7)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "2rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "rgba(196,255,0,0.1)",
            border: "2px solid rgba(196,255,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-green)" }}>
              {(user.username ?? "?")[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Name + tier */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap", marginBottom: "0.375rem" }}>
            <h1
              style={{
                fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                fontWeight: 800,
                fontSize: "1.5rem",
                color: "var(--color-text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {user.username}
            </h1>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                background: TIER_COLORS[tier],
                color: TIER_TEXT[tier],
                padding: "0.2rem 0.625rem",
                borderRadius: "999px",
                border: `1px solid ${TIER_TEXT[tier]}30`,
              }}
            >
              {tier}
            </span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
            Level: <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{user.xpLevel ?? "Rookie"}</span>
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "1.5rem", flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "1.25rem", color: "var(--color-green)" }}>
              {(accuracy * 100).toFixed(1)}%
            </p>
            <p style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Accuracy</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              {(profile.followerCount ?? 0).toLocaleString()}
            </p>
            <p style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Followers</p>
          </div>
        </div>
      </div>

      {/* XP progress */}
      <div
        style={{
          background: "rgba(17,22,32,0.5)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          padding: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-secondary)" }}>
            XP Progress
          </p>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
            {xp.toLocaleString()} / {nextLevelXp.toLocaleString()}
          </p>
        </div>
        <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${xpPct}%`,
              background: "var(--color-green)",
              borderRadius: "3px",
              boxShadow: "0 0 8px rgba(196,255,0,0.4)",
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <p style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
          {xpPct}% to next level
        </p>
      </div>

      {/* Badges */}
      <div>
        <h2 style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-text-secondary)", marginBottom: "0.875rem" }}>
          Badges
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {(badges as any[]).map((b) => (
            <div
              key={b.id}
              style={{
                background: b.unlocked ? "rgba(196,255,0,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${b.unlocked ? "rgba(196,255,0,0.2)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "12px",
                padding: "0.75rem 1rem",
                opacity: b.unlocked ? 1 : 0.45,
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>{b.icon ?? "🏅"}</span>
              <div>
                <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{b.name}</p>
                {b.fpReward > 0 && (
                  <p style={{ fontSize: "0.65rem", color: "var(--color-green)", fontWeight: 700 }}>+{b.fpReward} FP</p>
                )}
              </div>
            </div>
          ))}
          {!(badges as any[]).length && (
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>No badges yet — start forecasting to earn some!</p>
          )}
        </div>
      </div>
    </div>
  );
}
