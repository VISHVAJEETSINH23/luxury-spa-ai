import { NextResponse } from "next/server";
import { isBranchId } from "@/lib/branches";
import { isOwner, unauthorized } from "@/lib/server/adminAuth";
import { db, type BookingRow, type PaymentRow } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The owner's booking board. ?branch=sangli|karad|all &from=YYYY-MM-DD &to=YYYY-MM-DD */
export async function GET(request: Request) {
  if (!(await isOwner())) return unauthorized();

  const url = new URL(request.url);
  const branch = url.searchParams.get("branch") ?? "all";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let supabase;
  try {
    supabase = db();
  } catch (error) {
    console.error("admin bookings:", (error as Error).message);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }

  let query = supabase
    .from("bookings")
    .select("*, payments(razorpay_order_id, razorpay_payment_id, amount_paise, status, method, updated_at)")
    .order("booking_date", { ascending: true })
    .order("slot_time", { ascending: true })
    .limit(500);

  if (isBranchId(branch)) query = query.eq("branch", branch);
  if (from && ISO_DATE.test(from)) query = query.gte("booking_date", from);
  if (to && ISO_DATE.test(to)) query = query.lte("booking_date", to);

  const { data, error } = await query;
  if (error) {
    console.error("admin bookings: failed", error.code);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, bookings: data as (BookingRow & { payments: Partial<PaymentRow>[] })[] },
    { headers: { "Cache-Control": "no-store" } }
  );
}
