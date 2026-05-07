import { NextResponse } from "next/server";
import { adminApi } from "@/lib/admin-api";

export async function GET() {
  try {
    const data = await adminApi.reviewQueue("1");
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ reviews: [], total: 0 }, { status: 200 });
  }
}
