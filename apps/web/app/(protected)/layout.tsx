import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-surface">
      <nav className="border-b border-border bg-surface-2">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/home" className="font-heading font-bold text-text-primary">VenlaxIQ</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/markets" className="text-text-secondary hover:text-text-primary transition-colors">Markets</Link>
            <Link href="/forecast" className="text-text-secondary hover:text-text-primary transition-colors">Forecasts</Link>
            <Link href="/leaderboard" className="text-text-secondary hover:text-text-primary transition-colors">Leaderboard</Link>
            <Link href="/rewards" className="text-text-secondary hover:text-text-primary transition-colors">Rewards</Link>
            <Link href="/profile" className="text-text-secondary hover:text-text-primary transition-colors">Profile</Link>
            <Link href="/settings" className="text-text-secondary hover:text-text-primary transition-colors">Settings</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
