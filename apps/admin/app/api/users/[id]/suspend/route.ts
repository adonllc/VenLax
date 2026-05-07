import { NextRequest, NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  try {
    await adminApi.suspendUser(params.id, body.suspend);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
