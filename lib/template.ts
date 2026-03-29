// Instant HTML template engine - replaces AI generation entirely.
// Takes form data from the wizard and returns a complete, self-contained HTML file.

export function buildMediaKitHTML(form: any): string {
  const f = form;
  const brands = (f.brands || []).slice(0, f.brandCount || 1);
  const primary = brands[0]?.primaryColor || "#4A90D9";
  const accent = brands[0]?.accentColor || "#E8821A";
  const dark = brands[0]?.darkColor || "#0f1e30";
  const sections = f.selectedSections || [];
  const has = (id: string) => sections.includes(id);
  const metrics = f.metrics || [];
  const heroMetrics = metrics.filter((m: any) => m.isHero && m.label);
  const miniMetrics = metrics.filter((m: any) => !m.isHero && m.label);
  const testimonials = (f.testimonials || []).filter((t: any) => t.quote);
  const contactEmail = f.contactEmail || "hello@newsletter.com";
  const kitTitle = f.kitTitle || brands[0]?.name || "My Newsletter";

  function esc(s: string): string {
    return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function colorVal(c: string): string {
    if (c === "blue") return primary;
    if (c === "orange") return accent;
    return "#8a9ab0";
  }

  function cardBg(c: string): string {
    if (c === "blue") return `rgba(${hexToRgb(primary)},.1)`;
    if (c === "orange") return `rgba(${hexToRgb(accent)},.1)`;
    return "rgba(255,255,255,.05)";
  }

  function cardBorder(c: string): string {
    if (c === "blue") return `rgba(${hexToRgb(primary)},.25)`;
    if (c === "orange") return `rgba(${hexToRgb(accent)},.25)`;
    return "rgba(255,255,255,.1)";
  }

  function hexToRgb(hex: string): string {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r},${g},${b}`;
  }

  // Logo grid layout based on brand count
  function logoGridCols(): string {
    const n = brands.filter((b: any) => b.logoB64).length;
    if (n <= 1) return "1fr";
    if (n === 2) return "1fr 1fr";
    if (n <= 4) return "1fr 1fr";
    return "1fr 1fr 1fr";
  }

  // Build sections
  let sectionsHTML = "";

  // NAV
  const navLogo = f.kitLogoB64
    ? `<img src="data:image/png;base64,${f.kitLogoB64}" alt="${esc(kitTitle)}" style="height:36px;width:auto;border-radius:6px">`
    : `<span style="font-family:'Bebas Neue',sans-serif;font-size:clamp(16px,2vw,22px);letter-spacing:2px;color:#fff">${esc(kitTitle)}</span>`;

  sectionsHTML += `
  <nav id="kit-nav" style="position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.08);padding:0 clamp(16px,4vw,48px);display:flex;align-items:center;justify-content:space-between;height:60px">
    <div style="display:flex;align-items:center;gap:12px">${navLogo}</div>
    <button onclick="document.getElementById('contact-modal').style.display='flex'" style="padding:10px 24px;border-radius:6px;border:none;background:${accent};color:#fff;font-weight:700;font-size:clamp(12px,1.4vw,14px);cursor:pointer;letter-spacing:.5px;font-family:'DM Sans',sans-serif">GET IN TOUCH</button>
  </nav>`;

  // HERO
  if (has("hero")) {
    const logoGrid = brands.filter((b: any) => b.logoB64).map((b: any) =>
      `<div style="background:rgba(255,255,255,.06);border-radius:12px;padding:clamp(12px,2vw,24px);display:flex;align-items:center;justify-content:center">
        <img src="data:image/png;base64,${b.logoB64}" alt="${esc(b.name)}" style="max-width:100%;max-height:120px;border-radius:8px">
      </div>`
    ).join("");

    const heroStatsHTML = heroMetrics.map((m: any) =>
      `<div style="text-align:center">
        <div class="count-up" data-target="${esc(m.value)}" style="font-family:'Bebas Neue',sans-serif;font-size:clamp(36px,5vw,56px);color:${colorVal(m.color)};line-height:1">${esc(m.value)}</div>
        <div style="font-size:clamp(10px,1.2vw,13px);color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.5px;margin-top:4px">${esc(m.label)}</div>
      </div>`
    ).join("");

    sectionsHTML += `
  <section class="reveal" style="background:#111;padding:clamp(80px,12vw,140px) clamp(16px,4vw,48px) clamp(60px,8vw,100px);margin-top:60px">
    <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr;gap:40px;align-items:center" class="hero-grid">
      <div>
        <div style="font-size:clamp(11px,1.2vw,13px);color:${accent};text-transform:uppercase;letter-spacing:3px;margin-bottom:12px;font-weight:700">Media Kit 2026</div>
        <h1 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(40px,7vw,80px);line-height:.95;margin-bottom:16px;color:#fff">${esc(kitTitle)}</h1>
        <p style="font-size:clamp(14px,1.6vw,18px);color:rgba(255,255,255,.55);line-height:1.6;max-width:500px;margin-bottom:32px">${esc(f.combinedTagline || "The most engaged local audience in the market")}</p>
        ${heroStatsHTML ? `<div style="display:flex;gap:clamp(20px,3vw,40px);flex-wrap:wrap">${heroStatsHTML}</div>` : ""}
      </div>
      ${logoGrid ? `<div style="display:grid;grid-template-columns:${logoGridCols()};gap:12px">${logoGrid}</div>` : ""}
    </div>
  </section>`;
  }

  // MEET THE BRANDS
  if (has("meet") && brands.length > 0) {
    const brandCards = brands.map((b: any) => {
      const logo = b.logoB64
        ? `<img src="data:image/png;base64,${b.logoB64}" alt="${esc(b.name)}" style="height:48px;width:auto;border-radius:8px;margin-bottom:16px">`
        : "";
      return `<div style="background:#f8f8f8;border-radius:12px;padding:clamp(24px,3vw,36px);text-align:center">
        ${logo}
        <h3 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(20px,2.5vw,28px);color:#111;margin-bottom:8px">${esc(b.name || "Newsletter")}</h3>
        <div style="font-size:clamp(12px,1.3vw,14px);color:#666;margin-bottom:12px">${esc(b.market || "")}</div>
        <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap">
          ${b.subscribers ? `<div><div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(22px,2.5vw,32px);color:${b.primaryColor || primary}">${esc(b.subscribers)}</div><div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">Subscribers</div></div>` : ""}
          ${b.openRate ? `<div><div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(22px,2.5vw,32px);color:${b.accentColor || accent}">${esc(b.openRate)}%</div><div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">Open Rate</div></div>` : ""}
          ${b.frequency ? `<div><div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(18px,2vw,24px);color:#555">${esc(b.frequency)}</div><div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">Frequency</div></div>` : ""}
        </div>
      </div>`;
    }).join("");

    sectionsHTML += `
  <section class="reveal" style="background:#fff;padding:clamp(60px,8vw,100px) clamp(16px,4vw,48px)">
    <div style="max-width:1100px;margin:0 auto">
      <div style="text-align:center;margin-bottom:clamp(32px,5vw,56px)">
        <div style="font-size:clamp(11px,1.2vw,13px);color:${accent};text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;font-weight:700">Our Brands</div>
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(32px,5vw,52px);color:#111">Meet the Newsletters</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px">${brandCards}</div>
    </div>
  </section>`;
  }

  // METRICS
  if (has("metrics") && metrics.filter((m: any) => m.label).length > 0) {
    const renderMetricCards = (items: any[]) => {
      const heroes = items.filter((m: any) => m.isHero && m.label);
      const minis = items.filter((m: any) => !m.isHero && m.label);
      let html = "";
      if (heroes.length > 0) {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px">`;
        heroes.forEach((m: any) => {
          html += `<div style="background:${cardBg(m.color)};border:1px solid ${cardBorder(m.color)};border-radius:12px;padding:clamp(24px,3vw,36px);text-align:center">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(48px,6vw,72px);color:${colorVal(m.color)};line-height:1">${esc(m.value || "0")}</div>
            <div style="font-size:clamp(11px,1.2vw,14px);color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:2px;margin-top:8px">${esc(m.label)}</div>
          </div>`;
        });
        html += `</div>`;
      }
      if (minis.length > 0) {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">`;
        minis.forEach((m: any) => {
          html += `<div style="background:${cardBg(m.color)};border:1px solid ${cardBorder(m.color)};border-radius:10px;padding:clamp(16px,2vw,24px);text-align:center">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(28px,4vw,40px);color:${colorVal(m.color)};line-height:1">${esc(m.value || "0")}</div>
            <div style="font-size:clamp(10px,1.1vw,12px);color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:1.5px;margin-top:6px">${esc(m.label)}</div>
          </div>`;
        });
        html += `</div>`;
      }
      return html;
    };

    let metricsContent = "";

    if (f.separateBrandMetrics && brands.length > 1) {
      // Tabbed metrics
      const tabNames = ["All Brands", ...brands.map((b: any) => b.name || "Brand")];
      const tabsHTML = tabNames.map((name: string, i: number) =>
        `<button class="metric-tab${i === 0 ? " active" : ""}" onclick="switchMetricTab(${i})" style="padding:8px 20px;border-radius:4px;border:1px solid ${i === 0 ? accent : "rgba(255,255,255,.15)"};background:${i === 0 ? accent : "transparent"};color:${i === 0 ? "#fff" : "rgba(255,255,255,.5)"};font-weight:700;font-size:clamp(11px,1.2vw,13px);cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:.5px">${esc(name)}</button>`
      ).join("");

      let panelsHTML = `<div class="metric-panel" style="display:block">${renderMetricCards(metrics)}</div>`;
      brands.forEach((b: any, i: number) => {
        const bm = f.brandMetrics?.[i] || metrics;
        panelsHTML += `<div class="metric-panel" style="display:none">${renderMetricCards(bm)}</div>`;
      });

      metricsContent = `
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:32px;flex-wrap:wrap">${tabsHTML}</div>
        ${panelsHTML}`;
    } else {
      metricsContent = renderMetricCards(metrics);
    }

    sectionsHTML += `
  <section class="reveal" style="background:${dark};padding:clamp(60px,8vw,100px) clamp(16px,4vw,48px)">
    <div style="max-width:1100px;margin:0 auto">
      <div style="text-align:center;margin-bottom:clamp(32px,5vw,48px)">
        <div style="font-size:clamp(11px,1.2vw,13px);color:${accent};text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;font-weight:700">By the Numbers</div>
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(32px,5vw,52px);color:#fff">Performance Metrics</h2>
      </div>
      ${metricsContent}
    </div>
  </section>`;
  }

  // READER PROFILE
  if (has("reader")) {
    const surveyData = f.surveyData || "65% female, 70% HHI $100K+, 60% homeowners, 18% business owners";
    // Parse survey data into display items
    const items = surveyData.split(/,\s*/).filter((s: string) => s.trim()).map((item: string) => {
      const trimmed = item.trim();
      const match = trimmed.match(/^(\d+%?)\s+(.+)/);
      if (match) return { value: match[1], label: match[2] };
      return { value: "", label: trimmed };
    });

    const demographicCards = items.map((item: any) =>
      `<div style="background:#f8f8f8;border-radius:10px;padding:clamp(20px,2.5vw,28px);text-align:center">
        ${item.value ? `<div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(28px,4vw,42px);color:${primary};line-height:1;margin-bottom:6px">${esc(item.value)}</div>` : ""}
        <div style="font-size:clamp(12px,1.3vw,14px);color:#555">${esc(item.label)}</div>
      </div>`
    ).join("");

    sectionsHTML += `
  <section class="reveal" style="background:#fff;padding:clamp(60px,8vw,100px) clamp(16px,4vw,48px)">
    <div style="max-width:1100px;margin:0 auto">
      <div style="text-align:center;margin-bottom:clamp(32px,5vw,48px)">
        <div style="font-size:clamp(11px,1.2vw,13px);color:${accent};text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;font-weight:700">Our Audience</div>
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(32px,5vw,52px);color:#111">Reader Profile</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px">${demographicCards}</div>
    </div>
  </section>`;
  }

  // WHY NEWSLETTER ADS
  if (has("why")) {
    const whyCards = [
      { num: "01", title: "No Banner Blindness", body: "Readers chose to open this. Active attention, not a passive scroll." },
      { num: "02", title: "A Trusted Environment", body: "We curate every advertiser. That trust transfers to you on day one." },
      { num: "03", title: "3 to 5x Higher Click Rates", body: "Newsletter ads average 7 to 11% CTR. Display ads hit 0.1%." },
      { num: "04", title: "Complete Transparency", body: "Guaranteed impression counts, verified lists. No black-box metrics." },
      { num: "05", title: "Hyper-Local Only", body: "Not the whole internet. Just your specific community." },
    ];

    const cardsHTML = whyCards.map(c =>
      `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);padding:clamp(24px,3vw,36px);text-align:left">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(36px,5vw,56px);color:${accent};line-height:1;margin-bottom:12px">${c.num}</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(16px,2vw,22px);color:#fff;margin-bottom:8px;letter-spacing:.5px">${c.title}</div>
        <div style="font-size:clamp(12px,1.3vw,14px);color:rgba(255,255,255,.45);line-height:1.6">${c.body}</div>
      </div>`
    ).join("");

    sectionsHTML += `
  <section class="reveal" style="background:${dark};padding:clamp(60px,8vw,100px) 0">
    <div style="max-width:100%;padding:0">
      <div style="text-align:center;margin-bottom:clamp(32px,5vw,48px);padding:0 clamp(16px,4vw,48px)">
        <div style="font-size:clamp(11px,1.2vw,13px);color:${accent};text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;font-weight:700">Why Us</div>
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(32px,5vw,52px);color:#fff">Why Newsletter Ads Work</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px" class="why-grid">${cardsHTML}</div>
    </div>
  </section>`;
  }

  // PLACEMENTS
  if (has("placements")) {
    const placements = [
      { name: "Main Sponsor", badge: "Premium", desc: "Top position logo placement, 150 words of copy, plus a featured image. Maximum visibility.", features: ["Top-of-email placement", "Logo + 150 words + image", "Highest click-through rates"], borderColor: accent },
      { name: "Supporting Sponsor", badge: "Standard", desc: "Mid-email placement with 100 words and an image. Strong engagement at an accessible price.", features: ["Mid-email placement", "100 words + image", "Strong engagement metrics"], borderColor: primary },
      { name: "Community Sponsor", badge: "Starter", desc: "Highlighted text link with 40 words. Great entry point for local businesses.", features: ["Highlighted link placement", "40 words of copy", "Cost-effective option"], borderColor: "#8a9ab0" },
      { name: "Classified / Event", badge: "Quick Hit", desc: "Short text with a link. Perfect for events, job listings, and announcements.", features: ["25 words + link", "Event promotions", "Job listings"], borderColor: "#8a9ab0" },
      { name: "Sponsored Story", badge: "Editorial", desc: "Full editorial feature written about your business, permanently archived on our site.", features: ["Full editorial feature", "Permanent archive link", "Social media amplification"], borderColor: accent },
      { name: "Social Bundle", badge: "Add-On", desc: "Extend your reach beyond the inbox with dedicated social media posts.", features: ["Cross-platform promotion", "Custom social content", "Extended audience reach"], borderColor: primary },
    ];

    const placementCards = placements.map(p =>
      `<div style="background:rgba(255,255,255,.04);border-top:3px solid ${p.borderColor};border-radius:0 0 10px 10px;padding:clamp(20px,2.5vw,28px)">
        <div style="display:inline-block;padding:3px 10px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${p.borderColor};background:rgba(255,255,255,.06);margin-bottom:12px">${p.badge}</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(18px,2.2vw,24px);color:#fff;margin-bottom:8px">${p.name}</div>
        <div style="font-size:clamp(12px,1.3vw,14px);color:rgba(255,255,255,.4);line-height:1.6;margin-bottom:16px">${p.desc}</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${p.features.map(feat => `<div style="font-size:clamp(11px,1.2vw,13px);color:rgba(255,255,255,.55);padding-left:16px;position:relative"><span style="position:absolute;left:0;color:${p.borderColor}">&#8594;</span>${feat}</div>`).join("")}
        </div>
      </div>`
    ).join("");

    sectionsHTML += `
  <section class="reveal" style="background:#111;padding:clamp(60px,8vw,100px) clamp(16px,4vw,48px)">
    <div style="max-width:1100px;margin:0 auto">
      <div style="text-align:center;margin-bottom:clamp(32px,5vw,48px)">
        <div style="font-size:clamp(11px,1.2vw,13px);color:${accent};text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;font-weight:700">Ad Options</div>
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(32px,5vw,52px);color:#fff">Pick Your Placement</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">${placementCards}</div>
    </div>
  </section>`;
  }

  // PRICING
  if (has("pricing")) {
    if (f.pricingMode === "full") {
      const pricingRows = (f.pricing || []).map((p: any) => {
        const dotColor = p.dot === "orange" ? accent : p.dot === "blue" ? primary : "#8a9ab0";

        if (f.brandCount > 1) {
          // Multi-brand: show bundle + per-brand columns
          const brandCols = brands.map((b: any, i: number) =>
            `<div style="text-align:right">
              <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(18px,2.2vw,24px);color:#111">${esc(p.b?.[i] || "")}</div>
              <div style="font-size:11px;color:#999">${esc(b.name || "Brand " + (i + 1))}</div>
            </div>`
          ).join("");

          return `<div style="display:grid;grid-template-columns:2fr 1fr ${brands.map(() => "1fr").join(" ")};gap:16px;align-items:center;padding:clamp(16px,2vw,24px) 0;border-bottom:1px solid #eee">
            <div style="display:flex;align-items:flex-start;gap:12px">
              <div style="width:10px;height:10px;border-radius:50%;background:${dotColor};margin-top:6px;flex-shrink:0"></div>
              <div>
                <div style="font-weight:700;font-size:clamp(14px,1.5vw,16px);color:#111">${esc(p.unit)}</div>
                <div style="font-size:clamp(12px,1.3vw,13px);color:#888;margin-top:2px">${esc(p.desc)}</div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(20px,2.5vw,28px);color:${primary}">${esc(p.bundle || "")}</div>
              ${p.bundle ? `<div style="font-size:11px;color:${primary};font-weight:600">Bundle</div>` : ""}
            </div>
            ${brandCols}
          </div>`;
        }

        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:clamp(16px,2vw,24px) 0;border-bottom:1px solid #eee;gap:16px">
          <div style="display:flex;align-items:flex-start;gap:12px;flex:1">
            <div style="width:10px;height:10px;border-radius:50%;background:${dotColor};margin-top:6px;flex-shrink:0"></div>
            <div>
              <div style="font-weight:700;font-size:clamp(14px,1.5vw,16px);color:#111">${esc(p.unit)}</div>
              <div style="font-size:clamp(12px,1.3vw,13px);color:#888;margin-top:2px">${esc(p.desc)}</div>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(22px,3vw,32px);color:#111">${esc(p.bundle || "")}</div>
          </div>
        </div>`;
      }).join("");

      sectionsHTML += `
  <section class="reveal" style="background:#F7F4EF;padding:clamp(60px,8vw,100px) clamp(16px,4vw,48px)">
    <div style="max-width:900px;margin:0 auto">
      <div style="text-align:center;margin-bottom:clamp(32px,5vw,48px)">
        <div style="font-size:clamp(11px,1.2vw,13px);color:${accent};text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;font-weight:700">Investment</div>
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(32px,5vw,52px);color:#111">Pricing</h2>
      </div>
      ${pricingRows}
    </div>
  </section>`;
    } else {
      // On-request pricing
      sectionsHTML += `
  <section class="reveal" style="background:#F7F4EF;padding:clamp(60px,8vw,100px) clamp(16px,4vw,48px)">
    <div style="max-width:700px;margin:0 auto;text-align:center">
      <div style="font-size:clamp(11px,1.2vw,13px);color:${accent};text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;font-weight:700">Investment</div>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(32px,5vw,52px);color:#111;margin-bottom:16px">Pricing</h2>
      <p style="font-size:clamp(14px,1.6vw,18px);color:#666;line-height:1.6;margin-bottom:32px">We build custom packages based on your goals, budget, and timeline. Reach out and we will put together a plan that fits.</p>
      <button onclick="document.getElementById('contact-modal').style.display='flex'" style="padding:14px 36px;border-radius:6px;border:none;background:${accent};color:#fff;font-weight:700;font-size:clamp(14px,1.5vw,16px);cursor:pointer;font-family:'DM Sans',sans-serif">Contact Us for Rates</button>
    </div>
  </section>`;
    }
  }

  // TESTIMONIALS
  if (has("testimonials") && testimonials.length > 0) {
    const testiCards = testimonials.map((t: any) =>
      `<div style="background:#f8f8f8;border-radius:12px;padding:clamp(24px,3vw,36px);border-left:4px solid ${accent}">
        <div style="font-size:clamp(14px,1.5vw,17px);color:#333;line-height:1.7;margin-bottom:16px;font-style:italic">"${esc(t.quote)}"</div>
        <div style="font-weight:700;font-size:clamp(13px,1.4vw,15px);color:#111">${esc(t.name || "")}</div>
        ${t.company ? `<div style="font-size:clamp(12px,1.3vw,13px);color:#888">${esc(t.company)}</div>` : ""}
      </div>`
    ).join("");

    sectionsHTML += `
  <section class="reveal" style="background:#fff;padding:clamp(60px,8vw,100px) clamp(16px,4vw,48px)">
    <div style="max-width:1100px;margin:0 auto">
      <div style="text-align:center;margin-bottom:clamp(32px,5vw,48px)">
        <div style="font-size:clamp(11px,1.2vw,13px);color:${accent};text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;font-weight:700">Social Proof</div>
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(32px,5vw,52px);color:#111">What Advertisers Say</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px">${testiCards}</div>
    </div>
  </section>`;
  }

  // CTA
  if (has("cta")) {
    sectionsHTML += `
  <section class="reveal" style="background:${accent};padding:clamp(60px,8vw,100px) clamp(16px,4vw,48px)">
    <div style="max-width:700px;margin:0 auto;text-align:center">
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(32px,5vw,56px);color:#fff;margin-bottom:16px">Ready to Reach Our Readers?</h2>
      <p style="font-size:clamp(14px,1.6vw,18px);color:rgba(255,255,255,.8);line-height:1.6;margin-bottom:32px">Get in front of the most engaged local audience in the market. Let's build a campaign that drives real results for your business.</p>
      <button onclick="document.getElementById('contact-modal').style.display='flex'" style="padding:14px 40px;border-radius:6px;border:2px solid #fff;background:transparent;color:#fff;font-weight:700;font-size:clamp(14px,1.5vw,16px);cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:.5px">GET IN TOUCH</button>
    </div>
  </section>`;
  }

  // CONTACT MODAL
  const modalHTML = `
  <div id="contact-modal" style="display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:20px" onclick="if(event.target===this)this.style.display='none'">
    <div style="background:#fff;border-radius:16px;padding:clamp(28px,4vw,48px);max-width:540px;width:100%;position:relative;max-height:90vh;overflow-y:auto">
      <button onclick="document.getElementById('contact-modal').style.display='none'" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:24px;color:#999;cursor:pointer;line-height:1">&times;</button>
      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(24px,3vw,36px);color:#111;margin-bottom:4px">Get in Touch</h3>
      <p style="font-size:13px;color:#888;margin-bottom:24px">Interested in advertising? Fill out the form and we'll be in touch within 24 hours.</p>
      <form id="contact-form" onsubmit="event.preventDefault();document.getElementById('contact-form').style.display='none';document.getElementById('contact-success').style.display='block'">
        <!-- Add your Web3Forms access key: action="https://api.web3forms.com/submit" method="POST" -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div><label style="font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">First Name</label><input name="first_name" required style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;font-family:'DM Sans',sans-serif"></div>
          <div><label style="font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">Last Name</label><input name="last_name" required style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;font-family:'DM Sans',sans-serif"></div>
        </div>
        <div style="margin-bottom:12px"><label style="font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">Email</label><input name="email" type="email" required style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;font-family:'DM Sans',sans-serif"></div>
        <div style="margin-bottom:12px"><label style="font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">Phone</label><input name="phone" type="tel" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;font-family:'DM Sans',sans-serif"></div>
        <div style="margin-bottom:12px"><label style="font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">Business Name</label><input name="business" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;font-family:'DM Sans',sans-serif"></div>
        <div style="margin-bottom:12px"><label style="font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">Industry</label><input name="industry" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;font-family:'DM Sans',sans-serif"></div>
        <div style="margin-bottom:20px"><label style="font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px">Comments</label><textarea name="comments" rows="3" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;font-family:'DM Sans',sans-serif;resize:vertical"></textarea></div>
        <button type="submit" style="width:100%;padding:14px;border-radius:6px;border:none;background:${accent};color:#fff;font-weight:700;font-size:15px;cursor:pointer;font-family:'DM Sans',sans-serif">Send Message</button>
      </form>
      <div id="contact-success" style="display:none;text-align:center;padding:40px 0">
        <div style="font-size:48px;margin-bottom:16px">&#10003;</div>
        <h3 style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:#111;margin-bottom:8px">Message Sent!</h3>
        <p style="color:#888;font-size:14px">We'll be in touch within 24 hours.</p>
      </div>
    </div>
  </div>`;

  // FULL HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(kitTitle)} - Media Kit</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;background:#111;color:#fff;-webkit-font-smoothing:antialiased}
.reveal{opacity:0;transform:translateY(30px);transition:opacity .6s ease,transform .6s ease}
.reveal.on{opacity:1;transform:translateY(0)}
@media(max-width:900px){
  .hero-grid{grid-template-columns:1fr !important}
  .why-grid{grid-template-columns:1fr !important}
}
@media(max-width:640px){
  .hero-grid{grid-template-columns:1fr !important}
  .why-grid{grid-template-columns:1fr !important}
}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:#111}
::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
input,textarea,button,select{box-sizing:border-box}
</style>
</head>
<body>
${sectionsHTML}
${modalHTML}
<script>
// Scroll reveal
const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');obs.unobserve(e.target)}})},{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

// Count-up animation
document.querySelectorAll('.count-up').forEach(el=>{
  const raw=el.getAttribute('data-target')||'';
  const numMatch=raw.replace(/[^0-9.]/g,'');
  if(!numMatch)return;
  const target=parseFloat(numMatch);
  const prefix=raw.match(/^[^0-9]*/)?.[0]||'';
  const suffix=raw.match(/[^0-9.]*$/)?.[0]||'';
  const hasDecimal=numMatch.includes('.');
  const hasComma=raw.includes(',');
  let start=0;
  const dur=1500;
  const startTime=performance.now();
  function tick(now){
    const p=Math.min((now-startTime)/dur,1);
    const eased=1-Math.pow(1-p,3);
    const cur=eased*target;
    let formatted=hasDecimal?cur.toFixed(1):Math.floor(cur).toString();
    if(hasComma)formatted=formatted.replace(/\\B(?=(\\d{3})+(?!\\d))/g,',');
    el.textContent=prefix+formatted+suffix;
    if(p<1)requestAnimationFrame(tick);
  }
  const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){requestAnimationFrame(tick);io.unobserve(el)}},{threshold:.5});
  io.observe(el);
});

${f.separateBrandMetrics && brands.length > 1 ? `
// Metric tabs
function switchMetricTab(idx){
  document.querySelectorAll('.metric-tab').forEach((t,i)=>{
    t.style.border='1px solid '+(i===idx?'${accent}':'rgba(255,255,255,.15)');
    t.style.background=i===idx?'${accent}':'transparent';
    t.style.color=i===idx?'#fff':'rgba(255,255,255,.5)';
  });
  document.querySelectorAll('.metric-panel').forEach((p,i)=>{
    p.style.display=i===idx?'block':'none';
  });
}` : ""}
</script>
</body>
</html>`;
}
