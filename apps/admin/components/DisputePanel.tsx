"use client";

import { useState } from "react";

interface Review {
  id: string;
  marketId: string;
  userId: string;
  body: string;
  rating: number;
  isPublished: boolean;
  createdAt: string;
}

interface DisputePanelProps {
  review: Review;
  onAction: (id: string, action: "approved" | "rejected") => Promise<void>;
}

export function DisputePanel({ review, onAction }: DisputePanelProps) {
  const [loading, setLoading] = useState(false);
  const safeRating = Math.max(0, Math.min(5, Math.round(review.rating)));
  const hoursSinceCreated = Math.floor((Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60));
  const slaHoursLeft = Math.max(0, 48 - hoursSinceCreated);

  async function handle(action: "approved" | "rejected") {
    setLoading(true);
    try {
      await onAction(review.id, action);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-text-secondary font-mono">{review.id.slice(0, 8)}…</p>
          <p className="text-xs text-text-secondary mt-0.5">Rating: {"★".repeat(safeRating)}{"☆".repeat(5 - safeRating)}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${slaHoursLeft <= 6 ? "bg-red-500/20 text-red-400" : "bg-orange/20 text-orange"}`}>
          {slaHoursLeft}h SLA
        </span>
      </div>
      <p className="text-sm text-text-primary mb-4 leading-relaxed">{review.body}</p>
      <div className="flex gap-3">
        <button onClick={() => handle("approved")} disabled={loading}
          className="flex-1 py-2 text-sm font-semibold bg-green hover:bg-green-dark text-white rounded-lg transition-colors disabled:opacity-50">
          Approve
        </button>
        <button onClick={() => handle("rejected")} disabled={loading}
          className="flex-1 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50">
          Reject
        </button>
      </div>
    </div>
  );
}
