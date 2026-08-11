// Supabase Edge Function: place-cod-order
//
// Deploy via Supabase Dashboard -> Edge Functions -> Deploy a new function
// (name it exactly "place-cod-order", paste this whole file, Deploy).
//
// Required secrets: same WHATSAPP_* secrets used by the Razorpay functions,
// plus ALLOWED_ORIGIN. Doesn't need any Razorpay secrets.
//
// Why this exists: Cash on Delivery skips Razorpay entirely, but it should
// NOT skip the server-side price/stock verification — a customer's browser
// could otherwise submit any total it likes for a COD order. This function
// mirrors razorpay-create-order's verification, then immediately confirms
// the order (no payment gateway involved) and sends the same WhatsApp alert.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateOrderNumber() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${rand}`;
}

async function sendWhatsAppAlert(order: any, items: any[]) {
  const itemsSummary = items.map((i: any) => `${i.quantity}x ${i.product_name}`).join(", ");
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
                { type: "text", text: `₹${order.total} (COD)` },
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonError("Method not allowed", 405);

  try {
    const { customer, items, shippingMethod, couponCode } = await req.json();

    if (!customer?.name || !customer?.email || !customer?.phone || !customer?.address || !customer?.city) {
      throw new Error("Missing customer details");
    }
    if (!/\S+@\S+\.\S+/.test(customer.email)) throw new Error("Invalid email");
    if (!/^[0-9]{7,15}$/.test(String(customer.phone).replace(/\D/g, ""))) {
      throw new Error("Invalid phone number");
    }
    if (!Array.isArray(items) || items.length === 0) throw new Error("Cart is empty");
    for (const it of items) {
      if (!it.product_id || !Number.isInteger(it.qty) || it.qty < 1 || it.qty > 50) {
        throw new Error("Invalid item in cart");
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const productIds = [...new Set(items.map((i: any) => i.product_id))];
    const { data: products, error: productErr } = await supabase
      .from("products")
      .select("id, name, brand, price, discount_price, stock")
      .in("id", productIds);
    if (productErr) throw productErr;

    const productMap = new Map((products || []).map((p: any) => [p.id, p]));
    const qtyByProduct = new Map<string, number>();
    for (const it of items) {
      qtyByProduct.set(it.product_id, (qtyByProduct.get(it.product_id) || 0) + it.qty);
    }

    let subtotal = 0;
    const verifiedItems = items.map((it: any) => {
      const product = productMap.get(it.product_id);
      if (!product) throw new Error("One or more products no longer exist");
      const totalQtyForProduct = qtyByProduct.get(it.product_id)!;
      if (product.stock < totalQtyForProduct) {
        throw new Error(`"${product.name}" doesn't have enough stock`);
      }
      const unitPrice = product.discount_price && product.discount_price < product.price
        ? Number(product.discount_price)
        : Number(product.price);
      subtotal += unitPrice * it.qty;
      return {
        product_id: product.id,
        product_name: product.name,
        brand: product.brand,
        size: it.size ?? null,
        color: it.color ?? null,
        quantity: it.qty,
        price: unitPrice,
      };
    });

    let discount = 0;
    let appliedCouponCode: string | null = null;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", String(couponCode).toUpperCase())
        .eq("enabled", true)
        .maybeSingle();
      if (coupon && (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) && subtotal >= Number(coupon.min_order)) {
        discount = coupon.type === "percentage" ? subtotal * (Number(coupon.value) / 100) : Math.min(Number(coupon.value), subtotal);
        appliedCouponCode = coupon.code;
      }
    }

    const method = shippingMethod === "Express" ? "Express" : "Standard";
    const shippingFee = method === "Express" ? 25 : subtotal >= 75 ? 0 : 12;
    const total = Math.max(0, subtotal - discount) + shippingFee;
    if (!(total > 0)) throw new Error("Invalid order total");

    let customerId: string | null = null;
    const { data: existingCust } = await supabase.from("customers").select("id").eq("email", customer.email).maybeSingle();
    if (existingCust) {
      customerId = existingCust.id;
    } else {
      const { data: newCust } = await supabase
        .from("customers")
        .insert({ name: customer.name, email: customer.email, phone: customer.phone })
        .select("id")
        .maybeSingle();
      customerId = newCust?.id ?? null;
    }

    let orderNumber = generateOrderNumber();
    let order = null;
    for (let attempt = 0; attempt < 3 && !order; attempt++) {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          customer_name: customer.name,
          customer_email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          country: customer.country || "India",
          shipping_method: method,
          subtotal,
          discount,
          shipping_fee: shippingFee,
          total,
          coupon_code: appliedCouponCode,
          status: "Confirmed",
          payment_method: "COD",
          payment_status: "cod_pending",
        })
        .select("*")
        .maybeSingle();
      if (error?.code === "23505") { orderNumber = generateOrderNumber(); continue; }
      if (error) throw error;
      order = data;
    }
    if (!order) throw new Error("Could not create order, please try again");

    const { error: itemsError } = await supabase.from("order_items").insert(
      verifiedItems.map((it) => ({ ...it, order_id: order!.id })),
    );
    if (itemsError) throw itemsError;

    await supabase.rpc("decrement_stock_for_order", { p_order_id: order.id });
    await supabase.from("orders").update({ stock_decremented: true }).eq("id", order.id);

    try {
      await sendWhatsAppAlert(order, verifiedItems);
      await supabase.from("orders").update({ whatsapp_sent: true }).eq("id", order.id);
    } catch (waErr) {
      await supabase.from("orders").update({ whatsapp_sent: false, whatsapp_error: String(waErr) }).eq("id", order.id);
    }

    return new Response(JSON.stringify({ success: true, orderNumber: order.order_number }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err.message ?? "Could not place order");
  }
});
