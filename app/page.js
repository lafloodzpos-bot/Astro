"use client";

import { useState, useEffect } from "react";
import {
  SITE_TAGLINE, SITE_DESCRIPTION, SITE_NAME,
  CATEGORIES, SHIPPING_OPTIONS, PAYMENT_METHODS,
  PRODUCT_FIELDS, fmt, genOrderNum,
} from "@/lib/config";

// ─── ProductImage ───────────────────────────────────────────
function ProductImage({ src, name, height = 200 }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--surface), var(--card))", fontSize: 14, color: "var(--dim)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📦</div>
          <div style={{ padding: "0 12px" }}>{name}</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ height, overflow: "hidden", background: "linear-gradient(135deg, var(--surface), var(--card))" }}>
      <img src={src} alt={name} onError={() => setFailed(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s" }}
        onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
        onMouseOut={(e) => (e.target.style.transform = "scale(1)")} />
    </div>
  );
}