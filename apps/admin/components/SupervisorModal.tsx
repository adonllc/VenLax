"use client";

import { useState } from "react";

interface SupervisorModalProps {
  title: string;
  description: string;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

export function SupervisorModal({ title, description, onConfirm, onCancel }: SupervisorModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!password) { setError("Password required"); return; }
    setLoading(true);
    setError("");
    try {
      await onConfirm(password);
    } catch (err: any) {
      setError(err.message ?? "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-surface-2 border border-border rounded-xl p-6">
        <h2 className="font-heading font-bold text-lg text-text-primary mb-1">{title}</h2>
        <p className="text-sm text-text-secondary mb-5">{description}</p>
        <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider block mb-1.5">
          Re-enter your password to confirm
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-orange transition-colors mb-3"
        />
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="px-5 py-2 text-sm font-semibold bg-orange hover:bg-orange-dark text-white rounded-lg transition-colors disabled:opacity-50">
            {loading ? "Confirming…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
