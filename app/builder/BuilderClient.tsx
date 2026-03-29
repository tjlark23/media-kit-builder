"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const SECTIONS = [
  { id:"hero",         label:"Hero",                 desc:"Headline, key stats, logo display",       required:true },
  { id:"meet",         label:"Meet the Brands",      desc:"Brand intro and brand cards" },
  { id:"metrics",      label:"Performance Metrics",  desc:"Fully custom metrics - subscribers, social, web, anything", recommended:true },
  { id:"reader",       label:"Reader Profile",       desc:"Demographics and survey data" },
  { id:"why",          label:"Why Newsletter Ads",   desc:"Universal - use for every kit",            recommended:true },
  { id:"placements",   label:"Pick Your Placement",  desc:"Ad unit cards with descriptions" },
  { id:"pricing",      label:"Pricing",              desc:"Tabbed pricing by market" },
  { id:"testimonials", label:"Testimonials",         desc:"Advertiser quotes" },
  { id:"cta",          label:"Contact / CTA",        desc:"Final call to action + contact form",      required:true },
];

const STEPS = ["Sections","Brands","Metrics","Audience","Pricing","Generate"];

const emptyBrand = () => ({
  name:"", market:"", subscribers:"", frequency:"", openRate:"",
  primaryColor:"#4A90D9", accentColor:"#E8821A", darkColor:"#0f1e30",
  logoB64:"", logoName:""
});

const emptyMetric = () => ({
  id: Math.random().toString(36).slice(2),
  label:"", value:"", color:"blue", isHero:false
});

const defaultForm = {
  selectedSections:["hero","meet","metrics","reader","why","placements","pricing","testimonials","cta"],
  brandCount:1,
  brands:[emptyBrand()],
  kitTitle:"Henderson HQ x West Vegas HQ",
  kitLogoB64:"", kitLogoName:"",
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
};

const S = {
  input:{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:6, padding:"9px 12px", color:"#fff", fontSize:13, outline:"none", width:"100%" },
  card:{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:10, padding:20 },
  label:{ fontSize:11, fontWeight:700, color:"#4a6080", letterSpacing:1.2, textTransform:"uppercase" as const, display:"block", marginBottom:5 },
  tag:{ padding:"5px 14px", borderRadius:4, fontSize:12, fontWeight:600, cursor:"pointer", border:"1px solid transparent", letterSpacing:.3 },
};

const Label = ({c}:{c:string}) => <span style={S.label}>{c}</span>;
const Field = ({label,value,onChange,placeholder,type="text",style={}}:any) => (
  <div>
    <Label c={label}/>
    <input type={type} value={value} onChange={(e:any)=>onChange(e.target.value)} placeholder={placeholder} style={{...S.input,...style}}/>
  </div>
);
const G2 = ({children,cols=2,gap=14}:any) => (
  <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap}}>{children}</div>
);

function ColorPicker({label, value, onChange}:any) {
  return (
    <div>
      <Label c={label}/>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
        <input type="color" value={value} onChange={(e:any)=>onChange(e.target.value)}
          style={{width:36,height:34,borderRadius:5,background:"transparent"}}/>
        <input value={value} onChange={(e:any)=>onChange(e.target.value)}
          style={{...S.input,width:90,fontFamily:"monospace",fontSize:12}}/>
        <div style={{width:34,height:34,borderRadius:5,background:value,border:"1px solid rgba(255,255,255,.1)",flexShrink:0}}/>
      </div>
    </div>
  );
}

function LogoUpload({label, b64, name, onChange}:any) {
  const ref = useRef<HTMLInputElement>(null);
  const handle = (e:any) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => onChange((ev.target as any).result.split(",")[1], file.name);
    r.readAsDataURL(file);
  };
  return (
    <div>
      <Label c={label}/>
      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:2}}>
        <button onClick={()=>ref.current?.click()}
          style={{padding:"8px 14px",borderRadius:5,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.05)",
            color:"#8a9ab0",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>
          {b64 ? "Change" : "Upload PNG"}
        </button>
        {b64 && (
          <img src={`data:image/png;base64,${b64}`} alt=""
            style={{height:36,width:"auto",borderRadius:4,background:"rgba(255,255,255,.08)",padding:2}}/>
        )}
        {name && <span style={{fontSize:11,color:"#4A90D9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{name}</span>}
        <input ref={ref} type="file" accept="image/*" onChange={handle} style={{display:"none"}}/>
      </div>
    </div>
  );
}

function MetricRow({m, onUpdate, onRemove, onMove, isFirst, isLast}:any) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr auto auto auto",gap:8,alignItems:"center",
      padding:"10px 12px",background:"rgba(255,255,255,.04)",borderRadius:8,border:"1px solid rgba(255,255,255,.07)"}}>
      <div style={{display:"flex",flexDirection:"column",gap:3}}>
        <button onClick={onMove(-1)} disabled={isFirst}
          style={{width:20,height:18,border:"none",background:"transparent",color:isFirst?"#1a2a3a":"#5a7090",cursor:isFirst?"default":"pointer",fontSize:10,lineHeight:1}}>&#9650;</button>
        <button onClick={onMove(1)} disabled={isLast}
          style={{width:20,height:18,border:"none",background:"transparent",color:isLast?"#1a2a3a":"#5a7090",cursor:isLast?"default":"pointer",fontSize:10,lineHeight:1}}>&#9660;</button>
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
          border:`1px solid ${m.isHero?"#E8821A":"#1a2a3a"}`,
          background:m.isHero?"rgba(232,130,26,.15)":"transparent",
          color:m.isHero?"#E8821A":"#3a5070",whiteSpace:"nowrap"}}>
        HERO
      </div>
      <button onClick={onRemove}
        style={{width:26,height:26,borderRadius:4,border:"1px solid #1a2a3a",background:"transparent",
          color:"#3a5070",cursor:"pointer",fontSize:14,lineHeight:1}}>&times;</button>
    </div>
  );
}

export default function BuilderClient({ kitId }: { kitId?: string }) {
  const [step,setStep] = useState(0);
  const [form,setForm] = useState(defaultForm);
  const [generating,setGenerating] = useState(false);
  const [generated,setGenerated] = useState<string|null>(null);
  const [error,setError] = useState<string|null>(null);
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
        // Merge saved form_data with defaults to handle any missing fields
        const savedForm = { ...defaultForm, ...data.form_data };
        setForm(savedForm);
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

  const toggleSection = (id:string) => {
    const s=SECTIONS.find(s=>s.id===id);
    if(s?.required) return;
    const cur=form.selectedSections;
    set("selectedSections",cur.includes(id)?cur.filter((x:string)=>x!==id):[...cur,id]);
  };

  const activeBrands = form.brands.slice(0,form.brandCount);

  const buildPrompt = () => {
    const f=form as any;
    const brandLines=activeBrands.map((b:any,i:number)=>
      `Brand ${i+1}: "${b.name||"Unnamed"}" | Market: ${b.market||"TBD"} | ${b.subscribers||"?"} subscribers | ${b.frequency||"?"} | ${b.openRate||"?"}% open rate | Primary: ${b.primaryColor} | Accent: ${b.accentColor} | Dark bg: ${b.darkColor} | Logo: ${b.logoB64?"PROVIDED":"none"}`
    ).join("\n");

    const logoLines=[
      ...activeBrands.filter((b:any)=>b.logoB64).map((b:any,i:number)=>`LOGO_BRAND_${i+1}_BASE64:${b.logoB64}`),
      f.kitLogoB64 ? `KIT_NAV_LOGO_BASE64:${f.kitLogoB64}` : ""
    ].filter(Boolean).join("\n\n");

    const metricLines=f.metrics.map((m:any)=>`${m.label}: ${m.value||"TBD"} (color:${m.color}, hero:${m.isHero})`).join("\n");

    const brandMetricLines=f.separateBrandMetrics
      ? activeBrands.map((b:any,i:number)=>{
          const bm=f.brandMetrics[i]||f.metrics;
          return `${b.name||"Brand "+(i+1)} metrics:\n`+bm.map((m:any)=>`  ${m.label}: ${m.value||"TBD"} (color:${m.color}, hero:${m.isHero})`).join("\n");
        }).join("\n")
      : "Use combined metrics only (no per-brand tabs)";

    const pricingLines=f.pricingMode==="full"
      ? f.pricing.map((p:any)=>{
          let line=`${p.unit} | Bundle: ${p.bundle||"TBD"}`;
          if(f.brandCount>1) line+=` | `+activeBrands.map((b:any,i:number)=>`${b.name||"Brand "+(i+1)}: ${p.b[i]||"TBD"}`).join(" | ");
          return line;
        }).join("\n")
      : "PRICING MODE: on-request - show contact us instead";

    const testiLines=f.testimonials.filter((t:any)=>t.quote).map((t:any)=>`"${t.quote}" - ${t.name}, ${t.company}`).join("\n")
      ||"Use 2 realistic placeholder testimonials from local advertisers";

    return `Build a complete professional single-file HTML media kit for a local newsletter brand. Output ONLY the raw HTML. No explanation, no markdown fences. Start with <!DOCTYPE html>.

SECTIONS TO INCLUDE (in this order): ${f.selectedSections.join(", ")}

KIT TITLE (top-left nav): ${f.kitTitle||"My Newsletter"}
NAV LOGO: ${f.kitLogoB64?"PROVIDED as KIT_NAV_LOGO_BASE64 below":"none - use text title only"}

BRANDS:
${brandLines}

COMBINED STATS:
Subscribers: ${f.combinedSubs||"sum of brands"}
Tagline: ${f.combinedTagline||"The most engaged local audience in the market"}
Weekly impressions: ${f.weeklyImpressions||"calculate from brands"}
Contact email: ${f.contactEmail||"hello@newsletter.com"}

PERFORMANCE METRICS (custom - use exactly these):
${metricLines}

BRAND-SEPARATED METRICS:
${brandMetricLines}
Separate brand tabs: ${f.separateBrandMetrics?"YES - show All tab plus one tab per brand":"NO - show one unified metrics section, no tabs"}

AUDIENCE DATA:
${f.surveyData||"Use realistic placeholders: 65% female, 70% HHI $100K+, 60% homeowners, 18% business owners"}

PRICING:
${pricingLines}

TESTIMONIALS:
${testiLines}

${logoLines?`LOGO DATA:\n${logoLines}`:""}

DESIGN RULES - follow exactly:
- Google Fonts CDN: Bebas Neue (headlines) + DM Sans (body)
- Primary: ${f.brands[0]?.primaryColor||"#4A90D9"} | Accent: ${f.brands[0]?.accentColor||"#E8821A"} | Dark bg: ${f.brands[0]?.darkColor||"#0f1e30"}
- SECTION RHYTHM - never two dark or two light sections in a row: Hero=#111 dark, Meet=white, Metrics=dark blue, Reader=white, WhyAds=dark blue, Placements=#111 dark, Pricing=#F7F4EF off-white, Testimonials=white, CTA=accent color
- ZERO em dashes anywhere in the entire file. Use commas or hyphens only.
- Nav: ${f.kitLogoB64?"show nav logo image (base64 embedded) on left":"show kit title text on left"} + orange CTA button right that opens contact modal
- All logos embedded as base64 data URIs, never file paths
- All font sizes use clamp() - no fixed px font sizes
- Single file: all CSS in style block, all JS in one script block before /body
- Mobile first, responsive breakpoints at 640px and 900px
- Scroll reveal with IntersectionObserver on all sections (.reveal class, add .on when intersecting)

HERO: Two-column desktop (text+stats left, logo grid right). Logo grid scales by brand count: 1=large, 2=side by side, 3=2 on top 1 below, 4=2x2, 5=3+2, 6=3x2. Hero stats: show only metrics where isHero=true, with count-up animation. Logo images: no black borders, border-radius 12px, subtle bg.

METRICS SECTION:
- If separate tabs: tabbed interface with All Brands tab (default) plus one tab per brand. Use the combined metrics for All tab, brand-specific metrics for each brand tab.
- If no separate tabs: clean grid of metric cards, no tabs.
- Card types: blue-card (background rgba(74,144,217,.1) border rgba(74,144,217,.25)), orange-card (background rgba(232,130,26,.1) border rgba(232,130,26,.25)), neutral-card (background rgba(255,255,255,.05) border rgba(255,255,255,.1))
- Hero metrics get large cards (font-size clamp(48px,6vw,72px)). Non-hero metrics get mini cards (font-size clamp(28px,4vw,40px)).
- Layout: hero cards in 3-col grid first, then mini cards in 4-col grid below.

WHY ADS: Five full-bleed cards using negative horizontal margin to extend edge to edge. Desktop: grid-template-columns repeat(5,1fr), gap 2px. Each card: big orange number (01-05), Bebas Neue title, body paragraph. Dark glass style cards. Content:
01 No Banner Blindness - Readers chose to open this. Active attention - not a passive scroll.
02 A Trusted Environment - We curate every advertiser. That trust transfers to you on day one.
03 3 to 5x Higher Click Rates - Newsletter ads average 7 to 11% CTR. Display ads hit 0.1%.
04 Complete Transparency - Guaranteed impression counts, verified lists. No black-box metrics.
05 Hyper-Local Only - Not the whole internet. Just your specific community.

PLACEMENTS: Dark (#111) background. Six cards 3-col grid. Top border accent per card type. No pricing on cards. Each: badge + Bebas name (24px) + description + arrow-bullet feature list.

PRICING (if full): Tabbed by market. Row layout each row: left side has colored dot + name + description, right side has price right-aligned + period below + bundle savings note in blue if multi-brand.

CONTACT MODAL: Opens from nav CTA and bottom CTA buttons. Fields: First+Last (2-col), Email, Phone, Business Name, Industry (text input, NOT a select/dropdown), Comments textarea. Web3Forms action URL with comment showing where to add access key. Show success state after submit, hide form.

Output the complete self-contained HTML file now. Start with <!DOCTYPE html>.`;
  };

  const generate = async () => {
    setGenerating(true); setError(null); setGenerated(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ prompt: buildPrompt() })
      });
      const data = await res.json();
      if(data.error) throw new Error(data.error.message || data.error);
      let html=(data.html||"").trim();
      if(!html.startsWith("<!")) throw new Error("Unexpected response - try again.");
      setGenerated(html);
    } catch(err:any){ setError(err.message); }
    finally{ setGenerating(false); }
  };

  const save = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const name = form.brands[0]?.name || form.kitTitle || "Untitled Kit";
      if (currentKitId) {
        // Update existing
        await supabase.from("media_kits").update({
          name,
          form_data: form,
          generated_html: generated,
        }).eq("id", currentKitId);
      } else {
        // Create new
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";
        const { data } = await supabase.from("media_kits").insert({
          name,
          slug,
          form_data: form,
          generated_html: generated,
          is_published: false,
        }).select().single();
        if (data) {
          setCurrentKitId(data.id);
          // Update URL without full navigation
          window.history.replaceState(null, "", `/builder/${data.id}`);
        }
      }
      setSaveStatus("Saved!");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err: any) {
      setSaveStatus("Save failed");
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

  const preview = () => {
    if (!generated) return;
    const blob=new Blob([generated],{type:"text/html"});
    window.open(URL.createObjectURL(blob),"_blank");
  };

  if (loadingKit) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:36,height:36,border:"3px solid rgba(255,255,255,.07)",borderTop:"3px solid #4A90D9",
          borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>

      {/* Header */}
      <div style={{background:"#060e1a",borderBottom:"1px solid rgba(255,255,255,.07)",padding:"0 28px",
        display:"flex",alignItems:"center",justifyContent:"space-between",height:58,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {form.kitLogoB64
            ? <img src={`data:image/png;base64,${form.kitLogoB64}`} alt="" style={{height:32,width:"auto",borderRadius:5}}/>
            : <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:19,letterSpacing:2}}>
                <span style={{color:"#4A90D9"}}>LOCAL MEDIA HQ</span>
                <span style={{color:"#2a3a50",margin:"0 8px"}}>|</span>
                <span style={{color:"#E8821A"}}>MEDIA KIT BUILDER</span>
              </div>
          }
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",gap:5}}>
            {STEPS.map((s,i)=>(
              <div key={i} onClick={()=>setStep(i)} style={{padding:"5px 13px",borderRadius:4,fontSize:12,fontWeight:600,letterSpacing:.3,cursor:"pointer",
                background:i===step?"#E8821A":i<step?"rgba(74,144,217,.12)":"rgba(255,255,255,.04)",
                color:i===step?"#fff":i<step?"#4A90D9":"#3a5070",
                border:`1px solid ${i===step?"#E8821A":i<step?"rgba(74,144,217,.2)":"rgba(255,255,255,.06)"}`}}>
                {i<step?"\u2713 ":""}{s}
              </div>
            ))}
          </div>
          <div style={{width:1,height:28,background:"rgba(255,255,255,.1)",margin:"0 4px"}}/>
          <button onClick={save} disabled={saving}
            style={{padding:"7px 16px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",
              border:"1px solid rgba(74,144,217,.3)",background:"rgba(74,144,217,.12)",color:"#4A90D9",
              opacity:saving?0.5:1}}>
            {saving ? "Saving..." : saveStatus || "Save"}
          </button>
          <a href="/" style={{padding:"7px 14px",borderRadius:4,fontSize:12,fontWeight:600,
            border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#4a6080",
            textDecoration:"none",cursor:"pointer"}}>
            Dashboard
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"36px 28px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}} className="fade-in" key={step}>

          {/* STEP 0 - Sections */}
          {step===0 && (
            <div>
              <h2 style={{fontFamily:"Bebas Neue,sans-serif",fontSize:38,marginBottom:6}}>PICK YOUR SECTIONS</h2>
              <p style={{color:"#3a5070",fontSize:13,marginBottom:24}}>Select which sections to include in the generated media kit.</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {SECTIONS.map(s=>{
                  const on=form.selectedSections.includes(s.id);
                  return (
                    <div key={s.id} onClick={()=>toggleSection(s.id)}
                      style={{padding:"12px 14px",borderRadius:8,cursor:s.required?"default":"pointer",
                        border:`1px solid ${on?"#4A90D9":"rgba(255,255,255,.07)"}`,
                        background:on?"rgba(74,144,217,.07)":"rgba(255,255,255,.02)",
                        display:"flex",gap:10,alignItems:"flex-start",transition:"all .15s"}}>
                      <div style={{width:17,height:17,borderRadius:3,flexShrink:0,marginTop:2,
                        border:`2px solid ${on?"#4A90D9":"#1a2a3a"}`,background:on?"#4A90D9":"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {on&&<span style={{fontSize:9,color:"#fff",fontWeight:800}}>{"\u2713"}</span>}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:on?"#fff":"#6a8090",display:"flex",gap:7,alignItems:"center"}}>
                          {s.label}
                          {s.required&&<span style={{fontSize:9,color:"#E8821A",letterSpacing:1.2,textTransform:"uppercase"}}>Required</span>}
                          {s.recommended&&<span style={{fontSize:9,color:"#4A90D9",letterSpacing:1.2,textTransform:"uppercase"}}>Recommended</span>}
                        </div>
                        <div style={{fontSize:11,color:"#2a4060",marginTop:2}}>{s.desc}</div>
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
              <h2 style={{fontFamily:"Bebas Neue,sans-serif",fontSize:38,marginBottom:6}}>BRAND INFO</h2>
              <p style={{color:"#3a5070",fontSize:13,marginBottom:24}}>Enter details for each newsletter. Upload logos as PNG files.</p>

              <div style={{...S.card,marginBottom:16}}>
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:15,color:"#4A90D9",marginBottom:14,letterSpacing:1}}>KIT NAVIGATION (TOP BAR)</div>
                <G2 cols={2}>
                  <Field label="Kit Title Text" value={form.kitTitle} onChange={(v:any)=>set("kitTitle",v)} placeholder="Henderson HQ x West Vegas HQ"/>
                  <LogoUpload label="Nav Logo (replaces title text)" b64={form.kitLogoB64} name={form.kitLogoName}
                    onChange={(b64:string,name:string)=>setForm((f:any)=>({...f,kitLogoB64:b64,kitLogoName:name}))}/>
                </G2>
              </div>

              <div style={{marginBottom:16}}>
                <Label c="How many newsletters in this kit?"/>
                <div style={{display:"flex",gap:6,marginTop:6}}>
                  {[1,2,3,4,5,6].map(n=>(
                    <button key={n} onClick={()=>setBrandCount(n)}
                      style={{width:44,height:40,borderRadius:5,fontWeight:700,fontSize:15,cursor:"pointer",
                        border:`1px solid ${form.brandCount===n?"#E8821A":"#1a2a3a"}`,
                        background:form.brandCount===n?"#E8821A":"transparent",
                        color:form.brandCount===n?"#fff":"#4a6080"}}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {activeBrands.map((b:any,i:number)=>(
                <div key={i} style={{...S.card,marginBottom:12}}>
                  <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:15,color:"#E8821A",marginBottom:14,letterSpacing:1}}>
                    NEWSLETTER {i+1}
                  </div>
                  <G2 cols={2}>
                    <Field label="Newsletter Name" value={b.name} onChange={(v:any)=>updateBrand(i,"name",v)} placeholder="Henderson HQ"/>
                    <Field label="Market / City" value={b.market} onChange={(v:any)=>updateBrand(i,"market",v)} placeholder="Henderson, NV"/>
                    <Field label="Subscriber Count" value={b.subscribers} onChange={(v:any)=>updateBrand(i,"subscribers",v)} placeholder="32,000"/>
                    <Field label="Send Frequency" value={b.frequency} onChange={(v:any)=>updateBrand(i,"frequency",v)} placeholder="3x weekly"/>
                    <Field label="Open Rate %" value={b.openRate} onChange={(v:any)=>updateBrand(i,"openRate",v)} placeholder="58"/>
                    <LogoUpload label="Newsletter Logo" b64={b.logoB64} name={b.logoName}
                      onChange={(b64:string,name:string)=>{updateBrand(i,"logoB64",b64);updateBrand(i,"logoName",name);}}/>
                  </G2>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginTop:14}}>
                    <ColorPicker label="Primary Color" value={b.primaryColor} onChange={(v:any)=>updateBrand(i,"primaryColor",v)}/>
                    <ColorPicker label="Accent Color" value={b.accentColor} onChange={(v:any)=>updateBrand(i,"accentColor",v)}/>
                    <ColorPicker label="Dark Background" value={b.darkColor} onChange={(v:any)=>updateBrand(i,"darkColor",v)}/>
                  </div>
                </div>
              ))}

              <div style={{...S.card}}>
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:15,color:"#4A90D9",marginBottom:14,letterSpacing:1}}>COMBINED STATS</div>
                <G2 cols={2}>
                  <Field label="Combined Subscribers" value={form.combinedSubs} onChange={(v:any)=>set("combinedSubs",v)} placeholder="52,000"/>
                  <Field label="Weekly Impressions" value={form.weeklyImpressions} onChange={(v:any)=>set("weeklyImpressions",v)} placeholder="97,000"/>
                  <Field label="Contact Email" value={form.contactEmail} onChange={(v:any)=>set("contactEmail",v)} placeholder="hello@hendersonhq.com"/>
                  <Field label="Kit Tagline" value={form.combinedTagline} onChange={(v:any)=>set("combinedTagline",v)} placeholder="Las Vegas Valley's most engaged local audience"/>
                </G2>
              </div>
            </div>
          )}

          {/* STEP 2 - Metrics */}
          {step===2 && (
            <div>
              <h2 style={{fontFamily:"Bebas Neue,sans-serif",fontSize:38,marginBottom:6}}>PERFORMANCE METRICS</h2>
              <p style={{color:"#3a5070",fontSize:13,marginBottom:24}}>Add any metrics you want to show - email stats, social following, website traffic, anything. Mark up to 3 as HERO to show large in the stats row.</p>

              {form.brandCount > 1 && (
                <div style={{...S.card,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:3}}>Separate metrics per brand?</div>
                    <div style={{fontSize:12,color:"#3a5070"}}>Shows All Brands tab plus individual tabs for each newsletter</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {([["No","Combine all into one section",false],["Yes","Separate tabs per brand",true]] as const).map(([lbl,tip,val])=>(
                      <button key={lbl} onClick={()=>set("separateBrandMetrics",val)}
                        style={{padding:"7px 16px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",
                          border:`1px solid ${form.separateBrandMetrics===val?"#4A90D9":"#1a2a3a"}`,
                          background:form.separateBrandMetrics===val?"rgba(74,144,217,.15)":"transparent",
                          color:form.separateBrandMetrics===val?"#4A90D9":"#4a6080"}}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{...S.card,marginBottom:form.separateBrandMetrics?16:0}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:15,color:"#4A90D9",letterSpacing:1}}>
                    {form.separateBrandMetrics?"COMBINED (ALL BRANDS TAB)":"YOUR METRICS"}
                  </div>
                  <div style={{fontSize:10,color:"#3a5070",letterSpacing:1,textTransform:"uppercase"}}>Label - Value - Color - Hero?</div>
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
                  style={{marginTop:10,padding:"7px 16px",borderRadius:5,border:"1px dashed #1a3a5a",
                    background:"transparent",color:"#4A90D9",cursor:"pointer",fontSize:12,fontWeight:600}}>
                  + Add Metric
                </button>
              </div>

              {form.separateBrandMetrics && activeBrands.map((b:any,bi:number)=>(
                <div key={bi} style={{...S.card,marginBottom:12}}>
                  <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:15,color:"#E8821A",marginBottom:14,letterSpacing:1}}>
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
                  }} style={{marginTop:10,padding:"7px 16px",borderRadius:5,border:"1px dashed #1a3a2a",
                    background:"transparent",color:"#E8821A",cursor:"pointer",fontSize:12,fontWeight:600}}>
                    + Add Metric
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3 - Audience + Testimonials */}
          {step===3 && (
            <div>
              <h2 style={{fontFamily:"Bebas Neue,sans-serif",fontSize:38,marginBottom:6}}>AUDIENCE + TESTIMONIALS</h2>
              <p style={{color:"#3a5070",fontSize:13,marginBottom:24}}>Paste any survey stats you have. Add advertiser quotes or leave blank for smart placeholders.</p>

              <div style={{...S.card,marginBottom:16}}>
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:15,color:"#4A90D9",marginBottom:8,letterSpacing:1}}>AUDIENCE DATA</div>
                <p style={{fontSize:12,color:"#2a4060",marginBottom:10}}>Paste survey stats in any format. e.g. "71% female, 75% HHI $100K+, 63% homeowners, 22% business owners, top areas: Henderson 78%, Summerlin 20%"</p>
                <textarea value={form.surveyData} onChange={(e:any)=>set("surveyData",e.target.value)}
                  placeholder="Leave blank to use smart defaults..."
                  style={{...S.input,minHeight:80,resize:"vertical"}}/>
              </div>

              <div style={S.card}>
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:15,color:"#4A90D9",marginBottom:16,letterSpacing:1}}>TESTIMONIALS</div>
                {form.testimonials.map((t:any,i:number)=>(
                  <div key={i} style={{marginBottom:14,paddingBottom:14,borderBottom:i<form.testimonials.length-1?"1px solid rgba(255,255,255,.05)":"none"}}>
                    <div style={{fontSize:11,color:"#E8821A",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Quote {i+1}</div>
                    <textarea value={t.quote} onChange={(e:any)=>updateTesti(i,"quote",e.target.value)}
                      placeholder="We ran one issue and had three new leads that same week..."
                      style={{...S.input,minHeight:60,resize:"vertical",marginBottom:8}}/>
                    <G2 cols={2}>
                      <Field label="Name" value={t.name} onChange={(v:any)=>updateTesti(i,"name",v)} placeholder="Sarah M."/>
                      <Field label="Company" value={t.company} onChange={(v:any)=>updateTesti(i,"company",v)} placeholder="ReMax Henderson"/>
                    </G2>
                  </div>
                ))}
                <button onClick={()=>set("testimonials",[...form.testimonials,{quote:"",name:"",company:""}])}
                  style={{padding:"7px 14px",borderRadius:5,border:"1px solid #1a2a3a",background:"transparent",
                    color:"#4a6080",cursor:"pointer",fontSize:12}}>
                  + Add Quote
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 - Pricing */}
          {step===4 && (
            <div>
              <h2 style={{fontFamily:"Bebas Neue,sans-serif",fontSize:38,marginBottom:6}}>PRICING</h2>
              <p style={{color:"#3a5070",fontSize:13,marginBottom:20}}>Show specific prices or send advertisers to a contact form instead.</p>

              <div style={{display:"flex",gap:8,marginBottom:24}}>
                {([["full","Show Prices"],["on-request","On Request - Contact Us"]] as const).map(([mode,label])=>(
                  <button key={mode} onClick={()=>set("pricingMode",mode)}
                    style={{padding:"9px 20px",borderRadius:4,fontSize:13,fontWeight:600,cursor:"pointer",
                      border:`1px solid ${form.pricingMode===mode?"#E8821A":"#1a2a3a"}`,
                      background:form.pricingMode===mode?"#E8821A":"transparent",
                      color:form.pricingMode===mode?"#fff":"#4a6080"}}>
                    {label}
                  </button>
                ))}
              </div>

              {form.pricingMode==="full" ? (
                <div style={S.card}>
                  <div style={{display:"grid",
                    gridTemplateColumns:form.brandCount>1?`2fr 1fr ${activeBrands.map(()=>"1fr").join(" ")}`:"2fr 1fr",
                    gap:8,marginBottom:10,paddingBottom:10,borderBottom:"1px solid rgba(255,255,255,.07)"}}>
                    <span style={S.label}>Ad Unit</span>
                    <span style={{...S.label,textAlign:"right" as const}}>Bundle</span>
                    {form.brandCount>1&&activeBrands.map((b:any,i:number)=>(
                      <span key={i} style={{...S.label,textAlign:"right" as const}}>{b.name||`Brand ${i+1}`}</span>
                    ))}
                  </div>
                  {form.pricing.map((p:any,pi:number)=>(
                    <div key={pi} style={{display:"grid",
                      gridTemplateColumns:form.brandCount>1?`2fr 1fr ${activeBrands.map(()=>"1fr").join(" ")}`:"2fr 1fr",
                      gap:8,marginBottom:8,alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:13,color:"#ccc",fontWeight:600}}>{p.unit}</div>
                        <div style={{fontSize:11,color:"#2a4060"}}>{p.desc}</div>
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
                <div style={{...S.card,color:"#4a6080",fontSize:13,lineHeight:1.8}}>
                  The pricing section will show a clean "Contact us for rates" block. Good for new newsletters or when you prefer to discuss packages directly.
                </div>
              )}
            </div>
          )}

          {/* STEP 5 - Generate */}
          {step===5 && (
            <div style={{textAlign:"center"}}>
              <h2 style={{fontFamily:"Bebas Neue,sans-serif",fontSize:52,marginBottom:8}}>
                <span style={{color:"#4A90D9"}}>READY</span> TO BUILD
              </h2>
              <p style={{color:"#3a5070",fontSize:14,maxWidth:440,margin:"0 auto 32px",lineHeight:1.65}}>
                Claude will generate your complete, self-contained media kit HTML file. Usually takes 30 to 60 seconds.
              </p>

              <div style={{...S.card,textAlign:"left",maxWidth:500,margin:"0 auto 28px"}}>
                <div style={{fontSize:10,color:"#2a4060",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Build Summary</div>
                {[
                  ["Sections", form.selectedSections.length+" selected: "+form.selectedSections.join(", ")],
                  ["Brands", activeBrands.map((b:any)=>b.name||"Unnamed").join(", ")],
                  ["Logos", activeBrands.filter((b:any)=>b.logoB64).length+" of "+form.brandCount+" uploaded"],
                  ["Metrics", form.metrics.length+" total, "+form.metrics.filter((m:any)=>m.isHero).length+" hero"],
                  ["Separate brand metrics", form.brandCount>1 ? (form.separateBrandMetrics?"Yes, with tabs":"No, combined") : "N/A"],
                  ["Pricing", form.pricingMode],
                ].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",
                    borderBottom:"1px solid rgba(255,255,255,.04)",fontSize:12}}>
                    <span style={{color:"#3a5070",flexShrink:0,marginRight:16}}>{k}</span>
                    <span style={{color:"#aaa",textAlign:"right"}}>{v}</span>
                  </div>
                ))}
              </div>

              {!generating&&!generated&&(
                <button onClick={generate}
                  style={{padding:"15px 48px",borderRadius:6,border:"none",background:"#E8821A",
                    color:"#fff",fontWeight:700,fontSize:16,cursor:"pointer",letterSpacing:1,
                    boxShadow:"0 4px 24px rgba(232,130,26,.3)"}}>
                  GENERATE MEDIA KIT
                </button>
              )}

              {generating&&(
                <div>
                  <div style={{width:44,height:44,border:"3px solid rgba(255,255,255,.07)",borderTop:"3px solid #E8821A",
                    borderRadius:"50%",margin:"0 auto 14px",animation:"spin 1s linear infinite"}}/>
                  <div style={{color:"#3a5070",fontSize:13}}>Building your media kit...</div>
                </div>
              )}

              {error&&(
                <div style={{padding:14,background:"rgba(255,60,60,.07)",border:"1px solid rgba(255,60,60,.15)",
                  borderRadius:7,color:"#ff7070",fontSize:13,maxWidth:480,margin:"16px auto 0"}}>
                  {error}
                </div>
              )}

              {generated&&!generating&&(
                <div>
                  <div style={{padding:"10px 20px",background:"rgba(60,217,120,.07)",border:"1px solid rgba(60,217,120,.18)",
                    borderRadius:6,color:"#4ad990",fontSize:13,marginBottom:20,display:"inline-block"}}>
                    Generated successfully.
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                    <button onClick={preview}
                      style={{padding:"11px 26px",borderRadius:5,border:"1px solid #4A90D9",
                        background:"transparent",color:"#4A90D9",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                      Preview in New Tab
                    </button>
                    <button onClick={download}
                      style={{padding:"11px 26px",borderRadius:5,border:"none",background:"#E8821A",
                        color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                      Download HTML
                    </button>
                    <button onClick={save}
                      style={{padding:"11px 26px",borderRadius:5,border:"1px solid rgba(74,217,144,.3)",
                        background:"rgba(74,217,144,.1)",color:"#4ad990",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                      Save Kit
                    </button>
                    <button onClick={()=>{setGenerated(null);setError(null);}}
                      style={{padding:"11px 26px",borderRadius:5,border:"1px solid #1a2a3a",
                        background:"transparent",color:"#4a6080",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nav */}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:36,paddingTop:20,
            borderTop:"1px solid rgba(255,255,255,.05)"}}>
            <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}
              style={{padding:"9px 22px",borderRadius:5,border:"1px solid #1a2a3a",background:"transparent",
                color:step===0?"#1a2a3a":"#4a6080",cursor:step===0?"default":"pointer",fontSize:13,fontWeight:600}}>
              Back
            </button>
            {step<5&&(
              <button onClick={()=>setStep(s=>Math.min(5,s+1))}
                style={{padding:"9px 28px",borderRadius:5,border:"none",background:"#4A90D9",
                  color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                Next
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
