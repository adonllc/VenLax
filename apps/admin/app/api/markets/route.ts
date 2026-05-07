import { NextRequest, NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const market = await adminApi.createMarket(body);
    return NextResponse.json(market, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
