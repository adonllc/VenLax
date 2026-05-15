import Link from "next/link";
import { serverFetchPublic } from "@/lib/server-api";

const CATEGORIES = ["All", "sports", "politics", "open"] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

interface MarketSummary {
  id: string;
  title: string;
  category: string;
  status: string;
  qYes: number;
  qNo: number;
  closesAt: string;
  totalVolumeFp?: number;
}

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export const revalidate = 60;

function ProbBar({ yesProb }: { yesProb: number }) {
  return (
    <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${yesProb}%`,
          background: yesProb >= 60 ? "var(--color-green)" : yesProb <= 40 ? "#FF5C5C" : "var(--color-lemon)",
          borderRadius: "2px",
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

function MarketCard({ market }: { market: MarketSummary }) {
  const yesProb = Math.round((market.qYes / Math.max(market.qYes + market.qNo, 1)) * 100);
  const probColor = yesProb >= 60 ? "var(--color-green)" : yesProb <= 40 ? "#FF5C5C" : "var(--color-lemon)";

  return (
    <Link href={`/markets/${market.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          background: "rgba(17,22,32,0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          padding: "1.25rem",
          cursor: "pointer",
          transition: "all 0.2s",
          height: "100%",
        }}
        className="market-card"
      >
        <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-green)", marginBottom: "0.5rem" }}>
          {market.category}
        </p>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.45, marginBottom: "0.875rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {market.title}
        </p>
        <ProbBar yesProb={yesProb} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.625rem" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", fontWeight: 700, color: probColor }}>
            {yesProb}% YES
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>
            {new Date(market.closesAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
        {market.totalVolumeFp && (
          <p style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", marginTop: "0.375rem" }}>
            {market.totalVolumeFp.toLocaleString()} FP traded
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function MarketsPage({ searchParams }: PageProps) {
  const { category, search } = await searchParams;
  const params = new URLSearchParams();
  if (category && category !== "All") params.set("category", category);
  if (search) params.set("search", search);
  params.set("status", "open");

  const data = await serverFetchPublic<{ markets: MarketSummary[] }>(
    `/markets?${params}`
  ).catch(() => ({ markets: [] }));

  const activeCategory: CategoryFilter = (category as CategoryFilter) ?? "All";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-surface)" }}>
      <style>{`
        .market-card:hover {
          border-color: rgba(196,255,0,0.25) !important;
          box-shadow: 0 0 12px rgba(196,255,0,0.1);
          transform: translateY(-1px);
        }
        .cat-pill:hover {
          border-color: var(--color-green) !important;
          color: var(--color-green) !important;
        }
      `}</style>

      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              fontWeight: 800,
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              color: "var(--color-text-primary)",
              letterSpacing: "-0.02em",
              marginBottom: "0.375rem",
            }}
          >
            Markets
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            {data.markets.length} open market{data.markets.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <Link
                key={cat}
                href={cat === "All" ? "/markets" : `/markets?category=${cat}`}
                className="cat-pill"
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "0.4rem 1rem",
                  borderRadius: "999px",
                  border: `1px solid ${active ? "var(--color-green)" : "rgba(255,255,255,0.1)"}`,
                  color: active ? "var(--color-green)" : "var(--color-text-secondary)",
                  textDecoration: "none",
                  background: active ? "rgba(196,255,0,0.08)" : "transparent",
                  transition: "all 0.2s",
                }}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          {data.markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
          {data.markets.length === 0 && (
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", gridColumn: "1/-1", textAlign: "center", paddingTop: "4rem" }}>
              No open markets
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
