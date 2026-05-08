import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (token) redirect("/home");

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading font-bold text-5xl text-text-primary mb-3">VenlaxIQ</h1>
      <p className="text-text-secondary text-xl mb-2">Predict. Review. Earn.</p>
      <p className="text-text-secondary text-sm max-w-md mb-8">
        Make product forecasts, submit verified reviews, and earn ForecastPoints redeemable for real rewards.
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/register"
          className="px-6 py-3 bg-green hover:bg-green-dark text-white font-semibold rounded-lg transition-colors"
        >
          Get started
        </Link>
        <Link
          href="/markets"
          className="px-6 py-3 bg-surface-2 border border-border text-text-primary hover:border-green rounded-lg transition-colors"
        >
          Browse markets
        </Link>
      </div>
    </div>
  );
}
