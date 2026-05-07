import { adminApi } from "@/lib/admin-api";
import { StatCard } from "@/components/StatCard";

export default async function DashboardPage() {
  const analytics = await adminApi.analytics().catch(() => null);

  const tierMap: Record<string, number> = {};
  analytics?.tierCounts?.forEach((t: any) => { tierMap[t.tier] = Number(t.total); });

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard label="Monthly Active Users" value={analytics?.mau ?? "—"} color="green" />
        <StatCard label="Daily Active Users" value={analytics?.dau ?? "—"} color="green" />
        <StatCard label="Pro Subscribers" value={tierMap["pro"] ?? "—"} color="orange" />
        <StatCard label="Elite Subscribers" value={tierMap["elite"] ?? "—"} color="lemon" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Top Active Markets</h2>
          {analytics?.topMarkets?.length ? (
            <ul className="space-y-2">
              {analytics.topMarkets.map((m: any) => (
                <li key={m.id} className="text-sm text-text-primary">{m.title}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">No data</p>
          )}
        </div>

        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Subscriptions by Tier</h2>
          {["free", "pro", "elite"].map((tier) => (
            <div key={tier} className="flex justify-between text-sm py-1">
              <span className="text-text-secondary capitalize">{tier}</span>
              <span className="text-text-primary font-semibold font-mono">{tierMap[tier] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
