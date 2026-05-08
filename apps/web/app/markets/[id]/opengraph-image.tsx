import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VenlaxIQ Market";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const market = await fetch(
    `${process.env.API_URL ?? "http://localhost:3001"}/markets/${id}`
  )
    .then((r) => r.json())
    .catch(() => null) as { title?: string; qYes?: number; qNo?: number } | null;

  const title = market?.title ?? "Market";
  const prob = market
    ? Math.round(
        ((market.qYes ?? 0) /
          Math.max((market.qYes ?? 0) + (market.qNo ?? 0), 1)) *
          100
      )
    : 50;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0D0D0D",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: "#00D46A",
            marginBottom: 20,
            textTransform: "uppercase",
            letterSpacing: 4,
          }}
        >
          VenlaxIQ
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#F5F5F5",
            textAlign: "center",
            marginBottom: 40,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: prob >= 50 ? "#00D46A" : "#FF6B00",
          }}
        >
          {prob}%
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#8A8A8A",
            marginTop: 8,
          }}
        >
          Current probability estimate
        </div>
      </div>
    ),
    { ...size }
  );
}
