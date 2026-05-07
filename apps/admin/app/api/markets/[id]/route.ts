import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/lib/auth";

const API_BASE = process.env.API_URL ?? "http://localhost:3001";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAdminToken();
  const res = await fetch(`${API_BASE}/admin/markets/${id}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
