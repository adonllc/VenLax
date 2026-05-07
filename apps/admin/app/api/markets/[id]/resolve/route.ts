import { NextRequest, NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  try {
    await adminApi.resolveMarket(params.id, body.outcome);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
