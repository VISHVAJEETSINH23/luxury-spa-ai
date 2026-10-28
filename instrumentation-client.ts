import * as Sentry from "@sentry/nextjs";

/** Error tracking in the browser. Off until NEXT_PUBLIC_SENTRY_DSN is set. */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Events go to /monitoring on this site, so the CSP stays 'self' and
    // ad-blockers don't swallow them.
    tunnel: "/monitoring",
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Guest details never leave: no user info, cookies, headers or bodies.
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
