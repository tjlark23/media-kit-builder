# Media Kit Builder

## What This Is
A media kit generator tool for newsletter publishers (built for Local Media HQ). Next.js app with a 6-step wizard UI that collects brand info, metrics, audience data, pricing, and testimonials, then calls a Supabase Edge Function (Claude AI) to generate a complete, self-contained HTML media kit file. Supports 1-6 newsletter brands per kit with per-brand logos, colors, and metrics. Kits are saved to Supabase and can be published with shareable URLs.

## Work Mode
B

## Live URLs
- Dashboard: https://mediakit.localmediahq.com
- Builder: https://mediakit.localmediahq.com/builder
- Public kits: https://mediakit.localmediahq.com/kit/[slug]

## Design Style
Dark SaaS tool aesthetic:
- Background: #0a1628
- Surface/cards: rgba(255,255,255,.04) with rgba(255,255,255,.07) borders
- Primary blue: #4A90D9
- Accent orange: #E8821A
- Muted text: #3a5070, #4a6080
- Fonts: Bebas Neue (headlines/labels), DM Sans (body) via Google Fonts CDN
- Dark scrollbar, subtle fade-in animations

## Tech Stack
- Next.js 16 (App Router) with React 18
- TypeScript
- Supabase (project: ydcjljkehjqqshftktth / local-media-hq)
- Supabase Edge Function `generate-media-kit` for AI generation
- Vercel hosting (leander-scoop team)
- GitHub: tjlark23/media-kit-builder
- No Tailwind - custom CSS with inline React styles

## How To Run
- Local: `npm run dev` (requires .env.local with Supabase credentials)
- Production: Auto-deploys from GitHub main branch via Vercel

## Project-Specific Rules
1. All styling is inline React styles or in globals.css. No Tailwind.
2. The Supabase Edge Function handles AI generation - do not modify the endpoint URL without verifying.
3. Supabase project ID: ydcjljkehjqqshftktth
4. Generated media kits are self-contained HTML files rendered in iframes on public pages.
5. The public kit page (/kit/[slug]) has no auth - sponsors just click the link.

## Protected Scope
- Supabase Edge Function endpoint URL and project ID
- Media kit prompt structure (buildPrompt function in BuilderClient.tsx)
- 6-step wizard flow order: Sections > Brands > Metrics > Audience > Pricing > Generate
- Default form values and section definitions (SECTIONS array)
- Database schema (media_kits table structure)

## Key Files
- `app/builder/BuilderClient.tsx` - The main wizard component (all 6 steps + save/load)
- `app/page.tsx` - Dashboard listing saved kits
- `app/kit/[slug]/page.tsx` - Public shareable kit page
- `app/api/kits/route.ts` - Kit CRUD (list + create)
- `app/api/kits/[id]/route.ts` - Kit CRUD (get + update + delete)
- `app/api/generate/route.ts` - Proxy to Supabase Edge Function
- `lib/supabase.ts` - Supabase client
- `media-kit-builder-v3.html` - Original prototype (kept for reference)
