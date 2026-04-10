"use client";
import { useState, useEffect } from "react";
import { SITE_TAGLINE, SITE_DESCRIPTION, SITE_NAME, CATEGORIES, SHIPPING_OPTIONS, PAYMENT_METHODS, PRODUCT_FIELDS, fmt, genOrderNum } from "@/lib/config";

function Stars({ rating, label }) {
  if (!rating) return null;
  const n = parseInt(rating);
  return (<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}><span style={{color:"var(--dim)"}}>{label}:</span>{[1,2,3,4,5].map(i=>(<span key={i} style={{color:i<=n?"var(--gold)":"var(--border)"}}>&#9733;</span>))}</div>);
}

export default function StoreFront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("shop");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [shipping, setShipping] = useState("free");
  const [payment, setPayment] = useState("crypto");
  const [copied, setCopied] = useState(false);
  const [address, setAddress] = useState({name:"",street:"",city:"",state:"",zip:""});
  const [addedId, setAddedId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);

  useEffect(() => { fetch("/api/products").then(r=>r.json()).then(data=>{setProducts(data);setLoading(false);}).catch(()=>setLoading(false)); }, []);

  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const shipOption = SHIPPING_OPTIONS.find(o=>o.id===shipping);
  const payOption = PAYMENT_METHODS.find(o=>o.id===payment);
  const feeAmount = subtotal*(payOption.fee/100);
  const total = subtotal+shipOption.price+feeAmount;

  const addToCart = (product) => { setCart(prev=>{const e=prev.find(i=>i.id===product.id);if(e)return prev.map(i=>i.id===product.id?{...i,qty:i.qty+1}:i);return[...prev,{...product,qty:1}];}); setAddedId(product.id); setTimeout(()=>setAddedId(null),1200); };
  const updateQty = (id,delta) => setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+delta)}:i));
  const removeFromCart = (id) => setCart(prev=>prev.filter(i=>i.id!==id));
  const isVideo = (url) => url && url.match(/\.(mp4|mov|webm)$/i);

  const filtered = products.filter(p => { if(!p.name)return false; const matchCat=category==="All"||p.category===category; const matchSearch=p.name.toLowerCase().includes(search.toLowerCase()); return matchCat&&matchSearch; });

  const generateOrderText = () => {
    const items = cart.map(item=>`${item.qty}-${item.name} (${payOption.label}) [SKU: ${item.sku}] [${fmt(item.price)}]=${fmt(item.price*item.qty)}`).join("\n");
    const addr = `${address.name}\n${address.street}\n${address.city}, ${address.state} ${address.zip}`;
    return `ORDER REQUEST\n\nITEMS:\n${items}\n\nORDER SUMMARY\n-------------\nTotal Items: ${cartCount}\nSubtotal: ${fmt(subtotal)}\nShipping (${shipOption.label}): ${fmt(shipOption.price)}\n${payOption.label.toUpperCase()} Fee ${payOption.fee}% = ${fmt(feeAmount)}\nTotal due = ${fmt(total)}\n${shipping==="free"?"FREE SHIPPING ORDER SELECTED":""+shipOption.label.toUpperCase()+" SELECTED"}\nSHIPPING ADDRESS:\n${addr}\nOrder Number: ${genOrderNum()}`;
  };
  const copyOrder = async () => { try{await navigator.clipboard.writeText(generateOrderText());}catch{const t=document.createElement("textarea");t.value=generateOrderText();document.body.appendChild(t);t.select();document.execCommand("copy");document.body.removeChild(t);} setCopied(true);setTimeout(()=>setCopied(false),3000); };

  const is = {padding:"12px 16px",borderRadius:10,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",fontSize:14,outline:"none",width:"100%"};

  return (
    <div>
      {/* FULLSCREEN MEDIA VIEWER */}
      {fullscreenMedia&&(<div onClick={()=>setFullscreenMedia(null)} style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.95)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out",padding:10}}>
        <button onClick={()=>setFullscreenMedia(null)} style={{position:"absolute",top:20,right:20,background:"rgba(255,255,255,.2)",border:"none",color:"#fff",fontSize:24,width:44,height:44,borderRadius:"50%",cursor:"pointer",zIndex:301}}>X</button>
        {isVideo(fullscreenMedia)?<video src={fullscreenMedia} controls autoPlay style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}}/>:<img src={fullscreenMedia} alt="" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}}/>}
      </div>)}

      {/* HEADER */}
      <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(10,10,15,.88)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)",padding:"0 24px"}}>
        <div style={{maxWidth:1280,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>{setPage("shop");setSelectedProduct(null);}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,var(--accent),#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",boxShadow:"0 4px 16px var(--accent-glow)"}}>A</div>
            <span style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:20}}>Astro<span style={{color:"var(--accent)"}}>Packs</span></span>
          </div>
          <nav style={{display:"flex",alignItems:"center",gap:8}}>
            {["shop","cart"].map(p=>(<button key={p} onClick={()=>{setPage(p);setSelectedProduct(null);}} style={{background:page===p?"var(--card)":"transparent",border:page===p?"1px solid var(--border)":"1px solid transparent",color:page===p?"var(--text)":"var(--muted)",padding:"7px 18px",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:500}}>{p==="cart"?`Cart (${cartCount})`:"Shop"}</button>))}
          </nav>
          <button onClick={()=>setPage("cart")} style={{background:"transparent",border:"none",color:"var(--text)",cursor:"pointer",padding:6,position:"relative"}}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {cartCount>0&&<span style={{position:"absolute",top:-2,right:-6,background:"var(--red)",color:"#fff",fontSize:11,fontWeight:700,borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center"}}>{cartCount}</span>}
          </button>
        </div>
      </header>

      <main style={{maxWidth:1280,margin:"0 auto",padding:"24px 24px 80px"}}>
        {loading&&<div style={{textAlign:"center",padding:80,color:"var(--muted)"}}><p>Loading products...</p></div>}

        {/* PRODUCT DETAIL MODAL - VERTICAL FORMAT */}
        {selectedProduct&&(<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:10}} onClick={()=>setSelectedProduct(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"var(--card)",borderRadius:16,border:"1px solid var(--border)",maxWidth:360,width:"100%",maxHeight:"90vh",overflow:"auto"}}>
            {/* VERTICAL IMAGE - tap to view full resolution */}
            {selectedProduct.image&&<div style={{position:"relative",cursor:"pointer"}} onClick={()=>setFullscreenMedia(selectedProduct.image)}>
              {isVideo(selectedProduct.image)?<video src={selectedProduct.image} controls style={{width:"100%",aspectRatio:"1/1",objectFit:"cover",borderRadius:"16px 16px 0 0"}}/>
              :<img src={selectedProduct.image} alt={selectedProduct.name} style={{width:"100%",aspectRatio:"1/1",objectFit:"cover",borderRadius:"16px 16px 0 0"}}/>}
              <div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,.5)",color:"#fff",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600}}>Tap to view full size</div>
            </div>}
            {!selectedProduct.image&&<div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--surface)",borderRadius:"20px 20px 0 0",color:"var(--dim)"}}>No image</div>}
            
            <div style={{padding:16}}>
              <p style={{fontSize:11,color:"var(--dim)",fontWeight:600,letterSpacing:".08em"}}>SKU: {selectedProduct.sku} - {selectedProduct.category}</p>
              <h2 style={{fontSize:17,fontWeight:700,marginTop:3,marginBottom:6}}>{selectedProduct.name}</h2>
              <span style={{fontFamily:"'Outfit'",fontSize:22,fontWeight:800,color:"var(--accent)"}}>{fmt(selectedProduct.price)}</span>
              
              {selectedProduct.description&&<p style={{color:"var(--muted)",fontSize:14,lineHeight:1.6,marginTop:12,marginBottom:12}}>{selectedProduct.description}</p>}
              
              <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:12,marginBottom:16}}>
                <Stars rating={selectedProduct.smellRating} label="Smell"/>
                <Stars rating={selectedProduct.tasteRating} label="Taste"/>
                {selectedProduct.potency&&<span style={{fontSize:11,color:"var(--dim)"}}>Potency: <strong style={{color:"var(--text)"}}>{selectedProduct.potency}</strong></span>}
                {selectedProduct.strain&&<span style={{fontSize:11,color:"var(--dim)"}}>Strain: <strong style={{color:"var(--text)"}}>{selectedProduct.strain}</strong></span>}
                {selectedProduct.weight&&<span style={{fontSize:11,color:"var(--dim)"}}>Weight: <strong style={{color:"var(--text)"}}>{selectedProduct.weight}</strong></span>}
              </div>
              
              <div style={{display:"flex",gap:12}}>
                <button onClick={()=>{addToCart(selectedProduct);setSelectedProduct(null);}} style={{flex:1,padding:"12px 20px",borderRadius:10,border:"none",background:"linear-gradient(135deg,var(--accent),#8b5cf6)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>Add to Cart</button>
                <button onClick={()=>setSelectedProduct(null)} style={{padding:"12px 16px",borderRadius:10,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",fontSize:14,cursor:"pointer"}}>Close</button>
              </div>
            </div>
          </div>
        </div>)}

        {/* SHOP PAGE */}
        {page==="shop"&&!loading&&<>
          <div style={{textAlign:"center",padding:"40px 20px 32px",background:"radial-gradient(ellipse at 50% 0%,var(--accent-glow) 0%,transparent 70%)",marginBottom:28,borderRadius:20}}>
            <h1 style={{fontFamily:"'Outfit'",fontSize:"clamp(26px,5vw,44px)",fontWeight:800,background:"linear-gradient(135deg,var(--text),var(--accent))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:10}}>{SITE_TAGLINE}</h1>
            <p style={{color:"var(--muted)",fontSize:15,maxWidth:460,margin:"0 auto"}}>{SITE_DESCRIPTION}</p>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:24,alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {CATEGORIES.map(cat=>(<button key={cat} onClick={()=>setCategory(cat)} style={{padding:"8px 16px",borderRadius:10,border:"1px solid "+(category===cat?"var(--accent)":"var(--border)"),background:category===cat?"var(--accent)":"var(--surface)",color:category===cat?"#fff":"var(--muted)",cursor:"pointer",fontSize:13,fontWeight:600}}>{cat}</button>))}
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...is,width:200}}/>
          </div>
          {products.length===0&&<div style={{textAlign:"center",padding:60,color:"var(--muted)"}}><p>No products listed yet.</p></div>}
          
          {/* PRODUCT GRID - VERTICAL CARDS */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
            {filtered.map((product,i)=>{
              const inStock=product.inStock!==false;
              return(<div key={product.id} style={{background:"var(--card)",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden",cursor:"pointer",opacity:inStock?1:0.55,transition:"transform .2s",animation:"fadeUp .4s ease both "+(i*0.06)+"s"}} onClick={()=>setSelectedProduct(product)}>
                <div style={{position:"relative"}}>
                  {product.image?(isVideo(product.image)?<video src={product.image} muted style={{width:"100%",aspectRatio:"3/4",objectFit:"cover"}}/>:<img src={product.image} alt={product.name} style={{width:"100%",aspectRatio:"3/4",objectFit:"cover"}}/>)
                  :<div style={{width:"100%",aspectRatio:"3/4",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,var(--surface),var(--card))",color:"var(--dim)",fontSize:13}}>{product.name}</div>}
                  {product.badge&&<span style={{position:"absolute",top:10,right:10,background:product.badge==="HOT"?"var(--red)":product.badge==="NEW"?"var(--accent)":product.badge==="SALE"?"var(--green)":"var(--gold)",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:6}}>{product.badge}</span>}
                </div>
                <div style={{padding:"14px 16px 16px"}}>
                  <p style={{fontSize:10,color:"var(--dim)",fontWeight:600,letterSpacing:".06em",marginBottom:3}}>SKU: {product.sku}</p>
                  <h3 style={{fontSize:14,fontWeight:600,marginBottom:8,lineHeight:1.3,minHeight:36}}>{product.name}</h3>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontFamily:"'Outfit'",fontSize:20,fontWeight:700,color:"var(--accent)"}}>{fmt(product.price)}</span>
                    <button onClick={e=>{e.stopPropagation();inStock&&addToCart(product);}} style={{padding:"8px 16px",borderRadius:10,border:"none",background:inStock?"linear-gradient(135deg,var(--accent),#8b5cf6)":"var(--border)",color:"#fff",fontSize:12,fontWeight:600,cursor:inStock?"pointer":"default"}}>
                      {!inStock?"Sold Out":addedId===product.id?"Added!":"Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>);
            })}
          </div>
        </>}

        {/* CART PAGE */}
        {page==="cart"&&<div style={{maxWidth:800,margin:"0 auto"}}>
          <button onClick={()=>setPage("shop")} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:14,marginBottom:20}}>Back to Shop</button>
          <h2 style={{fontFamily:"'Outfit'",fontSize:28,fontWeight:700,marginBottom:24}}>Your Cart</h2>
          {cart.length===0?<div style={{textAlign:"center",padding:"60px 20px",background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)"}}><p style={{color:"var(--muted)",fontSize:16,marginBottom:20}}>Your cart is empty</p><button onClick={()=>setPage("shop")} style={{padding:"12px 28px",borderRadius:10,border:"none",background:"var(--accent)",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>Browse Products</button></div>
          :<>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>
              {cart.map((item,i)=>(<div key={item.id} style={{display:"flex",alignItems:"center",gap:14,background:"var(--card)",borderRadius:14,padding:"14px 18px",border:"1px solid var(--border)",flexWrap:"wrap"}}>
                <div style={{width:48,height:48,borderRadius:10,overflow:"hidden",background:"var(--surface)",flexShrink:0}}>
                  {item.image?<img src={item.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:10,color:"var(--dim)"}}>No img</div>}
                </div>
                <div style={{flex:1,minWidth:100}}><p style={{fontSize:14,fontWeight:600,marginBottom:2}}>{item.name}</p><p style={{fontSize:11,color:"var(--dim)"}}>SKU: {item.sku}</p></div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button onClick={()=>updateQty(item.id,-1)} style={{width:30,height:30,borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>-</button>
                  <span style={{fontSize:15,fontWeight:600,minWidth:20,textAlign:"center"}}>{item.qty}</span>
                  <button onClick={()=>updateQty(item.id,1)} style={{width:30,height:30,borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                </div>
                <span style={{fontFamily:"'Outfit'",fontWeight:700,fontSize:16,minWidth:80,textAlign:"right"}}>{fmt(item.price*item.qty)}</span>
                <button onClick={()=>removeFromCart(item.id)} style={{background:"transparent",border:"none",color:"var(--dim)",cursor:"pointer",padding:4,fontSize:16}}>X</button>
              </div>))}
            </div>
            <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
              <h3 style={{fontSize:14,fontWeight:600,marginBottom:14,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".04em"}}>Shipping Method</h3>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {SHIPPING_OPTIONS.map(opt=>(<label key={opt.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:"1px solid "+(shipping===opt.id?"var(--accent)":"var(--border)"),background:shipping===opt.id?"rgba(108,92,231,.08)":"transparent",cursor:"pointer"}}>
                  <input type="radio" name="shipping" value={opt.id} checked={shipping===opt.id} onChange={()=>setShipping(opt.id)} style={{accentColor:"var(--accent)"}}/>
                  <span style={{flex:1,fontSize:14,fontWeight:500}}>{opt.label}</span>
                  <span style={{fontSize:14,fontWeight:600,color:opt.price===0?"var(--green)":"var(--text)"}}>{opt.price===0?"FREE":fmt(opt.price)}</span>
                </label>))}
              </div>
            </div>
            <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
              <h3 style={{fontSize:14,fontWeight:600,marginBottom:14,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".04em"}}>Payment Method</h3>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {PAYMENT_METHODS.map(opt=>(<button key={opt.id} onClick={()=>setPayment(opt.id)} style={{padding:"10px 22px",borderRadius:10,border:"1px solid "+(payment===opt.id?"var(--accent)":"var(--border)"),background:payment===opt.id?"rgba(108,92,231,.12)":"var(--surface)",color:payment===opt.id?"var(--accent)":"var(--muted)",cursor:"pointer",fontSize:13,fontWeight:600}}>{opt.label}{opt.fee>0&&" ("+opt.fee+"%)"}</button>))}
              </div>
            </div>
            <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
              <h3 style={{fontSize:14,fontWeight:600,marginBottom:14,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".04em"}}>Shipping Address</h3>
              <div style={{display:"grid",gap:10}}>
                <input value={address.name} onChange={e=>setAddress(p=>({...p,name:e.target.value}))} placeholder="Full Name" style={is}/>
                <input value={address.street} onChange={e=>setAddress(p=>({...p,street:e.target.value}))} placeholder="Street Address" style={is}/>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10}}>
                  <input value={address.city} onChange={e=>setAddress(p=>({...p,city:e.target.value}))} placeholder="City" style={is}/>
                  <input value={address.state} onChange={e=>setAddress(p=>({...p,state:e.target.value}))} placeholder="State" style={is}/>
                  <input value={address.zip} onChange={e=>setAddress(p=>({...p,zip:e.target.value}))} placeholder="ZIP" style={is}/>
                </div>
              </div>
            </div>
            <div style={{background:"var(--card)",borderRadius:14,padding:24,border:"1px solid var(--border)",marginBottom:20}}>
              <h3 style={{fontSize:14,fontWeight:600,marginBottom:16,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".04em"}}>Order Summary</h3>
              {[{label:"Subtotal",value:fmt(subtotal)},{label:"Shipping ("+shipOption.label+")",value:shipOption.price===0?"FREE":fmt(shipOption.price),color:shipOption.price===0?"var(--green)":null},{label:payOption.label+" Fee ("+payOption.fee+"%)",value:fmt(feeAmount)}].map((row,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:14,color:"var(--muted)"}}><span>{row.label}</span><span style={{fontWeight:500,color:row.color||"var(--text)"}}>{row.value}</span></div>))}
              <div style={{borderTop:"1px solid var(--border)",paddingTop:14,marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:16,fontWeight:700}}>Total Due</span>
                <span style={{fontFamily:"'Outfit'",fontSize:26,fontWeight:800,color:"var(--accent)"}}>{fmt(total)}</span>
              </div>
            </div>
            <button onClick={copyOrder} style={{width:"100%",padding:"16px 24px",borderRadius:14,border:"none",background:copied?"linear-gradient(135deg,var(--green),#16a34a)":"linear-gradient(135deg,var(--accent),#8b5cf6)",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"all .3s"}}>
              {copied?"Order Copied to Clipboard!":"Copy Order Details"}
            </button>
            {copied&&<p style={{textAlign:"center",marginTop:12,fontSize:13,color:"var(--green)"}}>Paste into Telegram or Signal to submit your order</p>}
            <details style={{marginTop:20}}><summary style={{cursor:"pointer",fontSize:13,color:"var(--dim)",padding:"8px 0"}}>Preview order text</summary><pre style={{background:"var(--surface)",padding:16,borderRadius:12,border:"1px solid var(--border)",fontSize:12,color:"var(--muted)",whiteSpace:"pre-wrap",marginTop:8,lineHeight:1.6}}>{generateOrderText()}</pre></details>
          </>}
        </div>}
      </main>
      <footer style={{borderTop:"1px solid var(--border)",padding:24,textAlign:"center",fontSize:12,color:"var(--dim)"}}>&#169; {new Date().getFullYear()} {SITE_NAME} - All rights reserved</footer>
    </div>
  );
}