"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  padding: "0.75rem 1rem",
  fontSize: "0.875rem",
  color: "var(--color-text-primary)",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.7rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--color-text-secondary)",
  marginBottom: "0.5rem",
};

function Field({
  label, type = "text", value, onChange, minLength, maxLength, required,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; minLength?: number; maxLength?: number; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        style={{ ...inputStyle, borderColor: focused ? "var(--color-green)" : "rgba(255,255,255,0.1)" }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", password: "", ageConfirm: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form) {
    return (v: string | boolean) => setForm((f) => ({ ...f, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ageConfirm) { setError("You must be 18 or older to register."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, username: form.username, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
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
          <span style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)", fontWeight: 800, fontSize: "2rem", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Venlax
          </span>
          <span style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)", fontWeight: 800, fontSize: "2rem", color: "var(--color-green)", letterSpacing: "-0.02em" }}>
            IQ
          </span>
        </div>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>Predict. Review. Earn.</p>
      </div>

      {/* Card */}
      <div className="glass rounded-2xl p-7" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
        <h2 style={{ fontFamily: "var(--font-heading, 'Outfit', sans-serif)", fontWeight: 700, fontSize: "1.25rem", color: "var(--color-text-primary)", marginBottom: "1.5rem" }}>
          Create account
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field label="Email" type="email" value={form.email} onChange={set("email") as (v: string) => void} required />
          <Field label="Username" value={form.username} onChange={set("username") as (v: string) => void} required minLength={3} maxLength={30} />
          <Field label="Password" type="password" value={form.password} onChange={set("password") as (v: string) => void} required minLength={8} />

          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.ageConfirm}
              onChange={(e) => setForm((f) => ({ ...f, ageConfirm: e.target.checked }))}
              style={{ marginTop: "2px", accentColor: "var(--color-green)" }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              I confirm I am 18 years of age or older
            </span>
          </label>

          {error && <p style={{ fontSize: "0.8rem", color: "#FF5C5C", margin: 0 }}>{error}</p>}

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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "1.25rem" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--color-green)", textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
