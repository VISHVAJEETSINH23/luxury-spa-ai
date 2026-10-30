/**
 * The site's public address, for metadata, the sitemap and links in
 * messages. Set NEXT_PUBLIC_SITE_URL to the real domain once it is bought.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://alexa-spa.vercel.app").replace(/\/$/, "");
