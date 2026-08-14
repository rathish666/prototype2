import { LegalPageLayout } from './LegalPageLayout';

export function ShippingPolicyPage() {
  return (
    <LegalPageLayout title="Shipping Policy" updated="9 August 2026">
      <h2>Shipping Methods & Timelines</h2>
      <ul>
        <li><strong>Standard Shipping</strong> — 3–5 business days. Free on orders over INR 75, otherwise INR 12.</li>
        <li><strong>Express Shipping</strong> — 1-2 business days, INR 25.</li>
      </ul>
      <p>
        Timelines are estimates from the date of order confirmation (i.e. after payment is
        verified, or immediately for Cash on Delivery) and may vary by destination.
      </p>

      <h2>Processing Time</h2>
      <p>
        Orders are typically packed and handed to our courier partner within 1–2 business days
        of confirmation.
      </p>

      <h2>Order Tracking</h2>
      <p>
        You can track your order's status at any time from the <a href="/orders" className="underline">Track Order</a> section
        of your account.
      </p>

      <h2>Delivery Issues</h2>
      <p>
        If your order hasn't arrived within the expected window, contact us at
        support@maisonco.com with your order number and we'll look into it right away.
      </p>

      <p className="mt-8 rounded-lg border border-ink-100 bg-ink-50 p-4 text-xs text-ink-500">
        Template policy — update the timelines, fees, and courier details above to match your
        actual shipping setup before going live.
      </p>
    </LegalPageLayout>
  );
}
