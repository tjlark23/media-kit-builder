// Instant HTML template engine - neo-brutalist design matching tjlarkin.com.
// Takes form data from the wizard and returns a complete, self-contained HTML file.

type BrandData = {
  name?: string;
  market?: string;
  subscribers?: string;
  frequency?: string;
  openRate?: string;
  logoB64?: string;
  logoMime?: string;
};

type MetricData = {
  id?: string;
  label?: string;
  value?: string;
  color?: string;
  isHero?: boolean;
};

type PricingRow = {
  unit?: string;
  desc?: string;
  dot?: string;
  bundle?: string;
  b?: string[];
};

type TestimonialData = {
  quote?: string;
  name?: string;
  company?: string;
};

type WhyItem = {
  title?: string;
  body?: string;
};

type FormData = {
  selectedSections?: string[];
  brandCount?: number;
  brands?: BrandData[];
  kitTitle?: string;
  kitLogoB64?: string;
  kitLogoMime?: string;
  combinedSubs?: string;
  combinedTagline?: string;
  weeklyImpressions?: string;
  contactEmail?: string;
  metrics?: MetricData[];
  separateBrandMetrics?: boolean;
  brandMetrics?: Record<string, MetricData[]>;
  surveyData?: string;
  pricingMode?: string;
  pricing?: PricingRow[];
  testimonials?: TestimonialData[];
  whyUsItems?: WhyItem[];
};

export function buildMediaKitHTML(form: FormData): string {
  const f = form || {};
  const brandCount = Math.max(1, Math.min(6, f.brandCount || 1));
  const brands: BrandData[] = (f.brands || []).slice(0, brandCount);
  while (brands.length < brandCount) brands.push({});
  const sections: string[] = f.selectedSections || [];
  const metrics: MetricData[] = (f.metrics || []).filter((m) => m && m.label);
  const heroMetrics = metrics.filter((m) => m.isHero);
  const testimonials: TestimonialData[] = (f.testimonials || []).filter((t) => t && t.quote);
  const contactEmail = f.contactEmail || "hello@localmediahq.com";
  const kitTitle = f.kitTitle || brands[0]?.name || "Media Kit";
  const pricing: PricingRow[] = f.pricing || [];
  const whyUsItems: WhyItem[] = f.whyUsItems || [];

  const hasSection = (id: string): boolean => {
    if (sections.includes(id)) return true;
    if (id === "why_news" || id === "why_us") {
      if (sections.includes("why")) return true;
      const hasNew = sections.some((s) => s === "why_news" || s === "why_us");
      if (!hasNew) return true;
    }
    return false;
  };

  const esc = (s: string | undefined | null): string =>
    (s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  // ---------- Nav ----------
  const navLogoInner = f.kitLogoB64
    ? `<img src="data:${f.kitLogoMime || "image/png"};base64,${f.kitLogoB64}" alt="${esc(kitTitle)}" style="height:40px;width:auto;display:block">`
    : splitTitleForNav(kitTitle);

  const navHTML = `
  <nav>
    <div class="nav-inner">
      <a href="#" class="nav-logo">${navLogoInner}</a>
      <a href="#" class="nav-cta" onclick="openModal();return false">Get in Touch</a>
    </div>
  </nav>`;

  // ---------- Hero ----------
  const kitTaglineRaw = f.combinedTagline || "";
  const subsTotal = f.combinedSubs || totalSubscribersLabel(brands);
  const highlightPhrase = buildHighlightPhrase(subsTotal, brands);
  const heroIntro = buildHeroIntro(brands, kitTitle, kitTaglineRaw);
  const heroPull = buildHeroPull(brands, subsTotal);

  const specLogoGrid = buildLogoGrid(brands, brandCount);
  const specStatRows = buildSpecStats(brands, brandCount, f);

  const heroHTML = `
  <section class="hero">
    <div class="container">
      <div class="hero-grid">
        <div class="hero-text reveal">
          <div class="hero-eyebrow">Media Kit 2026</div>
          <h1>
            Your brand, in front of<br>
            <span class="highlight">${esc(highlightPhrase)}</span>
          </h1>
          <p class="hero-intro">${esc(heroIntro)}</p>
          <p class="hero-pull">${esc(heroPull)}</p>
          <div class="hero-btns">
            <a href="#pricing" class="btn btn-yellow">See the rates</a>
            <a href="#" class="btn btn-black" onclick="openModal();return false">Get in Touch &rarr;</a>
          </div>
        </div>
        <div class="spec-card-wrap reveal delay-200">
          <div class="spec-card">
            <div class="spec-card-bg"></div>
            <div class="spec-card-dots">
              <div class="spec-dot black"></div>
              <div class="spec-dot orange"></div>
            </div>
            <div class="spec-inner">
              ${specLogoGrid}
              <div class="spec-content">
                <h2 class="spec-title">${esc((kitTitle || "").toUpperCase())}</h2>
                <p class="spec-subtitle">
                  <span class="spec-subtitle-dot"></span>
                  ${esc(buildSpecSubtitle(brands).toUpperCase())}_
                </p>
                <div class="spec-stats">
                  ${specStatRows}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;

  // ---------- Stats Bar ----------
  const statsLabel = brandCount > 1 ? "TOTALS ACROSS ALL NEWSLETTERS" : "THE NUMBERS AT A GLANCE";
  const statsCells = buildStatsCells(heroMetrics);
  const statsHTML = `
  <section class="stats-section">
    <div class="container">
      <div class="stats-label">${statsLabel}</div>
      <div class="stats-grid">
        ${statsCells}
      </div>
    </div>
  </section>`;

  // ---------- Brands Section ----------
  let brandsHTML = "";
  if (hasSection("meet") && brandCount > 1) {
    const brandCards = brands
      .map((b, i) => buildBrandCard(b, i))
      .join("");
    brandsHTML = `
  <section id="brands" class="section">
    <div class="container">
      <div class="section-head reveal">
        <h2 class="section-title">Meet the <span class="accent">Brands</span></h2>
        <p class="section-sub">${esc(
          brandCount + " hyper-local newsletter" + (brandCount > 1 ? "s" : "") +
          ", " + brandCount + " distinct audience" + (brandCount > 1 ? "s" : "") + "."
        )}</p>
      </div>
      <div class="brand-grid n-${brandCount}">
        ${brandCards}
      </div>
    </div>
  </section>`;
  }

  // ---------- Performance Metrics ----------
  let metricsHTML = "";
  if (hasSection("metrics") && metrics.length > 0) {
    const useTabs = brandCount > 1 && f.separateBrandMetrics;
    const panelsHTML = useTabs ? buildMetricTabs(metrics, brands, f.brandMetrics || {}) : buildMetricPanel(metrics);
    metricsHTML = `
  <section id="metrics" class="section yellow-bg">
    <div class="container">
      <div class="section-head reveal">
        <h2 class="section-title">Performance <span class="accent">Metrics</span></h2>
        <p class="section-sub">${useTabs ? "Click a tab to see metrics for a specific newsletter." : "The numbers behind every send."}</p>
      </div>
      <div class="metrics-tabs-wrap reveal">
        ${panelsHTML}
      </div>
    </div>
  </section>`;
  }

  // ---------- Audience ----------
  let audienceHTML = "";
  if (hasSection("reader")) {
    const audRows = parseAudience(f.surveyData || "");
    const rowsHTML = audRows
      .map((r, i) => {
        const cls = ["orange", "yellow", "orange", "gray", "yellow"][i % 5];
        const delay = ["", "delay-100", "delay-200", "delay-300", "delay-300"][i] || "";
        return `<div class="aud-row reveal ${delay}"><div class="aud-lbl">${esc(r.label)}</div><div class="aud-bar"><div class="aud-fill ${cls}" data-w="${r.pct}"></div></div><div class="aud-v">${esc(r.display)}</div></div>`;
      })
      .join("");
    audienceHTML = `
  <section id="audience" class="section dark">
    <div class="container">
      <div class="section-head reveal">
        <h2 class="section-title">Our <span class="accent">Audience</span></h2>
        <p class="section-sub">Who opens every send and takes action on what they read.</p>
      </div>
      <div class="aud-rows">
        ${rowsHTML}
      </div>
    </div>
  </section>`;
  }

  // ---------- Why Newsletters ----------
  let whyNewsHTML = "";
  if (hasSection("why_news")) {
    whyNewsHTML = `
  <section id="why-news" class="section">
    <div class="container">
      <div class="section-head reveal">
        <h2 class="section-title">Why <span class="accent">Newsletters</span></h2>
        <p class="section-sub">Newsletter advertising outperforms display, social, and search on nearly every engagement metric.</p>
      </div>
      <div class="why-grid">
        ${WHY_NEWS_ITEMS.map((w, i) => buildWhyItem(w.num, w.title, w.body, i)).join("")}
      </div>
    </div>
  </section>`;
  }

  // ---------- Why Us ----------
  let whyUsHTML = "";
  if (hasSection("why_us")) {
    const filled = whyUsItems.filter((w) => w && (w.title || w.body));
    const items = filled.length > 0 ? filled.slice(0, 4) : WHY_US_DEFAULTS;
    // Pad to 4
    const padded = [...items];
    while (padded.length < 4) padded.push(WHY_US_DEFAULTS[padded.length] || { title: "", body: "" });
    const whyUsLabel =
      brandCount > 1
        ? (f.kitTitle || "Our Network")
        : (brands[0]?.name || "Us");
    whyUsHTML = `
  <section id="why-us" class="section yellow-bg">
    <div class="container">
      <div class="section-head reveal">
        <h2 class="section-title">Why <span class="accent">${esc(whyUsLabel)}</span></h2>
        <p class="section-sub">What makes us different from every other place you could spend your ad budget.</p>
      </div>
      <div class="why-grid">
        ${padded.map((w, i) => buildWhyItem(padNumber(i + 1), w.title || "", w.body || "", i)).join("")}
      </div>
    </div>
  </section>`;
  }

  // ---------- Pricing ----------
  let pricingHTML = "";
  if (hasSection("pricing")) {
    if (f.pricingMode === "on-request") {
      pricingHTML = buildPricingOnRequest(brandCount, contactEmail);
    } else {
      pricingHTML = buildPricingFull(pricing, brands, brandCount);
    }
  }

  // ---------- Testimonials Marquee ----------
  let testimonialsHTML = "";
  if (hasSection("testimonials") && testimonials.length > 0) {
    const items = testimonials.map((t) => buildMarqueeItem(t)).join("");
    // Duplicate for seamless loop
    testimonialsHTML = `
  <section class="marquee-section">
    <div class="marquee">
      ${items}
      ${items}
    </div>
  </section>`;
  }

  // ---------- CTA ----------
  let ctaHTML = "";
  if (hasSection("cta") || sections.length === 0) {
    ctaHTML = `
  <section class="cta-wrap">
    <div class="container">
      <div class="cta-card reveal">
        <div class="corner" style="top:-8px; left:-8px;"></div>
        <div class="corner" style="top:-8px; right:-8px;"></div>
        <div class="corner" style="bottom:-8px; left:-8px;"></div>
        <div class="corner" style="bottom:-8px; right:-8px;"></div>
        <h2>LET&#39;S <span class="accent">WORK.</span></h2>
        <p>${esc(buildCtaCopy(subsTotal, brandCount))}</p>
        <div class="cta-actions">
          <a href="#" class="btn btn-black" onclick="openModal();return false">Get in Touch &rarr;</a>
          <a href="mailto:${esc(contactEmail)}" class="btn btn-yellow">Email Us</a>
        </div>
      </div>
    </div>
  </section>`;
  }

  // ---------- Footer ----------
  const year = new Date().getFullYear();
  const footerHTML = `
  <footer>
    <div class="container">
      <div class="footer-content">
        ${esc(kitTitle)} <span class="divider">/</span> A Local Media HQ Brand <span class="divider">/</span> ${year}
      </div>
    </div>
  </footer>`;

  // ---------- Modal ----------
  const modalHTML = `
  <div id="modal" class="mo" onclick="if(event.target===this)closeModal()">
    <div class="mo-box">
      <div class="corner" style="top:-8px; left:-8px;"></div>
      <div class="corner" style="top:-8px; right:-8px;"></div>
      <div class="corner" style="bottom:-8px; left:-8px;"></div>
      <div class="corner" style="bottom:-8px; right:-8px;"></div>
      <button class="mo-x" onclick="closeModal()">&times;</button>
      <h3 class="mo-title">LET&#39;S <span class="accent">TALK.</span></h3>
      <div class="mo-sub">We will respond within 24 hours with next steps.</div>
      <form id="cf" onsubmit="handleContactSubmit(event)">
        <div class="mf-row">
          <div class="mf"><label>First Name</label><input name="first_name" required></div>
          <div class="mf"><label>Last Name</label><input name="last_name" required></div>
        </div>
        <div class="mf"><label>Email</label><input name="email" type="email" required></div>
        <div class="mf"><label>Business Name</label><input name="business"></div>
        <div class="mf"><label>What are you looking for?</label><textarea name="message" placeholder="Tell us about your goals and budget..."></textarea></div>
        <button type="submit" class="mf-submit">Send Message</button>
      </form>
      <div id="csuc" class="mf-ok"><h4>MESSAGE SENT!</h4><p>We will be in touch within 24 hours.</p></div>
    </div>
  </div>`;

  // ---------- Assemble ----------
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(kitTitle)} &mdash; Media Kit 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
${STYLES}
</style>
</head>
<body>
${navHTML}
<main>
${heroHTML}
${statsHTML}
${brandsHTML}
${metricsHTML}
${audienceHTML}
${whyNewsHTML}
${whyUsHTML}
${pricingHTML}
${testimonialsHTML}
${ctaHTML}
</main>
${footerHTML}
${modalHTML}
<script>
${SCRIPTS}
</script>
</body>
</html>`;
}

// ============================================================
// HELPERS
// ============================================================

function padNumber(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

function splitTitleForNav(title: string): string {
  const t = (title || "").trim().toLowerCase();
  if (!t) return "mediakit";
  // If title has multiple words, color the last word orange
  const parts = t.split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const first = parts.slice(0, -1).join(" ");
    return `${escapeForHTML(first)}<span class="accent">${escapeForHTML(last)}</span>`;
  }
  // Single word: split in half
  if (t.length > 6) {
    const mid = Math.ceil(t.length / 2);
    return `${escapeForHTML(t.slice(0, mid))}<span class="accent">${escapeForHTML(t.slice(mid))}</span>`;
  }
  return escapeForHTML(t);
}

function escapeForHTML(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function totalSubscribersLabel(brands: BrandData[]): string {
  let total = 0;
  let found = false;
  brands.forEach((b) => {
    const n = parseInt((b.subscribers || "").replace(/[^0-9]/g, ""), 10);
    if (!isNaN(n) && n > 0) {
      total += n;
      found = true;
    }
  });
  if (!found) return "";
  if (total >= 1000) {
    const k = Math.round(total / 1000);
    return k + "k+";
  }
  return String(total);
}

function buildHighlightPhrase(subsTotal: string, brands: BrandData[]): string {
  if (subsTotal) {
    const market = brands[0]?.market || "local";
    const shortMarket = market.split(/[,&]/)[0].trim() || "local";
    if (brands.length > 1) return `${subsTotal} local readers.`;
    return `${subsTotal} ${shortMarket} locals.`;
  }
  return "engaged local readers.";
}

function buildHeroIntro(brands: BrandData[], kitTitle: string, tagline: string): string {
  if (tagline && tagline.length > 40) return tagline;
  const names = brands.map((b) => b.name).filter(Boolean);
  const market = brands[0]?.market || "";
  if (names.length === 1) {
    return `${names[0]} is the most trusted read in ${market || "the area"}. Our audience is homeowners, families, and local business owners who open their inbox every morning looking for what is happening in their community.`;
  }
  if (names.length > 1) {
    const list = names.length === 2 ? names.join(" and ") : names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
    return `${list} reach the most engaged local audiences in ${market || "the region"}. Real people who open every send and take action on what they read.`;
  }
  return tagline || "The most engaged local audience in the market.";
}

function buildHeroPull(brands: BrandData[], subsTotal: string): string {
  const n = brands.length;
  const newsletters = n === 1 ? "One newsletter" : `${n} newsletters`;
  const opens = avgOpenRate(brands);
  const subsPart = subsTotal ? `${subsTotal} subscribers.` : "";
  const openPart = opens ? `${opens} open rate.` : "";
  return [newsletters + ".", subsPart, openPart, "Real people who read every day."].filter(Boolean).join(" ");
}

function avgOpenRate(brands: BrandData[]): string {
  const rates = brands
    .map((b) => parseFloat((b.openRate || "").replace(/[^0-9.]/g, "")))
    .filter((n) => !isNaN(n) && n > 0);
  if (rates.length === 0) return "";
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
  return Math.round(avg) + "%";
}

function buildSpecSubtitle(brands: BrandData[]): string {
  const market = brands[0]?.market || "";
  return market || "Local";
}

function buildLogoGrid(brands: BrandData[], n: number): string {
  const cells = brands
    .map((b) => {
      if (b.logoB64) {
        return `<div class="logo-cell"><img src="data:${b.logoMime || "image/png"};base64,${b.logoB64}" alt="${escapeForHTML(b.name || "")}" style="max-height:80px;max-width:100%;object-fit:contain"></div>`;
      }
      const name = (b.name || "Brand").toUpperCase();
      return `<div class="logo-cell">${escapeForHTML(name)}</div>`;
    })
    .join("");
  return `<div class="logo-grid n-${n}">${cells}</div>`;
}

function buildSpecStats(brands: BrandData[], n: number, f: FormData): string {
  const rows: string[] = [];
  if (n > 1) {
    rows.push(`<div class="spec-stat-row"><span>Brands</span><span>${n}</span></div>`);
    const subs = f.combinedSubs || totalSubscribersLabel(brands);
    if (subs) rows.push(`<div class="spec-stat-row"><span>Subscribers</span><span>${escapeForHTML(subs)}</span></div>`);
  } else {
    const b = brands[0] || {};
    if (b.subscribers) rows.push(`<div class="spec-stat-row"><span>Subscribers</span><span>${escapeForHTML(b.subscribers)}</span></div>`);
    if (b.openRate) rows.push(`<div class="spec-stat-row"><span>Open Rate</span><span>${escapeForHTML(b.openRate)}${/%/.test(b.openRate) ? "" : "%"}</span></div>`);
  }
  rows.push(`<div class="spec-stat-row"><span>Status</span><span class="green">Accepting sponsors</span></div>`);
  return rows.join("\n                  ");
}

function buildStatsCells(heroMetrics: MetricData[]): string {
  const cells = heroMetrics.slice(0, 4);
  // Pad to 4 cells if there are fewer
  const delays = ["", "delay-100", "delay-200", "delay-300"];
  return cells
    .map(
      (m, i) =>
        `<div class="stat-cell reveal ${delays[i]}"><span class="stat-num">${escapeForHTML(m.value || "")}</span><span class="stat-lbl">${escapeForHTML(m.label || "")}</span></div>`
    )
    .join("");
}

function buildBrandCard(b: BrandData, i: number): string {
  const initials = buildInitials(b.name || "");
  const tagMarket = (b.market || "").split(/[,&]/)[0].trim().toUpperCase();
  const tagFreq = (b.frequency || "").toUpperCase();
  const tags: string[] = [];
  if (tagMarket) tags.push(tagMarket);
  if (tagFreq) tags.push(tagFreq);
  const tagsHTML = tags.map((t) => `<span class="brand-tag">#${escapeForHTML(t)}</span>`).join("");
  const delay = ["", "delay-100", "delay-200", "delay-300", "", "delay-100"][i] || "";

  const statParts: string[] = [];
  if (b.subscribers) statParts.push(`<div><div class="brand-stat-v">${escapeForHTML(b.subscribers)}</div><div class="brand-stat-l">Subscribers</div></div>`);
  if (b.openRate) statParts.push(`<div><div class="brand-stat-v orange">${escapeForHTML(b.openRate)}${/%/.test(b.openRate) ? "" : "%"}</div><div class="brand-stat-l">Open Rate</div></div>`);
  if (b.frequency) statParts.push(`<div><div class="brand-stat-v">${escapeForHTML(b.frequency)}</div><div class="brand-stat-l">Frequency</div></div>`);

  const logoCell = b.logoB64
    ? `<div class="brand-logo" style="padding:4px"><img src="data:${b.logoMime || "image/png"};base64,${b.logoB64}" alt="${escapeForHTML(b.name || "")}" style="max-width:100%;max-height:100%;object-fit:contain"></div>`
    : `<div class="brand-logo">${escapeForHTML(initials)}</div>`;

  return `
      <div class="brand-card reveal ${delay}">
        <div class="corner c-tl"></div><div class="corner c-tr"></div><div class="corner c-bl"></div><div class="corner c-br"></div>
        ${logoCell}
        <div class="brand-tags">${tagsHTML}</div>
        <h3 class="brand-name">${escapeForHTML(b.name || "Newsletter")}</h3>
        <p class="brand-market">${escapeForHTML(b.market || "")}</p>
        <div class="brand-stats-row">
          ${statParts.join("")}
        </div>
      </div>`;
}

function buildInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "N";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildMetricPanel(metrics: MetricData[]): string {
  const cards = metrics
    .map((m) => {
      const cls = m.color === "orange" ? " orange" : "";
      return `<div class="metric-card"><div class="mc-val${cls}">${escapeForHTML(m.value || "")}</div><div class="mc-lbl">${escapeForHTML(m.label || "")}</div></div>`;
    })
    .join("");
  return `<div class="metric-cards-grid">${cards}</div>`;
}

function buildMetricTabs(
  metrics: MetricData[],
  brands: BrandData[],
  brandMetrics: Record<string, MetricData[]>
): string {
  const tabs: string[] = [`<button class="metric-tab active" data-tab="all">All Brands</button>`];
  const panels: string[] = [`<div class="metric-panel active" data-panel="all">${buildMetricPanel(metrics)}</div>`];
  brands.forEach((b, i) => {
    const id = "b" + i;
    const tabLabel = b.name || "Brand " + (i + 1);
    const bm: MetricData[] = (brandMetrics[i] as MetricData[] | undefined) || (brandMetrics[String(i)] as MetricData[] | undefined) || metrics;
    const filtered = bm.filter((m) => m && m.label);
    tabs.push(`<button class="metric-tab" data-tab="${id}">${escapeForHTML(tabLabel)}</button>`);
    panels.push(`<div class="metric-panel" data-panel="${id}">${buildMetricPanel(filtered)}</div>`);
  });
  return `
        <div class="metrics-tabs">
          ${tabs.join("\n          ")}
        </div>
        ${panels.join("\n        ")}`;
}

function parseAudience(raw: string): { label: string; pct: number; display: string }[] {
  const defaults = [
    { label: "Female", pct: 65, display: "65%" },
    { label: "HHI $100k+", pct: 70, display: "70%" },
    { label: "Homeowners", pct: 60, display: "60%" },
    { label: "Biz Owners", pct: 18, display: "18%" },
    { label: "Ages 28-55", pct: 82, display: "82%" },
  ];
  if (!raw || !raw.trim()) return defaults;
  const parts = raw
    .split(/[,\n]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return defaults;
  const parsed = parts
    .map((p) => {
      const m = p.match(/^\s*(\d+)\s*%?\s*(.+)$/);
      if (m) {
        const pct = parseInt(m[1], 10);
        const label = m[2].trim();
        return { label, pct: isNaN(pct) ? 50 : Math.min(100, pct), display: pct + "%" };
      }
      const m2 = p.match(/^(.+?):\s*(\d+)\s*%?/);
      if (m2) {
        const pct = parseInt(m2[2], 10);
        return { label: m2[1].trim(), pct: isNaN(pct) ? 50 : Math.min(100, pct), display: pct + "%" };
      }
      return { label: p, pct: 50, display: "" };
    })
    .slice(0, 6);
  return parsed.length ? parsed : defaults;
}

function buildWhyItem(num: string, title: string, body: string, i: number): string {
  const delays = ["", "delay-100", "delay-200", "delay-300"];
  return `
        <div class="why-item reveal ${delays[i] || ""}">
          <span class="why-num">${escapeForHTML(num)}</span>
          <div class="why-content">
            <h4>${escapeForHTML(title)}</h4>
            <p>${escapeForHTML(body)}</p>
          </div>
        </div>`;
}

const WHY_NEWS_ITEMS = [
  {
    num: "01",
    title: "No Banner Blindness",
    body: "Readers actively open the email and read top to bottom. Your ad gets focused attention, not a passive scroll past another display banner they have been trained to ignore.",
  },
  {
    num: "02",
    title: "Inherited Trust",
    body: "We curate every advertiser. Readers trust us, and that trust transfers to you on day one. You are not a stranger interrupting a feed, you are a recommendation from a friend.",
  },
  {
    num: "03",
    title: "3 to 5x Higher CTR",
    body: "Newsletter ads average 7 to 11% click-through. Display ads average 0.1%. Facebook ads average 0.9%. Email is the best-performing ad channel by a wide margin.",
  },
  {
    num: "04",
    title: "First-Party Audience",
    body: "These are real people who asked to be here. No bot traffic, no algorithmic audience guessing, no targeting cookies about to disappear. Just verified humans reading every day.",
  },
];

const WHY_US_DEFAULTS: WhyItem[] = [
  {
    title: "Real Attention, Not Impressions",
    body: "Our readers actively open and read every issue. This is not a banner ad on a page they scroll past. Your message gets focused, intentional attention from real people.",
  },
  {
    title: "Trusted Recommendations",
    body: "We hand-pick every advertiser. Our audience trusts us, and that trust transfers to you. Being featured here is an endorsement, not an interruption.",
  },
  {
    title: "Measurable Results",
    body: "We share transparent performance data after every campaign. You will know exactly how many people saw your ad, clicked, and engaged. No black box.",
  },
  {
    title: "Built for Local Business",
    body: "We are not a national ad network. Every subscriber lives in your service area. You are reaching the exact people who can walk through your door.",
  },
];

function buildPricingFull(pricing: PricingRow[], brands: BrandData[], brandCount: number): string {
  const rows = (pricing || []).filter((p) => p && (p.unit || p.bundle || (p.b && p.b.some((x) => x))));
  if (rows.length === 0) return "";
  const cards = rows
    .slice(0, 8)
    .map((p, i) => buildPlacementCard(p, i, brands, brandCount))
    .join("");
  return `
  <section id="pricing" class="section">
    <div class="container">
      <div class="pricing-intro-card reveal">
        <div class="corner" style="top:-8px; left:-8px;"></div>
        <div class="corner" style="top:-8px; right:-8px;"></div>
        <div class="corner" style="bottom:-8px; left:-8px;"></div>
        <div class="corner" style="bottom:-8px; right:-8px;"></div>
        <h2>PICK YOUR <span class="accent">PLACEMENT.</span></h2>
        <p>${brandCount > 1 ? "Transparent pricing. Bundle across all newsletters for the best value. No long-term commitments, no complicated contracts." : "Transparent pricing. No long-term commitments, no complicated contracts."}</p>
      </div>
      <div class="placement-grid">
        ${cards}
      </div>
    </div>
  </section>`;
}

function buildPlacementCard(p: PricingRow, i: number, brands: BrandData[], brandCount: number): string {
  const isPremium = p.dot === "orange";
  const tagLabel = isPremium ? "PREMIUM" : ["STANDARD", "STARTER", "EDITORIAL", "ADD-ON", "QUICK"][i] || "STANDARD";
  const tagCls = isPremium ? " premium" : "";
  const eyebrow = isPremium ? "Top Slot" : ["Mid-Email", "Light Touch", "Feature", "Extended", "Quick Hit"][i] || "Placement";
  const amtCls = isPremium ? " orange" : "";
  const delay = ["", "delay-100", "delay-200", "delay-300"][i] || "";

  let priceBlock = "";
  const hasBundle = p.bundle && p.bundle.trim();
  const brandPrices = (p.b || []).slice(0, brandCount).filter((v) => v && v.trim());

  if (hasBundle) {
    priceBlock += `<div class="placement-amt${amtCls}">${escapeForHTML(p.bundle || "")}</div>`;
    priceBlock += `<div class="placement-per">${brandCount > 1 ? "Bundle" : "Per Issue"}</div>`;
  }
  if (brandCount > 1 && brandPrices.length > 0) {
    const perBrand = brands
      .slice(0, brandCount)
      .map((b, bi) => {
        const v = p.b?.[bi];
        if (!v || !v.trim()) return "";
        return `<div style="font-family:var(--mono);font-size:11px;font-weight:700;margin-top:6px;opacity:0.75">${escapeForHTML(b.name || "Brand " + (bi + 1))}: ${escapeForHTML(v)}</div>`;
      })
      .filter(Boolean)
      .join("");
    if (perBrand) priceBlock += perBrand;
  }
  if (!priceBlock) {
    priceBlock = `<div class="placement-amt">—</div><div class="placement-per">Contact for pricing</div>`;
  }

  return `
        <div class="placement reveal ${delay}">
          <div class="placement-tag${tagCls}">${escapeForHTML(tagLabel)}</div>
          <div class="placement-eyebrow">${escapeForHTML(eyebrow)}</div>
          <h3 class="placement-name">${escapeForHTML(p.unit || "Placement")}</h3>
          <p class="placement-desc">${escapeForHTML(p.desc || "")}</p>
          <div class="placement-price">
            ${priceBlock}
          </div>
        </div>`;
}

function buildPricingOnRequest(brandCount: number, contactEmail: string): string {
  const brandsPhrase = brandCount > 1 ? `across ${brandCount === 2 ? "both" : "all " + brandCount} brands` : "in your audience";
  return `
  <section id="pricing" class="section pricing-split-section">
    <div class="container">
      <div class="pricing-split reveal">
        <div class="ps-left">
          <div class="ps-eyebrow">Investment</div>
          <h2 class="ps-title">Every campaign<br>is <span class="accent">different.</span></h2>
          <p class="ps-body">We do not do one-size-fits-all rate cards. Tell us who you want to reach, how often, and what success looks like. We put together a custom plan that fits your budget and delivers real results ${brandsPhrase}.</p>
          <div class="ps-features">
            <div class="ps-feat"><span class="ps-feat-num">01</span><span>Custom placement strategy ${brandCount > 1 ? "across " + brandCount + " brand" + (brandCount > 1 ? "s" : "") : "tailored to your goals"}</span></div>
            <div class="ps-feat"><span class="ps-feat-num">02</span><span>Transparent pricing with no long-term contracts</span></div>
            <div class="ps-feat"><span class="ps-feat-num">03</span><span>Campaign reporting after every send</span></div>
          </div>
        </div>
        <div class="ps-right">
          <div class="ps-card">
            <div class="ps-card-label">REQUEST A QUOTE</div>
            <div class="ps-card-time">24hr response</div>
            <h3 class="ps-card-title">Tell us about your campaign.</h3>
            <p class="ps-card-sub">Share a few details. We respond within one business day with placement options, pricing, and a recommended start date.</p>
            <a href="#" class="ps-card-btn" onclick="openModal();return false">Get in Touch &rarr;</a>
            <div class="ps-card-or">or email <a href="mailto:${escapeForHTML(contactEmail)}">${escapeForHTML(contactEmail)}</a></div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function buildMarqueeItem(t: TestimonialData): string {
  const who = [t.name, t.company].filter(Boolean).join(", ");
  return `<div class="marquee-item"><span class="marquee-quote">&ldquo;</span>${escapeForHTML(t.quote || "")}${who ? `<span class="marquee-who">${escapeForHTML(who)}</span>` : ""}</div>`;
}

function buildCtaCopy(subsTotal: string, brandCount: number): string {
  const subs = subsTotal ? `${subsTotal} engaged local readers` : "engaged local readers";
  const scope = brandCount > 1 ? ` across ${brandCount} newsletters` : "";
  return `Ready to reach ${subs}${scope}? Book a call and we will put together a plan that fits your goals and your budget.`;
}

// ============================================================
// STYLES (verbatim from tjlarkin.com neo-brutalist reference)
// ============================================================

const STYLES = `
:root {
  --black: #08313a;
  --white: #f8f9fa;
  --yellow: #e9ae4a;
  --orange: #e76f51;
  --gray: #c7d5e0;
  --green: #16a34a;
  --shadow: 4px 4px 0px 0px var(--black);
  --shadow-lg: 8px 8px 0px 0px var(--black);
  --border: 3px solid var(--black);
  --sans: 'Inter', system-ui, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
* { margin:0; padding:0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  background-color: var(--white);
  color: var(--black);
  font-family: var(--sans);
  min-height: 100vh;
  display: flex; flex-direction: column;
  -webkit-font-smoothing: antialiased;
  background-size: 40px 40px;
  background-image:
    linear-gradient(to right, var(--gray) 1px, transparent 1px),
    linear-gradient(to bottom, var(--gray) 1px, transparent 1px);
}
::selection { background: var(--yellow); color: var(--black); }
::-webkit-scrollbar { width: 12px; }
::-webkit-scrollbar-track { background: var(--white); border-left: 3px solid var(--black); }
::-webkit-scrollbar-thumb { background: var(--yellow); border: 3px solid var(--black); }
::-webkit-scrollbar-thumb:hover { background: var(--orange); }

.reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
.reveal.active { opacity: 1; transform: translateY(0); }
.delay-100 { transition-delay: 100ms; }
.delay-200 { transition-delay: 200ms; }
.delay-300 { transition-delay: 300ms; }

.container { max-width: 1280px; margin: 0 auto; padding: 0 clamp(24px,4vw,32px); }

nav {
  position: fixed; top:0; left:0; right:0; z-index:50;
  background: var(--white);
  border-bottom: var(--border);
  height: 80px;
}
.nav-inner {
  max-width: 1280px; height:100%; margin:0 auto;
  padding: 0 clamp(24px,4vw,32px);
  display:flex; align-items:center; justify-content:space-between;
}
.nav-logo { font-weight: 900; font-size: 24px; letter-spacing: -0.04em; color: var(--black); text-decoration:none; transition: color .2s; display:inline-flex; align-items:center; }
.nav-logo:hover { color: var(--orange); }
.nav-logo .accent { color: var(--orange); }
.nav-cta {
  background: var(--black); color: var(--white);
  padding: 8px 24px; font-weight:700; font-size:12px;
  text-transform:uppercase; letter-spacing:0.1em;
  text-decoration:none; border: 2px solid transparent;
  transition: all .2s;
}
.nav-cta:hover { background: var(--gray); color: var(--black); border-color: var(--black); box-shadow: var(--shadow); transform: scale(1.05); }

.hero { position:relative; padding: 128px 0 64px; border-bottom: var(--border); background: var(--white); overflow:hidden; }
@media(min-width:768px) { .hero { padding: 160px 0 96px; } }
.hero-grid { display: flex; flex-direction:column; gap: 48px; align-items: flex-start; }
@media(min-width:1024px) { .hero-grid { flex-direction:row; gap: 64px; align-items: center; } }
.hero-text { flex:1; display:flex; flex-direction:column; justify-content:center; }
.hero-eyebrow {
  background: var(--orange); color: var(--white);
  display: inline-block; padding: 4px 16px;
  font-family: var(--mono); font-size: 12px; font-weight:700;
  text-transform:uppercase; letter-spacing: 0.1em;
  margin-bottom: 24px; width: fit-content;
}
.hero h1 {
  font-size: clamp(48px, 7vw, 96px); font-weight: 900; color: var(--black);
  letter-spacing: -0.04em; margin-bottom: 24px; line-height: 1.0;
}
.hero h1 .highlight {
  color: var(--white); background: var(--orange);
  padding: 0 8px; display: inline-block;
  transform: rotate(-1deg); margin-top: 8px;
}
.hero-intro { font-size: clamp(16px, 1.2vw, 18px); color: var(--black); font-weight:500; margin-bottom: 16px; max-width: 36rem; line-height: 1.625; }
.hero-pull { font-size: clamp(18px, 1.4vw, 20px); color: var(--black); font-family: var(--mono); margin-bottom: 40px; line-height: 1.625; border-left: 4px solid var(--orange); padding-left: 24px; max-width: 36rem; }
.hero-btns { display: flex; flex-direction:column; gap: 24px; }
@media(min-width:640px) { .hero-btns { flex-direction:row; } }
.btn {
  padding: 16px 32px; font-weight: 700; text-transform:uppercase;
  letter-spacing: 0.08em; border: var(--border);
  box-shadow: var(--shadow); transition: all .2s;
  text-decoration:none;
  display: flex; align-items:center; justify-content:center; gap:8px;
  font-size: 14px; cursor:pointer; font-family: var(--sans);
}
.btn:hover { transform: scale(1.05); }
.btn:active { transform: scale(0.95); }
.btn-yellow { background: var(--yellow); color: var(--black); }
.btn-yellow:hover { background: var(--orange); color: var(--white); }
.btn-black { background: var(--black); color: var(--white); }
.btn-black:hover { background: var(--gray); color: var(--black); }

.spec-card-wrap { flex: 1; position: relative; width: 100%; max-width: 560px; margin: 0 auto; }
@media(min-width:1024px) { .spec-card-wrap { max-width: none; } }
.spec-card {
  background: var(--gray); border: var(--border);
  padding: 16px; box-shadow: var(--shadow-lg);
  position: relative;
  transform: rotate(2deg); transition: transform 0.3s;
}
@media(min-width:1024px) { .spec-card { transform: rotate(4deg); } }
.spec-card:hover { transform: rotate(1deg); }
.spec-card-bg {
  position: absolute; top:16px; left:16px;
  width:100%; height:100%;
  background: var(--black); z-index: -1;
}
.spec-card-dots { position: absolute; top:16px; right:16px; display:flex; gap:8px; z-index: 2; }
.spec-dot { width:12px; height:12px; border-radius:50%; }
.spec-dot.black { background: var(--black); }
.spec-dot.orange { background: var(--orange); }
.spec-inner {
  background: var(--white); border: var(--border);
  display:flex; flex-direction:column;
  padding: 16px; position:relative; overflow:hidden;
  gap: 16px;
}

.logo-grid {
  display: grid; gap: 8px;
  background: var(--white);
}
.logo-grid.n-1 { grid-template-columns: 1fr; }
.logo-grid.n-2 { grid-template-columns: 1fr 1fr; }
.logo-grid.n-3 { grid-template-columns: 1fr 1fr; }
.logo-grid.n-3 .logo-cell:nth-child(3) { grid-column: 1 / -1; }
.logo-grid.n-4 { grid-template-columns: 1fr 1fr; }
.logo-grid.n-5 { grid-template-columns: 1fr 1fr; }
.logo-grid.n-5 .logo-cell:nth-child(5) { grid-column: 1 / -1; }
.logo-grid.n-6 { grid-template-columns: 1fr 1fr; }

.logo-cell {
  border: 2px solid var(--black);
  display:flex; align-items:center; justify-content:center;
  font-weight:900; text-transform:uppercase;
  padding: 16px 12px;
  text-align:center;
  letter-spacing: -0.02em;
  line-height: 1.05;
  min-height: 110px;
  font-size: clamp(14px, 1.5vw, 18px);
  background: var(--yellow);
  transition: all .15s;
}
.logo-cell:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 var(--black); }
.logo-cell:nth-child(even) { background: var(--orange); color: var(--white); }
.logo-cell:nth-child(3n+3) { background: var(--gray); color: var(--black); }

.logo-grid.n-1 .logo-cell { min-height: 180px; font-size: clamp(24px, 3vw, 36px); }
.logo-grid.n-3 .logo-cell:nth-child(3) { min-height: 90px; }
.logo-grid.n-5 .logo-cell:nth-child(5) { min-height: 90px; }

.spec-content { width:100%; padding: 0 8px 8px; }
.spec-title { font-size: clamp(24px, 3vw, 32px); font-weight:900; letter-spacing: -0.04em; margin-bottom: 4px; text-transform: uppercase; line-height: 1; }
.spec-subtitle { font-family: var(--mono); font-size: 12px; margin-bottom: 16px; display:flex; align-items:center; gap:8px; }
.spec-subtitle-dot { width:8px; height:8px; border-radius:50%; background: var(--orange); }
.spec-stats { width:100%; border-top: var(--border); padding-top: 12px; }
.spec-stat-row { display:flex; justify-content:space-between; font-family: var(--mono); font-size: 11px; font-weight:700; text-transform: uppercase; margin-bottom: 6px; }
.spec-stat-row:last-child { margin-bottom: 0; }
.spec-stat-row .green { color: var(--green); animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

.stats-section { background: var(--white); border-bottom: var(--border); }
.stats-label { display: flex; align-items: center; justify-content: center; padding: 12px; background: var(--yellow); border-bottom: var(--border); font-family: var(--mono); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; }
.stats-grid {
  display:grid; grid-template-columns: 1fr 1fr;
  border-left: var(--border); border-right: var(--border);
}
@media(min-width:768px) {
  .stats-grid { grid-template-columns: repeat(4, 1fr); border-left:none; border-right:none; }
}
.stat-cell {
  display:flex; flex-direction:column; align-items:center;
  text-align:center; padding: 32px 16px; cursor:default;
  transition: background .2s; border-right: var(--border);
}
.stat-cell:last-child { border-right: none; }
@media(max-width:767px) {
  .stat-cell:nth-child(2) { border-right: none; }
  .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-top: var(--border); }
}
.stat-cell:hover { background: var(--yellow); }
.stat-num { font-size: clamp(36px, 4vw, 48px); font-weight: 900; color: var(--black); letter-spacing: -0.04em; margin-bottom: 8px; transition: transform 0.3s; }
.stat-cell:hover .stat-num { transform: scale(1.25) rotate(-6deg); }
.stat-lbl { font-family: var(--mono); font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; background: var(--gray); padding: 4px 8px; border: 1px solid var(--black); transition: background .2s; }
.stat-cell:hover .stat-lbl { background: var(--white); }

.section { padding: 96px 0; background: var(--white); border-bottom: var(--border); }
.section.yellow-bg { background: var(--yellow); position: relative; }
.section.yellow-bg::before, .section.yellow-bg::after { content: ''; position: absolute; width: 32px; height: 32px; background: var(--white); }
.section.yellow-bg::before { top: 0; left: 0; border-right: var(--border); border-bottom: var(--border); }
.section.yellow-bg::after { bottom: 0; right: 0; border-left: var(--border); border-top: var(--border); }

.section-head { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; border-bottom: var(--border); padding-bottom: 16px; margin-bottom: 48px; }
@media(min-width:768px) { .section-head { flex-direction:row; } }
.section-title { font-size: clamp(48px, 6vw, 80px); font-weight: 900; text-transform: uppercase; letter-spacing: -0.04em; line-height: 1; }
.section-title .accent { color: var(--orange); }
.section-sub { font-family: var(--mono); font-size: 14px; color: var(--black); opacity: 0.75; max-width: 360px; text-align: right; padding-top: 16px; line-height: 1.6; }
@media(max-width:767px) { .section-sub { text-align: left; padding-top: 8px; max-width: none; } }

.brand-grid { display: grid; gap: 24px; }
.brand-grid.n-1 { grid-template-columns: 1fr; }
.brand-grid.n-2 { grid-template-columns: 1fr; }
@media(min-width:768px) { .brand-grid.n-2 { grid-template-columns: 1fr 1fr; } }
.brand-grid.n-3 { grid-template-columns: 1fr; }
@media(min-width:768px) { .brand-grid.n-3 { grid-template-columns: 1fr 1fr; } .brand-grid.n-3 .brand-card:nth-child(3) { grid-column: 1/-1; } }
@media(min-width:1100px) { .brand-grid.n-3 { grid-template-columns: repeat(3, 1fr); } .brand-grid.n-3 .brand-card:nth-child(3) { grid-column: auto; } }
.brand-grid.n-4 { grid-template-columns: 1fr; }
@media(min-width:768px) { .brand-grid.n-4 { grid-template-columns: 1fr 1fr; } }
.brand-grid.n-5 { grid-template-columns: 1fr; }
@media(min-width:768px) { .brand-grid.n-5 { grid-template-columns: 1fr 1fr; } }
@media(min-width:1100px) { .brand-grid.n-5 { grid-template-columns: repeat(6, 1fr); } .brand-grid.n-5 .brand-card:nth-child(1), .brand-grid.n-5 .brand-card:nth-child(2), .brand-grid.n-5 .brand-card:nth-child(3) { grid-column: span 2; } .brand-grid.n-5 .brand-card:nth-child(4) { grid-column: 2 / 5; } .brand-grid.n-5 .brand-card:nth-child(5) { grid-column: 5 / 8; } }
.brand-grid.n-6 { grid-template-columns: 1fr; }
@media(min-width:768px) { .brand-grid.n-6 { grid-template-columns: 1fr 1fr; } }
@media(min-width:1100px) { .brand-grid.n-6 { grid-template-columns: repeat(3, 1fr); } }

.brand-card {
  background: var(--white); border: var(--border);
  padding: 32px; box-shadow: var(--shadow);
  transition: all .2s; position: relative;
}
.brand-card:hover { transform: translate(-4px, -4px); box-shadow: 8px 8px 0px 0px var(--black); }
.brand-card .corner { position: absolute; width: 16px; height: 16px; background: var(--orange); border: 2px solid var(--black); }
.brand-card .c-tl { top: -8px; left: -8px; }
.brand-card .c-tr { top: -8px; right: -8px; }
.brand-card .c-bl { bottom: -8px; left: -8px; }
.brand-card .c-br { bottom: -8px; right: -8px; }
.brand-logo { width: 56px; height: 56px; background: var(--black); color: var(--yellow); display:flex; align-items:center; justify-content:center; font-weight: 900; font-size: 18px; letter-spacing: -0.02em; margin-bottom: 16px; border: var(--border); overflow:hidden; }
.brand-card:nth-child(2) .brand-logo { background: var(--orange); color: var(--white); }
.brand-card:nth-child(3) .brand-logo { background: var(--yellow); color: var(--black); }
.brand-card:nth-child(4) .brand-logo { background: var(--gray); color: var(--black); }
.brand-card:nth-child(5) .brand-logo { background: var(--black); color: var(--orange); }
.brand-card:nth-child(6) .brand-logo { background: var(--orange); color: var(--yellow); }
.brand-tags { display:flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap; }
.brand-tag { font-family: var(--mono); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 8px; border: 2px solid var(--black); background: var(--white); }
.brand-name { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.03em; margin-bottom: 4px; line-height: 1.05; }
.brand-market { font-family: var(--mono); font-size: 13px; color: var(--black); opacity: 0.7; margin-bottom: 20px; }
.brand-stats-row { display: flex; gap: 24px; padding-top: 16px; border-top: var(--border); flex-wrap: wrap; }
.brand-stat-v { font-size: 24px; font-weight: 900; letter-spacing: -0.02em; line-height: 1; color: var(--black); }
.brand-stat-v.orange { color: var(--orange); }
.brand-stat-l { font-family: var(--mono); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; opacity: 0.7; }

.metrics-tabs-wrap { margin-bottom: 32px; }
.metrics-tabs {
  display: flex; flex-wrap: wrap; gap: 8px;
  border-bottom: var(--border); padding-bottom: 16px;
}
.metric-tab {
  font-family: var(--mono); font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  padding: 8px 16px; background: var(--white);
  border: var(--border); cursor: pointer;
  transition: all .15s;
}
.metric-tab:hover { background: var(--yellow); transform: translate(-1px,-1px); box-shadow: 2px 2px 0 var(--black); }
.metric-tab.active { background: var(--black); color: var(--white); }
.metric-panel { display: none; }
.metric-panel.active { display: block; animation: fadeIn .3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.metric-cards-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 16px; margin-top: 24px;
}
@media(min-width:640px) { .metric-cards-grid { grid-template-columns: repeat(4, 1fr); } }
.metric-card {
  background: var(--white); border: var(--border);
  box-shadow: var(--shadow); padding: 24px 16px;
  text-align: center;
}
.metric-card .mc-val { font-size: clamp(28px, 3vw, 40px); font-weight: 900; letter-spacing: -0.03em; line-height: 1; margin-bottom: 8px; color: var(--black); }
.metric-card .mc-val.orange { color: var(--orange); }
.metric-card .mc-lbl { font-family: var(--mono); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; background: var(--gray); padding: 3px 8px; border: 1px solid var(--black); display: inline-block; }

.section.dark { background: var(--black); color: var(--white); }
.section.dark .section-title { color: var(--white); }
.section.dark .section-head { border-bottom-color: rgba(255,255,255,0.2); }
.section.dark .section-sub { color: rgba(255,255,255,0.7); }
.aud-rows { display: flex; flex-direction: column; gap: 16px; }
.aud-row { display: grid; grid-template-columns: 140px 1fr 80px; gap: 24px; align-items: center; padding: 16px 24px; background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.15); transition: all .2s; }
.aud-row:hover { background: rgba(255,255,255,0.08); border-color: var(--yellow); }
.aud-lbl { font-family: var(--mono); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.7); }
.aud-bar { height: 16px; background: rgba(255,255,255,0.08); border: 2px solid rgba(255,255,255,0.2); position: relative; overflow: hidden; }
.aud-fill { height: 100%; width: 0; transition: width 1.2s cubic-bezier(.16,1,.3,1); }
.aud-fill.yellow { background: var(--yellow); }
.aud-fill.orange { background: var(--orange); }
.aud-fill.gray { background: var(--gray); }
.aud-v { font-size: 24px; font-weight: 900; text-align: right; letter-spacing: -0.02em; color: var(--white); }
@media(max-width:640px) { .aud-row { grid-template-columns: 1fr auto; } .aud-bar { display: none; } }

.why-grid { display: grid; grid-template-columns: 1fr; gap: 32px 48px; }
@media(min-width:768px) { .why-grid { grid-template-columns: 1fr 1fr; } }
.why-item { display: flex; gap: 16px; }
.why-num { font-family: var(--mono); font-size: 12px; font-weight: 700; color: var(--orange); flex-shrink: 0; padding: 4px 8px; background: var(--white); border: var(--border); height: fit-content; }
.section.yellow-bg .why-num { background: var(--white); }
.why-content h4 { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 8px; line-height: 1.15; }
.why-content p { font-size: 15px; color: var(--black); opacity: 0.85; line-height: 1.6; }

.pricing-intro-card {
  background: var(--white); border: var(--border);
  padding: 48px; box-shadow: var(--shadow-lg);
  margin-bottom: 48px; position: relative; text-align: center;
}
.pricing-intro-card .corner { position: absolute; width: 16px; height: 16px; background: var(--orange); border: 2px solid var(--black); }
.pricing-intro-card h2 { font-size: clamp(48px, 6vw, 72px); font-weight: 900; text-transform: uppercase; letter-spacing: -0.04em; margin-bottom: 24px; line-height: 1; }
.pricing-intro-card h2 .accent { color: var(--orange); padding: 0 8px; }
.pricing-intro-card p { font-family: var(--mono); font-size: 16px; color: var(--black); opacity: 0.75; max-width: 600px; margin: 0 auto; line-height: 1.6; }

.placement-grid { display:grid; grid-template-columns: 1fr; gap: 24px; }
@media(min-width:768px) { .placement-grid { grid-template-columns: repeat(2, 1fr); } }
@media(min-width:1100px) { .placement-grid { grid-template-columns: repeat(4, 1fr); } }
.placement { background: var(--white); border: var(--border); box-shadow: var(--shadow); padding: 24px; position: relative; transition: all .2s; display: flex; flex-direction: column; }
.placement:hover { transform: translate(-3px,-3px); box-shadow: 7px 7px 0px 0px var(--black); }
.placement-tag { position: absolute; top: 12px; right: 12px; font-family: var(--mono); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 8px; background: var(--black); color: var(--white); }
.placement-tag.premium { background: var(--orange); }
.placement-eyebrow { font-family: var(--mono); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--black); opacity: 0.6; margin-bottom: 4px; }
.placement-name { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.03em; margin-bottom: 8px; line-height: 1.1; }
.placement-desc { font-size: 13px; color: var(--black); opacity: 0.8; line-height: 1.5; margin-bottom: 20px; flex: 1; }
.placement-price { border-top: var(--border); padding-top: 16px; }
.placement-amt { font-size: 32px; font-weight: 900; letter-spacing: -0.03em; color: var(--black); line-height: 1; }
.placement-amt.orange { color: var(--orange); }
.placement-per { font-family: var(--mono); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6; margin-top: 4px; }

.pricing-split-section {
  background: var(--black);
  color: var(--white);
  border-bottom: var(--border);
}
.pricing-split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  align-items: center;
}
@media(min-width:900px) {
  .pricing-split { grid-template-columns: 1.1fr 1fr; gap: 64px; }
}
.ps-left .ps-eyebrow {
  display: inline-block; background: var(--orange); color: var(--white);
  padding: 4px 16px; font-family: var(--mono); font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  margin-bottom: 24px;
}
.ps-title {
  font-size: clamp(44px, 5.5vw, 72px);
  font-weight: 900; line-height: 1.0;
  letter-spacing: -0.04em; margin-bottom: 24px;
  color: var(--white);
}
.ps-title .accent { color: var(--orange); }
.ps-body {
  font-size: clamp(15px, 1.2vw, 17px);
  color: rgba(255,255,255,0.75);
  line-height: 1.65; margin-bottom: 32px;
  max-width: 520px;
}
.ps-features { display: flex; flex-direction: column; gap: 12px; }
.ps-feat {
  display: flex; align-items: center; gap: 16px;
  font-family: var(--mono); font-size: 14px;
  color: rgba(255,255,255,0.85); line-height: 1.4;
}
.ps-feat-num {
  background: var(--yellow); color: var(--black);
  padding: 4px 10px; font-weight: 700;
  letter-spacing: 0.05em; border: 2px solid var(--yellow);
  flex-shrink: 0;
}
.ps-right { display: flex; justify-content: center; }
.ps-card {
  background: var(--yellow); color: var(--black);
  border: var(--border); box-shadow: 8px 8px 0px 0px var(--orange);
  padding: 40px; width: 100%; max-width: 480px;
  position: relative;
}
.ps-card-label {
  display: inline-block;
  font-family: var(--mono); font-size: 10px; font-weight: 700;
  letter-spacing: 0.15em; text-transform: uppercase;
  background: var(--black); color: var(--yellow);
  padding: 4px 10px;
}
.ps-card-time {
  position: absolute; top: 40px; right: 40px;
  font-family: var(--mono); font-size: 11px; font-weight: 700;
  color: var(--black); opacity: 0.7;
  display: flex; align-items: center; gap: 6px;
}
.ps-card-time::before {
  content: ''; width: 8px; height: 8px; border-radius: 50%;
  background: var(--green);
  animation: pulse 2s infinite;
}
.ps-card-title {
  font-size: clamp(28px, 3vw, 36px);
  font-weight: 900; line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 24px 0 16px;
}
.ps-card-sub {
  font-family: var(--mono); font-size: 14px;
  color: var(--black); opacity: 0.75;
  line-height: 1.55; margin-bottom: 28px;
}
.ps-card-btn {
  display: inline-block; width: 100%;
  padding: 16px 24px; background: var(--black); color: var(--white);
  font-weight: 700; font-size: 14px;
  text-transform: uppercase; letter-spacing: 0.08em;
  border: var(--border);
  transition: all .2s;
  text-decoration: none; text-align: center;
  cursor: pointer; font-family: var(--sans);
  box-sizing: border-box;
}
.ps-card-btn:hover {
  background: var(--orange); color: var(--white);
  box-shadow: 4px 4px 0px 0px var(--black);
  transform: translate(-2px,-2px);
}
.ps-card-or {
  margin-top: 16px; font-family: var(--mono);
  font-size: 12px; text-align: center;
  color: var(--black); opacity: 0.65;
}
.ps-card-or a { color: var(--black); font-weight: 700; }

.marquee-section { background: var(--black); color: var(--white); padding: 24px 0; border-top: var(--border); border-bottom: var(--border); overflow: hidden; }
.marquee { display: flex; animation: marquee 30s linear infinite; gap: 48px; white-space: nowrap; }
@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.marquee-item { display: flex; align-items: center; gap: 16px; font-size: 20px; font-family: var(--mono); flex-shrink: 0; }
.marquee-quote { color: var(--yellow); font-size: 28px; font-weight: 900; }
.marquee-who { font-weight: 700; background: var(--yellow); color: var(--black); padding: 4px 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; }

.cta-wrap { background: var(--yellow); padding: 96px 0; border-bottom: var(--border); position: relative; }
.cta-wrap::before, .cta-wrap::after { content: ''; position: absolute; width: 32px; height: 32px; background: var(--white); }
.cta-wrap::before { top: 0; left: 0; border-right: var(--border); border-bottom: var(--border); }
.cta-wrap::after { bottom: 0; right: 0; border-left: var(--border); border-top: var(--border); }
.cta-card { background: var(--white); border: var(--border); padding: 64px 32px; box-shadow: var(--shadow-lg); position: relative; text-align: center; }
.cta-card .corner { position: absolute; width: 16px; height: 16px; background: var(--orange); border: 2px solid var(--black); }
.cta-card h2 { font-size: clamp(48px, 6vw, 80px); font-weight: 900; text-transform: uppercase; letter-spacing: -0.04em; margin-bottom: 24px; line-height: 1; }
.cta-card h2 .accent { color: var(--orange); padding: 0 8px; }
.cta-card p { font-family: var(--mono); font-size: clamp(15px, 1.3vw, 17px); color: var(--black); opacity: 0.75; max-width: 600px; margin: 0 auto 40px; line-height: 1.6; }
.cta-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

footer { background: var(--black); color: var(--white); padding: 32px 0; text-align: center; }
.footer-content { font-family: var(--mono); font-size: 13px; letter-spacing: 0.04em; }
.footer-content .divider { color: var(--orange); margin: 0 12px; }

.mo { display: none; position: fixed; inset: 0; z-index: 200; background: rgba(8, 49, 58, 0.5); align-items: center; justify-content: center; padding: 20px; }
.mo.active { display: flex; }
.mo-box { background: var(--white); border: var(--border); box-shadow: var(--shadow-lg); max-width: 500px; width: 100%; padding: 48px; position: relative; max-height: 90vh; overflow-y: auto; }
.mo-box .corner { position: absolute; width: 16px; height: 16px; background: var(--orange); border: 2px solid var(--black); }
.mo-x { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; background: var(--black); color: var(--yellow); border: var(--border); cursor: pointer; font-weight: 900; font-family: var(--mono); z-index: 2; }
.mo-title { font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.03em; margin-bottom: 8px; line-height: 1; }
.mo-title .accent { color: var(--orange); }
.mo-sub { font-family: var(--mono); font-size: 13px; color: var(--black); opacity: 0.65; margin-bottom: 24px; }
.mf { margin-bottom: 12px; }
.mf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mf-row .mf { margin-bottom: 0; }
.mf label { display: block; font-family: var(--mono); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
.mf input, .mf textarea { width: 100%; padding: 10px 14px; border: var(--border); font-family: var(--sans); font-size: 14px; background: var(--white); color: var(--black); outline: none; }
.mf input:focus, .mf textarea:focus { background: var(--yellow); }
.mf textarea { resize: vertical; min-height: 72px; }
.mf-submit { width: 100%; padding: 14px; background: var(--black); color: var(--white); border: var(--border); box-shadow: var(--shadow); font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; margin-top: 8px; font-family: var(--sans); transition: all .2s; }
.mf-submit:hover { background: var(--orange); transform: scale(1.02); }
.mf-ok { display: none; text-align: center; padding: 36px 0; }
.mf-ok h4 { font-size: 28px; font-weight: 900; text-transform: uppercase; margin-bottom: 8px; letter-spacing: -0.02em; }
.mf-ok p { font-family: var(--mono); font-size: 13px; opacity: 0.7; }

@media print {
  html, body {
    background: #fff !important;
    background-image: none !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  nav, .mo, .marquee-section { display: none !important; }
  .reveal { opacity: 1 !important; transform: none !important; }
  .aud-fill { width: var(--pct, 50%) !important; }
  .hero { padding: 32px 0 !important; }
  .section { padding: 48px 0 !important; page-break-inside: auto; }
  .brand-card, .why-item, .placement, .metric-card, .cta-card, .spec-card, .pricing-intro-card, .ps-card {
    page-break-inside: avoid;
  }
  .spec-card { transform: none !important; }
  .stat-cell:hover .stat-num { transform: none !important; }
  .metric-panel { display: block !important; page-break-inside: avoid; }
  .metric-tab { display: none !important; }
  .marquee { animation: none !important; }
}
`;

// ============================================================
// CLIENT SCRIPTS
// ============================================================

const SCRIPTS = `
(function(){
  var obs = new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('active');obs.unobserve(e.target);}});}, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});

  var bObs = new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.style.width = e.target.dataset.w + '%';bObs.unobserve(e.target);}});}, { threshold: 0.3 });
  document.querySelectorAll('.aud-fill').forEach(function(el){bObs.observe(el);});

  document.querySelectorAll('.metric-tab').forEach(function(tab){
    tab.addEventListener('click', function(){
      var target = tab.dataset.tab;
      document.querySelectorAll('.metric-tab').forEach(function(t){t.classList.remove('active');});
      document.querySelectorAll('.metric-panel').forEach(function(p){p.classList.remove('active');});
      tab.classList.add('active');
      var panel = document.querySelector('.metric-panel[data-panel="' + target + '"]');
      if (panel) panel.classList.add('active');
    });
  });
})();

function openModal(){
  var m = document.getElementById('modal');
  if (m) m.classList.add('active');
}
function closeModal(){
  var m = document.getElementById('modal');
  if (m) m.classList.remove('active');
}
function handleContactSubmit(e){
  e.preventDefault();
  var f = document.getElementById('cf');
  var s = document.getElementById('csuc');
  if (f) f.style.display = 'none';
  if (s) s.style.display = 'block';
  return false;
}
`;
