import Link from "next/link";
import { adminApi } from "@/lib/admin-api";

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string; category?: string }>;
}

export default async function MarketsPage({ searchParams }: PageProps) {
  const { page, status, category } = await searchParams;
  const params: Record<string, string> = {};
  if (page) params.page = page;
  if (status) params.status = status;
  if (category) params.category = category;

  const data = await adminApi.markets(params).catch(() => ({ markets: [], total: 0, pages: 1 }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-text-primary">Markets</h1>
        <Link href="/markets/new" className="px-4 py-2 bg-green hover:bg-green-dark text-white text-sm font-semibold rounded-lg transition-colors">
          + New market
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        {["", "open", "closed", "resolved", "settled"].map((s) => (
          <Link key={s} href={s ? `/markets?status=${s}` : "/markets"}
            className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
              (status ?? "") === s ? "border-orange text-orange" : "border-border text-text-secondary hover:text-text-primary"
            }`}>
            {s || "All"}
          </Link>
        ))}
      </div>

      <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary uppercase text-xs tracking-wider">
              <th className="text-left p-4">Title</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Closes At</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {data.markets.map((m: any) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface-3 transition-colors">
                <td className="p-4 text-text-primary font-medium">{m.title}</td>
                <td className="p-4 text-text-secondary capitalize">{m.category}</td>
                <td className="p-4">
                  <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
                    m.status === "open" ? "bg-green/20 text-green" :
                    m.status === "resolved" ? "bg-orange/20 text-orange" :
                    "bg-surface-3 text-text-secondary"
                  }`}>{m.status}</span>
                </td>
                <td className="p-4 text-text-secondary font-mono text-xs">{new Date(m.closesAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <Link href={`/markets/${m.id}`} className="text-orange text-xs hover:underline">Manage →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
