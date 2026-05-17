"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TwoFAPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (!sessionStorage.getItem("admin_partial_token")) {
      router.replace("/login");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const partialToken = sessionStorage.getItem("admin_partial_token") ?? "";
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partialToken, totpCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      sessionStorage.removeItem("admin_partial_token");
      router.refresh();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface-2 border border-border rounded-xl p-8">
        <h1 className="font-heading font-bold text-2xl text-text-primary mb-1">Two-Factor Auth</h1>
        <p className="text-text-secondary text-sm mb-6">Enter the 6-digit code from your authenticator app.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input ref={inputRef} type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000"
            className="w-full bg-surface-3 border border-border rounded-lg px-3 py-3 text-center text-2xl font-mono text-text-primary tracking-[0.5em] outline-none focus:border-orange transition-colors" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading || code.length !== 6}
            className="w-full bg-orange hover:bg-orange-dark text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>
        <button onClick={() => router.push("/login")}
          className="w-full mt-3 text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Back to login
        </button>
      </div>
    </div>
  );
}
