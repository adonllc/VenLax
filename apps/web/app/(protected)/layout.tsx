import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

const navLinks = [
  { href: "/markets", label: "Markets" },
  { href: "/forecast", label: "Forecasts" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rewards", label: "Rewards" },
  { href: "/profile", label: "Profile" },
];

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-surface)" }}>
      {/* Top nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(8,11,15,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            padding: "0 1rem",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link href="/home" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}>
            <span
              style={{
                fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                fontWeight: 800,
                fontSize: "1.25rem",
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Venlax
            </span>
            <span
              style={{
                fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                fontWeight: 800,
                fontSize: "1.25rem",
                color: "var(--color-green)",
                letterSpacing: "-0.02em",
              }}
            >
              IQ
            </span>
          </Link>

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                  textDecoration: "none",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                }}
                className="nav-link"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/settings"
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                textDecoration: "none",
                padding: "0.375rem 0.75rem",
                borderRadius: "8px",
                marginLeft: "0.25rem",
                border: "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.2s",
              }}
              className="nav-link"
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <style>{`
        .nav-link:hover {
          color: var(--color-green) !important;
          background: rgba(196,255,0,0.06);
        }
      `}</style>

      <main style={{ maxWidth: "1120px", margin: "0 auto", padding: "1.5rem 1rem" }}>
        {children}
      </main>
    </div>
  );
}
