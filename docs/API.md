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
`PAYMENT_NOT_CAPTURED` (402).

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

### `GET /api/cron/expire-bookings`
Vercel Cron only (`Authorization: Bearer $CRON_SECRET`). Cancels online
bookings unpaid for 90 minutes. `{ ok, expired }`.

## Owner (session cookie required; state changes also need a same-origin `Origin`)

| Endpoint | Does |
|---|---|
| `POST /api/admin/login` | `{ password }` → sets the session cookie. 5 tries per 15 min. |
| `POST /api/admin/logout` | Revokes the session and clears the cookie. |
| `GET /api/admin/bookings?branch=&from=&to=` | Up to 500 bookings with their payments. |
| `PATCH /api/admin/bookings/{reference}` | `{ status }` — allowed moves only: confirm, complete, cancel. `409 INVALID_TRANSITION` / `CHANGED_MEANWHILE`. |
