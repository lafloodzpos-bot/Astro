"use client";

import { useState, useEffect, useRef } from "react";
import { CATEGORIES, PRODUCT_FIELDS, ADMIN_PASSWORD, fmt } from "@/lib/config";

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef(null);

  const headers = { "x-admin-password": password, "Content-Type": "application/json" };
  const flash = (text, type = "success") => { setMessage({ text, type }); setTimeout(() => setMessage(null), 3000); };

  const loadProducts = async () => {
    setLoading(true);
    try { const res = await fetch("/api/products"); const data = await res.json(); setProducts(data); } catch (err) { flash("Failed to load products", "error"); }
    setLoading(false);
  };

  const login = async () => {
    try {
      const res = await fetch("/api/products", { method: "POST", headers: { "x-admin-password": password, "Content-Type": "application/json" }, body: JSON.stringify({ _test: true }) });
      if (res.status === 401) { flash("Wrong password", "error"); return; }
      setAuthed(true); loadProducts();
    } catch { setAuthed(true); loadProducts(); }
  };

  const startNew = () => {
    setEditing("new");
    setForm({ name: "", sku: "QP" + Math.floor(10000 + Math.random() * 90000), price: "", category: CATEGORIES[1] || "Exotic", image: "", inStock: true, description: "", smellRating: "", tasteRating: "", potency: "", strain: "", weight: "", badge: "" });
  };

  const startEdit = (product) => { setEditing(product.id); setForm({ ...product }); };

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData(); formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", headers: { "x-admin-password": password }, body: formData });
      if (!res.ok) { const err = await res.json(); flash(err.error || "Upload failed", "error"); setUploading(false); return; }
      const data = await res.json(); setForm((prev) => ({ ...prev, image: data.url })); flash("Image uploaded!");
    } catch (err) { flash("Upload failed", "error"); }
    setUploading(false);
  };
  const saveProduct = async () => {
    if (!form.name || !form.price) { flash("Name and price are required", "error"); return; }
    const productData = { ...form, price: parseFloat(form.price), inStock: form.inStock !== false };
    try {
      if (editing === "new") {
        const res = await fetch("/api/products", { method: "POST", headers, body: JSON.stringify(productData) });
        if (res.ok) { flash("Product created!"); } else { flash("Failed to create product", "error"); return; }
      } else {
        const res = await fetch("/api/products", { method: "PUT", headers, body: JSON.stringify({ id: editing, ...productData }) });
        if (res.ok) { flash("Product updated!"); } else { flash("Failed to update product", "error"); return; }
      }
      setEditing(null); loadProducts();
    } catch { flash("Save failed", "error"); }
  };

  const deleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE", headers });
      if (res.ok) { flash("Product deleted!"); loadProducts(); }
    } catch { flash("Delete failed", "error"); }
  };

  const inputStyle = { padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 14, outline: "none", width: "100%" };
  const btnStyle = (color = "var(--accent)") => ({ padding: "10px 20px", borderRadius: 10, border: "none", background: color, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" });

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)", padding: 40, maxWidth: 400, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, var(--accent), #8b5cf6)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 16 }}>A</div>
            <h1 style={{ fontFamily: "'Outfit'", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Admin Panel</h1>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>Enter your admin password to manage products</p>
          </div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} placeholder="Admin password" style={{ ...inputStyle, marginBottom: 16, padding: "14px 18px", fontSize: 16 }} autoFocus />
          <button onClick={login} style={{ ...btnStyle(), width: "100%", padding: "14px", fontSize: 16 }}>ð Login</button>
          {message && (<p style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: message.type === "error" ? "var(--red)" : "var(--green)" }}>{message.text}</p>)}
        </div>
      </div>
    );
  }
  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ background: "rgba(10,10,15,.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--accent), #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff" }}>A</div>
            <span style={{ fontFamily: "'Outfit'", fontWeight: 700, fontSize: 18 }}>Admin Panel</span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="/" style={{ fontSize: 13, color: "var(--muted)" }}>â View Store</a>
            <button onClick={() => { setAuthed(false); setPassword(""); }} style={{ ...btnStyle("var(--surface)"), border: "1px solid var(--border)", color: "var(--muted)" }}>Logout</button>
          </div>
        </div>
      </header>

      {message && (<div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: message.type === "error" ? "var(--red)" : "var(--green)", color: "#fff", padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,.3)", animation: "fadeUp .3s ease" }}>{message.text}</div>)}

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 80px" }}>
        {!editing && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Outfit'", fontSize: 24, fontWeight: 700 }}>Products ({products.length})</h2>
              <button onClick={startNew} style={btnStyle()}>+ Add New Product</button>
            </div>
            {loading && <p style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>Loading...</p>}
            {!loading && products.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 48, marginBottom: 16 }}>ð¦</p>
                <p style={{ color: "var(--muted)", fontSize: 16, marginBottom: 20 }}>No products yet</p>
                <button onClick={startNew} style={btnStyle()}>Add Your First Product</button>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {products.map((product) => (
                <div key={product.id} style={{ display: "flex", alignItems: "center", gap: 16, background: "var(--card)", borderRadius: 14, padding: "14px 20px", border: "1px solid var(--border)", flexWrap: "wrap" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", background: "var(--surface)", flexShrink: 0 }}>
                    {product.image ? (<img src={product.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />) : (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 24 }}>ð¦</div>)}
                  </div>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <p style={{ fontSize: 15, fontWeight: 600 }}>{product.name}</p>
                    <p style={{ fontSize: 11, color: "var(--dim)" }}>SKU: {product.sku} Â· {product.category}{product.inStock === false && <span style={{ color: "var(--red)", marginLeft: 8 }}>â Out of Stock</span>}</p>
                  </div>
                  <span style={{ fontFamily: "'Outfit'", fontWeight: 700, fontSize: 18, color: "var(--accent)", minWidth: 100, textAlign: "right" }}>{fmt(product.price)}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => startEdit(product)} style={{ ...btnStyle("var(--surface)"), border: "1px solid var(--border)", color: "var(--accent)", fontSize: 12 }}>Edit</button>
                    <button onClick={() => deleteProduct(product.id)} style={{ ...btnStyle("transparent"), border: "1px solid var(--border)", color: "var(--red)", fontSize: 12 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {editing && (
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <button onClick={() => setEditing(null)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, marginBottom: 20 }}>â Back to Products</button>
            <h2 style={{ fontFamily: "'Outfit'", fontSize: 24, fontWeight: 700, marginBottom: 24 }}>{editing === "new" ? "Add New Product" : "Edit Product"}</h2>
            <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>Product Image</label>
                {form.image && (<div style={{ marginBottom: 12, borderRadius: 12, overflow: "hidden", maxHeight: 250 }}><img src={form.image} alt="Preview" style={{ width: "100%", maxHeight: 250, objectFit: "cover" }} /></div>)}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => e.target.files[0] && uploadImage(e.target.files[0])} style={{ display: "none" }} />
                  <button onClick={() => fileRef.current.click()} disabled={uploading} style={{ ...btnStyle("var(--surface)"), border: "1px solid var(--border)", color: "var(--accent)" }}>{uploading ? "Uploading..." : "ð· Upload Image"}</button>
                  <span style={{ fontSize: 12, color: "var(--dim)" }}>or paste URL:</span>
                  <input value={form.image || ""} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} placeholder="https://..." style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
                </div>
              </div>

              <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Product Name *</label>
                  <input value={form.name || ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. LIMON CHERRY W/BAGS" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>SKU</label>
                    <input value={form.sku || ""} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Price *</label>
                    <input type="number" step="0.01" value={form.price || ""} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="0.00" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Category</label>
                    <select value={form.category || ""} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} style={inputStyle}>
                      {CATEGORIES.filter((c) => c !== "All").map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.inStock !== false} onChange={(e) => setForm((p) => ({ ...p, inStock: e.target.checked }))} style={{ accentColor: "var(--accent)", width: 18, height: 18 }} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>In Stock</span>
                  </label>
                </div>
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", marginBottom: 16, textTransform: "uppercase", letterSpacing: ".04em", borderTop: "1px solid var(--border)", paddingTop: 20 }}>Product Details</h3>
              <div style={{ display: "grid", gap: 16 }}>
                {PRODUCT_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea value={form[field.key] || ""} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))} rows={3} placeholder={`Enter ${field.label.toLowerCase()}...`} style={{ ...inputStyle, resize: "vertical" }} />
                    ) : field.type === "select" ? (
                      <select value={form[field.key] || ""} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))} style={inputStyle}>
                        <option value="">-- Select --</option>
                        {field.options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                      </select>
                    ) : (
                      <input value={form[field.key] || ""} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))} placeholder={`Enter ${field.label.toLowerCase()}`} style={inputStyle} />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                <button onClick={saveProduct} style={{ ...btnStyle(), flex: 1, padding: "14px", fontSize: 15 }}>{editing === "new" ? "â Create Product" : "â Save Changes"}</button>
                <button onClick={() => setEditing(null)} style={{ ...btnStyle("var(--surface)"), border: "1px solid var(--border)", color: "var(--muted)", padding: "14px 24px" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
