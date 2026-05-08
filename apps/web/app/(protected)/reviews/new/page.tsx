"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ReviewForm } from "@venlaxiq/ui";
import type { ReviewFormData } from "@venlaxiq/ui";

export default function NewReviewPage() {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [step, setStep] = useState<"product" | "review">("product");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: ReviewFormData & { productId: string }) => {
      const res = await fetch("/api/proxy/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: data.productId,
          title: data.title,
          body: data.body,
          rating: data.rating,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Failed to submit" }));
        throw new Error((d as { error?: string }).error ?? "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => router.push("/reviews"),
    onError: (err: Error) => setError(err.message),
  });

  const fieldClass =
    "w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-green transition-colors";
  const labelClass =
    "text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5";

  if (step === "product") {
    return (
      <div className="max-w-lg">
        <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Write a Review</h1>
        <div className="bg-surface-2 border border-border rounded-xl p-5 space-y-4">
          <div>
            <label className={labelClass}>Product ID</label>
            <input
              className={fieldClass}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Product UUID"
            />
          </div>
          <div>
            <label className={labelClass}>Product Name</label>
            <input
              className={fieldClass}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Nike Air Max 90"
            />
          </div>
          <button
            onClick={() => {
              if (!productId.trim() || !productName.trim()) {
                setError("Both Product ID and Product Name are required.");
                return;
              }
              setError("");
              setStep("review");
            }}
            className="w-full bg-green hover:bg-green-dark text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            Continue
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Write a Review</h1>
      <div className="bg-surface-2 border border-border rounded-xl p-5">
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        <ReviewForm
          productName={productName}
          onSubmit={async (data) => {
            await mutation.mutateAsync({ ...data, productId });
          }}
        />
      </div>
    </div>
  );
}
