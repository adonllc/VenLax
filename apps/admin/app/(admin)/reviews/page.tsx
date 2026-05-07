"use client";

import { useEffect, useState } from "react";
import { DisputePanel } from "@/components/DisputePanel";

export default function ReviewsPage() {
  const [data, setData] = useState<any>({ reviews: [], total: 0 });

  async function load() {
    const res = await fetch("/api/reviews/queue");
    const d = await res.json();
    setData(d);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id: string, action: "approved" | "rejected") {
    await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">Review Moderation</h1>
      <p className="text-sm text-text-secondary mb-6">{data.total} flagged reviews in queue</p>
      {data.reviews.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm">Queue is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.reviews.map((r: any) => (
            <DisputePanel key={r.id} review={r} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
