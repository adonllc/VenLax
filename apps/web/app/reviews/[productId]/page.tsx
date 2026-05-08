import { serverFetchPublic } from "@/lib/server-api";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { productId } = await params;
  const product = await serverFetchPublic<any>(`/products/${productId}`).catch(() => null);
  return { title: product ? `Reviews — ${product.name} | VenlaxIQ` : "Reviews | VenlaxIQ" };
}

export default async function ProductReviewsPage({ params }: PageProps) {
  const { productId } = await params;
  const [product, reviewsData] = await Promise.all([
    serverFetchPublic<any>(`/products/${productId}`).catch(() => null),
    serverFetchPublic<{ reviews: any[] }>(`/reviews/${productId}`).catch(() => ({ reviews: [] })),
  ]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {product && (
          <div className="mb-6">
            <h1 className="font-heading font-bold text-2xl text-text-primary">{product.name}</h1>
            <p className="text-text-secondary text-sm">{product.brand}</p>
          </div>
        )}

        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Community Reviews
        </h2>

        <div className="flex flex-col gap-4">
          {reviewsData.reviews?.map((review: any) => (
            <div key={review.id} className="bg-surface-2 border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{review.title}</p>
                  <p className="text-xs text-text-secondary">by {review.username ?? "Anonymous"}</p>
                </div>
                <span className="text-orange text-sm font-semibold">{review.rating}/5</span>
              </div>
              <p className="text-sm text-text-secondary">{review.body}</p>
              <p className="text-xs text-text-secondary mt-2 italic">
                *FTC Disclosure: Reviewer may have received this product for free or at a discount.
              </p>
            </div>
          ))}
          {!reviewsData.reviews?.length && (
            <p className="text-text-secondary text-sm text-center py-16">No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
