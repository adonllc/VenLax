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
        avatarUrl={profile.user.avatarUrl}
        subscriptionTier={profile.user.subscriptionTier}
        totalForecasts={profile.totalForecasts}
        reputationScore={profile.user.reputationScore}
      />
      <div className="mt-6">
        <XPProgressBar xpTotal={profile.user.xpTotal} xpLevel={profile.user.xpLevel} />
      </div>
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Badges</h2>
        <div className="flex flex-wrap gap-3">
          {badges.map((b) => <BadgeDisplay key={b.id} badge={b} />)}
        </div>
      </div>
    </div>
  );
}
