"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function ReviewsBrowsePage() {
  const { data: reviews, isLoading } = useQuery<any[]>({
    queryKey: ["reviews-browse"],
    queryFn: () => fetch("/api/proxy/reviews?limit=20").then((r) => r.json()),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-text-primary">Reviews</h1>
        <Link
          href="/reviews/new"
          className="px-4 py-2 bg-green hover:bg-green-dark text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Write a review
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading && <p className="text-text-secondary text-sm">Loading…</p>}
        {reviews?.map((r) => (
          <div key={r.id} className="bg-surface-2 border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-text-primary">{r.title}</p>
                <p className="text-xs text-text-secondary">
                  by {r.username ?? "User"} · {r.rating}/5
                </p>
              </div>
              <span className="text-xs text-text-secondary">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-text-secondary line-clamp-3">{r.body}</p>
            <p className="text-xs text-text-secondary mt-2 italic">
              *FTC Disclosure: Reviewer may have received this product for free or at a discount.
            </p>
          </div>
        ))}
        {!isLoading && !reviews?.length && (
          <p className="text-text-secondary text-sm text-center py-16">No reviews yet</p>
        )}
      </div>
    </div>
  );
}
