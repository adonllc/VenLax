import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const { pathname } = request.nextUrl;

  // Auth pages and unauthenticated API routes — always allow through
  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/2fa") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/logout");

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
