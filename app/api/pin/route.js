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

// POST - verify PIN with strong brute force protection
export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  
  // Check if site is enabled
  const siteEnabled = await kv.get("site_enabled");
  if (siteEnabled === false) return NextResponse.json({ error: "Site is currently disabled" }, { status: 403 });
  
  // RATE LIMIT - 5 attempts per 10 minutes per IP (reduced from 10)
  const rlKey = "ratelimit:" + ip;
  const attempts = (await kv.get(rlKey)) || 0;
  if (attempts >= 5) {
    // Log blocked attempt
    const blockLogs = (await kv.get("block_logs")) || [];
    blockLogs.unshift({ ip, date: new Date().toISOString(), attempts });
    if (blockLogs.length > 200) blockLogs.length = 200;
    await kv.set("block_logs", blockLogs);
    return NextResponse.json({ error: "Too many attempts. Try again in 10 minutes.", blocked: true }, { status: 429 });
  }
  
  // GLOBAL rate limit - max 30 total attempts across ALL IPs per minute (stops distributed attacks)
  const globalKey = "ratelimit:global:" + Math.floor(Date.now() / 60000);
  const globalAttempts = (await kv.get(globalKey)) || 0;
  if (globalAttempts >= 30) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly.", blocked: true }, { status: 429 });
  }
  await kv.set(globalKey, globalAttempts + 1, { ex: 120 });
  
  // Add artificial delay - makes brute force even slower (200-500ms random)
  await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
  
  let pin;
  try {
    const body = await request.json();
    pin = body.pin;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  
  if (!pin || typeof pin !== "string" || pin.length > 10 || !/^\d+$/.test(pin)) {
    await kv.set(rlKey, attempts + 1, { ex: 600 });
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }
  
  // Get PIN list
  const pins = (await kv.get("user_pins")) || [];
  const match = pins.find(p => p.pin === pin);
  
  if (!match) {
    await kv.set(rlKey, attempts + 1, { ex: 600 });
    const remaining = 4 - attempts;
    return NextResponse.json({ error: "Invalid PIN. " + remaining + " attempts remaining.", remaining }, { status: 401 });
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