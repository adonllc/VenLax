interface AuditEntry {
  id: string;
  actorId: string | null;
  targetId: string;
  action: string;
  metadata: string;
  createdAt: string;
}

interface AuditLogTableProps {
  entries: AuditEntry[];
}

export function AuditLogTable({ entries }: AuditLogTableProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary uppercase text-xs tracking-wider">
            <th className="text-left p-4">Action</th>
            <th className="text-left p-4">Admin</th>
            <th className="text-left p-4">Target</th>
            <th className="text-left p-4">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-border last:border-0">
              <td className="p-4 font-mono text-xs text-orange">{e.action}</td>
              <td className="p-4 font-mono text-xs text-text-secondary">{e.actorId ? `${e.actorId.slice(0, 8)}…` : "admin"}</td>
              <td className="p-4 font-mono text-xs text-text-secondary">{e.targetId.slice(0, 8)}…</td>
              <td className="p-4 font-mono text-xs text-text-secondary">{new Date(e.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {entries.length === 0 && (
        <p className="text-center text-text-secondary text-sm py-8">No audit entries</p>
      )}
    </div>
  );
}
