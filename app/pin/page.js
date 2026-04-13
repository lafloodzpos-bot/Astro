"use client";
import { useState, useEffect } from "react";

export default function PinWall() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    fetch("/api/pin").then(r=>r.json()).then(d=>{
      if (d.authed) { window.location.href="/shop"; }
      else if (!d.enabled) { setDisabled(true); }
      setChecking(false);
    }).catch(()=>setChecking(false));
  }, []);

  const submit = async (fullPin) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/pin", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({pin:fullPin}) });
      const data = await res.json();
      if (data.success) { window.location.href="/shop"; }
      else if (data.blocked) { setBlocked(true); setError(data.error); setShake(true); setTimeout(()=>setShake(false),600); }
      else { setError(data.error || "Invalid PIN"); setShake(true); setTimeout(()=>{setShake(false);setPin("");},600); }
    } catch { setError("Connection error"); setShake(true); setTimeout(()=>setShake(false),600); }
    setLoading(false);
  };

  const press = (num) => {
    if (blocked || loading) return;
    const next = pin + num;
    setPin(next);
    setError("");
  };

  const backspace = () => { if(!loading&&!blocked) setPin(p=>p.slice(0,-1)); };
  const clear = () => { if(!loading&&!blocked) setPin(""); };

  if (checking) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0a0f"}}><p style={{color:"#666"}}>Loading...</p></div>;
  if (disabled) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0a0f",padding:24}}>
      <div style={{textAlign:"center"}}><h1 style={{fontFamily:"'Outfit',sans-serif",fontSize:28,fontWeight:700,color:"#fff",marginBottom:12}}>AP Private</h1><p style={{color:"#666",fontSize:16}}>This site is currently unavailable.</p></div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#0a0a0f",padding:24,userSelect:"none",WebkitUserSelect:"none"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#6c5ce7,#8b5cf6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:800,color:"#fff",marginBottom:16}}>A</div>
        <h1 style={{fontFamily:"'Outfit',sans-serif",fontSize:26,fontWeight:700,color:"#fff",marginBottom:8}}>AP Private</h1>
        <p style={{color:"#666",fontSize:14}}>Please type pin to access</p>
      </div>

      {/* PIN dots */}
      <div style={{display:"flex",gap:14,marginBottom:12,animation:shake?"shake 0.5s ease":"none"}}>
        {[0,1,2,3,4,5].map(i=>(<div key={i} style={{width:14,height:14,borderRadius:"50%",border:"2px solid "+(i<pin.length?"#6c5ce7":"#333"),background:i<pin.length?"#6c5ce7":"transparent",transition:"all 0.15s"}}/>))}
      </div>
      <div style={{height:24,marginBottom:20}}>
        {error&&<p style={{color:"#ef4444",fontSize:13,textAlign:"center"}}>{error}</p>}
      </div>

      {/* KEYPAD */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,80px)",gap:12,marginBottom:16}}>
        {[1,2,3,4,5,6,7,8,9].map(n=>(<button key={n} onClick={()=>press(String(n))} disabled={blocked||loading} style={{width:80,height:80,borderRadius:"50%",border:"1px solid #333",background:"rgba(255,255,255,.05)",color:"#fff",fontSize:28,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.1s",WebkitTapHighlightColor:"transparent"}} onTouchStart={e=>e.currentTarget.style.background="rgba(108,92,231,.3)"} onTouchEnd={e=>e.currentTarget.style.background="rgba(255,255,255,.05)"}>{n}</button>))}
        <button onClick={clear} style={{width:80,height:80,borderRadius:"50%",border:"none",background:"transparent",color:"#666",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>Clear</button>
        <button onClick={()=>press("0")} disabled={blocked||loading} style={{width:80,height:80,borderRadius:"50%",border:"1px solid #333",background:"rgba(255,255,255,.05)",color:"#fff",fontSize:28,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent"}} onTouchStart={e=>e.currentTarget.style.background="rgba(108,92,231,.3)"} onTouchEnd={e=>e.currentTarget.style.background="rgba(255,255,255,.05)"}>0</button>
        <button onClick={backspace} style={{width:80,height:80,borderRadius:"50%",border:"none",background:"transparent",color:"#666",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>&#9003;</button>
      </div>

      {/* Submit button */}
      <button onClick={()=>{if(pin.length>0)submit(pin);}} disabled={pin.length===0||blocked||loading} style={{padding:"14px 48px",borderRadius:12,border:"none",background:pin.length>0?"linear-gradient(135deg,#6c5ce7,#8b5cf6)":"#222",color:pin.length>0?"#fff":"#555",fontSize:16,fontWeight:700,cursor:pin.length>0?"pointer":"default",transition:"all .2s",marginTop:8}}>{loading?"Verifying...":"Enter"}</button>

      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-10px)}40%,80%{transform:translateX(10px)}}`}</style>
    </div>
  );
}