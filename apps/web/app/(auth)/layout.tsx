export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "var(--color-surface)" }}>
      {/* Ambient glow blobs */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(196,255,0,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-10%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(196,255,0,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
