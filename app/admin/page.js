"use client";
import { useState, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { CATEGORIES, PRODUCT_FIELDS, ADMIN_PASSWORD, fmt } from "@/lib/config";

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [message, setMessage] = useState(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const flash = (text, type = "success") => { setMessage({ text, type }); setTimeout(() => setMessage(null), 3000); };
  const loadProducts = async () => { setLoading(true); try { const res = await fetch("/api/products"); setProducts(await res.json()); } catch { flash("Failed to load", "error"); } setLoading(false); };
  const login = () => { if (password === ADMIN_PASSWORD) { setAuthed(true); loadProducts(); } else { flash("Wrong password", "error"); } };
  const startNew = () => { setEditing("new"); setForm({ name:"", sku:"QP"+Math.floor(10000+Math.random()*90000), price:"", category:CATEGORIES[1]||"Highs", image:"", video:"", inStock:true, description:"", smellRating:"", tasteRating:"", potency:"", strain:"", weight:"", badge:"", dateAdded: new Date().toLocaleDateString("en-US"), dateUpdated: "" }); };
  const startEdit = (p) => { setEditing(p.id); setForm({...p}); };
  
  const uploadFile = async (file, field, setUploading) => {
    setUploading(true);
    try {
      const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/upload" });
      setForm(p => ({...p, [field]: blob.url}));
      flash((field === "image" ? "Photo" : "Video") + " uploaded! (" + (file.size/1024/1024).toFixed(1) + "MB)");
    } catch (err) { flash("Upload failed: " + (err.message || "Unknown error"), "error"); }
    setUploading(false);
  };

  const saveProduct = async () => {
    if (!form.name||!form.price) { flash("Name and price required","error"); return; }
    const pd = {...form, price:parseFloat(form.price), inStock:form.inStock!==false};
    try {
      const h = {"x-admin-password":password,"Content-Type":"application/json"};
      if (editing==="new") { await fetch("/api/products",{method:"POST",headers:h,body:JSON.stringify(pd)}); flash("Product created!"); }
      else { await fetch("/api/products",{method:"PUT",headers:h,body:JSON.stringify({id:editing,...pd})}); flash("Product updated!"); }
      setEditing(null); loadProducts();
    } catch { flash("Save failed","error"); }
  };
  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    try { await fetch("/api/products?id="+id,{method:"DELETE",headers:{"x-admin-password":password,"Content-Type":"application/json"}}); flash("Deleted!"); loadProducts(); } catch { flash("Delete failed","error"); }
  };
  const is = {padding:"10px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",fontSize:14,outline:"none",width:"100%"};
  const bs = (c="var(--accent)") => ({padding:"10px 20px",borderRadius:10,border:"none",background:c,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"});

  if (!authed) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"var(--card)",borderRadius:20,border:"1px solid var(--border)",padding:40,maxWidth:400,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,var(--accent),#8b5cf6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#fff",marginBottom:16}}>A</div>
          <h1 style={{fontFamily:"'Outfit'",fontSize:24,fontWeight:700,marginBottom:8}}>Admin Panel</h1>
          <p style={{color:"var(--muted)",fontSize:14}}>Enter your admin password</p>
        </div>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Admin password" style={{...is,marginBottom:16,padding:"14px 18px",fontSize:16}} autoFocus />
        <button onClick={login} style={{...bs(),width:"100%",padding:"14px",fontSize:16}}>Login</button>
        {message&&<p style={{marginTop:12,textAlign:"center",fontSize:13,color:message.type==="error"?"var(--red)":"var(--green)"}}>{message.text}</p>}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh"}}>
      <header style={{background:"rgba(10,10,15,.88)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)",padding:"0 24px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,var(--accent),#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff"}}>A</div><span style={{fontFamily:"'Outfit'",fontWeight:700,fontSize:18}}>Admin Panel</span></div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}><a href="/" style={{fontSize:13,color:"var(--muted)"}}>View Store</a><button onClick={()=>{setAuthed(false);setPassword("");}} style={{...bs("var(--surface)"),border:"1px solid var(--border)",color:"var(--muted)"}}>Logout</button></div>
        </div>
      </header>
      {message&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:200,background:message.type==="error"?"var(--red)":"var(--green)",color:"#fff",padding:"10px 24px",borderRadius:10,fontSize:14,fontWeight:600}}>{message.text}</div>}
      <main style={{maxWidth:1100,margin:"0 auto",padding:"24px 24px 80px"}}>
        {!editing&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <h2 style={{fontFamily:"'Outfit'",fontSize:24,fontWeight:700}}>Products ({products.length})</h2>
            <button onClick={startNew} style={bs()}>+ Add New Product</button>
          </div>
          {loading&&<p style={{color:"var(--muted)",textAlign:"center",padding:40}}>Loading...</p>}
          {!loading&&products.length===0&&<div style={{textAlign:"center",padding:"60px 20px",background:"var(--card)",borderRadius:16,border:"1px solid var(--border)"}}><p style={{fontSize:18,marginBottom:16,color:"var(--muted)"}}>No products yet</p><button onClick={startNew} style={bs()}>Add Your First Product</button></div>}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {products.filter(p=>p.name).map(product=>(
              <div key={product.id} style={{display:"flex",alignItems:"center",gap:16,background:"var(--card)",borderRadius:14,padding:"14px 20px",border:"1px solid var(--border)",flexWrap:"wrap"}}>
                <div style={{width:56,height:56,borderRadius:10,overflow:"hidden",background:"var(--surface)",flexShrink:0}}>
                  {product.image?<img src={product.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:12,color:"var(--dim)"}}>No img</div>}
                </div>
                <div style={{flex:1,minWidth:150}}>
                  <p style={{fontSize:15,fontWeight:600}}>{product.name}</p>
                  <p style={{fontSize:11,color:"var(--dim)"}}>SKU: {product.sku} - {product.category} {product.video?" | Has video":""}{product.inStock===false&&<span style={{color:"var(--red)",marginLeft:8}}>Out of Stock</span>}</p>
                </div>
                <span style={{fontFamily:"'Outfit'",fontWeight:700,fontSize:18,color:"var(--accent)",minWidth:100,textAlign:"right"}}>{fmt(product.price||0)}</span>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>startEdit(product)} style={{...bs("var(--surface)"),border:"1px solid var(--border)",color:"var(--accent)",fontSize:12}}>Edit</button>
                  <button onClick={()=>deleteProduct(product.id)} style={{...bs("transparent"),border:"1px solid var(--border)",color:"var(--red)",fontSize:12}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>}
        {editing&&<div style={{maxWidth:700,margin:"0 auto"}}>
          <button onClick={()=>setEditing(null)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:14,marginBottom:20}}>Back to Products</button>
          <h2 style={{fontFamily:"'Outfit'",fontSize:24,fontWeight:700,marginBottom:24}}>{editing==="new"?"Add New Product":"Edit Product"}</h2>
          <div style={{background:"var(--card)",borderRadius:16,border:"1px solid var(--border)",padding:24}}>
            
            {/* PRODUCT IMAGE BOX */}
            <div style={{marginBottom:20}}>
              <label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:8,textTransform:"uppercase"}}>Product Image</label>
              <div style={{border:"2px dashed var(--border)",borderRadius:12,padding:16,textAlign:"center",background:"var(--surface)"}}>
                {form.image&&<div style={{marginBottom:12,borderRadius:8,overflow:"hidden"}}><img src={form.image} alt="Preview" style={{width:"100%",maxHeight:200,objectFit:"cover"}}/></div>}
                <input type="file" ref={imageRef} accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>e.target.files[0]&&uploadFile(e.target.files[0],"image",setUploadingImage)} style={{display:"none"}}/>
                <button onClick={()=>imageRef.current.click()} disabled={uploadingImage} style={{...bs("var(--accent)"),opacity:uploadingImage?0.6:1}}>{uploadingImage?"Uploading Photo...":form.image?"Replace Photo":"Upload Photo"}</button>
                <p style={{fontSize:11,color:"var(--dim)",marginTop:8}}>JPG, PNG, WebP, GIF accepted</p>
                {form.image&&<button onClick={()=>setForm(p=>({...p,image:""}))} style={{background:"none",border:"none",color:"var(--red)",fontSize:12,cursor:"pointer",marginTop:4}}>Remove photo</button>}
              </div>
            </div>
            
            {/* PRODUCT VIDEO BOX */}
            <div style={{marginBottom:24}}>
              <label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:8,textTransform:"uppercase"}}>Product Video</label>
              <div style={{border:"2px dashed var(--border)",borderRadius:12,padding:16,textAlign:"center",background:"var(--surface)"}}>
                {form.video&&<div style={{marginBottom:12,borderRadius:8,overflow:"hidden"}}><video src={form.video} controls style={{width:"100%",maxHeight:200}}/></div>}
                <input type="file" ref={videoRef} accept="video/mp4,video/quicktime,video/webm,video/mov" onChange={e=>e.target.files[0]&&uploadFile(e.target.files[0],"video",setUploadingVideo)} style={{display:"none"}}/>
                <button onClick={()=>videoRef.current.click()} disabled={uploadingVideo} style={{...bs("#8b5cf6"),opacity:uploadingVideo?0.6:1}}>{uploadingVideo?"Uploading Video...":form.video?"Replace Video":"Upload Video"}</button>
                <p style={{fontSize:11,color:"var(--dim)",marginTop:8}}>MP4, MOV, WebM accepted. Max 100MB.</p>
                {form.video&&<button onClick={()=>setForm(p=>({...p,video:""}))} style={{background:"none",border:"none",color:"var(--red)",fontSize:12,cursor:"pointer",marginTop:4}}>Remove video</button>}
              </div>
            </div>

            <div style={{display:"grid",gap:16,marginBottom:24}}>
              <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>Product Name *</label><input value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. LIMON CHERRY W/BAGS" style={is}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>SKU</label><input value={form.sku||""} onChange={e=>setForm(p=>({...p,sku:e.target.value}))} style={is}/></div>
                <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>Price *</label><input type="number" step="0.01" value={form.price||""} onChange={e=>setForm(p=>({...p,price:e.target.value}))} placeholder="0.00" style={is}/></div>
                <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>Category</label><select value={form.category||""} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={is}>{CATEGORIES.filter(c=>c!=="All").map(cat=><option key={cat} value={cat}>{cat}</option>)}</select></div>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}><input type="checkbox" checked={form.inStock!==false} onChange={e=>setForm(p=>({...p,inStock:e.target.checked}))} style={{accentColor:"var(--accent)",width:18,height:18}}/><span style={{fontSize:14,fontWeight:500}}>In Stock</span></label>
            </div>
            <h3 style={{fontSize:14,fontWeight:600,color:"var(--muted)",marginBottom:16,textTransform:"uppercase",borderTop:"1px solid var(--border)",paddingTop:20}}>Product Details</h3>
            <div style={{display:"grid",gap:16}}>
              {PRODUCT_FIELDS.map(field=><div key={field.key}>
                <label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>{field.label}</label>
                {field.type==="textarea"?<textarea value={form[field.key]||""} onChange={e=>setForm(p=>({...p,[field.key]:e.target.value}))} rows={3} style={{...is,resize:"vertical"}}/>
                :field.type==="select"?<select value={form[field.key]||""} onChange={e=>setForm(p=>({...p,[field.key]:e.target.value}))} style={is}><option value="">-- Select --</option>{field.options.map(o=><option key={o} value={o}>{o}</option>)}</select>
                :<input value={form[field.key]||""} onChange={e=>setForm(p=>({...p,[field.key]:e.target.value}))} style={is}/>}
              </div>)}
            </div>
            <div style={{display:"flex",gap:12,marginTop:24,paddingTop:20,borderTop:"1px solid var(--border)"}}>
              <button onClick={saveProduct} style={{...bs(),flex:1,padding:"14px",fontSize:15}}>{editing==="new"?"Create Product":"Save Changes"}</button>
              <button onClick={()=>setEditing(null)} style={{...bs("var(--surface)"),border:"1px solid var(--border)",color:"var(--muted)",padding:"14px 24px"}}>Cancel</button>
            </div>
          </div>
        </div>}
      </main>
    </div>
  );
}