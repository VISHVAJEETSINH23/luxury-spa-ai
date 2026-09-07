# Alexa Spa

A luxury spa site with an AI business assistant behind it — a practice project
built to see how far a marketing site can go before it turns into an
application. "Alexa Spa" is a fictional brand; there is no real client.

**Next.js 14 · TypeScript · Tailwind · GSAP · Lenis · Gemini**

---

## What it does

**The front of house** is a scroll-driven editorial site. The hero is an
875-frame image sequence scrubbed by scroll position, the way product pages do
it — decoded ahead of the playhead so the scrub never stalls on a frame that
has not arrived.

**The back of house** is an admin dashboard. Bookings persist through a real
API route (`/api/bookings`) and a 3-second poller keeps every open tab and
device in sync, so the front desk on a tablet and the owner on a laptop see the
same board without either of them refreshing.

**The AI layer** is seven server-side route handlers, each with a narrow job:

| route | what it does |
|---|---|
| `ai/concierge` | answers guest questions from the treatment catalogue |
| `ai/today` | the owner's morning briefing from the day's bookings |
| `ai/insights` | trends across the booking history |
| `ai/operations-copilot` | staffing and scheduling suggestions |
| `ai/campaign` | drafts marketing copy from real occupancy |
| `ai/review-reply` | drafts replies in the brand's voice |
| `ai/gift-message` | writes gift-card notes |

## The key never reaches the browser

`lib/ai/client.ts` is marked `import "server-only"`, and every AI feature goes
through a route handler in `app/api/ai/*`. The browser never sees
`GEMINI_API_KEY` — it only ever sees the answer.

The client also degrades instead of breaking: no key configured returns a clean
503 telling you to add it, and the model list falls back
(`gemini-2.5-flash` → `2.0-flash` → `1.5-flash` → `1.5-flash-8b`) rather than
failing outright when a model is unavailable.

## Scrolling goes through one place

The hero mounts Lenis, which takes over the wheel. A native `scrollIntoView` or
a plain hash jump fights it and the page lands hard or not at all — so
`lib/scroll.ts` is the single door: it asks for `window.__lenis` and falls back
to the native path only when the hero is not mounted.

## Running it

```bash
npm install
cp .env.example .env.local     # add GEMINI_API_KEY
npm run dev
```

The site runs without a key — the AI panels return a 503 with an explanation
and everything else works.

| variable | required | what for |
|---|---|---|
| `GEMINI_API_KEY` | for AI features | Google AI Studio key |
| `GEMINI_MODEL` | no | defaults to `gemini-2.5-flash` |
| `NEXT_PUBLIC_SUPABASE_URL` | for shared bookings | falls back to local storage |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | for shared bookings | publishable, not secret |
| `ADMIN_INSIGHTS_SECRET` | for the admin board | gates the insights routes |

## Layout

```
app/            routes; app/api/ai/* holds the seven AI handlers
components/     26 components — hero, suite tour, configurators, admin panels
lib/ai/         server-only Gemini client and booking helpers
lib/scroll.ts   the single entry point for programmatic scrolling
lib/sound*.ts   Web Audio ambience
public/frames/  the 875-frame hero sequence
```

## Notes

- Imagery and audio are placeholders for a fictional brand.
- Not affiliated with Amazon; "Alexa" here is a spa name, not the assistant.
