/**
 * Content Security Policy, built per request so scripts run only with that
 * request's nonce (proxy.ts creates it and Next.js stamps it on its own
 * scripts). Everything is served from this site except Razorpay Checkout,
 * which loads its script and payment frames from *.razorpay.com. Inline
 * styles stay allowed: React's style={} attributes need them. 'unsafe-eval'
 * only in development for React Refresh.
 */
export function contentSecurityPolicy(nonce: string, isDev = process.env.NODE_ENV !== "production"): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://checkout.razorpay.com${isDev ? " 'unsafe-eval'" : ""}`,
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
}
