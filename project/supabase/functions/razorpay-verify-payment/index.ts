// Supabase Edge Function: razorpay-verify-payment
//
// Deploy via Supabase Dashboard -> Edge Functions -> Deploy a new function
// (name it exactly "razorpay-verify-payment", paste this whole file, Deploy).
//
// Required secrets:
//   RAZORPAY_KEY_SECRET
//   WHATSAPP_TOKEN
//   WHATSAPP_PHONE_NUMBER_ID
//   OWNER_WHATSAPP_NUMBER      e.g. 919876543210 (no +, no spaces)
//   WHATSAPP_TEMPLATE_NAME     e.g. new_order_alert
//   ALLOWED_ORIGINS            comma-separated, e.g. https://yourdomain.com,https://www.yourdomain.com

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Only ever reflect an Origin that's on the allowlist — never "*" for an
// endpoint that confirms payments and returns order details.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

function corsHeadersFor(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function jsonError(message: string, status = 400, corsHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${orderId}|${paymentId}`));
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
              // {{1}}..{{6}} must match the variable order approved in your template
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
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error("Missing payment fields");
    }

    const valid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      Deno.env.get("RAZORPAY_KEY_SECRET")!,
    );
    if (!valid) throw new Error("Payment signature verification failed");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Atomic compare-and-set: only the FIRST call (browser callback or the
    // webhook, whichever arrives first) will actually flip payment_status.
    // If a row comes back, this call "owns" the follow-up actions below —
    // stock and WhatsApp can never double-fire, even under a race.
    const { data: claimedOrder, error: claimError } = await supabase
      .from("orders")
      .update({ payment_status: "processing" })
      .eq("razorpay_order_id", razorpay_order_id)
      .in("payment_status", ["pending", "cod_pending"])
      .select("*")
      .maybeSingle();
    if (claimError) throw claimError;

    if (!claimedOrder) {
      const { data: existing } = await supabase.from("orders").select("*").eq("razorpay_order_id", razorpay_order_id).maybeSingle();
      if (!existing) throw new Error("Order not found");
      const { data: existingItems } = await supabase.from("order_items").select("*").eq("order_id", existing.id);
      return new Response(JSON.stringify({ success: true, orderNumber: existing.order_number, order: existing, items: existingItems || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.rpc("decrement_stock_for_order", { p_order_id: claimedOrder.id });
    await supabase.from("orders").update({ payment_status: "paid", status: "Confirmed", razorpay_payment_id, razorpay_signature, stock_decremented: true }).eq("id", claimedOrder.id);

    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", claimedOrder.id);
    try {
      await sendWhatsAppAlert(claimedOrder, items || []);
      await supabase.from("orders").update({ whatsapp_sent: true }).eq("id", claimedOrder.id);
    } catch (waErr) {
      await supabase.from("orders").update({ whatsapp_sent: false, whatsapp_error: String(waErr) }).eq("id", claimedOrder.id);
    }

    const { data: finalOrder } = await supabase.from("orders").select("*").eq("id", claimedOrder.id).maybeSingle();

    return new Response(JSON.stringify({ success: true, orderNumber: claimedOrder.order_number, order: finalOrder, items: items || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err.message ?? "Verification failed", 400, corsHeaders);
  }
});
