import Link from "next/link";
import { serverFetchPublic } from "@/lib/server-api";
import { MarketCard } from "@venlaxiq/ui";
import type { MarketCategory } from "@venlaxiq/ui";
import type { MarketStatus } from "@venlaxiq/ui";

const CATEGORIES = ["All", "sports", "politics", "open"] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

interface MarketSummary {
  id: string;
  title: string;
  category: MarketCategory;
  status: MarketStatus;
  qYes: number;
  qNo: number;
  closesAt: string;
  totalVolumeFp?: number;
}

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export const revalidate = 60;

export default async function MarketsPage({ searchParams }: PageProps) {
  const { category, search } = await searchParams;
  const params = new URLSearchParams();
  if (category && category !== "All") params.set("category", category);
  if (search) params.set("search", search);
  params.set("status", "open");

  const data = await serverFetchPublic<{ markets: MarketSummary[] }>(
    `/markets?${params}`
  ).catch(() => ({ markets: [] }));

  const activeCategory: CategoryFilter = (category as CategoryFilter) ?? "All";

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="font-heading font-bold text-3xl text-text-primary mb-6">
          Markets
        </h1>

        {/* Category filter pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={cat === "All" ? "/markets" : `/markets?category=${cat}`}
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === cat
                  ? "border-green text-green"
                  : "border-border text-text-secondary hover:border-green hover:text-green"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Market grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.markets.map((market) => {
            const yesProb = Math.round(
              (market.qYes / Math.max(market.qYes + market.qNo, 1)) * 100
            );
            return (
              <Link key={market.id} href={`/markets/${market.id}`} className="block">
                <MarketCard
                  id={market.id}
                  title={market.title}
                  category={market.category}
                  status={market.status}
                  yesProb={yesProb}
                  closesAt={new Date(market.closesAt)}
                  totalVolumeFp={market.totalVolumeFp}
                />
              </Link>
            );
          })}
          {data.markets.length === 0 && (
            <p className="text-text-secondary text-sm col-span-3 py-16 text-center">
              No open markets
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
