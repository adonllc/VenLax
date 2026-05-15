"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function RewardsPage() {
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: catalog } = useQuery<any[]>({
    queryKey: ["reward-catalog"],
    queryFn: () => fetch("/api/proxy/rewards/catalog").then((r) => r.json()),
  });

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["fp-balance"],
    queryFn: () => fetch("/api/proxy/fp-ledger/balance").then((r) => r.json()),
  });

  const redeem = useMutation({
    mutationFn: async (catalogItemId: string) => {
      const res = await fetch("/api/proxy/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogItemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Redemption failed");
      return data;
    },
    onSuccess: (data) => {
      setSuccess(`Redeemed! Your code: ${data.code}`);
      qc.invalidateQueries({ queryKey: ["fp-balance"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const fp = balance?.balance ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Balance hero */}
      <div
        style={{
          background: "rgba(17,22,32,0.7)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(196,255,0,0.15)",
          borderRadius: "20px",
          padding: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
            FP Balance
          </p>
          <p
            style={{
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              fontWeight: 800,
              fontSize: "3rem",
              color: "var(--color-green)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              textShadow: "var(--glow-green-sm)",
            }}
          >
            {fp.toLocaleString()}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "0.375rem" }}>
            Forecast Points available to spend
          </p>
        </div>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(196,255,0,0.1)",
            border: "2px solid rgba(196,255,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
          }}
        >
          💎
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div style={{ background: "rgba(255,92,92,0.1)", border: "1px solid rgba(255,92,92,0.2)", borderRadius: "12px", padding: "0.875rem 1rem", fontSize: "0.875rem", color: "#FF5C5C" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: "rgba(196,255,0,0.08)", border: "1px solid rgba(196,255,0,0.2)", borderRadius: "12px", padding: "0.875rem 1rem", fontSize: "0.875rem", color: "var(--color-green)", fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* Catalog */}
      <div>
        <h2 style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
          Reward Catalog
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {catalog?.map((item) => {
            const canAfford = fp >= item.fpCost;
            return (
              <div
                key={item.id}
                style={{
                  background: "rgba(17,22,32,0.6)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${canAfford ? "rgba(196,255,0,0.12)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "16px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "10px" }} />
                )}
                <div>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
                    {item.category}
                  </p>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-primary)" }}>{item.name}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <p
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: canAfford ? "var(--color-green)" : "var(--color-text-secondary)",
                    }}
                  >
                    {item.fpCost.toLocaleString()} FP
                  </p>
                  <button
                    onClick={() => redeem.mutate(item.id)}
                    disabled={!canAfford || redeem.isPending}
                    style={{
                      background: canAfford ? "var(--color-green)" : "rgba(255,255,255,0.06)",
                      color: canAfford ? "#080B0F" : "var(--color-text-secondary)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.5rem 1rem",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: canAfford ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                      boxShadow: canAfford ? "var(--glow-green-sm)" : "none",
                    }}
                  >
                    {redeem.isPending ? "…" : "Redeem"}
                  </button>
                </div>
              </div>
            );
          })}
          {!catalog?.length && (
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>No rewards available yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
