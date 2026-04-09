export default function TermsPage() {
  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", background: "#FFFBF5", color: "#1a1410", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.95rem 2.25rem", borderBottom: "2px solid #1a1410", background: "#FFFBF5" }}>
        <a href="/" style={{ fontSize: "1.375rem", letterSpacing: "-0.03em", textDecoration: "none", color: "inherit" }}>
          Event<span style={{ color: "#E8450A" }}>ful</span>
        </a>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 2.25rem", fontSize: "0.95rem", lineHeight: 1.8, fontFamily: "system-ui, sans-serif", color: "#333" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 600, marginBottom: "0.25rem", fontFamily: "'Georgia', 'Times New Roman', serif", color: "#1a1410" }}>Terms of Service</h1>
        <p style={{ color: "#6b5c4e", marginBottom: "2rem", fontSize: "0.875rem" }}>
          <strong>Effective Date:</strong> April 9, 2026<br />
          <strong>Last Updated:</strong> April 9, 2026
        </p>

        <div style={{ color: "#1a1410" }}>
          <p>
            These Terms of Service ("Terms") govern your use of Eventful ("Service," "we," "us," or "our"), operated at useventful.com. By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>1. What Eventful Is</h2>
          <p>
            Eventful is a web-based platform that allows organizations ("Tenants") to collect, moderate, and display community event listings through embeddable calendars and submission forms. The Service includes a public submission form, an admin dashboard, and embeddable calendar widgets.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>2. Accounts and Eligibility</h2>
          <p>
            You must be at least 18 years old to create an account. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You agree to provide accurate information when creating your account and to keep it current.
          </p>
          <p>
            Each account is associated with a single organization (tenant). You may invite additional users to your organization's account. You are responsible for the actions of any users you invite.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>3. Free and Paid Plans</h2>
          <p>
            Eventful offers a free plan and a paid Pro plan. The free plan includes limited features and a monthly event cap. The Pro plan is billed annually at the price displayed at the time of purchase.
          </p>
          <p>
            Payment is processed through Stripe. By subscribing to a paid plan, you authorize us to charge your payment method on a recurring annual basis until you cancel. You may cancel at any time through the billing portal in your account settings. Cancellation takes effect at the end of your current billing period — you retain access to Pro features until then.
          </p>
          <p>
            We do not offer refunds for partial billing periods. We reserve the right to change pricing with 30 days' notice. Price changes will not affect your current billing period.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>4. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem" }}>
            <li>Submit, publish, or distribute content that is unlawful, defamatory, obscene, or infringes on the rights of others.</li>
            <li>Impersonate any person or organization.</li>
            <li>Attempt to gain unauthorized access to the Service or other users' accounts.</li>
            <li>Use the Service to send unsolicited messages or spam.</li>
            <li>Interfere with or disrupt the Service or its infrastructure.</li>
            <li>Scrape, crawl, or use automated tools to extract data from the Service without our written permission.</li>
            <li>Use the Service for any purpose that violates applicable laws or regulations.</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>5. Content and Ownership</h2>
          <p>
            "Your Content" means any text, images, event information, and other materials you or your community submitters upload to the Service.
          </p>
          <p>
            You retain ownership of Your Content. By uploading content to the Service, you grant us a limited, non-exclusive license to host, display, and transmit that content as necessary to operate the Service — for example, displaying event details on your public calendar or sending email notifications to submitters.
          </p>
          <p>
            We do not claim ownership of Your Content and will not use it for purposes unrelated to providing the Service.
          </p>
          <p>
            You are responsible for ensuring you have the right to upload any content, including event images and flyers. If you receive a takedown request for content on your calendar, you agree to address it promptly.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>6. Event Submissions by Third Parties</h2>
          <p>
            The Service allows members of the public to submit events to your calendar. You, as the Tenant, are responsible for moderating and approving submissions before they appear publicly. We do not review, verify, or endorse any event submissions.
          </p>
          <p>
            Submitters grant the Tenant a license to display their submitted event information on the Tenant's calendar. Submitters are responsible for the accuracy of the information they provide.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>7. AI Features</h2>
          <p>
            The Service may include AI-powered features, such as automated extraction of event details from uploaded flyer images. These features are provided as a convenience and may not always be accurate. You are responsible for reviewing and correcting any AI-generated content before publishing.
          </p>
          <p>
            AI features may be limited to certain plan tiers.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>8. Embeddable Widgets</h2>
          <p>
            The Service provides embeddable calendar and submission form widgets designed to be placed on third-party websites via iframe. You are responsible for how and where you embed these widgets.
          </p>
          <p>
            Eventful may display a "Powered by Eventful" badge on embedded widgets for accounts on the free plan. Removing this badge requires a paid plan.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>9. Availability and Support</h2>
          <p>
            We strive to keep the Service available and reliable, but we do not guarantee uninterrupted access. The Service is provided "as is" without warranties of any kind.
          </p>
          <p>
            We may perform maintenance, updates, or changes to the Service that could temporarily affect availability. We will make reasonable efforts to provide advance notice of significant planned downtime.
          </p>
          <p>
            Support is provided via email. Response times may vary based on your plan tier.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>10. Data and Privacy</h2>
          <p>
            Our collection and use of personal information is described in our <a href="/privacy" style={{ color: "#E8450A", textDecoration: "none" }}>Privacy Policy</a>. By using the Service, you agree to the terms of our Privacy Policy.
          </p>
          <p>
            You, as a Tenant, are responsible for any data you collect from event submitters through the Service. If you operate in a jurisdiction that requires a privacy policy or data processing disclosures, you are responsible for maintaining your own compliance.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>11. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Eventful and its operators shall not be liable for any indirect, incidental, consequential, or punitive damages, including lost revenue, lost data, or business interruption, arising out of your use of or inability to use the Service.
          </p>
          <p>
            Our total liability for any claim arising from these Terms or the Service shall not exceed the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>12. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Eventful and its operators from any claims, damages, or expenses (including reasonable legal fees) arising from your use of the Service, your violation of these Terms, or your violation of any third party's rights.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>13. Termination</h2>
          <p>
            You may close your account at any time by contacting us at support@useventful.com.
          </p>
          <p>
            We may suspend or terminate your account if you violate these Terms, if your account is inactive for an extended period, or if we discontinue the Service. If we terminate your account without cause, we will provide reasonable notice and the opportunity to export your data.
          </p>
          <p>
            Upon termination, your right to use the Service ceases. We may delete your data after a reasonable retention period following account closure.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>14. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material changes, we will notify you by email or by posting a notice in the Service at least 30 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated Terms.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>15. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of California, without regard to conflict of law principles. Any disputes shall be resolved in the courts located in San Joaquin County, California.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>16. Contact</h2>
          <p>
            If you have questions about these Terms, contact us at:
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Eventful</strong><br />
            Email: <a href="mailto:support@useventful.com" style={{ color: "#E8450A", textDecoration: "none" }}>support@useventful.com</a><br />
            Website: <a href="https://useventful.com" style={{ color: "#E8450A", textDecoration: "none" }}>useventful.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
