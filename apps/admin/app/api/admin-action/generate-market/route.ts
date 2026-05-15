import { NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function POST() {
  try {
    await adminApi.generateMarket();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
