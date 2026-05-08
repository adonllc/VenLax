import { serverFetch } from "@/lib/server-api";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RedemptionPage({ params }: PageProps) {
  const { id } = await params;
  const history = await serverFetch<any[]>("/rewards/history").catch(() => []);
  const redemption = history.find((r: any) => r.id === id);
  if (!redemption) notFound();

  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="text-4xl mb-4">🎁</div>
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-2">Reward Redeemed!</h1>
      <p className="text-text-secondary text-sm mb-6">{redemption.itemName}</p>
      <div className="bg-surface-2 border border-green/30 rounded-xl p-6">
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Your code</p>
        <p className="font-mono text-2xl font-bold text-green">{redemption.code}</p>
        <p className="text-xs text-text-secondary mt-3">-{redemption.fpDebited} FP debited from your wallet</p>
      </div>
    </div>
  );
}
