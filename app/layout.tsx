import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "ALEXA SPA | Luxury Wellness & Thermal Sanctuary",
  description: "A 70-second transformative cinematic wellness experience crafted for rejuvenation, balance, and pure tranquility.",
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
