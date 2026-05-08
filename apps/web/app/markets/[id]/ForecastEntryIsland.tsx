"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ForecastEntryWidget } from "@venlaxiq/ui";

interface Props {
  marketId: string;
  initialProb: number;
  isAuthed: boolean;
}

interface FpBalanceResponse {
  balance: number;
  maxFp?: number;
}

export function ForecastEntryIsland({ marketId, initialProb, isAuthed }: Props) {
  const qc = useQueryClient();
  const router = useRouter();

  // WebSocket for live probability updates
  useEffect(() => {
    const WS_BASE = (
      process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001"
    ).replace(/^http/, "ws");
    const ws = new WebSocket(`${WS_BASE}/markets/${marketId}/ws`);
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data as string);
        if (data.type === "probability_update") {
          qc.setQueryData(["market-prob", marketId], data.prob as number);
        }
      } catch {
        // ignore malformed frames
      }
    };
    return () => ws.close();
  }, [marketId, qc]);

  const { data: liveProb } = useQuery({
    queryKey: ["market-prob", marketId],
    queryFn: () => initialProb,
    initialData: initialProb,
    staleTime: Infinity,
  });

  const { data: fpData } = useQuery<FpBalanceResponse>({
    queryKey: ["fp-balance"],
    queryFn: async () => {
      const res = await fetch("/api/proxy/fp-ledger/balance");
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json() as Promise<FpBalanceResponse>;
    },
    enabled: isAuthed,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (payload: { side: boolean; fpAmount: number }) => {
      const res = await fetch(`/api/proxy/forecast/${marketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Forecast failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["fp-balance"] });
    },
  });

  const prob = liveProb ?? initialProb;
  const fpBalance = fpData?.balance ?? 0;
  const maxFp = fpData?.maxFp ?? 10_000;

  return (
    <ForecastEntryWidget
      marketId={marketId}
      yesProb={prob}
      fpBalance={fpBalance}
      maxFp={maxFp}
      isLoggedIn={isAuthed}
      onLoginPrompt={() => router.push("/auth/login")}
      onSubmit={async (side, fpAmount) => {
        await mutation.mutateAsync({ side, fpAmount });
      }}
    />
  );
}
