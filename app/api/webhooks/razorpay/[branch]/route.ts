import { NextResponse } from "next/server";
import { log } from "@/lib/server/log";
import { isBranchId } from "@/lib/branches";
import { findPaymentByOrder, recordCapturedPayment } from "@/lib/server/payments";
import { verifyWebhookSignature } from "@/lib/server/razorpay";
import { db } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
}

/**
 * Razorpay → us, one URL per branch account:
 *   /api/webhooks/razorpay/sangli   /api/webhooks/razorpay/karad
 * This is what confirms a booking when the guest paid but closed the tab
 * before the browser could report back. Every write is idempotent, so
 * Razorpay's retries are harmless.
 */
export async function POST(request: Request, { params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  if (!isBranchId(branch)) return new NextResponse(null, { status: 404 });

  const rawBody = await request.text();
  if (rawBody.length > 64_000) return new NextResponse(null, { status: 413 });

  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(branch, rawBody, signature)) {
    return new NextResponse(null, { status: 400 });
  }

  let event: { event?: string; payload?: Record<string, { entity?: Record<string, unknown> }> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const name = event.event ?? "";

    if (name === "payment.captured" || name === "order.paid") {
      const entity = event.payload?.payment?.entity as unknown as PaymentEntity | undefined;
      if (entity?.order_id && entity.status === "captured" && entity.currency === "INR") {
        const payment = await findPaymentByOrder(entity.order_id);
        // Ignore orders that belong to another branch's account or not to us.
        if (payment && payment.branch === branch) {
          await recordCapturedPayment(payment, entity.id, entity.amount, entity.method ?? null);
        }
      }
    } else if (name === "payment.failed") {
      const entity = event.payload?.payment?.entity as unknown as PaymentEntity | undefined;
      if (entity?.order_id) {
        await db()
          .from("payments")
          .update({ status: "failed", razorpay_payment_id: entity.id })
          .eq("razorpay_order_id", entity.order_id)
          .eq("branch", branch)
          .eq("status", "created");
      }
    } else if (name === "refund.processed") {
      const paymentId = event.payload?.refund?.entity?.payment_id;
      if (typeof paymentId === "string") {
        await db()
          .from("payments")
          .update({ status: "refunded" })
          .eq("razorpay_payment_id", paymentId)
          .eq("branch", branch);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    // A 5xx makes Razorpay retry later, which is what we want on a DB hiccup.
    log.error("webhook.failed", error, { branch, event: event.event ?? "" });
    return new NextResponse(null, { status: 500 });
  }
}
