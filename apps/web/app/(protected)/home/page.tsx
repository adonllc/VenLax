"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { StreakBanner } from "@venlaxiq/ui";

function useProxy<T>(key: string[], path: string) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => fetch(`/api/proxy/${path}`).then((r) => r.json()),
  });
}

export default function HomePage() {
  const { data: missions } = useProxy<any[]>(["missions"], "missions/today");
  const { data: streak } = useProxy<any>(["streak"], "auth/daily-login/status");
  const { data: markets } = useProxy<{ markets: any[] }>(["home-markets"], "markets?status=open&limit=6");

  const claimMutation = useMutation({
    mutationFn: () =>
      fetch("/api/proxy/auth/daily-login", { method: "POST" }).then((r) => r.json()),
  });

  return (
    <div className="space-y-6">
      {streak && (
        <StreakBanner
          day={streak.currentStreak ?? 1}
          multiplier={streak.multiplier ?? 1}
          dailyFp={streak.dailyFp ?? 0}
          claimed={streak.claimed ?? false}
          claimLoading={claimMutation.isPending}
          onClaim={() => claimMutation.mutate()}
        />
      )}

      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Today&apos;s Missions
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {missions?.map((m) => (
            <div
              key={m.id}
              className={`bg-surface-2 border rounded-xl p-4 ${
                m.completed ? "border-green/30 opacity-60" : "border-border"
              }`}
            >
              <p className="text-sm font-semibold text-text-primary mb-1">{m.title}</p>
              <p className="text-xs text-text-secondary mb-2">{m.description}</p>
              <p className="text-xs text-green font-semibold">
                +{m.fpReward} FP{m.completed ? " ✓" : ""}
              </p>
            </div>
          ))}
          {!missions?.length && (
            <p className="text-text-secondary text-sm col-span-3 py-4">No missions today</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Active Markets
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {markets?.markets?.map((m) => (
            <Link
              key={m.id}
              href={`/markets/${m.id}`}
              className="block bg-surface-2 border border-border hover:border-green rounded-xl p-4 transition-colors"
            >
              <p className="text-xs text-text-secondary uppercase mb-1">{m.category}</p>
              <p className="text-sm font-semibold text-text-primary line-clamp-2 mb-2">{m.title}</p>
              <p className="text-xs text-text-secondary">
                {new Date(m.closesAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
          {!markets?.markets?.length && (
            <p className="text-text-secondary text-sm col-span-3 py-4">No open markets</p>
          )}
        </div>
      </div>
    </div>
  );
}
