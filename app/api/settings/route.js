import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { ADMIN_PASSWORD } from "@/lib/config";

function checkAdmin(request) {
  return request.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

export async function GET(request) {
  if (!checkAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pins = (await kv.get("user_pins")) || [];
  const logs = (await kv.get("access_logs")) || [];
  const enabled = await kv.get("site_enabled");
  return NextResponse.json({ pins, logs, siteEnabled: enabled !== false });
}

export async function POST(request) {
  if (!checkAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  
  if (body.action === "set_pins") {
    await kv.set("user_pins", body.pins);
    return NextResponse.json({ success: true });
  }
  
  if (body.action === "toggle_site") {
    const current = await kv.get("site_enabled");
    const newVal = current === false ? true : false;
    await kv.set("site_enabled", newVal);
    return NextResponse.json({ siteEnabled: newVal });
  }
  
  if (body.action === "clear_logs") {
    await kv.set("access_logs", []);
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}