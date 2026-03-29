# Media Kit Builder

## What This Is
A media kit generator tool for newsletter publishers (built for Local Media HQ). Multi-step wizard UI collects brand info, metrics, audience data, pricing, and testimonials, then sends a detailed prompt to a Supabase Edge Function that uses Claude AI to generate a complete, self-contained HTML media kit file. Supports 1-6 newsletter brands per kit with per-brand logos, colors, and metrics.

## Work Mode
A

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
- Single HTML file (media-kit-builder-v3.html)
- React 18 + ReactDOM via CDN (production builds)
- Babel Standalone CDN for in-browser JSX transpilation
- Custom CSS (no Tailwind) - inline styles + style block
- Supabase Edge Function backend at ydcjljkehjqqshftktth.supabase.co/functions/v1/generate-media-kit
- No build process, no npm, no node_modules

## How To Run
Open `media-kit-builder-v3.html` directly in a browser. No server required for the UI. The generate function calls the Supabase Edge Function (requires the function to be deployed and running).

## Project-Specific Rules
1. Mode A with React CDN - not a standard React project. No npm/node/build tools.
2. Babel transpiles JSX in-browser - this is intentional for simplicity. Do not convert to compiled React.
3. The Supabase Edge Function handles AI generation - do not modify the endpoint URL without verifying the function.
4. Supabase project ID: ydcjljkehjqqshftktth - verify Edge Function is deployed before testing generation.
5. All styling is inline React styles or in the single style block. No external CSS files.
6. Generated media kits are self-contained HTML files downloaded by the user - they are separate from this builder tool.

## Protected Scope
- Supabase Edge Function endpoint URL and project ID
- Media kit prompt structure (buildPrompt function) - changes affect generated output quality
- 6-step wizard flow order: Sections > Brands > Metrics > Audience > Pricing > Generate
- Default form values and section definitions (SECTIONS array)

## Known Issues
- React + Babel CDN approach is slower initial load than compiled React - acceptable for this internal tool
- Edge Function requires valid Supabase project to be running for generation to work
- No production hosting for the frontend - runs as a local file
- No error handling for Edge Function auth/CORS issues
- Color pickers and logo uploads use base64 encoding which inflates prompt size for multi-brand kits
