# Alexa Spa — Sangli & Karad

Booking website for the two Alexa Spa branches. Guests pick a branch, a
therapy and a time, then pay online (Razorpay, into that branch's own account)
or choose to pay at the spa. The owner sees and manages every booking at
`/admin`.

**Next.js 16 · TypeScript · Tailwind · Supabase (Postgres, Mumbai) · Razorpay · Gemini**

## How a booking works

1. `POST /api/bookings` validates everything server-side — branch, therapy,
   length, date, slot, phone — and takes the **price from the menu**
   (`lib/treatments.ts`). Nothing the browser says about money is read.
2. **Pay at spa** → saved as `pending_confirmation`; the owner confirms it.
3. **Pay online** → saved as `pending_payment`, and a Razorpay order is opened
   on that branch's account. The guest pays in Razorpay Checkout.
4. `POST /api/payments/verify` checks the signature with the branch's secret
   **and** asks Razorpay that the payment is captured for the full amount, then
   marks the booking `confirmed`.
5. The Razorpay webhook (`/api/webhooks/razorpay/sangli` and `/karad`) does the
   same independently, so a guest who closes the tab after paying is still
   confirmed. Both paths are idempotent.

## Security

- The database has two tables (`bookings`, `payments`) with RLS on and no
  policies; the public key can read or write nothing. Only the server, with
  `SUPABASE_SECRET_KEY`, reaches the data. No secret has a `NEXT_PUBLIC_` name.
- `/admin` and `/api/admin/*` are behind `proxy.ts` and re-checked in each
  handler. One owner login: scrypt-hashed password, signed httpOnly
  `SameSite=Strict` cookie, 12-hour session, 5 attempts per 15 minutes,
  Origin check on every state change.
- Webhook and checkout signatures are compared in constant time.
- CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, no `X-Powered-By`.
- Public endpoints are rate-limited; one phone can hold at most 3 open
  requests.

## Setup

```bash
npm install
cp .env.example .env.local
npm run hash-password        # paste the two lines it prints into .env.local
npm run dev
```

Fill in `.env.local` as described in `.env.example`. A branch without
Razorpay keys simply shows "Pay at the spa" only.

Branch WhatsApp numbers and addresses live in `lib/branches.ts`; the site hides
WhatsApp buttons until they are filled in. The database schema is in
`supabase/migrations/`.

## Backups

The free Supabase plan has no backups. `.github/workflows/db-backup.yml` takes
an encrypted dump every night at 03:00 IST and keeps 30 days of them as GitHub
artifacts — set the `SUPABASE_DB_URL` and `BACKUP_PASSPHRASE` repository
secrets. Restore steps are in the workflow file.

## Before going live

- [ ] Real Razorpay **live** keys for each branch, and a webhook per branch
- [ ] Same environment variables set on the host (e.g. Vercel → Settings → Environment Variables)
- [ ] Branch WhatsApp numbers and addresses in `lib/branches.ts`
- [ ] Owner reviews `/privacy`, `/terms`, `/refund-policy` (Razorpay checks these)
- [ ] One real test booking per branch, paid and refunded, end to end
