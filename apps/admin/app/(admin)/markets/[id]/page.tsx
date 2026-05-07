"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SupervisorModal } from "@/components/SupervisorModal";

export default function MarketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [market, setMarket] = useState<any>(null);
  const [fetchError, setFetchError] = useState("");
  const [showResolve, setShowResolve] = useState(false);
  const [resolveOutcome, setResolveOutcome] = useState<"yes" | "no">("yes");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetch(`/api/markets/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load market");
        return r.json();
      })
      .then(setMarket)
      .catch((err: unknown) => setFetchError(err instanceof Error ? err.message : "Failed to load market"));
  }, [id]);

  async function handleResolve(_password: string) {
    setResolving(true);
    try {
      const res = await fetch(`/api/markets/${id}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: resolveOutcome }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to resolve");
      }
      setShowResolve(false);
      router.push("/markets");
    } finally {
      setResolving(false);
    }
  }

  if (fetchError) return <p className="text-red-400 text-sm">{fetchError}</p>;
  if (!market) return <p className="text-text-secondary text-sm">Loading…</p>;

  return (
    <div className="max-w-xl">
      {showResolve && (
        <SupervisorModal
          title="Resolve Market"
          description={`You are resolving "${market.title}" as ${resolveOutcome.toUpperCase()}. This cannot be undone.`}
          onConfirm={handleResolve}
          onCancel={() => setShowResolve(false)}
        />
      )}
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">{market.title}</h1>
      <p className="text-text-secondary text-sm mb-6">{market.description}</p>
      <div className="bg-surface-2 border border-border rounded-xl p-5 mb-6 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-text-secondary">Status</span><span className="text-text-primary capitalize">{market.status}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Category</span><span className="text-text-primary capitalize">{market.category}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Closes</span><span className="font-mono text-xs text-text-primary">{new Date(market.closesAt).toLocaleString()}</span></div>
      </div>
      {market.status === "closed" && (
        <div className="flex gap-3">
          <select value={resolveOutcome} onChange={(e) => setResolveOutcome(e.target.value as "yes" | "no")}
            className="flex-1 bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary">
            <option value="yes">Resolve YES</option>
            <option value="no">Resolve NO</option>
          </select>
          <button onClick={() => setShowResolve(true)} disabled={resolving}
            className="px-5 py-2.5 bg-orange hover:bg-orange-dark text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50">
            {resolving ? "Resolving…" : "Resolve"}
          </button>
        </div>
      )}
    </div>
  );
}
