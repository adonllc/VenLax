import { serverFetch } from "@/lib/server-api";
import { ProfileHeader, BadgeDisplay, XPProgressBar } from "@venlaxiq/ui";

export default async function ProfilePage() {
  const profile = await serverFetch<any>("/profile/me").catch(() => null);
  const badges = await serverFetch<any[]>("/badges").catch(() => []);

  if (!profile) {
    return <p className="text-text-secondary">Unable to load profile.</p>;
  }

  return (
    <div>
      <ProfileHeader
        username={profile.user.username}
        avatarUrl={profile.user.avatarUrl ?? null}
        tier={profile.user.subscriptionTier ?? "free"}
        xpLevel={profile.user.xpLevel ?? "rookie"}
        accuracy={profile.user.accuracy ?? 0}
        isOwnProfile={true}
        isFollowing={false}
        followerCount={profile.followerCount ?? 0}
        followingCount={profile.followingCount}
        onFollow={() => {}}
      />
      <div className="mt-6">
        <XPProgressBar
          level={profile.user.xpLevel ?? "rookie"}
          xp={profile.user.xpTotal ?? 0}
          nextLevelXp={profile.user.nextLevelXp ?? 1000}
        />
      </div>
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Badges</h2>
        <div className="flex flex-wrap gap-3">
          {(badges as any[]).map((b) => (
            <BadgeDisplay
              key={b.id}
              name={b.name}
              icon={b.icon ?? "🏅"}
              fpReward={b.fpReward ?? 0}
              unlocked={b.unlocked ?? true}
              earnedAt={b.earnedAt ? new Date(b.earnedAt) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
