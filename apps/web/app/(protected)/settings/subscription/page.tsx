"use client";

import { useState } from "react";
import { SubscriptionBadge } from "@venlaxiq/ui";

const TIERS = [
  { id: "pro", name: "Pro", price: "$9/mo", features: ["500 daily FP", "20 open positions", "AI signals", "1.2× accuracy multiplier"] },
  { id: "elite", name: "Elite", price: "$19/mo", features: ["2000 daily FP", "Unlimited positions", "Priority AI signals", "1.5× accuracy multiplier", "FP never expire"] },
] as const;

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleUpgrade(tier: "pro" | "elite") {
    setLoading(tier);
    setError("");
    try {
      const res = await fetch("/api/proxy/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">Upgrade Your Plan</h1>
      <p className="text-text-secondary text-sm mb-6">Unlock more FP, positions, and AI-powered insights.</p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {TIERS.map((tier) => (
          <div key={tier.id} className="bg-surface-2 border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <SubscriptionBadge tier={tier.id} />
              <span className="text-lemon font-bold font-heading">{tier.price}</span>
            </div>
            <ul className="space-y-2 mb-5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-green">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade(tier.id)}
              disabled={loading === tier.id}
              className="w-full py-2.5 text-sm font-semibold bg-green hover:bg-green-dark text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === tier.id ? "Redirecting…" : `Upgrade to ${tier.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
