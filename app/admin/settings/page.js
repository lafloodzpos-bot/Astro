"use client";
import { useState, useEffect } from "react";
import { ADMIN_PASSWORD } from "@/lib/config";

export default function AdminSettings() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pins, setPins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [siteEnabled, setSiteEnabled] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const flash = (text, type="success") => { setMessage({text,type}); setTimeout(()=>setMessage(null),3000); };
  const is = {padding:"10px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",fontSize:14,outline:"none",width:"100%"};
  const bs = (c="var(--accent)") => ({padding:"10px 20px",borderRadius:10,border:"none",background:c,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"});

  const login = () => { if(password===ADMIN_PASSWORD){setAuthed(true);loadData();}else{flash("Wrong password","error");} };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings",{headers:{"x-admin-password":password}});
      const data = await res.json();
      setPins(data.pins||[]);
      setLogs(data.logs||[]);
      setSiteEnabled(data.siteEnabled!==false);
    } catch { flash("Failed to load","error"); }
    setLoading(false);
  };

  const savePins = async (newPins) => {
    await fetch("/api/settings",{method:"POST",headers:{"x-admin-password":password,"Content-Type":"application/json"},body:JSON.stringify({action:"set_pins",pins:newPins})});
    setPins(newPins);
  };

  const addPin = async () => {
    if(!newName||!newPin){flash("Name and PIN required","error");return;}
    if(!/^\d+$/.test(newPin)){flash("PIN must be numbers only","error");return;}
    if(pins.find(p=>p.pin===newPin)){flash("PIN already exists","error");return;}
    const updated = [...pins, {name:newName, pin:newPin, created:new Date().toISOString()}];
    await savePins(updated);
    setNewName(""); setNewPin("");
    flash("PIN added!");
  };

  const removePin = async (idx) => {
    if(!confirm("Remove this PIN?"))return;
    const updated = pins.filter((_,i)=>i!==idx);
    await savePins(updated);
    flash("PIN removed");
  };

  const toggleSite = async () => {
    const res = await fetch("/api/settings",{method:"POST",headers:{"x-admin-password":password,"Content-Type":"application/json"},body:JSON.stringify({action:"toggle_site"})});
    const data = await res.json();
    setSiteEnabled(data.siteEnabled);
    flash(data.siteEnabled?"Site ENABLED":"Site DISABLED");
  };

  const clearLogs = async () => {
    if(!confirm("Clear all access logs?"))return;
    await fetch("/api/settings",{method:"POST",headers:{"x-admin-password":password,"Content-Type":"application/json"},body:JSON.stringify({action:"clear_logs"})});
    setLogs([]);
    flash("Logs cleared");
  };

  if(!authed) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"var(--card)",borderRadius:20,border:"1px solid var(--border)",padding:40,maxWidth:400,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <h1 style={{fontFamily:"'Outfit'",fontSize:24,fontWeight:700,marginBottom:8}}>Admin Settings</h1>
          <p style={{color:"var(--muted)",fontSize:14}}>PIN management, access logs, site control</p>
        </div>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Admin password" style={{...is,marginBottom:16,padding:"14px 18px",fontSize:16}} autoFocus/>
        <button onClick={login} style={{...bs(),width:"100%",padding:"14px",fontSize:16}}>Login</button>
        {message&&<p style={{marginTop:12,textAlign:"center",fontSize:13,color:message.type==="error"?"var(--red)":"var(--green)"}}>{message.text}</p>}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh"}}>
      <header style={{background:"rgba(10,10,15,.88)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)",padding:"0 24px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <span style={{fontFamily:"'Outfit'",fontWeight:700,fontSize:18}}>Admin Settings</span>
          <div style={{display:"flex",gap:12}}><a href="/admin" style={{fontSize:13,color:"var(--muted)"}}>Products</a><a href="/shop" style={{fontSize:13,color:"var(--muted)"}}>Store</a></div>
        </div>
      </header>
      {message&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:200,background:message.type==="error"?"var(--red)":"var(--green)",color:"#fff",padding:"10px 24px",borderRadius:10,fontSize:14,fontWeight:600}}>{message.text}</div>}
      <main style={{maxWidth:900,margin:"0 auto",padding:"24px 24px 80px"}}>
        
        {/* SITE KILL SWITCH */}
        <div style={{background:siteEnabled?"var(--card)":"rgba(239,68,68,.1)",borderRadius:14,padding:20,border:"1px solid "+(siteEnabled?"var(--border)":"var(--red)"),marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Site Status</h3>
              <p style={{fontSize:13,color:"var(--muted)"}}>{siteEnabled?"Customers can access the storefront with a valid PIN":"Site is completely disabled. No one can access the storefront."}</p>
            </div>
            <button onClick={toggleSite} style={{...bs(siteEnabled?"var(--red)":"var(--green)"),padding:"12px 24px",fontSize:14,minWidth:120}}>
              {siteEnabled?"Disable Site":"Enable Site"}
            </button>
          </div>
        </div>

        {/* PIN MANAGEMENT */}
        <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:24}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>User PINs ({pins.length})</h3>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="User name" style={{...is,flex:1,minWidth:120}}/>
            <input value={newPin} onChange={e=>setNewPin(e.target.value.replace(/[^0-9]/g,""))} placeholder="PIN (numbers only)" style={{...is,flex:1,minWidth:120}} maxLength={10}/>
            <button onClick={addPin} style={bs()}>Add PIN</button>
          </div>
          {pins.length===0&&<p style={{color:"var(--dim)",fontSize:13,textAlign:"center",padding:20}}>No PINs configured. Add a PIN to allow customer access.</p>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {pins.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"var(--surface)",borderRadius:8,border:"1px solid var(--border)"}}>
              <div><span style={{fontWeight:600,fontSize:14}}>{p.name}</span><span style={{color:"var(--dim)",fontSize:12,marginLeft:10}}>PIN: {p.pin}</span>{p.created&&<span style={{color:"var(--dim)",fontSize:11,marginLeft:10}}>Added: {new Date(p.created).toLocaleDateString("en-US")}</span>}</div>
              <button onClick={()=>removePin(i)} style={{background:"none",border:"none",color:"var(--red)",cursor:"pointer",fontSize:12,fontWeight:600}}>Remove</button>
            </div>))}
          </div>
        </div>

        {/* ACCESS LOGS */}
        <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{fontSize:16,fontWeight:700}}>Access Logs ({logs.length})</h3>
            {logs.length>0&&<button onClick={clearLogs} style={{...bs("var(--surface)"),border:"1px solid var(--border)",color:"var(--red)",fontSize:12}}>Clear Logs</button>}
          </div>
          {logs.length===0&&<p style={{color:"var(--dim)",fontSize:13,textAlign:"center",padding:20}}>No access logs yet.</p>}
          <div style={{maxHeight:400,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
            {logs.map((log,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"var(--surface)",borderRadius:6,fontSize:12,flexWrap:"wrap",gap:4}}>
              <span style={{fontWeight:600,color:"var(--text)"}}>{log.user}</span>
              <span style={{color:"var(--dim)"}}>PIN: {log.pin}</span>
              <span style={{color:"var(--dim)"}}>IP: {log.ip}</span>
              <span style={{color:"var(--dim)"}}>{new Date(log.date).toLocaleString("en-US",{month:"2-digit",day:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
            </div>))}
          </div>
        </div>
      </main>
    </div>
  );
}