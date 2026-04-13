import { NextResponse } from "next/server";

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Skip API routes, admin, pin page, and static files
  if (path.startsWith("/api") || path.startsWith("/admin") || path.startsWith("/pin") || path.startsWith("/_next") || path.startsWith("/favicon")) {
    return NextResponse.next();
  }
  
  // Check site enabled status via API
  try {
    const baseUrl = request.nextUrl.origin;
    const statusRes = await fetch(baseUrl + "/api/pin");
    const status = await statusRes.json();
    
    // If site is disabled, redirect to pin page (which shows disabled message)
    if (!status.enabled) {
      return NextResponse.redirect(new URL("/pin", request.url));
    }
  } catch {
    // If API check fails, allow through
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