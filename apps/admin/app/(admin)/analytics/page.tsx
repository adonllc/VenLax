import { adminApi } from "@/lib/admin-api";
import { StatCard } from "@/components/StatCard";

export default async function AnalyticsPage() {
  const analytics = await adminApi.analytics().catch(() => null);

  const tierMap: Record<string, number> = {};
  analytics?.tierCounts?.forEach((t: any) => { tierMap[t.tier] = Number(t.total); });

  const fpByType: Record<string, number> = {};
  analytics?.fpVolume?.forEach((f: any) => { fpByType[f.poolType] = Number(f.volume); });

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Analytics</h1>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard label="30-day MAU" value={analytics?.mau ?? "—"} color="green" />
        <StatCard label="Daily AU" value={analytics?.dau ?? "—"} color="green" />
        <StatCard label="Pro users" value={tierMap["pro"] ?? 0} color="orange" />
        <StatCard label="Elite users" value={tierMap["elite"] ?? 0} color="lemon" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Subscriptions by Tier</h2>
          <div className="space-y-3">
            {["free", "pro", "elite"].map((tier) => {
              const total = (tierMap["free"] ?? 0) + (tierMap["pro"] ?? 0) + (tierMap["elite"] ?? 0);
              const val = tierMap[tier] ?? 0;
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                <div key={tier}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary capitalize">{tier}</span>
                    <span className="font-mono text-text-primary">{val} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${tier === "elite" ? "bg-lemon" : tier === "pro" ? "bg-orange" : "bg-green"}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-2 border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">FP Volume (7-day) by Pool</h2>
          <div className="space-y-2">
            {Object.entries(fpByType).map(([type, vol]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-text-secondary capitalize">{type.replace("_", " ")}</span>
                <span className="font-mono text-green">⚡ {vol.toLocaleString()}</span>
              </div>
            ))}
            {Object.keys(fpByType).length === 0 && (
              <p className="text-sm text-text-secondary">No data for the last 7 days</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
