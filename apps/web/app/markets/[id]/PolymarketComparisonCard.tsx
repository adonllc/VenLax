interface PolymarketComparisonCardProps {
  polyQuestion: string;
  polyYesPercent: number;
  venlaxYesPercent: number;
  polyUrl: string;
}

export function PolymarketComparisonCard({
  polyQuestion,
  polyYesPercent,
  venlaxYesPercent,
  polyUrl,
}: PolymarketComparisonCardProps) {
  const diff = venlaxYesPercent - polyYesPercent;
  const diffColor = Math.abs(diff) <= 5 ? "var(--color-text-secondary)" : diff > 0 ? "var(--color-green)" : "#FF5C5C";

  return (
    <div
      style={{
        background: "rgba(17,22,32,0.6)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "1.25rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-secondary)" }}>
          Also trading on
        </span>
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#6AFFC4",
            background: "rgba(106,255,196,0.1)",
            padding: "0.15rem 0.5rem",
            borderRadius: "999px",
            border: "1px solid rgba(106,255,196,0.2)",
          }}
        >
          Polymarket
        </span>
      </div>

      <p style={{ fontSize: "0.8rem", color: "var(--color-text-primary)", lineHeight: 1.5, marginBottom: "1.125rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {polyQuestion}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "1.75rem", color: "var(--color-green)", textShadow: "var(--glow-green-sm)" }}>
            {venlaxYesPercent}%
          </p>
          <p style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            VenlaxIQ
          </p>
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: diffColor }}>
            {diff > 0 ? "+" : ""}{diff}%
          </p>
          <p style={{ fontSize: "0.6rem", color: "var(--color-text-secondary)" }}>diff</p>
        </div>

        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "1.75rem", color: "#6AFFC4" }}>
            {polyYesPercent}%
          </p>
          <p style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            Polymarket
          </p>
        </div>
      </div>

      <a
        href={polyUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          marginTop: "1rem",
          fontSize: "0.72rem",
          color: "var(--color-text-secondary)",
          textDecoration: "none",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-green)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
      >
        View on Polymarket →
      </a>
    </div>
  );
}
