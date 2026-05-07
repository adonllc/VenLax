"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewMarketPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", category: "open", closesAt: "", resolvesAt: "", resolutionCriteria: "", resolutionSource: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          closesAt: new Date(form.closesAt).toISOString(),
          resolvesAt: new Date(form.resolvesAt).toISOString(),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to create market");
      }
      router.push("/markets");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fieldClass = "w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-green transition-colors";
  const labelClass = "text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5";

  return (
    <div className="max-w-xl">
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">New Market</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div><label className={labelClass}>Title</label><input className={fieldClass} value={form.title} onChange={set("title")} required minLength={5} /></div>
        <div><label className={labelClass}>Description</label><textarea className={fieldClass} value={form.description} onChange={set("description")} rows={3} required minLength={10} /></div>
        <div>
          <label className={labelClass}>Category</label>
          <select className={fieldClass} value={form.category} onChange={set("category")}>
            <option value="open">Open</option>
            <option value="sports">Sports</option>
            <option value="politics">Politics</option>
          </select>
        </div>
        <div><label className={labelClass}>Closes At</label><input type="datetime-local" className={fieldClass} value={form.closesAt} onChange={set("closesAt")} required /></div>
        <div><label className={labelClass}>Resolves At</label><input type="datetime-local" className={fieldClass} value={form.resolvesAt} onChange={set("resolvesAt")} required /></div>
        <div><label className={labelClass}>Resolution Criteria</label><textarea className={fieldClass} value={form.resolutionCriteria} onChange={set("resolutionCriteria")} rows={3} required minLength={10} /></div>
        <div><label className={labelClass}>Resolution Source</label><input className={fieldClass} value={form.resolutionSource} onChange={set("resolutionSource")} required minLength={5} /></div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 bg-green hover:bg-green-dark text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50">
          {loading ? "Creating…" : "Create market"}
        </button>
      </form>
    </div>
  );
}
