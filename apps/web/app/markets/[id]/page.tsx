import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { serverFetchPublic } from "@/lib/server-api";
import { ProbabilityBar, MarketStatusChip, CategoryPill } from "@venlaxiq/ui";
import type { MarketCategory, MarketStatus } from "@venlaxiq/ui";
import { ForecastEntryIsland } from "./ForecastEntryIsland";
import { findPolymarketMatch } from "@/lib/polymarket";
import { PolymarketComparisonCard } from "./PolymarketComparisonCard";

interface MarketDetail {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  status: MarketStatus;
  qYes: number;
  qNo: number;
  closesAt: string;
  resolutionCriteria: string;
  totalVolumeFp?: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const market = await serverFetchPublic<MarketDetail>(`/markets/${id}`).catch(
    () => null
  );
  if (!market) return { title: "Market not found" };
  const prob = Math.round(
    (market.qYes / Math.max(market.qYes + market.qNo, 1)) * 100
  );
  return {
    title: `${market.title} — ${prob}% | VenlaxIQ`,
    description: market.description,
    openGraph: {
      title: market.title,
      description: `Current probability: ${prob}% YES`,
    },
  };
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const market = await serverFetchPublic<MarketDetail>(`/markets/${id}`).catch(
    () => null
  );
  if (!market) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const prob = Math.round(
    (market.qYes / Math.max(market.qYes + market.qNo, 1)) * 100
  );
  const polyMatch = await findPolymarketMatch(market.title).catch(() => null);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb / meta row */}
        <div className="flex items-center gap-2 mb-3">
          <CategoryPill category={market.category} />
          <span className="text-text-secondary text-xs">·</span>
          <MarketStatusChip status={market.status} />
        </div>

        <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">
          {market.title}
        </h1>
        <p className="text-text-secondary text-sm mb-6">{market.description}</p>

        {/* Probability bar */}
        <div className="mb-6 bg-surface-2 border border-border rounded-xl p-4">
          <div className="flex justify-between text-xs text-text-secondary mb-2">
            <span>YES</span>
            <span className="font-mono font-bold text-text-primary">{prob}%</span>
          </div>
          <ProbabilityBar yesProb={prob} />
        </div>

        {/* Polymarket comparison widget */}
        {polyMatch && (
          <PolymarketComparisonCard
            polyQuestion={polyMatch.polyQuestion}
            polyYesPercent={polyMatch.polyYesPercent}
            venlaxYesPercent={prob}
            polyUrl={polyMatch.polyUrl}
          />
        )}

        {/* Forecast entry island (client component) */}
        <ForecastEntryIsland
          marketId={id}
          initialProb={prob}
          isAuthed={!!token}
        />

        {/* Resolution criteria */}
        <div className="mt-8 bg-surface-2 border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Resolution Criteria
          </h2>
          <p className="text-sm text-text-primary">{market.resolutionCriteria}</p>
          <p className="text-xs text-text-secondary mt-3">
            Closes:{" "}
            {new Date(market.closesAt).toLocaleDateString("en-US", {
              dateStyle: "long",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
