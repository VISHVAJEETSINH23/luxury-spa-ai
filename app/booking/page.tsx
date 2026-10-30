import type { Metadata } from "next";
import { Suspense } from "react";
import ManageBooking from "@/components/ManageBooking";

export const metadata: Metadata = {
  title: "Manage your booking | Alexa Salon & Spa",
  robots: { index: false, follow: false },
};

export default function BookingPage() {
  return (
    <Suspense>
      <ManageBooking />
    </Suspense>
  );
}
