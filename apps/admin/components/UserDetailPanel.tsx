"use client";

interface UserDetailPanelProps {
  user: {
    id: string;
    email: string;
    username: string;
    subscriptionTier: string;
    xpLevel: string;
    xpTotal: number;
    isActive: boolean;
    isBanned: boolean;
    createdAt: string;
  };
  fpBalance: number;
}

export function UserDetailPanel({ user, fpBalance }: UserDetailPanelProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-5 space-y-3 text-sm">
      <div className="flex justify-between"><span className="text-text-secondary">Email</span><span className="text-text-primary font-mono text-xs">{user.email}</span></div>
      <div className="flex justify-between"><span className="text-text-secondary">Username</span><span className="text-text-primary">@{user.username}</span></div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Subscription</span>
        <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
          user.subscriptionTier === "elite" ? "bg-lemon/20 text-lemon" :
          user.subscriptionTier === "pro" ? "bg-orange/20 text-orange" :
          "bg-surface-3 text-text-secondary"
        }`}>{user.subscriptionTier}</span>
      </div>
      <div className="flex justify-between"><span className="text-text-secondary">FP Balance</span><span className="text-green font-semibold font-mono">⚡ {fpBalance.toLocaleString()}</span></div>
      <div className="flex justify-between"><span className="text-text-secondary">XP</span><span className="text-text-primary font-mono">{user.xpTotal.toLocaleString()} ({user.xpLevel})</span></div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Status</span>
        <span className={user.isBanned ? "text-red-400 font-semibold" : user.isActive ? "text-green font-semibold" : "text-text-secondary"}>
          {user.isBanned ? "Suspended" : user.isActive ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="flex justify-between"><span className="text-text-secondary">Joined</span><span className="font-mono text-xs text-text-secondary">{new Date(user.createdAt).toLocaleDateString()}</span></div>
    </div>
  );
}
