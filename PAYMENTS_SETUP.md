# Payments (Razorpay) + Owner WhatsApp Alerts — Setup Guide

Everything below is dashboard-only — no command line required.

## What you get
- Customers pay by Card / UPI / Netbanking (via Razorpay) or choose Cash on Delivery
- Every price is looked up from the live `products` table on the server — a customer's
  browser can never submit a fake total, for either payment method
- The instant a payment is confirmed (or a COD order is placed): the order is saved, stock
  is reduced, and the store owner gets a WhatsApp message with the full order details
- A backup webhook from Razorpay's own servers guarantees the owner is notified even if the
  customer's browser/internet dies right after paying
- Admin dashboard (`/admin`, password `admin123` by default — change this before going live,
  see "Recommended next steps") already has order management, so no separate build needed there

## 1. Apply the database migrations
Supabase Dashboard → **SQL Editor** → New Query → run each of these **in order** (skip any
you've already applied):

1. `supabase/migrations/20260807171006_create_store_schema.sql` — base store schema
2. `supabase/migrations/20260807180000_seed_demo_data.sql` — sample products/categories (optional, safe to skip in production once you have real inventory)
3. `supabase/migrations/20260809120000_razorpay_whatsapp_integration.sql` — adds payment/WhatsApp tracking columns to `orders`, locks down order writes to server-side only, and adds the `decrement_stock_for_order` function

##supabase secrets set RAZORPAY_KEY_ID=your_test_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_test_key_secret
# later, after adding webhook in Razorpay:
supabase secrets set RAZORPAY_WEBHOOK_SECRET=webhook_secret_from_razorpay

## 3. WhatsApp Cloud API (Meta) account
1. Create a Meta Business Account: https://business.facebook.com
2. https://developers.facebook.com → create an App → add the **WhatsApp** product
3. WhatsApp → API Setup gives you a **test phone number** + **temporary token** (24hr). For
   production: create a System User in Business Settings → generate a **permanent token** with
   `whatsapp_business_messaging` permission, and add your own verified business number.
4. **Create a message template** (WhatsApp → Message Templates → Create):
   - Category: Utility
   - Example body: `New order from {{1}} ({{2}}). Items: {{3}}. Total: {{4}}. Address: {{5}}. Order ID: {{6}}.`
   - Submit for approval (usually minutes to a few hours) — required, Meta doesn't allow
     free-form business-initiated messages
5. Note down: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN`, `WHATSAPP_TEMPLATE_NAME`, and the
   owner's number as `OWNER_WHATSAPP_NUMBER` (e.g. `919876543210`, no `+`)

## 4. Deploy the 4 Edge Functions — entirely in the browser
Supabase Dashboard → **Edge Functions**:

1. **Deploy a new function** → name it exactly `razorpay-create-order` → paste in the full
   contents of `supabase/functions/razorpay-create-order/index.ts` → **Deploy**
2. Repeat: name it `razorpay-verify-payment` → paste `supabase/functions/razorpay-verify-payment/index.ts`
3. Repeat: name it `razorpay-webhook` → paste `supabase/functions/razorpay-webhook/index.ts` →
   while creating it, turn **OFF** "Enforce JWT Verification" (only for this one function —
   Razorpay's servers call it directly and can't send a Supabase login token; security instead
   comes from verifying Razorpay's own signature inside the function)
4. Repeat: name it `place-cod-order` → paste `supabase/functions/place-cod-order/index.ts`
   (this one keeps JWT verification ON, same as the first two — it's called from your own
   checkout page, not by Razorpay)

## 5. Add your secret keys
**Edge Functions → Secrets** (or **Project Settings → Edge Functions**). Add each as Name/Value —
these apply to all functions automatically:

| Name | Value |
|---|---|
| `RAZORPAY_KEY_ID` | from Razorpay |
| `RAZORPAY_KEY_SECRET` | from Razorpay |
| `RAZORPAY_WEBHOOK_SECRET` | from step 6 below |
| `WHATSAPP_TOKEN` | from Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | from Meta |
| `OWNER_WHATSAPP_NUMBER` | e.g. `919876543210` |
| `WHATSAPP_TEMPLATE_NAME` | e.g. `new_order_alert` |
| `ALLOWED_ORIGIN` | your real domain, e.g. `https://maisonco.com` |

## 6. Connect the webhook in Razorpay
Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**:
- URL: the live URL Supabase shows for your `razorpay-webhook` function
- Active event: `payment.captured`
- Save → copy the generated **Webhook Secret** into `RAZORPAY_WEBHOOK_SECRET` (step 5)

## 7. Frontend — already wired up
This is done for you in this build:
- `index.html` already loads `https://checkout.razorpay.com/v1/checkout.js`
- `src/pages/CheckoutPage.tsx` already calls `razorpay-create-order` → opens the Razorpay
  widget → calls `razorpay-verify-payment` on success, or calls `place-cod-order` directly for
  Cash on Delivery
- `src/pages/OrderConfirmationPage.tsx` (route: `/order-confirmation/:orderNumber`) already
  shows the confirmation screen — no separate `/order-success` page needed, both payment paths
  route here
- Admin → Orders already shows payment status (paid / pending / cod_pending / failed),
  fulfillment status, and a WhatsApp delivery indicator per order

There's nothing left to wire up here — just complete steps 1–6 with your real credentials.

## 8. Test end-to-end
- Use Razorpay test cards: https://razorpay.com/docs/payments/payments/test-card-upi-details/
- Place one order via Razorpay and one via Cash on Delivery
- Confirm a row appears in `orders` with the correct `payment_status` (`paid` or `cod_pending`)
  and `stock_decremented = true`
- Confirm the product's `stock` actually went down in the `products` table
- Confirm the owner's WhatsApp receives the message for both order types
- Try the webhook independently: in Razorpay Dashboard → Webhooks, use "Test Webhook" to confirm
  it reaches your function and returns 200

## Security checklist covered
- ✅ Prices looked up from `products` on the server — never trusted from the browser — for
  **both** Razorpay and Cash on Delivery orders
- ✅ CORS restricted to your real domain via `ALLOWED_ORIGIN`
- ✅ Payment signature verified with HMAC-SHA256 before any order is marked "paid"
- ✅ Webhook requests verified against Razorpay's own signature
- ✅ `orders` / `order_items` have no browser write access (RLS policy removed) — only Edge
  Functions using the service-role key can create or modify orders; reads stay public so the
  account page's order history and the order confirmation page keep working
- ✅ Stock decrement and WhatsApp notification are both guarded with an atomic
  compare-and-set on `payment_status`, so a race between the browser callback and the webhook
  can never double-fire either one
- ✅ Raw card details are never collected by this site at all — Razorpay's own hosted widget
  handles that, so there's nothing PCI-sensitive to secure on our side

## Already done elsewhere in this build (from the original "still recommended" list)
- ✅ Admin dashboard to view/update order status — `/admin/orders`
- ✅ Customer-facing order tracking — Account → My Orders / Tracking tabs
- ✅ Terms, Privacy, Shipping, and Refund policy pages are live at `/terms`, `/privacy`,
  `/shipping-policy`, `/refund-policy` (linked from the footer) — **template text**, have a
  professional review it before going live, Razorpay requires these live before activating a
  live account

## Recommended next steps before handing off to the client
- **Change the admin password** — `ADMIN_PASSWORD` in `src/layouts/AdminLayout.tsx` is
  currently the placeholder `admin123`, and the admin session gate is client-side only, not
  real authentication. For a genuinely production-grade admin area, migrate this to Supabase
  Auth with a proper admin role.
- Order confirmation **email** to the customer as a backup/receipt channel (WhatsApp currently
  only notifies the *owner*, not the customer)
- Refund flow in the admin dashboard (Razorpay supports refunds via API — currently refunds
  have to be issued manually from the Razorpay dashboard)
- GST/invoice generation if the client is a registered business
- Custom domain + SSL, analytics, and a final mobile responsiveness pass on checkout & admin
