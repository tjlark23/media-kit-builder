"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { buildMediaKitHTML } from "@/lib/template";

const SECTIONS = [
  { id:"hero",         label:"Hero",                 desc:"Headline, key stats, logo display",       required:true },
  { id:"meet",         label:"Meet the Brands",      desc:"Brand intro and brand cards (hidden for 1-brand kits)" },
  { id:"metrics",      label:"Performance Metrics",  desc:"Fully custom metrics - subscribers, social, web, anything", recommended:true },
  { id:"reader",       label:"Reader Profile",       desc:"Demographics and survey data" },
  { id:"why_news",     label:"Why Newsletters",      desc:"Universal newsletter advertising benefits - pre-filled", recommended:true },
  { id:"why_us",       label:"Why Us",               desc:"Your pitch for why advertisers should work with you - editable", recommended:true },
  { id:"pricing",      label:"Pricing",              desc:"Placement cards or on-request quote form" },
  { id:"testimonials", label:"Testimonials",         desc:"Advertiser quotes" },
  { id:"cta",          label:"Contact / CTA",        desc:"Final call to action + contact form",      required:true },
];

const STEPS = ["Sections","Brands","Metrics","Audience","Why Us","Pricing","Preview"];

const emptyBrand = () => ({
  name:"", market:"", subscribers:"", frequency:"", openRate:"",
  primaryColor:"#4A90D9", accentColor:"#E8821A", darkColor:"#0f1e30",
  logoB64:"", logoName:"", logoMime:""
});

const emptyMetric = () => ({
  id: Math.random().toString(36).slice(2),
  label:"", value:"", color:"blue", isHero:false
});

const defaultForm = {
  selectedSections:["hero","meet","metrics","reader","why_news","why_us","pricing","testimonials","cta"],
  brandCount:1,
  brands:[emptyBrand()],
  kitTitle:"Henderson HQ x West Vegas HQ",
  kitLogoB64:"", kitLogoName:"", kitLogoMime:"",
  combinedSubs:"", combinedTagline:"", weeklyImpressions:"", contactEmail:"",
  metrics:[
    {id:"m1", label:"Subscribers",       value:"",  color:"blue",   isHero:true},
    {id:"m2", label:"Avg Open Rate",     value:"",  color:"orange", isHero:true},
    {id:"m3", label:"Weekly Impressions",value:"",  color:"blue",   isHero:true},
    {id:"m4", label:"Click Rate",        value:"",  color:"orange", isHero:false},
  ],
  separateBrandMetrics: false,
  brandMetrics:{} as any,
  surveyData:"",
  pricingMode:"full",
  pricing:[
    {unit:"Main Sponsor",       desc:"Logo at top + 150 words + image",  dot:"orange", bundle:"", b:["","","","","",""]},
    {unit:"Supporting Sponsor", desc:"100 words + image at 60% mark",    dot:"blue",   bundle:"", b:["","","","","",""]},
    {unit:"Community Sponsor",  desc:"40 words + highlighted link",      dot:"muted",  bundle:"", b:["","","","","",""]},
    {unit:"Classified / Event", desc:"25 words + link",                  dot:"muted",  bundle:"", b:["","","","","",""]},
    {unit:"Sponsored Story",    desc:"Full editorial feature + archive", dot:"orange", bundle:"", b:["","","","","",""]},
  ],
  testimonials:[
    {quote:"",name:"",company:""},
    {quote:"",name:"",company:""},
  ],
  whyUsItems:[
    {title:"", body:""},
    {title:"", body:""},
    {title:"", body:""},
    {title:"", body:""},
  ],
};

const S = {
  input:{ background:"#fff", border:"1.5px solid #08313a", borderRadius:4, padding:"9px 12px", color:"#08313a", fontSize:13, outline:"none", width:"100%" },
  card:{ background:"#f8f9fa", border:"2px solid #08313a", borderRadius:6, padding:20, boxShadow:"2px 2px 0 #08313a" as const },
  label:{ fontSize:11, fontWeight:700, color:"#08313a", letterSpacing:1.2, textTransform:"uppercase" as const, display:"block", marginBottom:5, fontFamily:"ui-monospace, monospace" },
  tag:{ padding:"5px 14px", borderRadius:4, fontSize:12, fontWeight:600, cursor:"pointer", border:"1.5px solid #08313a", letterSpacing:.3 },
};

const Label = ({c}:{c:string}) => <span style={S.label}>{c}</span>;
const Field = ({label,value,onChange,placeholder,type="text",style={}}:any) => (
  <div>
    <Label c={label}/>
    <input type={type} value={value} onChange={(e:any)=>onChange(e.target.value)} placeholder={placeholder} style={{...S.input,...style}}/>
  </div>
);

function ColorPicker({label, value, onChange}:any) {
  return (
    <div>
      <Label c={label}/>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
        <input type="color" value={value} onChange={(e:any)=>onChange(e.target.value)}
          style={{width:36,height:34,borderRadius:5,background:"transparent"}}/>
        <input value={value} onChange={(e:any)=>onChange(e.target.value)}
          style={{...S.input,width:90,fontFamily:"ui-monospace, monospace",fontSize:12}}/>
        <div style={{width:34,height:34,borderRadius:5,background:value,border:"1.5px solid #08313a",flexShrink:0}}/>
      </div>
    </div>
  );
}

function LogoUpload({label, b64, name, mime, onChange}:any) {
  const ref = useRef<HTMLInputElement>(null);
  const handle = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (ev) => {
      img.onload = () => {
        const MAX = 300;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = mime === 'image/jpeg' ? 0.7 : undefined;
        const dataUrl = canvas.toDataURL(mime, quality);
        const b64 = dataUrl.split(',')[1];
        onChange(b64, file.name, mime);
      };
      img.src = (ev.target as any).result;
    };
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <Label c={label}/>
      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:2}}>
        <button onClick={()=>ref.current?.click()}
          style={{padding:"8px 14px",borderRadius:4,border:"1.5px solid #08313a",background:"#fff",
            color:"#08313a",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",
            boxShadow:"1px 1px 0 #08313a"}}>
          {b64 ? "Change" : "Upload Logo"}
        </button>
        {b64 && (
          <img src={`data:${mime || "image/png"};base64,${b64}`} alt=""
            style={{height:36,width:"auto",borderRadius:4,background:"#eef2f5",padding:2,border:"1px solid #c7d5e0"}}/>
        )}
        {name && <span style={{fontSize:11,color:"#e76f51",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{name}</span>}
        <input ref={ref} type="file" accept="image/*" onChange={handle} style={{display:"none"}}/>
      </div>
    </div>
  );
}

function MetricRow({m, onUpdate, onRemove, onMove, isFirst, isLast}:any) {
  return (
    <div className="metric-row">
      <div style={{display:"flex",flexDirection:"column",gap:3}}>
        <button onClick={onMove(-1)} disabled={isFirst}
          style={{width:20,height:18,border:"none",background:"transparent",color:isFirst?"#c7d5e0":"#08313a",cursor:isFirst?"default":"pointer",fontSize:10,lineHeight:1}}>&#9650;</button>
        <button onClick={onMove(1)} disabled={isLast}
          style={{width:20,height:18,border:"none",background:"transparent",color:isLast?"#c7d5e0":"#08313a",cursor:isLast?"default":"pointer",fontSize:10,lineHeight:1}}>&#9660;</button>
      </div>
      <input value={m.label} onChange={(e:any)=>onUpdate("label",e.target.value)}
        placeholder="e.g. Facebook Followers" style={{...S.input,fontSize:12}}/>
      <input value={m.value} onChange={(e:any)=>onUpdate("value",e.target.value)}
        placeholder="e.g. 47,000" style={{...S.input,fontSize:12}}/>
      <select value={m.color} onChange={(e:any)=>onUpdate("color",e.target.value)}
        style={{...S.input,width:90,fontSize:12,cursor:"pointer"}}>
        <option value="blue">Blue</option>
        <option value="orange">Orange</option>
        <option value="neutral">Neutral</option>
      </select>
      <div title="Show in hero stats row" onClick={()=>onUpdate("isHero",!m.isHero)}
        style={{padding:"5px 9px",borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:.5,
          border:`1.5px solid ${m.isHero?"#e76f51":"#c7d5e0"}`,
          background:m.isHero?"rgba(231,111,81,.12)":"transparent",
          color:m.isHero?"#e76f51":"#5a7a8a",whiteSpace:"nowrap"}}>
        HERO
      </div>
      <button onClick={onRemove}
        style={{width:26,height:26,borderRadius:4,border:"1.5px solid #c7d5e0",background:"transparent",
          color:"#5a7a8a",cursor:"pointer",fontSize:14,lineHeight:1}}>&times;</button>
    </div>
  );
}

export default function BuilderClient({ kitId }: { kitId?: string }) {
  const [step,setStep] = useState(0);
  const [form,setForm] = useState(defaultForm);
  const [generated,setGenerated] = useState<string|null>(null);
  const [saving,setSaving] = useState(false);
  const [saveStatus,setSaveStatus] = useState<string|null>(null);
  const [currentKitId,setCurrentKitId] = useState<string|null>(kitId || null);
  const [loadingKit,setLoadingKit] = useState(!!kitId);

  // Load existing kit
  useEffect(() => {
    if (!kitId) return;
    (async () => {
      const { data } = await supabase.from("media_kits").select("*").eq("id", kitId).single();
      if (data) {
        const merged = { ...defaultForm, ...data.form_data };
        const base = emptyBrand();
        merged.brands = (merged.brands || []).map((b:any) => ({ ...base, ...b }));
        setForm(merged);
        if (data.generated_html) setGenerated(data.generated_html);
      }
      setLoadingKit(false);
    })();
  }, [kitId]);

  const set = (k:string,v:any) => setForm((f:any)=>({...f,[k]:v}));

  const setBrandCount = (n:number) => {
    let brands = [...form.brands];
    while(brands.length < n) brands.push(emptyBrand());
    setForm((f:any)=>({...f,brandCount:n,brands:brands.slice(0,n)}));
  };

  const updateBrand = (i:number,k:string,v:any) => {
    const b=[...form.brands]; b[i]={...b[i],[k]:v}; set("brands",b);
  };

  const updateMetric = (i:number,k:string,v:any) => {
    const m=[...form.metrics]; m[i]={...m[i],[k]:v}; set("metrics",m);
  };

  const moveMetric = (i:number,dir:number) => () => {
    const m=[...form.metrics];
    const j=i+dir;
    if(j<0||j>=m.length) return;
    [m[i],m[j]]=[m[j],m[i]];
    set("metrics",m);
  };

  const removeMetric = (i:number) => {
    set("metrics",form.metrics.filter((_:any,idx:number)=>idx!==i));
  };

  const updateBrandMetric = (brandIdx:number,metricIdx:number,k:string,v:any) => {
    const bm={...form.brandMetrics};
    if(!bm[brandIdx]) bm[brandIdx]=[...form.metrics.map((m:any)=>({...m,id:Math.random().toString(36).slice(2)}))];
    bm[brandIdx][metricIdx]={...bm[brandIdx][metricIdx],[k]:v};
    set("brandMetrics",bm);
  };

  const updatePricing = (i:number,k:string,v:any) => {
    const p=[...form.pricing]; p[i]={...p[i],[k]:v}; set("pricing",p);
  };

  const updatePricingBrand = (pi:number,bi:number,v:any) => {
    const p=[...form.pricing];
    const b=[...p[pi].b]; b[bi]=v; p[pi]={...p[pi],b};
    set("pricing",p);
  };

  const updateTesti = (i:number,k:string,v:any) => {
    const t=[...form.testimonials]; t[i]={...t[i],[k]:v}; set("testimonials",t);
  };

  const updateWhyUs = (i:number,k:string,v:any) => {
    const items=[...(form.whyUsItems||[])];
    while(items.length < 4) items.push({title:"",body:""});
    items[i]={...items[i],[k]:v};
    set("whyUsItems",items);
  };

  const toggleSection = (id:string) => {
    const s=SECTIONS.find(s=>s.id===id);
    if(s?.required) return;
    const cur=form.selectedSections;
    set("selectedSections",cur.includes(id)?cur.filter((x:string)=>x!==id):[...cur,id]);
  };

  const activeBrands = form.brands.slice(0,form.brandCount);

  // Instant template rendering - no AI, no API call
  const generatePreview = () => {
    const html = buildMediaKitHTML(form);
    setGenerated(html);
  };

  const save = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const approxSize = JSON.stringify(form).length + (generated?.length || 0);
      if (approxSize > 900_000) {
        console.warn(`[mkb] payload approx ${(approxSize / 1024).toFixed(1)}KB — approaching 1MB limit`);
      }
      const name = form.brands[0]?.name || form.kitTitle || "Untitled Kit";
      if (currentKitId) {
        const payload = { name, form_data: form, ...(generated ? { generated_html: generated } : {}) };
        const { error } = await supabase.from("media_kits").update(payload).eq("id", currentKitId);
        if (error) {
          console.error("Supabase update failed:", error);
          setSaveStatus("Save failed: " + error.message);
          return;
        }
      } else {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";
        const payload:any = { name, slug, form_data: form, is_published: false };
        if (generated) payload.generated_html = generated;
        const { data, error } = await supabase.from("media_kits").insert(payload).select().single();
        if (error) {
          console.error("Supabase insert failed:", error);
          setSaveStatus("Save failed: " + error.message);
          return;
        }
        if (data) {
          setCurrentKitId(data.id);
          window.history.replaceState(null, "", `/builder/${data.id}`);
        }
      }
      setSaveStatus("Saved!");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err: any) {
      console.error("Save threw:", err);
      setSaveStatus("Save failed: " + (err?.message || "unknown"));
    } finally {
      setSaving(false);
    }
  };

  const download = () => {
    if (!generated) return;
    const blob=new Blob([generated],{type:"text/html"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`${(form.brands[0]?.name||"media-kit").toLowerCase().replace(/\s+/g,"-")}-media-kit-2026.html`;
    a.click(); URL.revokeObjectURL(url);
  };

  const openPreview = () => {
    if (!generated) return;
    const blob=new Blob([generated],{type:"text/html"});
    window.open(URL.createObjectURL(blob),"_blank");
  };

  const downloadPDF = () => {
    if (!generated) return;
    const blob = new Blob([generated], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) {
      alert("Popup blocked. Please allow popups for this site to export PDF.");
      URL.revokeObjectURL(url);
      return;
    }
    // Wait for fonts + images to load, then trigger the print dialog.
    // User saves as PDF from the browser's print dialog.
    const trigger = () => { try { w.focus(); w.print(); } catch(e) { /* user closed window */ } };
    setTimeout(trigger, 1500);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  if (loadingKit) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:36,height:36,border:"3px solid #c7d5e0",borderTop:"3px solid #e76f51",
          borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      </div>
    );
  }

  const Eyebrow = ({text}:{text:string}) => (
    <div style={{
      display:"inline-block",background:"#e76f51",color:"#fff",
      padding:"3px 12px",borderRadius:20,fontSize:10,fontWeight:700,
      letterSpacing:1.5,textTransform:"uppercase" as const,marginBottom:8,
      fontFamily:"ui-monospace, monospace"
    }}>{text}</div>
  );

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>

      {/* Topbar */}
      <div style={{background:"#f8f9fa",borderBottom:"2px solid #08313a",padding:"0 20px",
        display:"flex",alignItems:"center",justifyContent:"space-between",height:56,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {form.kitLogoB64
            ? <img src={`data:${(form as any).kitLogoMime || "image/png"};base64,${form.kitLogoB64}`} alt="" style={{height:32,width:"auto",borderRadius:4}}/>
            : <>
                <div style={{width:10,height:10,borderRadius:"50%",background:"#e76f51"}}/>
                <span className="topbar-full" style={{fontWeight:900,fontSize:16,letterSpacing:2,textTransform:"uppercase" as const}}>
                  LOCAL MEDIA HQ <span style={{color:"#c7d5e0",margin:"0 4px"}}>/</span> <span style={{color:"#e76f51"}}>KIT BUILDER</span>
                </span>
                <span className="topbar-short" style={{fontWeight:900,fontSize:16,letterSpacing:2}}>
                  LMHQ
                </span>
              </>
          }
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Mobile step select */}
          <select className="step-tabs-mobile" value={step} onChange={e=>setStep(Number(e.target.value))}
            style={{background:"#08313a",color:"#e9ae4a",border:"2px solid #08313a",borderRadius:4,
              padding:"7px 12px",fontSize:12,fontWeight:700,letterSpacing:.5,cursor:"pointer"}}>
            {STEPS.map((s,i) => <option key={i} value={i}>{i<step?"\u2713 ":""}{s}</option>)}
          </select>
          {/* Desktop step tabs */}
          <div className="step-tabs-desktop" style={{display:"flex",gap:4}}>
            {STEPS.map((s,i)=>(
              <div key={i} onClick={()=>setStep(i)} style={{
                padding:"5px 13px",borderRadius:4,fontSize:12,fontWeight:700,letterSpacing:.3,cursor:"pointer",
                background:i===step?"#08313a":i<step?"#c7d5e0":"transparent",
                color:i===step?"#e9ae4a":i<step?"#08313a":"#5a7a8a",
                border:`1.5px solid ${i===step?"#08313a":i<step?"#c7d5e0":"#c7d5e0"}`}}>
                {i<step?"\u2713 ":""}{s}
              </div>
            ))}
          </div>
          <div style={{width:1,height:28,background:"#c7d5e0",margin:"0 4px"}}/>
          <button onClick={save} disabled={saving}
            style={{padding:"7px 16px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",
              border:"2px solid #08313a",background:"#e9ae4a",color:"#08313a",
              boxShadow:"1px 1px 0 #08313a",opacity:saving?0.5:1}}>
            {saving ? "Saving..." : saveStatus || "Save"}
          </button>
          <a href="/" style={{padding:"7px 14px",borderRadius:4,fontSize:12,fontWeight:700,
            border:"1.5px solid #08313a",background:"transparent",color:"#08313a",
            textDecoration:"none",cursor:"pointer"}}>
            <span className="topbar-full">Dashboard</span>
            <span className="topbar-short">&larr;</span>
          </a>
        </div>
      </div>

      {/* Content - extra bottom padding for fixed nav */}
      <div style={{flex:1,overflowY:"auto",padding:"28px 20px 100px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}} className="fade-in" key={step}>

          {/* STEP 0 - Sections */}
          {step===0 && (
            <div>
              <Eyebrow text="Step 1"/>
              <h2 style={{fontWeight:900,fontSize:36,textTransform:"uppercase" as const,letterSpacing:1,marginBottom:6}}>
                PICK YOUR <span style={{color:"#e76f51"}}>SECTIONS</span>
              </h2>
              <p style={{color:"#5a7a8a",fontSize:13,marginBottom:24}}>Select which sections to include in the generated media kit.</p>
              <div className="grid-sections">
                {SECTIONS.map(s=>{
                  const on=form.selectedSections.includes(s.id);
                  return (
                    <div key={s.id} onClick={()=>toggleSection(s.id)}
                      style={{padding:"12px 14px",borderRadius:6,cursor:s.required?"default":"pointer",
                        border:`2px solid ${on?"#08313a":"#c7d5e0"}`,
                        background:on?"#f8f9fa":"#fff",
                        boxShadow:on?"2px 2px 0 #08313a":"none",
                        display:"flex",gap:10,alignItems:"flex-start",transition:"all .15s"}}>
                      <div style={{width:17,height:17,borderRadius:3,flexShrink:0,marginTop:2,
                        border:`2px solid ${on?"#08313a":"#c7d5e0"}`,background:on?"#08313a":"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {on&&<span style={{fontSize:9,color:"#fff",fontWeight:800}}>{"\u2713"}</span>}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:on?"#08313a":"#5a7a8a",display:"flex",gap:7,alignItems:"center"}}>
                          {s.label}
                          {s.required&&<span style={{fontSize:9,color:"#e76f51",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",fontFamily:"ui-monospace, monospace"}}>Required</span>}
                          {s.recommended&&<span style={{fontSize:9,color:"#e9ae4a",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",fontFamily:"ui-monospace, monospace"}}>Recommended</span>}
                        </div>
                        <div style={{fontSize:11,color:"#5a7a8a",marginTop:2}}>{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1 - Brands */}
          {step===1 && (
            <div>
              <Eyebrow text="Step 2"/>
              <h2 style={{fontWeight:900,fontSize:36,textTransform:"uppercase" as const,letterSpacing:1,marginBottom:6}}>
                BRAND <span style={{color:"#e76f51"}}>INFO</span>
              </h2>
              <p style={{color:"#5a7a8a",fontSize:13,marginBottom:24}}>Enter details for each newsletter. Upload logos as PNG files.</p>

              <div style={{...S.card,marginBottom:16}}>
                <div style={{fontFamily:"ui-monospace, monospace",fontSize:12,color:"#e76f51",marginBottom:14,letterSpacing:1.5,fontWeight:700,textTransform:"uppercase" as const}}>KIT NAVIGATION (TOP BAR)</div>
                <div className="grid-form">
                  <Field label="Kit Title Text" value={form.kitTitle} onChange={(v:any)=>set("kitTitle",v)} placeholder="Henderson HQ x West Vegas HQ"/>
                  <LogoUpload label="Nav Logo (replaces title text)" b64={form.kitLogoB64} name={form.kitLogoName} mime={(form as any).kitLogoMime}
                    onChange={(b64:string,name:string,mime:string)=>setForm((f:any)=>({...f,kitLogoB64:b64,kitLogoName:name,kitLogoMime:mime}))}/>
                </div>
              </div>

              <div style={{marginBottom:16}}>
                <Label c="How many newsletters in this kit?"/>
                <div style={{display:"flex",gap:6,marginTop:6}}>
                  {[1,2,3,4,5,6].map(n=>(
                    <button key={n} onClick={()=>setBrandCount(n)}
                      style={{width:44,height:40,borderRadius:4,fontWeight:900,fontSize:15,cursor:"pointer",
                        border:`2px solid #08313a`,
                        background:form.brandCount===n?"#08313a":"#fff",
                        color:form.brandCount===n?"#e9ae4a":"#08313a",
                        boxShadow:form.brandCount===n?"2px 2px 0 #08313a":"none"}}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {activeBrands.map((b:any,i:number)=>(
                <div key={i} style={{...S.card,marginBottom:12}}>
                  <div style={{fontFamily:"ui-monospace, monospace",fontSize:12,color:"#e76f51",marginBottom:14,letterSpacing:1.5,fontWeight:700,textTransform:"uppercase" as const}}>
                    NEWSLETTER {i+1}
                  </div>
                  <div className="grid-form">
                    <Field label="Newsletter Name" value={b.name} onChange={(v:any)=>updateBrand(i,"name",v)} placeholder="Henderson HQ"/>
                    <Field label="Market / City" value={b.market} onChange={(v:any)=>updateBrand(i,"market",v)} placeholder="Henderson, NV"/>
                    <Field label="Subscriber Count" value={b.subscribers} onChange={(v:any)=>updateBrand(i,"subscribers",v)} placeholder="32,000"/>
                    <Field label="Send Frequency" value={b.frequency} onChange={(v:any)=>updateBrand(i,"frequency",v)} placeholder="3x weekly"/>
                    <Field label="Open Rate %" value={b.openRate} onChange={(v:any)=>updateBrand(i,"openRate",v)} placeholder="58"/>
                    <LogoUpload label="Newsletter Logo" b64={b.logoB64} name={b.logoName} mime={b.logoMime}
                      onChange={(b64:string,name:string,mime:string)=>{
                        const bs=[...form.brands];
                        bs[i]={...bs[i],logoB64:b64,logoName:name,logoMime:mime};
                        set("brands",bs);
                      }}/>
                  </div>
                  <div className="grid-colors" style={{marginTop:14}}>
                    <ColorPicker label="Primary Color" value={b.primaryColor} onChange={(v:any)=>updateBrand(i,"primaryColor",v)}/>
                    <ColorPicker label="Accent Color" value={b.accentColor} onChange={(v:any)=>updateBrand(i,"accentColor",v)}/>
                    <ColorPicker label="Dark Background" value={b.darkColor} onChange={(v:any)=>updateBrand(i,"darkColor",v)}/>
                  </div>
                </div>
              ))}

              <div style={S.card}>
                <div style={{fontFamily:"ui-monospace, monospace",fontSize:12,color:"#e76f51",marginBottom:14,letterSpacing:1.5,fontWeight:700,textTransform:"uppercase" as const}}>COMBINED STATS</div>
                <div className="grid-form">
                  <Field label="Combined Subscribers" value={form.combinedSubs} onChange={(v:any)=>set("combinedSubs",v)} placeholder="52,000"/>
                  <Field label="Weekly Impressions" value={form.weeklyImpressions} onChange={(v:any)=>set("weeklyImpressions",v)} placeholder="97,000"/>
                  <Field label="Contact Email" value={form.contactEmail} onChange={(v:any)=>set("contactEmail",v)} placeholder="hello@hendersonhq.com"/>
                  <Field label="Kit Tagline" value={form.combinedTagline} onChange={(v:any)=>set("combinedTagline",v)} placeholder="Las Vegas Valley's most engaged local audience"/>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 - Metrics */}
          {step===2 && (
            <div>
              <Eyebrow text="Step 3"/>
              <h2 style={{fontWeight:900,fontSize:36,textTransform:"uppercase" as const,letterSpacing:1,marginBottom:6}}>
                PERFORMANCE <span style={{color:"#e76f51"}}>METRICS</span>
              </h2>
              <p style={{color:"#5a7a8a",fontSize:13,marginBottom:24}}>Add any metrics you want to show - email stats, social following, website traffic, anything. Mark up to 3 as HERO to show large in the stats row.</p>

              {form.brandCount > 1 && (
                <div style={{...S.card,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap" as const,gap:12}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#08313a",marginBottom:3}}>Separate metrics per brand?</div>
                    <div style={{fontSize:12,color:"#5a7a8a"}}>Shows All Brands tab plus individual tabs for each newsletter</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {([["No","Combine all into one section",false],["Yes","Separate tabs per brand",true]] as const).map(([lbl,tip,val])=>(
                      <button key={lbl} onClick={()=>set("separateBrandMetrics",val)}
                        style={{padding:"7px 16px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",
                          border:`2px solid #08313a`,
                          background:form.separateBrandMetrics===val?"#08313a":"#fff",
                          color:form.separateBrandMetrics===val?"#e9ae4a":"#08313a"}}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{...S.card,marginBottom:form.separateBrandMetrics?16:0}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap" as const,gap:8}}>
                  <div style={{fontFamily:"ui-monospace, monospace",fontSize:12,color:"#e76f51",letterSpacing:1.5,fontWeight:700,textTransform:"uppercase" as const}}>
                    {form.separateBrandMetrics?"COMBINED (ALL BRANDS TAB)":"YOUR METRICS"}
                  </div>
                  <div style={{fontSize:10,color:"#5a7a8a",letterSpacing:1,textTransform:"uppercase",fontFamily:"ui-monospace, monospace"}}>Label - Value - Color - Hero?</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {form.metrics.map((m:any,i:number)=>(
                    <MetricRow key={m.id} m={m}
                      onUpdate={(k:string,v:any)=>updateMetric(i,k,v)}
                      onRemove={()=>removeMetric(i)}
                      onMove={(dir:number)=>moveMetric(i,dir)}
                      isFirst={i===0} isLast={i===form.metrics.length-1}/>
                  ))}
                </div>
                <button onClick={()=>set("metrics",[...form.metrics,emptyMetric()])}
                  style={{marginTop:10,padding:"7px 16px",borderRadius:4,border:"1.5px dashed #08313a",
                    background:"transparent",color:"#08313a",cursor:"pointer",fontSize:12,fontWeight:700}}>
                  + Add Metric
                </button>
              </div>

              {form.separateBrandMetrics && activeBrands.map((b:any,bi:number)=>(
                <div key={bi} style={{...S.card,marginBottom:12}}>
                  <div style={{fontFamily:"ui-monospace, monospace",fontSize:12,color:"#e76f51",marginBottom:14,letterSpacing:1.5,fontWeight:700,textTransform:"uppercase" as const}}>
                    {b.name||`BRAND ${bi+1}`} METRICS
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {(form.brandMetrics[bi]||form.metrics).map((m:any,mi:number)=>(
                      <MetricRow key={m.id||mi} m={m}
                        onUpdate={(k:string,v:any)=>updateBrandMetric(bi,mi,k,v)}
                        onRemove={()=>{
                          const bm={...form.brandMetrics};
                          if(!bm[bi]) bm[bi]=[...form.metrics];
                          bm[bi]=bm[bi].filter((_:any,idx:number)=>idx!==mi);
                          set("brandMetrics",bm);
                        }}
                        onMove={(dir:number)=>()=>{
                          const bm={...form.brandMetrics};
                          if(!bm[bi]) bm[bi]=[...form.metrics];
                          const arr=[...bm[bi]];
                          const j=mi+dir;
                          if(j>=0&&j<arr.length){[arr[mi],arr[j]]=[arr[j],arr[mi]];}
                          bm[bi]=arr; set("brandMetrics",bm);
                        }}
                        isFirst={mi===0}
                        isLast={mi===(form.brandMetrics[bi]||form.metrics).length-1}/>
                    ))}
                  </div>
                  <button onClick={()=>{
                    const bm={...form.brandMetrics};
                    if(!bm[bi]) bm[bi]=[...form.metrics];
                    bm[bi]=[...bm[bi],emptyMetric()];
                    set("brandMetrics",bm);
                  }} style={{marginTop:10,padding:"7px 16px",borderRadius:4,border:"1.5px dashed #e76f51",
                    background:"transparent",color:"#e76f51",cursor:"pointer",fontSize:12,fontWeight:700}}>
                    + Add Metric
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3 - Audience + Testimonials */}
          {step===3 && (
            <div>
              <Eyebrow text="Step 4"/>
              <h2 style={{fontWeight:900,fontSize:36,textTransform:"uppercase" as const,letterSpacing:1,marginBottom:6}}>
                AUDIENCE + <span style={{color:"#e76f51"}}>TESTIMONIALS</span>
              </h2>
              <p style={{color:"#5a7a8a",fontSize:13,marginBottom:24}}>Paste any survey stats you have. Add advertiser quotes or leave blank for smart placeholders.</p>

              <div style={{...S.card,marginBottom:16}}>
                <div style={{fontFamily:"ui-monospace, monospace",fontSize:12,color:"#e76f51",marginBottom:8,letterSpacing:1.5,fontWeight:700,textTransform:"uppercase" as const}}>AUDIENCE DATA</div>
                <p style={{fontSize:12,color:"#5a7a8a",marginBottom:10}}>Paste survey stats in any format. e.g. &quot;71% female, 75% HHI $100K+, 63% homeowners, 22% business owners, top areas: Henderson 78%, Summerlin 20%&quot;</p>
                <textarea value={form.surveyData} onChange={(e:any)=>set("surveyData",e.target.value)}
                  placeholder="Leave blank to use smart defaults..."
                  style={{...S.input,minHeight:80,resize:"vertical"}}/>
              </div>

              <div style={S.card}>
                <div style={{fontFamily:"ui-monospace, monospace",fontSize:12,color:"#e76f51",marginBottom:16,letterSpacing:1.5,fontWeight:700,textTransform:"uppercase" as const}}>TESTIMONIALS</div>
                {form.testimonials.map((t:any,i:number)=>(
                  <div key={i} style={{marginBottom:14,paddingBottom:14,borderBottom:i<form.testimonials.length-1?"1.5px solid #c7d5e0":"none"}}>
                    <div style={{fontSize:11,color:"#e76f51",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:8,fontFamily:"ui-monospace, monospace"}}>Quote {i+1}</div>
                    <textarea value={t.quote} onChange={(e:any)=>updateTesti(i,"quote",e.target.value)}
                      placeholder="We ran one issue and had three new leads that same week..."
                      style={{...S.input,minHeight:60,resize:"vertical",marginBottom:8}}/>
                    <div className="grid-form">
                      <Field label="Name" value={t.name} onChange={(v:any)=>updateTesti(i,"name",v)} placeholder="Sarah M."/>
                      <Field label="Company" value={t.company} onChange={(v:any)=>updateTesti(i,"company",v)} placeholder="ReMax Henderson"/>
                    </div>
                  </div>
                ))}
                <button onClick={()=>set("testimonials",[...form.testimonials,{quote:"",name:"",company:""}])}
                  style={{padding:"7px 14px",borderRadius:4,border:"1.5px solid #08313a",background:"#fff",
                    color:"#08313a",cursor:"pointer",fontSize:12,fontWeight:700}}>
                  + Add Quote
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 - Why Us (brand pitch) */}
          {step===4 && (
            <div>
              <Eyebrow text="Step 5"/>
              <h2 style={{fontWeight:900,fontSize:36,textTransform:"uppercase" as const,letterSpacing:1,marginBottom:6}}>
                WHY <span style={{color:"#e76f51"}}>{
                  form.brandCount > 1
                    ? (form.kitTitle ? form.kitTitle.toUpperCase() : "OUR NETWORK")
                    : (form.brands[0]?.name ? form.brands[0].name.toUpperCase() : "US")
                }</span>
              </h2>
              <p style={{color:"#5a7a8a",fontSize:13,marginBottom:24}}>
                Tell advertisers why they should work with you. What makes your newsletter special? Leave blank to use smart defaults.
              </p>

              <div style={S.card}>
                {(form.whyUsItems && form.whyUsItems.length ? form.whyUsItems : [0,1,2,3].map(()=>({title:"",body:""}))).slice(0,4).map((w:any,i:number)=>(
                  <div key={i} style={{marginBottom:18,paddingBottom:18,borderBottom:i<3?"1.5px solid #c7d5e0":"none"}}>
                    <div style={{fontFamily:"ui-monospace, monospace",fontSize:12,color:"#e76f51",letterSpacing:1.5,marginBottom:10,fontWeight:700,textTransform:"uppercase" as const}}>
                      REASON 0{i+1}
                    </div>
                    <Field
                      label="Title"
                      value={w.title||""}
                      onChange={(v:any)=>updateWhyUs(i,"title",v)}
                      placeholder={[
                        "Real Attention, Not Impressions",
                        "Trusted Recommendations",
                        "Measurable Results",
                        "Built for Local Business"
                      ][i]}
                    />
                    <div style={{marginTop:10}}>
                      <Label c="Body"/>
                      <textarea
                        value={w.body||""}
                        onChange={(e:any)=>updateWhyUs(i,"body",e.target.value)}
                        placeholder={[
                          "Our readers actively open and read every issue. Your message gets focused, intentional attention from real people.",
                          "We hand-pick every advertiser. Our audience trusts us, and that trust transfers to you. Being featured here is an endorsement, not an interruption.",
                          "We share transparent performance data after every campaign. You will know exactly how many people saw your ad, clicked, and engaged. No black box.",
                          "We are not a national ad network. Every subscriber lives in your service area. You are reaching the exact people who can walk through your door."
                        ][i]}
                        style={{...S.input,minHeight:80,resize:"vertical"}}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{marginTop:16,padding:"12px 14px",background:"rgba(233,174,74,.08)",border:"1.5px solid #e9ae4a",borderRadius:6,fontSize:12,color:"#5a7a8a",lineHeight:1.6}}>
                Tip: Focus on what makes your newsletter different from other ad channels. Section title auto-fills from your brand name.
              </div>
            </div>
          )}

          {/* STEP 5 - Pricing */}
          {step===5 && (
            <div>
              <Eyebrow text="Step 6"/>
              <h2 style={{fontWeight:900,fontSize:36,textTransform:"uppercase" as const,letterSpacing:1,marginBottom:6}}>
                <span style={{color:"#e76f51"}}>PRICING</span>
              </h2>
              <p style={{color:"#5a7a8a",fontSize:13,marginBottom:20}}>Show specific prices or send advertisers to a contact form instead.</p>

              <div style={{display:"flex",gap:8,marginBottom:24}}>
                {([["full","Show Prices"],["on-request","On Request - Contact Us"]] as const).map(([mode,label])=>(
                  <button key={mode} onClick={()=>set("pricingMode",mode)}
                    style={{padding:"9px 20px",borderRadius:4,fontSize:13,fontWeight:700,cursor:"pointer",
                      border:`2px solid #08313a`,
                      background:form.pricingMode===mode?"#08313a":"#fff",
                      color:form.pricingMode===mode?"#e9ae4a":"#08313a",
                      boxShadow:form.pricingMode===mode?"2px 2px 0 #08313a":"none"}}>
                    {label}
                  </button>
                ))}
              </div>

              {form.pricingMode==="full" ? (
                <div style={{...S.card,overflowX:"auto" as const}}>
                  <div style={{display:"grid",
                    gridTemplateColumns:form.brandCount>1?`2fr 1fr ${activeBrands.map(()=>"1fr").join(" ")}`:"2fr 1fr",
                    gap:8,marginBottom:10,paddingBottom:10,borderBottom:"1.5px solid #c7d5e0",minWidth:form.brandCount>2?500:0}}>
                    <span style={S.label}>Ad Unit</span>
                    <span style={{...S.label,textAlign:"right" as const}}>Bundle</span>
                    {form.brandCount>1&&activeBrands.map((b:any,i:number)=>(
                      <span key={i} style={{...S.label,textAlign:"right" as const}}>{b.name||`Brand ${i+1}`}</span>
                    ))}
                  </div>
                  {form.pricing.map((p:any,pi:number)=>(
                    <div key={pi} style={{display:"grid",
                      gridTemplateColumns:form.brandCount>1?`2fr 1fr ${activeBrands.map(()=>"1fr").join(" ")}`:"2fr 1fr",
                      gap:8,marginBottom:8,alignItems:"center",minWidth:form.brandCount>2?500:0}}>
                      <div>
                        <div style={{fontSize:13,color:"#08313a",fontWeight:700}}>{p.unit}</div>
                        <div style={{fontSize:11,color:"#5a7a8a"}}>{p.desc}</div>
                      </div>
                      <input value={p.bundle} onChange={(e:any)=>updatePricing(pi,"bundle",e.target.value)}
                        placeholder="$1,500" style={{...S.input,textAlign:"right",fontSize:13}}/>
                      {form.brandCount>1&&activeBrands.map((_:any,bi:number)=>(
                        <input key={bi} value={p.b[bi]||""} onChange={(e:any)=>updatePricingBrand(pi,bi,e.target.value)}
                          placeholder="$1,000" style={{...S.input,textAlign:"right",fontSize:13}}/>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{...S.card,color:"#5a7a8a",fontSize:13,lineHeight:1.8}}>
                  The pricing section will show a clean &quot;Contact us for rates&quot; block. Good for new newsletters or when you prefer to discuss packages directly.
                </div>
              )}
            </div>
          )}

          {/* STEP 6 - Preview */}
          {step===6 && (
            <div style={{textAlign:"center"}}>
              <Eyebrow text="Final Step"/>
              <h2 style={{fontWeight:900,fontSize:44,textTransform:"uppercase" as const,letterSpacing:1,marginBottom:8}}>
                <span style={{color:"#e76f51"}}>PREVIEW</span> YOUR KIT
              </h2>
              <p style={{color:"#5a7a8a",fontSize:14,maxWidth:440,margin:"0 auto 32px",lineHeight:1.65}}>
                Your media kit is ready to preview. Click below to see it instantly.
              </p>

              <div style={{...S.card,textAlign:"left",maxWidth:500,margin:"0 auto 28px"}}>
                <div style={{fontSize:10,color:"#5a7a8a",textTransform:"uppercase",letterSpacing:2,marginBottom:12,fontFamily:"ui-monospace, monospace",fontWeight:700}}>Build Summary</div>
                {[
                  ["Sections", form.selectedSections.length+" selected: "+form.selectedSections.join(", ")],
                  ["Brands", activeBrands.map((b:any)=>b.name||"Unnamed").join(", ")],
                  ["Logos", activeBrands.filter((b:any)=>b.logoB64).length+" of "+form.brandCount+" uploaded"],
                  ["Metrics", form.metrics.length+" total, "+form.metrics.filter((m:any)=>m.isHero).length+" hero"],
                  ["Separate brand metrics", form.brandCount>1 ? (form.separateBrandMetrics?"Yes, with tabs":"No, combined") : "N/A"],
                  ["Pricing", form.pricingMode],
                ].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",
                    borderBottom:"1px solid #c7d5e0",fontSize:12}}>
                    <span style={{color:"#5a7a8a",flexShrink:0,marginRight:16,fontFamily:"ui-monospace, monospace"}}>{k}</span>
                    <span style={{color:"#08313a",textAlign:"right",fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>

              {!generated&&(
                <button onClick={generatePreview}
                  style={{padding:"15px 48px",borderRadius:6,border:"2px solid #08313a",background:"#e76f51",
                    color:"#fff",fontWeight:900,fontSize:16,cursor:"pointer",letterSpacing:1,
                    boxShadow:"3px 3px 0 #08313a"}}>
                  PREVIEW MEDIA KIT
                </button>
              )}

              {generated&&(
                <div>
                  <div style={{padding:"10px 20px",background:"rgba(22,163,74,.08)",border:"1.5px solid #16a34a",
                    borderRadius:6,color:"#16a34a",fontSize:13,fontWeight:700,marginBottom:20,display:"inline-block"}}>
                    Ready to preview.
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:24}}>
                    <button onClick={openPreview}
                      style={{padding:"11px 26px",borderRadius:4,border:"2px solid #08313a",
                        background:"#fff",color:"#08313a",fontWeight:700,fontSize:13,cursor:"pointer",
                        boxShadow:"2px 2px 0 #08313a"}}>
                      Open in New Tab
                    </button>
                    <button onClick={download}
                      style={{padding:"11px 26px",borderRadius:4,border:"2px solid #08313a",background:"#e76f51",
                        color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"2px 2px 0 #08313a"}}>
                      Download HTML
                    </button>
                    <button onClick={downloadPDF}
                      style={{padding:"11px 26px",borderRadius:4,border:"2px solid #08313a",
                        background:"#fff",color:"#e76f51",fontWeight:700,fontSize:13,cursor:"pointer",
                        boxShadow:"2px 2px 0 #08313a"}}>
                      Download PDF
                    </button>
                    <button onClick={save}
                      style={{padding:"11px 26px",borderRadius:4,border:"2px solid #08313a",
                        background:"#16a34a",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",
                        boxShadow:"2px 2px 0 #08313a"}}>
                      Save Kit
                    </button>
                    <button onClick={()=>{generatePreview();}}
                      style={{padding:"11px 26px",borderRadius:4,border:"1.5px solid #c7d5e0",
                        background:"#fff",color:"#5a7a8a",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                      Refresh Preview
                    </button>
                  </div>
                  {/* Inline preview */}
                  <div style={{...S.card,padding:0,overflow:"hidden",borderRadius:8,height:500}}>
                    <iframe srcDoc={generated} style={{width:"100%",height:"100%",border:"none",borderRadius:8}} title="Media Kit Preview"/>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Fixed Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#f8f9fa",
        borderTop:"2px solid #08313a",padding:"10px 20px",display:"flex",justifyContent:"space-between",
        alignItems:"center",zIndex:50}}>
        <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}
          style={{padding:"9px 22px",borderRadius:4,border:`1.5px solid ${step===0?"#c7d5e0":"#08313a"}`,
            background:step===0?"#eef2f5":"#fff",
            color:step===0?"#c7d5e0":"#08313a",cursor:step===0?"default":"pointer",fontSize:13,fontWeight:700}}>
          Back
        </button>
        <div style={{fontSize:11,color:"#5a7a8a",fontFamily:"ui-monospace, monospace",fontWeight:700,letterSpacing:1}}>
          {step+1} / {STEPS.length}
        </div>
        {step<6?(
          <button onClick={()=>setStep(s=>Math.min(6,s+1))}
            style={{padding:"9px 28px",borderRadius:4,border:"2px solid #08313a",background:"#e76f51",
              color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"2px 2px 0 #08313a"}}>
            Next
          </button>
        ):(
          <div style={{width:80}}/>
        )}
      </div>
    </div>
  );
}
