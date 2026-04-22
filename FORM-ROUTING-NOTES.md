# Form Routing — Research Notes

Status as of 2026-04-22. Author: Claude Code, on behalf of TJ.

## a. What is currently handling form submissions

The contact form on every public media kit posts to a single Next.js Route Handler at `app/api/contact/route.ts`. That handler uses [Resend](https://resend.com) (the `resend` npm package) to send a transactional email via API.

Key facts:
- Sender address is hardcoded: `Media Kit <onboarding@resend.dev>`. This is Resend's shared sandbox sender, not a verified Local Media HQ domain.
- API key is read from `RESEND_API_KEY` (Vercel env var).
- As of this commit, the recipient is **hardcoded to `tj@tjlarkin.com`** in `RECIPIENT` at the top of the route file. Every submission, from every kit, goes there. The kit's own `contactEmail` field is included in the email body for reference but is not used for routing.
- The form body posted from the client (`app/kit/[slug]/ContactSection.tsx`) already includes `contactEmail` (the kit owner's email entered in the builder). The handler just isn't acting on it right now.
- There is no queue, no DB write, no retry. If Resend fails, the user sees the error message inline and the lead is lost.

There is no Supabase Edge Function, no SMTP, no Formspree, no GoHighLevel webhook in the path. Just `route.ts` → Resend → inbox.

## b. What it would take to route per-kit

The data is already in place — the builder collects `contactEmail` per kit, the kit page passes it to `ContactSection`, and the form posts it to the API. To switch routing on, you only need to change the recipient logic in `app/api/contact/route.ts`:

```ts
const recipient = (contactEmail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail))
  ? contactEmail
  : "tj@tjlarkin.com"; // safety fallback
```

That's the core change. You'd also probably want to:
1. **Send a CC or BCC to tj@tjlarkin.com** so TJ has a paper trail of every lead across the network.
2. **Verify a sender domain in Resend** (e.g. `mediakit.localmediahq.com` or `localmediahq.com`) so the `from:` address isn't `onboarding@resend.dev`. Resend's shared sandbox has aggressive deliverability throttling and can land in spam, especially when the recipient is a small local business inbox. Verifying takes ~15 minutes (DNS records: SPF, DKIM, DMARC).
3. **Validate the email** so a typo in the builder doesn't silently dead-letter every lead.
4. **Optionally write a row to Supabase** (`leads` table or similar) for redundancy. If a kit owner's inbox is full or their domain is misconfigured, the lead is at least retrievable.

## c. Complexity

The minimum viable change — swap the hardcoded recipient for the kit's `contactEmail` — is genuinely a 5-minute edit, plus ~5 minutes of testing.

The "do it right" version with a verified sender domain, BCC to TJ, validation, and Supabase logging is a 1–3 hour job, mostly waiting for DNS to propagate.

So: **30 minutes of code, plus DNS wait time.** Not a multi-day rebuild.

## d. Risks and gotchas

- **Resend free-tier sender (`onboarding@resend.dev`) limits.** Once submissions volume picks up or kit owners start receiving these on Gmail/Outlook business inboxes, deliverability will degrade. Verifying a real domain is mandatory before promoting per-kit routing widely.
- **Sender domain reputation crossover.** If you verify `localmediahq.com` and use it as the `from:` address while emailing arbitrary third-party advertisers, any spam complaints will hurt your main domain's sender reputation. Recommendation: use a subdomain like `mediakit.localmediahq.com` for these transactional sends so reputation is isolated.
- **Bad/missing emails in the builder.** If a kit owner forgets to fill `Contact Email`, the route should fall back to `tj@tjlarkin.com`. If they typo it (`@gmial.com`), Resend will accept the request and bounce silently. A regex check + a Resend webhook listener for bounces would catch this.
- **Reply-To behavior.** The route already sets `replyTo: email` (the sponsor's email). That's correct — when a kit owner hits Reply, they reply to the sponsor, not to themselves. Keep this when switching to per-kit.
- **Spam abuse.** The form has no rate limit, captcha, or honeypot. With per-kit routing, anyone could spray spam to every kit owner's inbox by scripting submissions. At a minimum add a hidden honeypot field. A turnstile/recaptcha is the next step if abuse appears.
- **Multiple kits with the same `contactEmail`.** Fine — Resend doesn't care. Just means one inbox gets multiple leads, which is the desired behavior.
- **Iframe preview environment.** The contact form lives in the parent React app, not inside the iframe. So even when the public kit is embedded, submissions go through the same `/api/contact` endpoint. No special handling needed.

## TL;DR

- Currently: every submission → `tj@tjlarkin.com` via Resend.
- Per-kit routing is one `if` statement away. Data is already collected.
- Real blocker is sender domain verification, not code complexity.
- Add BCC to TJ + a Supabase log when you flip the switch, so leads are never lost.
