import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { serverFetchPublic } from "@/lib/server-api";
import { ForecastEntryIsland } from "./ForecastEntryIsland";
import { findPolymarketMatch } from "@/lib/polymarket";
import { PolymarketComparisonCard } from "./PolymarketComparisonCard";

interface MarketDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  qYes: number;
  qNo: number;
  closesAt: string;
  resolutionCriteria: string;
  resolutionSource?: string;
  totalVolumeFp?: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const market = await serverFetchPublic<MarketDetail>(`/markets/${id}`).catch(() => null);
  if (!market) return { title: "Market not found" };
  const prob = Math.round((market.qYes / Math.max(market.qYes + market.qNo, 1)) * 100);
  return {
    title: `${market.title} — ${prob}% | VenlaxIQ`,
    description: market.description,
    openGraph: { title: market.title, description: `Current probability: ${prob}% YES` },
  };
}

const STATUS_COLORS: Record<string, string> = {
  open: "rgba(196,255,0,0.15)",
  closed: "rgba(255,92,92,0.15)",
  resolved: "rgba(107,122,153,0.2)",
  settled: "rgba(107,122,153,0.15)",
  draft: "rgba(255,255,255,0.06)",
};
const STATUS_TEXT: Record<string, string> = {
  open: "var(--color-green)",
  closed: "#FF5C5C",
  resolved: "var(--color-text-secondary)",
  settled: "var(--color-text-secondary)",
  draft: "var(--color-text-secondary)",
};

export default async function MarketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const market = await serverFetchPublic<MarketDetail>(`/markets/${id}`).catch(() => null);
  if (!market) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const prob = Math.round((market.qYes / Math.max(market.qYes + market.qNo, 1)) * 100);
  const polyMatch = await findPolymarketMatch(market.title).catch(() => null);

  const probColor = prob >= 60 ? "var(--color-green)" : prob <= 40 ? "#FF5C5C" : "var(--color-lemon)";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-surface)" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <Link href="/markets" style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textDecoration: "none" }}>
            Markets
          </Link>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>›</span>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-green)",
              background: "rgba(196,255,0,0.1)",
              padding: "0.2rem 0.625rem",
              borderRadius: "999px",
            }}
          >
            {market.category}
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: STATUS_TEXT[market.status] ?? "var(--color-text-secondary)",
              background: STATUS_COLORS[market.status] ?? "rgba(255,255,255,0.06)",
              padding: "0.2rem 0.625rem",
              borderRadius: "999px",
            }}
          >
            {market.status}
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            fontWeight: 800,
            fontSize: "clamp(1.4rem, 3vw, 2rem)",
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
            marginBottom: "0.75rem",
          }}
        >
          {market.title}
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "2rem" }}>
          {market.description}
        </p>

        {/* Probability hero */}
        <div
          style={{
            background: "rgba(17,22,32,0.7)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            padding: "1.75rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: "0.375rem" }}>
                Current Probability
              </p>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: "3rem",
                  color: probColor,
                  lineHeight: 1,
                  textShadow: prob >= 60 ? "0 0 20px rgba(196,255,0,0.3)" : "none",
                }}
              >
                {prob}%
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>YES / NO</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                {prob}% / {100 - prob}%
              </p>
            </div>
          </div>

          {/* Prob bar */}
          <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${prob}%`,
                background: probColor,
                borderRadius: "4px",
                transition: "width 0.5s ease",
                boxShadow: prob >= 60 ? "0 0 8px rgba(196,255,0,0.4)" : "none",
              }}
            />
          </div>

          {market.totalVolumeFp && (
            <p style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", marginTop: "0.75rem" }}>
              {market.totalVolumeFp.toLocaleString()} FP total volume
            </p>
          )}
        </div>

        {/* Polymarket comparison */}
        {polyMatch && (
          <div style={{ marginBottom: "1.25rem" }}>
            <PolymarketComparisonCard
              polyQuestion={polyMatch.polyQuestion}
              polyYesPercent={polyMatch.polyYesPercent}
              venlaxYesPercent={prob}
              polyUrl={polyMatch.polyUrl}
            />
          </div>
        )}

        {/* Forecast entry */}
        <div style={{ marginBottom: "1.25rem" }}>
          <ForecastEntryIsland marketId={id} initialProb={prob} isAuthed={!!token} />
        </div>

        {/* Resolution criteria */}
        <div
          style={{
            background: "rgba(17,22,32,0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "1.5rem",
          }}
        >
          <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>
            Resolution Criteria
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-primary)", lineHeight: 1.65 }}>{market.resolutionCriteria}</p>
          {market.resolutionSource && (
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.75rem" }}>
              Source: {market.resolutionSource}
            </p>
          )}
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
            Closes:{" "}
            {new Date(market.closesAt).toLocaleDateString("en-US", { dateStyle: "long" })}
          </p>
        </div>
      </div>
    </div>
  );
}
