import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public kit pages - no auth needed
  if (pathname.startsWith("/kit/")) {
    return NextResponse.next();
  }

  // API routes - no auth gate (they're called by the app itself)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const auth = request.cookies.get("mkb_auth");
  if (auth?.value === "authenticated") {
    return NextResponse.next();
  }

  // Redirect to login page
  if (pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
