import { LegalPageLayout } from './LegalPageLayout';

export function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" updated="9 August 2026">
      <p>
        These Terms of Service govern your use of the Maison Co. website and your purchase of
        products from us. By placing an order, you agree to these terms.
      </p>

      <h2>Orders & Pricing</h2>
      <p>
        All prices are shown in the currency displayed at checkout and are inclusive of
        applicable taxes unless stated otherwise. We reserve the right to correct pricing errors
        and to cancel and refund any order affected by an error before it ships.
      </p>

      <h2>Payment</h2>
      <p>
        Online payments are processed securely by Razorpay. We verify every payment
        server-side before an order is confirmed — your total is calculated from our live
        product prices at the time of payment, not from anything sent by your browser. Cash on
        Delivery orders are confirmed immediately and paid for at the time of delivery.
      </p>

      <h2>Order Confirmation</h2>
      <p>
        You'll receive an on-screen confirmation with your order number once your order is
        placed, and can track its status from your account at any time.
      </p>

      <h2>Shipping</h2>
      <p>
        See our <a href="/shipping-policy" className="underline">Shipping Policy</a> for delivery
        timelines and charges.
      </p>

      <h2>Cancellations, Returns & Refunds</h2>
      <p>
        See our <a href="/refund-policy" className="underline">Refund &amp; Cancellation Policy</a> for
        full details.
      </p>

      <h2>Product Availability</h2>
      <p>
        Stock is checked at the time of payment. In the rare case an item sells out between
        browsing and checkout, we'll contact you to offer an alternative or a full refund.
      </p>

      <h2>Account Responsibility</h2>
      <p>
        You're responsible for keeping your account credentials confidential and for all
        activity under your account.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        To the extent permitted by law, Maison Co. is not liable for indirect or consequential
        losses arising from use of this site or our products.
      </p>

      <h2>Governing Law</h2>
      <p>These terms are governed by the laws of India.</p>

      <h2>Contact</h2>
      <p>Questions? Email support@maisonco.com.</p>

      <p className="mt-8 rounded-lg border border-ink-100 bg-ink-50 p-4 text-xs text-ink-500">
        This is a template — please have it reviewed by a qualified professional before going
        live to ensure it fits your specific business and complies with local consumer
        protection law.
      </p>
    </LegalPageLayout>
  );
}
