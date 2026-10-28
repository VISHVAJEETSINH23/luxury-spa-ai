import { withSentryConfig } from "@sentry/nextjs/config";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy. Everything is served from this site except
 * Razorpay Checkout, which loads its script and payment frames from
 * *.razorpay.com. 'unsafe-inline' scripts are needed for Next's inline
 * bootstrapping; 'unsafe-eval' only in development for React Refresh.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.razorpay.com",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.razorpay.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://api.razorpay.com",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com")',
  },
];

// Hero frames are versioned by filename/query (?v=), so they never change in
// place: cache them for a year. Other media can be swapped under the same
// name, so browsers keep them a week and the CDN refreshes in the background.
const IMMUTABLE = "public, max-age=31536000, immutable";
const MEDIA = "public, max-age=604800, stale-while-revalidate=86400";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1440, 1920],
    minimumCacheTTL: 604800,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/frames/:path*", headers: [{ key: "Cache-Control", value: IMMUTABLE }] },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: MEDIA }] },
      { source: "/audio/:path*", headers: [{ key: "Cache-Control", value: MEDIA }] },
      { source: "/video/:path*", headers: [{ key: "Cache-Control", value: MEDIA }] },
      // Owner pages and every API answer must never be cached by a browser or CDN.
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Source maps upload only when the Vercel project has SENTRY_AUTH_TOKEN,
  // SENTRY_ORG and SENTRY_PROJECT; without them the build just skips it.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  silent: !process.env.CI,
  telemetry: false,
});
