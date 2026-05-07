import { getAdminUser } from "@/lib/auth";

export default async function SettingsPage() {
  const admin = await getAdminUser();

  return (
    <div className="max-w-lg">
      <h1 className="font-heading font-bold text-2xl text-text-primary mb-6">Settings</h1>

      <div className="bg-surface-2 border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Admin Profile</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Email</span>
            <span className="font-mono text-text-primary">{admin?.email ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Role</span>
            <span className="text-orange font-semibold uppercase text-xs">{admin?.role ?? "—"}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-2 border border-orange/20 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-orange uppercase tracking-wider mb-2">2FA Reset</h2>
        <p className="text-sm text-text-secondary mb-4">
          To reset your TOTP 2FA, contact a superadmin. They will run the seed-admin script with your email to regenerate a new TOTP secret.
        </p>
        <p className="text-xs text-text-secondary font-mono bg-surface-3 px-3 py-2 rounded-lg">
          pnpm --filter api seed:admin
        </p>
      </div>
    </div>
  );
}
