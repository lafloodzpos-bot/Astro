import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// GET - check if site is enabled and if session is valid
export async function GET(request) {
  const session = request.cookies.get("ap_session")?.value;
  const siteEnabled = await kv.get("site_enabled");
  if (siteEnabled === false) return NextResponse.json({ enabled: false, authed: false });
  if (!session) return NextResponse.json({ enabled: true, authed: false });
  const valid = await kv.get("session:" + session);
  return NextResponse.json({ enabled: true, authed: !!valid });
}

// POST - verify PIN
export async function POST(request) {
  const { pin } = await request.json();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  
  // Check if site is enabled
  const siteEnabled = await kv.get("site_enabled");
  if (siteEnabled === false) return NextResponse.json({ error: "Site is currently disabled" }, { status: 403 });
  
  // Check rate limit (10 attempts per 10 minutes per IP)
  const rlKey = "ratelimit:" + ip;
  const attempts = (await kv.get(rlKey)) || 0;
  if (attempts >= 10) return NextResponse.json({ error: "Too many attempts. Try again in 10 minutes.", blocked: true }, { status: 429 });
  
  // Get PIN list
  const pins = (await kv.get("user_pins")) || [];
  const match = pins.find(p => p.pin === pin);
  
  if (!match) {
    await kv.set(rlKey, attempts + 1, { ex: 600 });
    return NextResponse.json({ error: "Invalid PIN", remaining: 9 - attempts }, { status: 401 });
  }
  
  // Valid PIN - create session
  const sessionId = crypto.randomUUID();
  await kv.set("session:" + sessionId, { user: match.name, pin: match.pin, ip, ts: Date.now() }, { ex: 86400 });
  
  // Log access
  const logs = (await kv.get("access_logs")) || [];
  logs.unshift({ user: match.name, pin: match.pin, ip, date: new Date().toISOString() });
  if (logs.length > 500) logs.length = 500;
  await kv.set("access_logs", logs);
  
  // Clear rate limit on success
  await kv.del(rlKey);
  
  const res = NextResponse.json({ success: true, user: match.name });
  res.cookies.set("ap_session", sessionId, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400, path: "/" });
  return res;
}