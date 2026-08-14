// Supabase Edge Function: razorpay-webhook
//
// Deploy via Supabase Dashboard -> Edge Functions -> Deploy a new function
// (name it exactly "razorpay-webhook", paste this whole file, Deploy).
// IMPORTANT: while creating it, turn OFF "Enforce JWT Verification" for this
// function only — Razorpay's servers call it directly and can't send a
// Supabase login token. Security instead comes from verifying Razorpay's own
// signature below — never remove that check.
//
// Then in Razorpay Dashboard -> Settings -> Webhooks -> Add New Webhook:
//   URL: (copy the live URL Supabase shows for this function)
//   Active events: payment.captured
//   Copy the generated "Webhook Secret" into RAZORPAY_WEBHOOK_SECRET below.
//
// Required secrets: RAZORPAY_WEBHOOK_SECRET, plus the same WHATSAPP_* secrets
// used by razorpay-verify-payment.
//
// This function exists purely as a safety net: if the customer's browser or
// internet dies right after paying, the frontend never gets to call
// razorpay-verify-payment. Razorpay calls this webhook independently
// straight from their servers, so the order still gets marked paid, stock
// still gets decremented, and the owner still gets notified.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return expected === signature;
}

async function sendWhatsAppAlert(order: any, items: any[]) {
  const itemsSummary = items.map((i) => `${i.quantity}x ${i.product_name}`).join(", ");
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("WHATSAPP_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: Deno.env.get("OWNER_WHATSAPP_NUMBER"),
        type: "template",
        template: {
          name: Deno.env.get("WHATSAPP_TEMPLATE_NAME"),
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: order.customer_name },
                { type: "text", text: order.phone },
                { type: "text", text: itemsSummary },
                { type: "text", text: `₹${order.total}` },
                { type: "text", text: `${order.address}, ${order.city}` },
                { type: "text", text: order.order_number },
              ],
            },
          ],
        },
      }),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Signature must be verified against the RAW body text, before JSON parsing.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

  const valid = await verifyWebhookSignature(rawBody, signature, secret);
  if (!valid) {
    // This check is what stops anyone from faking a "payment successful" call.
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);
  if (event.event !== "payment.captured") {
    return new Response("ignored", { status: 200 });
  }

  const payment = event.payload.payment.entity;
  const razorpayOrderId = payment.order_id;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Same atomic compare-and-set as razorpay-verify-payment: whichever path
  // (browser callback or this webhook) gets here first "wins" and is the
  // only one that runs stock decrement + WhatsApp.
  const { data: claimedOrder, error } = await supabase
    .from("orders")
    .update({ payment_status: "processing" })
    .eq("razorpay_order_id", razorpayOrderId)
    .in("payment_status", ["pending", "cod_pending"])
    .select("id, order_number, customer_name, phone, total, address, city")
    .maybeSingle();

  if (error) {
    console.error("Webhook: claim failed for", razorpayOrderId, error);
    return new Response("error", { status: 200 });
  }
  if (!claimedOrder) {
    return new Response("ok", { status: 200 });
  }

  await supabase.rpc("decrement_stock_for_order", { p_order_id: claimedOrder.id });
  await supabase.from("orders").update({ payment_status: "paid", status: "Confirmed", razorpay_payment_id: payment.id, stock_decremented: true }).eq("id", claimedOrder.id);

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", claimedOrder.id);
  try {
    await sendWhatsAppAlert(claimedOrder, items || []);
    await supabase.from("orders").update({ whatsapp_sent: true }).eq("id", claimedOrder.id);
  } catch (waErr) {
    await supabase.from("orders").update({ whatsapp_error: String(waErr) }).eq("id", claimedOrder.id);
    console.error("WhatsApp send failed:", waErr);
  }

  return new Response("ok", { status: 200 });
});
