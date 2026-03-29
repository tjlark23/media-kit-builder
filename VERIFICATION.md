# Verification -- Media Kit Builder

## Work Mode
A

## Build/Run Command
Open `media-kit-builder-v3.html` directly in a browser. No build step.

## Live URL
No production deployment. Local file only. Supabase Edge Function at ydcjljkehjqqshftktth.supabase.co/functions/v1/generate-media-kit.

## Required Page/Route Checks
- [ ] Main page loads (React app renders without console errors)
- [ ] Header shows "LOCAL MEDIA HQ | MEDIA KIT BUILDER" branding
- [ ] Step indicators display in header (Sections, Brands, Metrics, Audience, Pricing, Generate)

## Required Flow Checks
- [ ] Step 0 (Sections): Toggle sections on/off, required sections cannot be deselected
- [ ] Step 1 (Brands): Set brand count 1-6, enter brand details, upload logos, pick colors, set combined stats
- [ ] Step 1 (Brands): Kit nav logo upload replaces title text in header
- [ ] Step 2 (Metrics): Add/remove/reorder metrics, toggle hero designation, color selection
- [ ] Step 2 (Metrics): Separate brand metrics toggle appears when brand count > 1
- [ ] Step 3 (Audience): Enter survey data, add/edit testimonials
- [ ] Step 4 (Pricing): Toggle between full pricing and on-request mode
- [ ] Step 4 (Pricing): Per-brand price columns appear when brand count > 1
- [ ] Step 5 (Generate): Build summary displays correct counts
- [ ] Step 5 (Generate): Generate button calls Edge Function and shows spinner
- [ ] Step 5 (Generate): Success state shows Preview/Download/Build Another buttons
- [ ] Step 5 (Generate): Preview opens generated HTML in new tab
- [ ] Step 5 (Generate): Download saves HTML file with brand-name-based filename
- [ ] Navigation: Back/Next buttons work across all steps, Back disabled on step 0

## Responsive Checks
- [ ] Wizard UI at 375px (mobile)
- [ ] Section grid stacks properly on mobile
- [ ] Brand cards and form fields stack on mobile
- [ ] Pricing grid scrolls or stacks on mobile
- [ ] Step indicators in header at 375px
- [ ] All views at 768px (tablet)
- [ ] All views at 1280px (desktop)

## SEO Checks (Public Pages Only)
N/A - internal tool, not a public marketing page.

## Protected Scope
- Supabase Edge Function URL and project ID
- Media kit prompt structure (buildPrompt function)
- 6-step wizard flow order
- SECTIONS and STEPS arrays

## Design Style
Dark SaaS: #0a1628 background, #4A90D9 primary blue, #E8821A accent orange. Bebas Neue headlines, DM Sans body. Professional tool aesthetic with subtle animations.

## Project-Specific Checks
- [ ] React 18 + Babel CDN loads without errors
- [ ] All inline styles render correctly (no Tailwind dependency)
- [ ] Logo upload converts to base64 and displays preview
- [ ] Color picker updates both swatch and hex input
- [ ] Metric reorder (up/down arrows) works correctly
- [ ] buildPrompt() generates valid prompt string with all form data
- [ ] Supabase Edge Function is deployed and responding (test with actual generation)
- [ ] Generated HTML starts with <!DOCTYPE html> (validation check in code)
- [ ] Error state displays when Edge Function fails
