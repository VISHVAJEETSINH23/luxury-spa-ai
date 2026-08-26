import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
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
  title: "ALEXA SPA | Luxury Day Spa & Thermal Sanctuary",
  description:
    "Experience 5-star private suite massages with attached hot rain showers, 120°C autoclaved volcanic basalt stones, and custom cold-pressed aromatherapy.",
  keywords: [
    "Luxury Spa",
    "Deep Tissue Massage",
    "Balinese Massage",
    "Couple Spa Suite",
    "Attached Shower Spa",
    "Alexa Spa",
    "Hot Stone Therapy",
    "Aromatherapy",
  ],
  metadataBase: new URL("https://alexa-spa.vercel.app"),
  openGraph: {
    title: "ALEXA SPA | Luxury Day Spa & Thermal Sanctuary",
    description:
      "Private suite massages with attached hot rain showers, autoclaved basalt stones, and certified master therapists.",
    url: "https://alexa-spa.vercel.app",
    siteName: "ALEXA SPA",
    images: [
      {
        url: "/images/suite-panoramic-luxury.jpg",
        width: 1920,
        height: 1080,
        alt: "Alexa Spa Private Sanctuary Suite",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ALEXA SPA | Luxury Day Spa & Thermal Sanctuary",
    description: "Private suite massages with attached hot rain showers & 5-star hygiene.",
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
      </body>
    </html>
  );
}
