import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { RETENTION_MONTHS } from "@/lib/server/retention";

export const metadata: Metadata = { title: "Privacy Policy | Alexa Salon & Spa" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="29 October 2026">
      <p>
        This explains what Alexa Salon & Spa (Sangli and Karad) collects when you book on this website, why, and what you
        can ask us to do with it, in line with India&apos;s Digital Personal Data Protection Act, 2023.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Your name and mobile number, and your email if you choose to give it.</li>
        <li>Your booking: branch, therapy, date and time, therapist preference and any note you add.</li>
        <li>For online payments, the Razorpay payment reference and whether the payment succeeded.</li>
      </ul>
      <p>
        We never see or store your card, UPI or bank details. Online payments are handled entirely by Razorpay
        under its own privacy policy.
      </p>

      <h2>Why we use it</h2>
      <ul>
        <li>To hold your slot, confirm it with you, and contact you about that booking.</li>
        <li>To keep accounts of payments, as the law requires.</li>
      </ul>
      <p>We do not sell your details, share them with advertisers, or send you marketing without asking.</p>

      <h2>Where it is kept</h2>
      <p>
        Booking records are stored in a secured database hosted in India (Mumbai). Only the spa owner can see them,
        through a password-protected page. When a new booking arrives, the owner gets an alert on their phone with
        your name, therapy and time (never your number).
      </p>
      <p>
        Your name, mobile number, email and note are removed {RETENTION_MONTHS} months after your appointment. After
        that we keep only an anonymous record — branch, therapy, date and amount — for our accounts, as the law
        requires. Encrypted backups are kept for 30 days and then deleted.
      </p>

      <h2>The chat assistant</h2>
      <p>
        If you use the AI chat on this site, your messages are sent to Google&apos;s Gemini service to write the
        reply. Please don&apos;t type personal details into the chat — it is only for questions about therapies.
      </p>

      <h2>Cookies and your browser</h2>
      <p>
        We use no advertising or tracking cookies. Your browser remembers the branch and language you last picked,
        on your device only.
      </p>

      <h2>Your rights</h2>
      <p>
        You can see or cancel your booking yourself at{" "}
        <a href="/booking" className="text-[#c5a880] underline">
          Manage booking
        </a>
        . You can ask us to show you, correct, or delete the details we hold about you, or withdraw your consent, by
        contacting your branch below. We will respond within 30 days.
      </p>
    </LegalPage>
  );
}
