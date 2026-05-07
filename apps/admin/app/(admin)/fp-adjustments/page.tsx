"use client";

import { useState } from "react";
import { SupervisorModal } from "@/components/SupervisorModal";

export default function FPAdjustmentsPage() {
  const [form, setForm] = useState({
    userId: "", amount: "", poolType: "bonus" as "bonus" | "achievement", reason: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleConfirm(_password: string) {
    const res = await fetch("/api/fp/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed");
    setShowModal(false);
    setSuccess(true);
    setForm({ userId: "", amount: "", poolType: "bonus", reason: "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!form.userId || !form.amount || !form.reason) { setError("All fields required"); return; }
    if (Number(form.amount) === 0) { setError("Amount cannot be 0"); return; }
    setShowModal(true);
  }

  const fieldClass = "w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-orange transition-colors";
  const labelClass = "text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5";

  return (
    <div className="max-w-lg">
      {showModal && (
        <SupervisorModal
          title="FP Adjustment"
          description={`You are ${Number(form.amount) > 0 ? "crediting" : "debiting"} ${Math.abs(Number(form.amount))} FP ${Number(form.amount) > 0 ? "to" : "from"} user ${form.userId}. This is immutably audit-logged.`}
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}

      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">FP Adjustments</h1>
      <p className="text-sm text-text-secondary mb-6">Manual FP credits and debits are immutably audit-logged. Negative amounts = debit.</p>

      {success && (
        <div className="mb-4 p-3 bg-green/10 border border-green/30 rounded-lg text-sm text-green font-semibold">
          FP adjustment recorded successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div><label className={labelClass}>User ID</label><input className={fieldClass} value={form.userId} onChange={set("userId")} placeholder="uuid" required /></div>
        <div><label className={labelClass}>Amount (+ credit / − debit)</label><input type="number" className={fieldClass} value={form.amount} onChange={set("amount")} placeholder="e.g. 500 or -200" required /></div>
        <div>
          <label className={labelClass}>Pool Type</label>
          <select className={fieldClass} value={form.poolType} onChange={set("poolType")}>
            <option value="bonus">Bonus</option>
            <option value="achievement">Achievement</option>
          </select>
        </div>
        <div><label className={labelClass}>Reason (min 10 chars)</label><textarea className={fieldClass} value={form.reason} onChange={set("reason")} rows={2} minLength={10} required /></div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="px-5 py-2.5 bg-orange hover:bg-orange-dark text-white font-semibold rounded-lg text-sm transition-colors">
          Submit adjustment
        </button>
      </form>
    </div>
  );
}
