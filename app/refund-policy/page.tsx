import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CANCEL_HOURS } from "@/lib/branches";

export const metadata: Metadata = { title: "Cancellation & Refund Policy | Alexa Salon & Spa" };

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Cancellation & Refund Policy" updated="29 October 2026">
      <h2>Cancelling a booking</h2>
      <ul>
        <li>
          To cancel, open <a href="/booking" className="text-[#c5a880] underline">Manage booking</a> and enter your booking reference (for example
          SNG-4F2K9C or KRD-7M3P2Q) and mobile number. To change the time, call or WhatsApp the branch you booked
          with and give your reference.
        </li>
        <li>
          Cancel at least {CANCEL_HOURS} hours before your appointment and an online payment is refunded in full.
        </li>
        <li>
          Cancellations less than {CANCEL_HOURS} hours before the appointment, and missed appointments, are not
          refunded.
        </li>
        <li>Pay-at-spa bookings can be cancelled at any time at no charge.</li>
      </ul>

      <h2>If the spa cancels</h2>
      <p>
        If we have to cancel or cannot honour your slot, you can move it to another time or receive a full refund
        — your choice.
      </p>

      <h2>How refunds are paid</h2>
      <p>
        Refunds go back to the same card, UPI account or bank you paid with, through Razorpay. They usually reach
        you within 5–7 working days of being approved, depending on your bank.
      </p>

      <h2>Payment problems</h2>
      <p>
        If money was deducted but you did not get a booking reference, contact the branch with the time of payment.
        Payments that reach us are matched to the booking automatically; anything that cannot be matched is
        refunded in full.
      </p>
    </LegalPage>
  );
}
