"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateAIButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch("/api/admin-action/generate-market", { method: "POST" });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
        done
          ? "border-green text-green bg-green/10"
          : "border-border text-text-secondary hover:border-green hover:text-green"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? "Generating…" : done ? "✓ Generated" : "Generate with AI"}
    </button>
  );
}
