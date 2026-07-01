import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "stallHq terms of service. Read the rules and guidelines for using the stallHq platform.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://hqlink.vercel.app/terms" },
};

export default function TermsPage() {
  const sectionStyle = { marginBottom: "2rem" };
  const h2Style = { fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" };
  const pStyle = { fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "0.75rem" };
  const ulStyle = { fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: "1.25rem", marginBottom: "0.75rem" };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Terms of Service</h1>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "2rem" }}>Last updated: July 2026</p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Acceptance of Terms</h2>
          <p style={pStyle}>
            By accessing or using stallHq (&quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you agree to these Terms of Service.
            If you do not agree, do not use the Platform.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Description of Service</h2>
          <p style={pStyle}>
            stallHq provides digital storefronts for WhatsApp and Instagram vendors. Vendors create product catalogs at a
            custom URL, and customers place orders by being redirected to WhatsApp or Instagram with pre-filled messages.
            stallHq is not a payment processor — all transactions happen between vendor and customer.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Account Registration</h2>
          <ul style={ulStyle}>
            <li>You must be at least 13 years old to use stallHq.</li>
            <li>You must provide accurate and complete registration information.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must not share your account with others or create multiple accounts for the same business.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Your Store</h2>
          <ul style={ulStyle}>
            <li>You retain full ownership of your products, images, and content.</li>
            <li>You grant stallHq a limited license to display your content as part of the Platform service.</li>
            <li>You are responsible for the accuracy of your product listings, prices, and descriptions.</li>
            <li>You must comply with all applicable laws regarding the products you sell.</li>
            <li> stallHq reserves the right to remove content that violates these terms or applicable law.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Orders and Transactions</h2>
          <ul style={ulStyle}>
            <li>stallHq does not process payments. All payments are handled directly between vendor and customer.</li>
            <li>stallHq is not a party to any transaction between vendor and customer.</li>
            <li>Order disputes, refunds, and returns are solely between vendor and customer.</li>
            <li>stallHq is not liable for any loss arising from transactions.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Subscriptions and Payments</h2>
          <ul style={ulStyle}>
            <li>Free trial: 5 days, up to 10 products. No credit card required.</li>
            <li>Paid plans are billed via Paystack. By subscribing, you authorize Paystack to charge your payment method.</li>
            <li>Subscriptions auto-renew unless cancelled before the renewal date.</li>
            <li>Refund policy: subscriptions are non-refundable except where required by law.</li>
            <li>Plan changes take effect at the next billing cycle.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Prohibited Conduct</h2>
          <p style={pStyle}>You must not:</p>
          <ul style={ulStyle}>
            <li>Use the Platform for any illegal purpose.</li>
            <li>Sell prohibited items (weapons, drugs, counterfeit goods, etc.).</li>
            <li>Upload malicious code, viruses, or harmful content.</li>
            <li>Attempt to access other users&apos; accounts or data without authorization.</li>
            <li>Scrape, crawl, or use automated tools to extract data from the Platform.</li>
            <li>Impersonate another person or business.</li>
            <li>Interfere with or disrupt the Platform&apos;s infrastructure.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Intellectual Property</h2>
          <p style={pStyle}>
            The stallHq platform, code, design, and branding are owned by stallHq. You may not copy, modify, distribute,
            or reverse-engineer any part of the Platform without written permission.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Limitation of Liability</h2>
          <p style={pStyle}>
            stallHq is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental,
            special, or consequential damages arising from your use of the Platform. Our total liability shall not exceed
            the amount you paid us in the 12 months preceding the claim.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Termination</h2>
          <ul style={ulStyle}>
            <li>You may delete your account at any time from your dashboard.</li>
            <li>We may suspend or terminate your account for violation of these terms.</li>
            <li>Upon termination, your data will be handled per our Privacy Policy.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>11. Changes to These Terms</h2>
          <p style={pStyle}>
            We may update these terms from time to time. Continued use of the Platform after changes constitutes acceptance
            of the updated terms.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>12. Governing Law</h2>
          <p style={pStyle}>
            These terms are governed by the laws of the Federal Republic of Nigeria.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>13. Contact</h2>
          <p style={pStyle}>
            Questions? Email{" "}
            <a href="mailto:support@hqlink.vercel.app" style={{ color: "var(--glow-purple)", textDecoration: "none" }}>
              support@hqlink.vercel.app
            </a>.
          </p>
        </div>
      </div>
    </main>
  );
}
