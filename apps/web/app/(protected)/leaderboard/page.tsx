"use client";

import { useQuery } from "@tanstack/react-query";
import { LeaderboardRow } from "@venlaxiq/ui";

export default function LeaderboardPage() {
  const { data: entries, isPending } = useQuery<any[]>({
    queryKey: ["leaderboard"],
    queryFn: () => fetch("/api/proxy/leaderboard").then((r) => r.json()),
  });

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Leaderboard</h1>
      <div className="flex flex-col gap-2">
        {isPending && <p className="text-text-secondary text-sm">Loading…</p>}
        {entries?.map((entry) => (
          <LeaderboardRow
            key={entry.id}
            rank={entry.rank}
            username={entry.username}
            avatarUrl={entry.avatarUrl ?? null}
            accuracy={entry.accuracy ?? 0}
            fpEarned={entry.fpEarned ?? 0}
            isCurrentUser={entry.isCurrentUser ?? false}
          />
        ))}
      </div>
    </div>
  );
}
