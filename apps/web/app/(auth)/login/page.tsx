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

  const fieldClass = "w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-green transition-colors";
  const labelClass = "text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5";

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="font-heading font-bold text-3xl text-text-primary">VenlaxIQ</h1>
        <p className="text-text-secondary text-sm mt-1">Predict. Review. Earn.</p>
      </div>
      <div className="bg-surface-2 border border-border rounded-xl p-6">
        <h2 className="font-heading font-bold text-lg text-text-primary mb-5">Sign in</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input type="password" className={fieldClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green hover:bg-green-dark text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-sm text-text-secondary mt-4">
          No account? <Link href="/register" className="text-green hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
