import { LegalPageLayout } from './LegalPageLayout';

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="9 August 2026">
      <p>
        This Privacy Policy explains how Maison Co. ("we", "us") collects, uses, and protects
        your information when you shop with us.
      </p>

      <h2>Information We Collect</h2>
      <ul>
        <li>Contact details you provide at checkout or registration: name, email, phone number, delivery address.</li>
        <li>Order information: items purchased, order value, order history.</li>
        <li>Payment information: we never see or store your card, UPI, or bank details — these are entered directly on Razorpay's secure payment page and handled entirely by Razorpay, a PCI-DSS compliant payment processor.</li>
        <li>Basic usage data such as pages visited, to help us improve the site.</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <ul>
        <li>To process and deliver your orders, and to contact you about them.</li>
        <li>To send order confirmations and, where applicable, marketing emails you've opted into.</li>
        <li>To notify our team of new orders via WhatsApp so they can be fulfilled promptly.</li>
        <li>To improve our products, website, and customer service.</li>
      </ul>

      <h2>Sharing Your Information</h2>
      <p>
        We share the minimum information necessary with trusted third parties to operate our
        store: Razorpay (payment processing), Meta/WhatsApp Business Platform (order
        notifications to our team), and Supabase (secure database hosting). We do not sell your
        personal information to anyone.
      </p>

      <h2>Data Retention</h2>
      <p>
        We retain order records for as long as needed to comply with tax, accounting, and legal
        obligations, and to support returns or warranty claims.
      </p>

      <h2>Your Rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal information by
        contacting us at support@maisonco.com. Note that we may need to retain certain order
        records where required by law.
      </p>

      <h2>Cookies</h2>
      <p>
        We use essential cookies/local storage to keep your cart and session working. We do not
        use third-party advertising trackers.
      </p>

      <h2>Contact Us</h2>
      <p>
        Questions about this policy? Email support@maisonco.com or write to us at 123 Fashion
        Ave, New York, NY 10001.
      </p>

      <p className="mt-8 rounded-lg border border-ink-100 bg-ink-50 p-4 text-xs text-ink-500">
        This is a template policy provided as a starting point. Please have it reviewed by a
        qualified professional before going live, to make sure it accurately reflects your
        business and complies with applicable law (e.g. India's DPDP Act, GDPR if you serve EU
        customers).
      </p>
    </LegalPageLayout>
  );
}
