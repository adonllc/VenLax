"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", password: "", ageConfirm: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: key === "ageConfirm" ? e.target.checked : e.target.value }));
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

  const fieldClass = "w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-green transition-colors";
  const labelClass = "text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5";

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="font-heading font-bold text-3xl text-text-primary">VenlaxIQ</h1>
        <p className="text-text-secondary text-sm mt-1">Predict. Review. Earn.</p>
      </div>
      <div className="bg-surface-2 border border-border rounded-xl p-6">
        <h2 className="font-heading font-bold text-lg text-text-primary mb-5">Create account</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={fieldClass} value={form.email} onChange={set("email")} required />
          </div>
          <div>
            <label className={labelClass}>Username</label>
            <input className={fieldClass} value={form.username} onChange={set("username")} required minLength={3} maxLength={30} />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input type="password" className={fieldClass} value={form.password} onChange={set("password")} required minLength={8} />
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ageConfirm} onChange={set("ageConfirm")} className="mt-0.5" />
            <span className="text-xs text-text-secondary">I confirm I am 18 years of age or older</span>
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green hover:bg-green-dark text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="text-center text-sm text-text-secondary mt-4">
          Already have an account? <Link href="/login" className="text-green hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
