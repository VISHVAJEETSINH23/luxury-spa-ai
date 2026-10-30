# API

Every endpoint answers JSON and sends `Cache-Control: no-store`. Errors look
like `{ "ok": false, "error": "CODE" }` with a matching HTTP status.

## Public

### `POST /api/bookings`
A guest books a slot. Limit: 10 per 10 minutes per IP; 3 open requests per phone per day.

```json
{
  "branch": "sangli" | "karad",
  "therapyId": "deep-tissue",
  "minutes": 60,
  "date": "2026-11-02",
  "slot": "14:00",
  "name": "…", "phone": "98xxxxxxxx", "email": "…" | null,
  "notes": "…" | null,
  "therapistPref": "female" | "male" | "any",
  "paymentMode": "online" | "at_spa",
  "consent": true
}
```

The price is read from the menu, never from the request.

| Result | Body |
|---|---|
| 200 pay at spa | `{ ok, reference, status: "pending_confirmation", amountInr }` |
| 200 online | `{ ok, reference, status: "pending_payment", amountInr, payment: { keyId, orderId, amountPaise, currency, name, description, prefill } }` — pass `payment` to Razorpay Checkout |
| 400 | `BAD_REQUEST`, `INVALID_BRANCH`, `INVALID_THERAPY`, `INVALID_DATE`, `INVALID_SLOT`, `SLOT_IN_PAST`, `INVALID_NAME`, `INVALID_PHONE`, `INVALID_EMAIL`, `INVALID_PAYMENT_MODE`, `CONSENT_REQUIRED` |
| 409 | `SLOT_FULL` (all rooms taken), `ONLINE_PAYMENT_UNAVAILABLE` |
| 429 | `TOO_MANY_REQUESTS`, `TOO_MANY_OPEN_BOOKINGS` |
| 502 | `PAYMENT_START_FAILED` (booking cancelled, nothing charged) |

### `POST /api/payments/verify`
The browser reports a finished Checkout. Limit: 20 per 10 minutes per IP.

`{ reference, razorpay_order_id, razorpay_payment_id, razorpay_signature }` →
`{ ok, reference, status }`. Errors: `BAD_SIGNATURE`, `UNKNOWN_ORDER` (404),
`PAYMENT_NOT_CAPTURED` (402), `SLOT_TAKEN` (409 — paid, but the booking was
cancelled first; it shows on the board as "Paid · refund due").

### `GET /api/availability?branch=&date=YYYY-MM-DD&minutes=`
Start times where every room is already taken. Limit: 60 per 10 minutes per IP.
`{ ok, full: ["14:00", …] }`. Advisory only — the database trigger decides.

### `POST /api/bookings/manage`
A guest's own booking. Limit: 10 per 10 minutes per IP.

`{ action: "view" | "cancel", reference, phone }` → `{ ok, booking: { reference,
branch, therapyTitle, minutes, date, slot, name, amountInr, paymentMode, paid,
status, canCancel, cancelBlockedBy } }`. A wrong reference/phone pair is
`404 NOT_FOUND`. Cancel errors (409): `STARTED`, `TOO_LATE_FOR_REFUND` (paid,
less than `CANCEL_HOURS` before), `NOT_ACTIVE`, `CHANGED_MEANWHILE`.

### `GET /api/payment-options`
`{ sangli: boolean, karad: boolean }` — which branches take online payment.

### `POST /api/ai/concierge`
Chatbot. Limit: 30 per 10 minutes per IP, plus a site-wide daily budget.

`{ messages: [{ role: "user" | "assistant", content }], language: "en" | "hi" | "mr" }` →
`{ reply, followUp: string[], therapy: {…} | null }`. Always answers; falls
back to built-in replies when Gemini is unavailable or over budget.

### `GET /api/health`
`200 { ok: true }` when the database is reachable, `503` otherwise.

## Webhooks and jobs

### `POST /api/webhooks/razorpay/{sangli|karad}`
Razorpay only. Verified with that branch's webhook secret over the raw body.
Handles `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`.
Idempotent; a 500 makes Razorpay retry.

### `GET /api/cron/daily`
Vercel Cron only (`Authorization: Bearer $CRON_SECRET`). Cancels online
bookings unpaid for 90 minutes, and blanks guest details on bookings older
than the retention period. `{ ok, expired, anonymised }`.

## Owner (session cookie required; state changes also need a same-origin `Origin`)

| Endpoint | Does |
|---|---|
| `POST /api/admin/login` | `{ password }` → sets the session cookie. 5 tries per 15 min. |
| `POST /api/admin/logout` | Revokes the session and clears the cookie. |
| `GET /api/admin/bookings?branch=&from=&to=` | Up to 500 bookings with their payments. |
| `POST /api/admin/bookings` | A phone or walk-in booking, saved as confirmed, pay at spa. `409 SLOT_FULL`. |
| `PATCH /api/admin/bookings/{reference}` | `{ status }` — allowed moves only: confirm, complete, cancel. Or `{ date, slot }` — move a pending or confirmed booking (`400 INVALID_DATE` / `INVALID_SLOT`, `409 SLOT_FULL`). `409 INVALID_TRANSITION` / `CHANGED_MEANWHILE`. |
