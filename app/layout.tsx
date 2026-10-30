import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BRANCH_LIST, OPENS_AT } from "@/lib/branches";
import { COMPLETE_SPA_DATA } from "@/lib/treatments";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#07090b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Alexa Salon & Spa | Massage in Sangli & Karad — Book Online",
  description:
    "Alexa Salon & Spa in Sangli and Karad: deep tissue, aroma, Swedish, couple and four-hand massages and body scrub. Private rooms with attached hot shower. Book online, pay online or at the spa.",
  keywords: [
    "Alexa Salon & Spa",
    "Spa in Sangli",
    "Spa in Karad",
    "Massage Sangli",
    "Massage Karad",
    "Deep Tissue Massage",
    "Couple Massage",
    "Aroma Massage",
  ],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Alexa Salon & Spa | Sangli & Karad",
    description: "Massages and body scrub in Sangli and Karad. Book online in under a minute.",
    url: SITE_URL,
    siteName: "Alexa Salon & Spa",
    images: [
      {
        url: "/images/suite-panoramic-luxury.jpg",
        width: 1920,
        height: 1080,
        alt: "A treatment room at Alexa Salon & Spa",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alexa Salon & Spa | Sangli & Karad",
    description: "Massages and body scrub in Sangli and Karad. Book online in under a minute.",
    images: ["/images/suite-panoramic-luxury.jpg"],
  },
};

const prices = COMPLETE_SPA_DATA.flatMap((t) => t.options.map((o) => o.price));

/** Both branches as local businesses, so Google can show them in local search and Maps. */
const structuredData = BRANCH_LIST.map((branch) => ({
  "@context": "https://schema.org",
  "@type": "DaySpa",
  "@id": `${SITE_URL}/#${branch.id}`,
  name: branch.name,
  url: SITE_URL,
  image: `${SITE_URL}/images/suite-panoramic-luxury.jpg`,
  ...(branch.phone ? { telephone: `+91${branch.phone}` } : {}),
  ...(branch.address
    ? {
        address: {
          "@type": "PostalAddress",
          streetAddress: branch.address,
          addressLocality: branch.city,
          postalCode: branch.postalCode,
          addressRegion: "Maharashtra",
          addressCountry: "IN",
        },
      }
    : {}),
  ...(branch.geo ? { geo: { "@type": "GeoCoordinates", latitude: branch.geo.lat, longitude: branch.geo.lng } } : {}),
  ...(branch.mapsUrl ? { hasMap: branch.mapsUrl } : {}),
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: OPENS_AT,
    closes: branch.closesAt,
  },
  priceRange: `₹${Math.min(...prices).toLocaleString("en-IN")} – ₹${Math.max(...prices).toLocaleString("en-IN")}`,
  currenciesAccepted: "INR",
}));

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body className="bg-[#07090b] text-[#f7f4ee] font-sans antialiased overflow-x-hidden selection:bg-[#c5a880]/30 selection:text-[#f7f4ee]">
        <script
          type="application/ld+json"
          // JSON only, built from our own branch data; "<" is escaped so it can't close the tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
