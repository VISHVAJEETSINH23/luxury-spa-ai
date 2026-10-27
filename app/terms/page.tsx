import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Booking | Alexa Salon & Spa" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Booking" updated="27 October 2026">
      <p>These terms apply to appointments booked on this website at Alexa Salon & Spa, Sangli and Alexa Salon & Spa, Karad.</p>

      <h2>Booking</h2>
      <ul>
        <li>
          <strong>Pay online:</strong> your booking is confirmed as soon as the payment succeeds. You will see a
          booking reference on screen.
        </li>
        <li>
          <strong>Pay at the spa:</strong> your booking is a request until the branch confirms it by phone or
          WhatsApp.
        </li>
        <li>Please give a correct mobile number — it is how the branch reaches you about the booking.</li>
      </ul>

      <h2>Prices</h2>
      <p>
        Prices are as shown on the menu on this website, in Indian Rupees. Couple therapies are priced for two
        guests. The amount you pay online is the full price of the therapy you booked.
      </p>

      <h2>Your health</h2>
      <p>
        Tell us before your session if you are pregnant, have recently had surgery, have a fever, a skin condition,
        or any injury. The therapist may adjust or decline a treatment for your safety. Our therapies are for
        relaxation and are not medical treatment.
      </p>

      <h2>At the spa</h2>
      <p>
        All therapies are professional, non-sexual massage and body treatments. The spa may refuse or end a
        session, without refund, in case of inappropriate behaviour.
      </p>

      <h2>Cancellations and refunds</h2>
      <p>
        See our <Link href="/refund-policy" className="text-[#c5a880] underline">Cancellation &amp; Refund Policy</Link>.
      </p>
    </LegalPage>
  );
}
