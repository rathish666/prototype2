import { LegalPageLayout } from './LegalPageLayout';

export function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refund & Cancellation Policy" updated="9 August 2026">
      <h2>Cancellations</h2>
      <p>
        Orders can be cancelled free of charge as long as they haven't shipped yet. To cancel,
        contact support@maisonco.com with your order number as soon as possible. Once an order
        has shipped, it can no longer be cancelled and must instead be returned per the policy
        below.
      </p>

      <h2>Returns</h2>
      <p>
        We accept returns within 14 days of delivery for items that are unused, unworn, and in
        their original packaging with tags attached. To start a return, email
        support@maisonco.com with your order number and the item(s) you'd like to return.
      </p>

      <h2>Refunds</h2>
      <p>
        Once your return is received and inspected, we'll notify you of the approval status. If
        approved:
      </p>
      <ul>
        <li>Online payments (Razorpay) are refunded to the original payment method, typically within 5–7 business days.</li>
        <li>Cash on Delivery orders are refunded via bank transfer or UPI — we'll ask for your details when processing the return.</li>
      </ul>

      <h2>Non-Returnable Items</h2>
      <p>Items marked "Final Sale" and gift cards are not eligible for return or refund.</p>

      <h2>Damaged or Incorrect Items</h2>
      <p>
        If you receive a damaged, defective, or incorrect item, contact us within 48 hours of
        delivery with photos — we'll arrange a replacement or full refund at no cost to you.
      </p>

      <h2>Contact</h2>
      <p>For any cancellation, return, or refund query, email support@maisonco.com.</p>

      <p className="mt-8 rounded-lg border border-ink-100 bg-ink-50 p-4 text-xs text-ink-500">
        Template policy — adjust the return window, conditions, and refund timelines to match
        your actual operations before going live. Razorpay requires this page to be live on your
        site before activating a live account.
      </p>
    </LegalPageLayout>
  );
}
