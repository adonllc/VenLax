import Link from "next/link";
import { adminApi } from "@/lib/admin-api";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; tier?: string; status?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const { page, search, tier, status } = await searchParams;
  const params: Record<string, string> = {};
  if (page) params.page = page;
  if (search) params.search = search;
  if (tier) params.tier = tier;
  if (status) params.status = status;

  const data = await adminApi.users(params).catch(() => ({ users: [], total: 0, pages: 1 }));

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Users</h1>

      <form method="GET" className="flex gap-3 mb-5">
        <input name="search" defaultValue={search} placeholder="Search by email…"
          className="flex-1 bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-orange" />
        <select name="tier" defaultValue={tier ?? ""} className="bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
          <option value="">All tiers</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="elite">Elite</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-orange text-white text-sm font-semibold rounded-lg">Search</button>
      </form>

      <p className="text-xs text-text-secondary mb-3">{data.total} users found</p>

      <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary uppercase text-xs tracking-wider">
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Tier</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Joined</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u: any) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-3 transition-colors">
                <td className="p-4 text-text-primary">{u.email}</td>
                <td className="p-4">
                  <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
                    u.subscriptionTier === "elite" ? "bg-lemon/20 text-lemon" :
                    u.subscriptionTier === "pro" ? "bg-orange/20 text-orange" :
                    "bg-surface-3 text-text-secondary"
                  }`}>{u.subscriptionTier}</span>
                </td>
                <td className="p-4">
                  <span className={u.isBanned ? "text-red-400 text-xs font-semibold" : "text-green text-xs font-semibold"}>
                    {u.isBanned ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-text-secondary">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-4"><Link href={`/users/${u.id}`} className="text-orange text-xs hover:underline">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
