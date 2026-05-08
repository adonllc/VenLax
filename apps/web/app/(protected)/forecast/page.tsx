"use client";

import { useQuery } from "@tanstack/react-query";

export default function ForecastPage() {
  const { data: positions, isLoading } = useQuery<any[]>({
    queryKey: ["positions"],
    queryFn: () => fetch("/api/proxy/forecast/positions").then((r) => r.json()),
  });

  function downloadCSV() {
    if (!positions?.length) return;
    const headers = ["Market", "Side", "FP Deployed", "Shares", "Status", "Date"];
    const rows = positions.map((p) => [
      p.marketTitle ?? p.marketId,
      p.side ? "YES" : "NO",
      p.fpDeployed,
      p.shares,
      p.isSettled ? `Settled (+${p.fpEarned ?? 0} FP)` : "Open",
      new Date(p.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forecast-history.csv";
    a.click();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-text-primary">My Forecasts</h1>
        <button
          onClick={downloadCSV}
          className="text-xs font-semibold text-text-secondary hover:text-green border border-border hover:border-green px-3 py-1.5 rounded-lg transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
        {isLoading && <p className="text-text-secondary text-sm p-4">Loading…</p>}
        {positions?.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-4 border-b border-border last:border-0"
          >
            <div>
              <p className="text-sm text-text-primary">{p.marketTitle ?? "Market"}</p>
              <p className="text-xs text-text-secondary">
                {p.side ? "YES" : "NO"} · {p.fpDeployed} FP · {p.shares} shares
              </p>
            </div>
            <span
              className={`text-xs font-semibold ${
                p.isSettled ? "text-green" : "text-text-secondary"
              }`}
            >
              {p.isSettled ? `+${p.fpEarned ?? 0} FP` : "Open"}
            </span>
          </div>
        ))}
        {!isLoading && !positions?.length && (
          <p className="text-text-secondary text-sm text-center py-16">
            No forecast history yet
          </p>
        )}
      </div>
    </div>
  );
}
