import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side database client. Uses the secret key, which bypasses RLS — so
 * this module must never be imported from a client component ("server-only"
 * enforces that at build time). The key is read from SUPABASE_SECRET_KEY and
 * never given a NEXT_PUBLIC_ name.
 */

let cached: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Database is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY).");
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return cached;
}

export interface BookingRow {
  id: string;
  reference: string;
  branch: "sangli" | "karad";
  therapy_id: string;
  therapy_title: string;
  minutes: number;
  booking_date: string;
  slot_time: string;
  guest_name: string;
  /** Null once the guest's details are removed after the retention period. */
  guest_phone: string | null;
  guest_email: string | null;
  notes: string | null;
  therapist_pref: "female" | "male" | "any";
  amount_inr: number;
  payment_mode: "online" | "at_spa";
  status: "pending_payment" | "pending_confirmation" | "confirmed" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  booking_id: string;
  branch: "sangli" | "karad";
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount_paise: number;
  status: "created" | "captured" | "failed" | "refunded";
  method: string | null;
  created_at: string;
  updated_at: string;
}
