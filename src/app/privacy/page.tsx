import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "stallHq privacy policy. Learn how we handle your data, cookies, and protect your privacy.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://stallhq.com/privacy" },
};

export default function PrivacyPage() {
  const sectionStyle = { marginBottom: "2rem" };
  const h2Style = { fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" };
  const pStyle = { fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "0.75rem" };
  const ulStyle = { fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7, paddingLeft: "1.25rem", marginBottom: "0.75rem" };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Privacy Policy</h1>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "2rem" }}>Last updated: July 2026</p>

        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Who We Are</h2>
          <p style={pStyle}>
            stallHq (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a digital storefront platform operated for vendors in Nigeria and across Africa.
            Our website is{" "}
            <a href="https://stallhq.com" style={{ color: "var(--glow-purple)", textDecoration: "none" }}>
              stallhq.com
            </a>.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Data We Collect</h2>
          <p style={pStyle}>We collect only what is necessary to provide the service:</p>
          <ul style={ulStyle}>
            <li><strong>Account data</strong> — email, name, and password (hashed) when you sign up as a vendor.</li>
            <li><strong>Store data</strong> — store name, description, logo, banner, WhatsApp number, Instagram handle, products, and pricing you choose to publish.</li>
            <li><strong>Order data</strong> — customer name, phone, email, and items when a customer places an order through your store.</li>
            <li><strong>Usage data</strong> — anonymous page-visit counts (no personally identifiable information) to show you analytics.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>3. How We Use Your Data</h2>
          <ul style={ulStyle}>
            <li>To provide and maintain the stallHq platform.</li>
            <li>To authenticate your account (login sessions).</li>
            <li>To display your store, products, and orders.</li>
            <li>To send order notification emails to vendors.</li>
            <li>To send transactional emails (verification, password reset, welcome).</li>
            <li>To process subscription payments via Paystack.</li>
            <li>To show anonymous analytics (visit counts, order totals) to store owners.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Cookies</h2>
          <p style={pStyle}>
            stallHq uses only strictly necessary cookies — Supabase authentication session tokens. These are essential for
            keeping you signed in. We do not use tracking cookies, analytics cookies, advertising cookies, or any
            third-party cookies.
          </p>
          <p style={pStyle}>
            No cookie consent banner is required because we do not use non-essential cookies. If this changes in the
            future, we will update this policy and provide a consent mechanism.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Data Sharing</h2>
          <p style={pStyle}>We do not sell your data. We share it only with:</p>
          <ul style={ulStyle}>
            <li><strong>Supabase</strong> — database and authentication hosting.</li>
            <li><strong>Vercel</strong> — application hosting.</li>
            <li><strong>Paystack</strong> — subscription payment processing (card details never touch our servers).</li>
            <li><strong>Brevo</strong> — transactional email delivery.</li>
          </ul>
          <p style={pStyle}>All third-party providers are contractually bound to protect your data.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Data Retention</h2>
          <ul style={ulStyle}>
            <li><strong>Account data</strong> — retained while your account is active. Deleted within 30 days of account deletion.</li>
            <li><strong>Order data</strong> — retained indefinitely unless you delete it, as it is part of your business records.</li>
            <li><strong>Analytics data</strong> — anonymized visit counts are retained indefinitely. No personal data is stored in analytics.</li>
            <li><strong>Verification tokens</strong> — auto-expire and are cleaned up automatically.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Your Rights</h2>
          <ul style={ulStyle}>
            <li><strong>Access</strong> — request a copy of all data we hold about you.</li>
            <li><strong>Rectification</strong> — request correction of inaccurate data.</li>
            <li><strong>Deletion</strong> — request deletion of your account and all associated data.</li>
            <li><strong>Export</strong> — request your data in a portable format.</li>
          </ul>
          <p style={pStyle}>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:support@hqlink.vercel.app" style={{ color: "var(--glow-purple)", textDecoration: "none" }}>
              support@hqlink.vercel.app
            </a>.
          </p>
        </div>

        <div style={sectionStyle} id="data-deletion">
          <h2 style={h2Style}>8. Data Deletion Instructions</h2>
          <p style={pStyle}>
            You can request deletion of your account and all associated data at any time.
          </p>
          <ul style={ulStyle}>
            <li><strong>Self-service:</strong> Go to Account Settings → Delete Account. Your data will be removed within 24 hours.</li>
            <li><strong>Email request:</strong> Send a deletion request to{" "}
              <a href="mailto:support@hqlink.vercel.app" style={{ color: "var(--glow-purple)", textDecoration: "none" }}>
                support@hqlink.vercel.app
              </a>{" "}
              with your account email. We will process your request within 7 business days.
            </li>
            <li><strong>What gets deleted:</strong> Account credentials, store data, products, orders, analytics (anonymized counts may be retained), and all third-party tokens (Instagram, WhatsApp).</li>
            <li><strong>Exceptions:</strong> Transaction records required by law may be retained in encrypted backup storage for up to 90 days before permanent deletion.</li>
          </ul>
          <p style={pStyle}>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:support@hqlink.vercel.app" style={{ color: "var(--glow-purple)", textDecoration: "none" }}>
              support@hqlink.vercel.app
            </a>.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Data Security</h2>
          <p style={pStyle}>
            We use industry-standard encryption (TLS in transit, encrypted at rest via Supabase), row-level security policies,
            and role-based access control. Passwords are hashed with bcrypt. Service-role keys are never exposed to the client.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Children&apos;s Privacy</h2>
          <p style={pStyle}>
            stallHq is not intended for children under 13. We do not knowingly collect data from children.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>11. Changes to This Policy</h2>
          <p style={pStyle}>
            We may update this policy from time to time. Changes will be posted on this page with an updated &quot;Last updated&quot; date.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>12. Contact Us</h2>
          <p style={pStyle}>
            Questions about this policy? Email{" "}
            <a href="mailto:support@hqlink.vercel.app" style={{ color: "var(--glow-purple)", textDecoration: "none" }}>
              support@hqlink.vercel.app
            </a>.
          </p>
        </div>
      </div>
    </main>
  );
}
