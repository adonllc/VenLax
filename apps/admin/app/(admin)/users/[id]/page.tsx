"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserDetailPanel } from "@/components/UserDetailPanel";
import { SupervisorModal } from "@/components/SupervisorModal";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [fetchError, setFetchError] = useState("");
  const [modal, setModal] = useState<"suspend" | "reinstate" | null>(null);

  function load() {
    fetch(`/api/users/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load user");
        return r.json();
      })
      .then(setData)
      .catch((err: unknown) => setFetchError(err instanceof Error ? err.message : "Failed to load user"));
  }

  useEffect(() => { load(); }, [id]);

  async function handleSuspend(_password: string) {
    const suspend = modal === "suspend";
    const res = await fetch(`/api/users/${id}/suspend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspend }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error ?? "Action failed");
    }
    setModal(null);
    load();
  }

  if (fetchError) return <p className="text-red-400 text-sm">{fetchError}</p>;
  if (!data) return <p className="text-text-secondary text-sm">Loading…</p>;

  return (
    <div className="max-w-xl">
      {modal && (
        <SupervisorModal
          title={modal === "suspend" ? "Suspend User" : "Reinstate User"}
          description={`You are about to ${modal} ${data.user.email}. Confirm with your password.`}
          onConfirm={handleSuspend}
          onCancel={() => setModal(null)}
        />
      )}
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">{data.user.username}</h1>
      <UserDetailPanel user={data.user} fpBalance={data.fpBalance} />
      <div className="mt-6 flex gap-3">
        {data.user.isBanned ? (
          <button onClick={() => setModal("reinstate")}
            className="px-5 py-2.5 bg-green hover:bg-green-dark text-white font-semibold rounded-lg text-sm transition-colors">
            Reinstate user
          </button>
        ) : (
          <button onClick={() => setModal("suspend")}
            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition-colors">
            Suspend user
          </button>
        )}
      </div>
    </div>
  );
}
