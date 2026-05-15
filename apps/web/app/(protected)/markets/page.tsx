"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

const CATEGORIES = ["All", "Sports", "Politics", "Open"];

function MarketCard({ id, category, title, closesAt, source }: { id: string; category: string; title: string; closesAt: string; source?: string }) {
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
        {source === "ai" && (
          <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#080B0F", background: "var(--color-green)", borderRadius: "4px", padding: "1px 5px", display: "inline-block", marginBottom: "4px" }}>
            AI
          </span>
        )}
        <p style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-green)", marginBottom: "0.5rem" }}>{category}</p>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.45, marginBottom: "0.625rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</p>
        <p style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>
          Closes {new Date(closesAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </Link>
  );
}

export default function MarketsPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const { data, isPending } = useQuery<{ markets: any[] }>({
    queryKey: ["markets-list"],
    queryFn: () => fetch("/api/proxy/markets?status=open").then((r) => r.json()),
  });

  const markets = data?.markets ?? [];

  const filtered = activeCategory === "All"
    ? markets
    : markets.filter((m) => m.category?.toLowerCase() === activeCategory.toLowerCase());

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
          Markets
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          Browse open prediction markets
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "0.375rem 0.875rem",
              borderRadius: "999px",
              border: `1px solid ${activeCategory === cat ? "var(--color-green)" : "var(--color-border)"}`,
              background: activeCategory === cat ? "rgba(196,255,0,0.1)" : "transparent",
              color: activeCategory === cat ? "var(--color-green)" : "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {isPending && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.875rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: "120px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {!isPending && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.875rem" }}>
          {filtered.map((m) => (
            <MarketCard key={m.id} id={m.id} category={m.category} title={m.title} closesAt={m.closesAt} source={m.source} />
          ))}
          {filtered.length === 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>No open markets yet</p>
          )}
        </div>
      )}
    </div>
  );
}
