import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  color?: "green" | "orange" | "lemon" | "default";
}

export function StatCard({ label, value, trend, color = "default" }: StatCardProps) {
  const colorMap = {
    green: "border-green/30 text-green",
    orange: "border-orange/30 text-orange",
    lemon: "border-lemon/30 text-lemon",
    default: "border-border text-text-primary",
  };

  return (
    <div className={clsx("bg-surface-2 rounded-xl p-5 border", colorMap[color])}>
      <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-heading font-bold">{value}</p>
      {trend !== undefined && (
        <p className={clsx("text-xs mt-1 font-semibold", trend >= 0 ? "text-green" : "text-red-400")}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last period
        </p>
      )}
    </div>
  );
}
