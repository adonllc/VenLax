"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/markets", icon: "📈", label: "Markets" },
  { href: "/users", icon: "👤", label: "Users" },
  { href: "/fp-adjustments", icon: "⚡", label: "FP Adjustments" },
  { href: "/reviews", icon: "🔍", label: "Reviews" },
  { href: "/analytics", icon: "📉", label: "Analytics" },
  { href: "/settings", icon: "⚙", label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    const res = await fetch("/api/logout", { method: "POST" });
    if (res.ok) window.location.href = "/login";
  }

  return (
    <aside className="w-56 min-h-screen bg-surface-2 border-r border-border flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <span className="font-heading font-bold text-lg text-text-primary">VenlaxIQ</span>
        <span className="ml-2 text-xs text-orange font-semibold uppercase tracking-wider">Admin</span>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "text-text-primary bg-surface-3"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-3"
            )}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-text-secondary hover:text-orange transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
