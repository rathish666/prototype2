// Supabase Edge Function: razorpay-create-order
//
// Deploy via Supabase Dashboard -> Edge Functions -> Deploy a new function
// (name it exactly "razorpay-create-order", paste this whole file, Deploy).
//
// Required secrets (Edge Functions -> Secrets):
//   RAZORPAY_KEY_ID
//   RAZORPAY_KEY_SECRET
//   ALLOWED_ORIGIN   e.g. https://yourdomain.com
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically)
//
// What it does:
//   1. Verifies every product/price/stock server-side (never trusts the browser)
//   2. Applies a coupon the same way, if one was sent
//   3. Creates a Razorpay order
//   4. Inserts a "Pending" row into `orders` + its `order_items` using the
//      store's existing schema, so the admin dashboard / account page /
//      order confirmation page all work unchanged.

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonError("Method not allowed", 405);

  try {
    // Client sends product_id + size + color + qty only. Price is NEVER
    // trusted from the browser — it's looked up from the database below.
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

    // ---- fetch REAL prices/stock from the database ----
    const productIds = [...new Set(items.map((i: any) => i.product_id))];
    const [{ data: products, error: productErr }, { data: variants, error: variantErr }] = await Promise.all([
      supabase.from("products").select("id, name, brand, price, discount_price").in("id", productIds),
      supabase.from("product_variants").select("id, product_id, size, color, stock, low_stock_threshold, sku").in("product_id", productIds),
    ]);
    if (productErr) throw productErr;
    if (variantErr) throw variantErr;

    const productMap = new Map((products || []).map((p: any) => [p.id, p]));
    const variantMap = new Map((variants || []).map((v: any) => [`${v.product_id}||${v.size}||${v.color}`, v]));
    const variantById = new Map((variants || []).map((v: any) => [v.id, v]));

    const qtyByVariant = new Map<string, number>();
    for (const it of items) {
      const key = it.variant_id ? it.variant_id : `${it.product_id}||${it.size || ''}||${it.color || ''}`;
      qtyByVariant.set(key, (qtyByVariant.get(key) || 0) + it.qty);
    }

    let subtotal = 0;
    const verifiedItems = items.map((it: any) => {
      const product = productMap.get(it.product_id);
      if (!product) throw new Error("One or more products no longer exist");

      const variant = it.variant_id
        ? variantById.get(it.variant_id)
        : variantMap.get(`${it.product_id}||${it.size || ''}||${it.color || ''}`);
      if (!variant) {
        throw new Error(`Variant not found for ${it.size ?? 'default'} / ${it.color ?? 'default'}`);
      }

      const aggregatedQty = it.variant_id
        ? qtyByVariant.get(it.variant_id)
        : qtyByVariant.get(`${it.product_id}||${it.size || ''}||${it.color || ''}`);
      if (aggregatedQty == null) {
        throw new Error('Could not aggregate variant quantities');
      }
      if (variant.stock < aggregatedQty) {
        throw new Error(`"${product.name}" ${variant.size} / ${variant.color} doesn't have enough stock`);
      }

      const unitPrice = product.discount_price && product.discount_price < product.price
        ? Number(product.discount_price)
        : Number(product.price);
      subtotal += unitPrice * it.qty;
      return {
        product_id: product.id,
        variant_id: variant.id,
        product_name: product.name,
        brand: product.brand,
        size: variant.size,
        color: variant.color,
        quantity: it.qty,
        price: unitPrice,
      };
    });

    // ---- coupon (optional) ----
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

    // ---- create Razorpay order ----
    const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const auth = btoa(`${keyId}:${keySecret}`);

    const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.round(total * 100), // paise
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
      }),
    });
    if (!rpRes.ok) throw new Error(`Razorpay order creation failed: ${await rpRes.text()}`);
    const rpOrder = await rpRes.json();

    // ---- find or create the lightweight customer profile ----
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

    // ---- insert the pending order using verified, server-computed data ----
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
          status: "Pending",
          payment_method: "Razorpay",
          payment_status: "pending",
          razorpay_order_id: rpOrder.id,
        })
        .select("id, order_number")
        .maybeSingle();
      if (error?.code === "23505") { orderNumber = generateOrderNumber(); continue; } // unique violation, retry
      if (error) throw error;
      order = data;
    }
    if (!order) throw new Error("Could not create order, please try again");

    const { error: itemsError } = await supabase.from("order_items").insert(
      verifiedItems.map((it) => ({ ...it, order_id: order!.id })),
    );
    if (itemsError) throw itemsError;

    return new Response(
      JSON.stringify({
        razorpayOrderId: rpOrder.id,
        razorpayKeyId: keyId, // public key, safe to expose
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        orderNumber: order.order_number,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return jsonError(err.message ?? "Something went wrong");
  }
});
