"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/home");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-2">
          <span
            style={{
              fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
              fontWeight: 800,
              fontSize: "2rem",
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
              fontSize: "2rem",
              color: "var(--color-green)",
              letterSpacing: "-0.02em",
            }}
          >
            IQ
          </span>
        </div>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
          Predict. Review. Earn.
        </p>
      </div>

      {/* Card */}
      <div
        className="glass rounded-2xl p-7"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading, 'Outfit', sans-serif)",
            fontWeight: 700,
            fontSize: "1.25rem",
            color: "var(--color-text-primary)",
            marginBottom: "1.5rem",
          }}
        >
          Sign in
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--color-text-secondary)",
                marginBottom: "0.5rem",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                color: "var(--color-text-primary)",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-green)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--color-text-secondary)",
                marginBottom: "0.5rem",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                color: "var(--color-text-primary)",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-green)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {error && (
            <p style={{ fontSize: "0.8rem", color: "#FF5C5C", margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "rgba(196,255,0,0.5)" : "var(--color-green)",
              color: "#080B0F",
              fontWeight: 700,
              fontSize: "0.875rem",
              border: "none",
              borderRadius: "10px",
              padding: "0.85rem",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "var(--glow-green-sm)",
              letterSpacing: "0.01em",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "1.25rem" }}>
          No account?{" "}
          <Link href="/register" style={{ color: "var(--color-green)", textDecoration: "none", fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
