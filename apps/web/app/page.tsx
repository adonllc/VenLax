import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (token) redirect("/home");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "700px",
          height: "500px",
          background: "radial-gradient(ellipse, rgba(196,255,0,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: "2px", marginBottom: "0.75rem" }}>
            <span
              style={{
                fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                fontWeight: 800,
                fontSize: "clamp(2.5rem, 7vw, 4rem)",
                color: "var(--color-text-primary)",
                letterSpacing: "-0.03em",
              }}
            >
              Venlax
            </span>
            <span
              style={{
                fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
                fontWeight: 800,
                fontSize: "clamp(2.5rem, 7vw, 4rem)",
                color: "var(--color-green)",
                letterSpacing: "-0.03em",
                textShadow: "var(--glow-green)",
              }}
            >
              IQ
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              color: "var(--color-text-secondary)",
              letterSpacing: "0.02em",
            }}
          >
            Predict. Review. Earn.
          </p>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--color-text-secondary)",
            maxWidth: "460px",
            lineHeight: 1.7,
            marginBottom: "2.5rem",
            margin: "0 auto 2.5rem",
          }}
        >
          Make product forecasts, submit verified reviews, and earn ForecastPoints redeemable for real rewards.
        </p>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2.5rem" }}>
          {["Binary Markets", "LMSR Pricing", "AI Insights", "Daily Rewards"].map((f) => (
            <span
              key={f}
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "999px",
                padding: "0.3rem 0.875rem",
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "0.875rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/register"
            style={{
              padding: "0.875rem 2rem",
              background: "var(--color-green)",
              color: "#080B0F",
              fontWeight: 700,
              fontSize: "0.9rem",
              borderRadius: "12px",
              textDecoration: "none",
              boxShadow: "var(--glow-green)",
              transition: "all 0.2s",
              letterSpacing: "0.01em",
            }}
          >
            Get started free
          </Link>
          <Link
            href="/markets"
            style={{
              padding: "0.875rem 2rem",
              background: "rgba(255,255,255,0.04)",
              color: "var(--color-text-primary)",
              fontWeight: 600,
              fontSize: "0.9rem",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            Browse markets
          </Link>
        </div>
      </div>
    </div>
  );
}
