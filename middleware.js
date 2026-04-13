import { NextResponse } from "next/server";

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Skip API routes, admin, pin page, and static files
  if (path.startsWith("/api") || path.startsWith("/admin") || path.startsWith("/pin") || path.startsWith("/_next") || path.startsWith("/favicon")) {
    return NextResponse.next();
  }
  
  // Check session cookie
  const session = request.cookies.get("ap_session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/pin", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|admin|pin|_next|favicon).*)"],
};