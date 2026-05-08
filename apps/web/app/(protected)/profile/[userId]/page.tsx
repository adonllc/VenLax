"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfileHeader, BadgeDisplay, FollowButton } from "@venlaxiq/ui";

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const qc = useQueryClient();
  const [followError, setFollowError] = useState("");

  const { data: profile } = useQuery<any>({
    queryKey: ["profile", userId],
    queryFn: () => fetch(`/api/proxy/profile/${userId}`).then((r) => r.json()),
  });

  const follow = useMutation({
    mutationFn: async (isFollowing: boolean) => {
      await fetch(`/api/proxy/users/${userId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", userId] }),
    onError: (err: any) => setFollowError(err?.message ?? "Action failed"),
  });

  if (!profile) return <p className="text-text-secondary text-sm">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <ProfileHeader
          username={profile.user.username}
          avatarUrl={profile.user.avatarUrl}
          subscriptionTier={profile.user.subscriptionTier}
          totalForecasts={profile.totalForecasts}
          reputationScore={profile.user.reputationScore}
        />
        <FollowButton
          isFollowing={profile.isFollowing ?? false}
          onToggle={(isFollowing) => follow.mutate(isFollowing)}
          isLoading={follow.isPending}
        />
      </div>
      {followError && <p className="text-red-400 text-sm mt-2">{followError}</p>}
      <div className="flex flex-wrap gap-3">
        {profile.badges?.filter((b: any) => b.earned).map((b: any) => (
          <BadgeDisplay key={b.id} badge={b} />
        ))}
      </div>
    </div>
  );
}
