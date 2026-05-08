"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WalletSummary, RewardCard } from "@venlaxiq/ui";
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

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Rewards</h1>

      <WalletSummary earnedFp={balance?.balance ?? 0} expiresAt={null} />

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {success && <p className="text-green text-sm mb-4 font-semibold">{success}</p>}

      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Reward Catalog</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {catalog?.map((item) => (
          <RewardCard
            key={item.id}
            name={item.name}
            category={item.category}
            fpCost={item.fpCost}
            imageUrl={item.imageUrl ?? null}
            canAfford={(balance?.balance ?? 0) >= item.fpCost}
            onRedeem={() => redeem.mutate(item.id)}
            redeemLoading={redeem.isPending}
          />
        ))}
      </div>
    </div>
  );
}
