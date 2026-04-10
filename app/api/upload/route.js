import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { ADMIN_PASSWORD } from "@/lib/config";

export async function POST(request) {
  const pw = request.headers.get("x-admin-password");
  if (pw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" }, { status: 400 });
  }
  if (file.size > 4.5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Max 4.5MB" }, { status: 400 });
  }
  try {
    const blob = await put("products/" + file.name, file, { access: "public", addRandomSuffix: true });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const pw = request.headers.get("x-admin-password");
  if (pw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }
  try {
    await del(url);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}