import * as Sentry from "@sentry/nextjs";

/**
 * Error tracking on the server. Does nothing until NEXT_PUBLIC_SENTRY_DSN is
 * set. Guest details are never sent: no default PII, and request bodies,
 * cookies and headers are stripped before an event leaves.
 */
export function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Guest details never leave: no user info, cookies, headers or bodies.
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    },
  });
}

export const onRequestError = Sentry.captureRequestError;
