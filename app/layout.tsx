import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  metadataBase: new URL("https://alexa-spa.vercel.app"),
  openGraph: {
    title: "Alexa Salon & Spa | Sangli & Karad",
    description: "Massages and body scrub in Sangli and Karad. Book online in under a minute.",
    url: "https://alexa-spa.vercel.app",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body className="bg-[#07090b] text-[#f7f4ee] font-sans antialiased overflow-x-hidden selection:bg-[#c5a880]/30 selection:text-[#f7f4ee]">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
