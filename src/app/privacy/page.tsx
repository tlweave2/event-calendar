export default function PrivacyPage() {
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
        <h1 style={{ fontSize: "2rem", fontWeight: 600, marginBottom: "0.25rem", fontFamily: "'Georgia', 'Times New Roman', serif", color: "#1a1410" }}>Privacy Policy</h1>
        <p style={{ color: "#6b5c4e", marginBottom: "2rem", fontSize: "0.875rem" }}>
          <strong>Effective Date:</strong> April 9, 2026<br />
          <strong>Last Updated:</strong> April 9, 2026
        </p>

        <div style={{ color: "#1a1410" }}>
          <p>
            This Privacy Policy explains how Eventful ("Service," "we," "us," or "our"), operated at useventful.com, collects, uses, and protects your information. By using the Service, you agree to the practices described here.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>1. Who This Policy Applies To</h2>
          <p>This policy applies to:</p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem" }}>
            <li><strong>Tenant Admins</strong> — organizations and individuals who create an Eventful account to manage a community event calendar.</li>
            <li><strong>Event Submitters</strong> — members of the public who submit events through an Eventful-powered form.</li>
            <li><strong>Calendar Visitors</strong> — anyone who views an Eventful-powered calendar on a website or hosted page.</li>
          </ul>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>2. Information We Collect</h2>
          
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.75rem" }}>Information you provide directly</h3>
          
          <p style={{ marginBottom: "0.5rem" }}><strong>Tenant Admins:</strong></p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1.5rem" }}>
            <li>Email address (used for login and account communications)</li>
            <li>Organization name</li>
            <li>Branding preferences (logo, colors, timezone)</li>
            <li>Payment information (processed by Stripe — we do not store credit card numbers)</li>
          </ul>

          <p style={{ marginBottom: "0.5rem" }}><strong>Event Submitters:</strong></p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1.5rem" }}>
            <li>Name and email address (provided when submitting an event)</li>
            <li>Event details: title, description, dates, location, images, ticket URLs, cost</li>
          </ul>

          <p style={{ marginBottom: "0.5rem" }}><strong>Team Members:</strong></p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1.5rem" }}>
            <li>Email address (provided when invited by a Tenant Admin)</li>
          </ul>

          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.75rem" }}>Information collected automatically</h3>
          <p>When you use the Service, we may automatically collect:</p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem" }}>
            <li><strong>Page view data</strong> — which calendar pages and events are viewed, used to provide analytics to Tenant Admins. This data is associated with the tenant, not with individual visitors.</li>
            <li><strong>Basic server logs</strong> — IP addresses, browser type, and timestamps for security and debugging purposes. These are not used for tracking or advertising.</li>
          </ul>

          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.75rem" }}>Information we do NOT collect</h3>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem" }}>
            <li>We do not use cookies for advertising or cross-site tracking.</li>
            <li>We do not sell, rent, or share personal information with advertisers.</li>
            <li>We do not build profiles of Calendar Visitors for marketing purposes.</li>
            <li>We do not collect sensitive personal information such as Social Security numbers, financial account numbers, or health information.</li>
          </ul>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem" }}>
            <li>Operate and maintain the Service (hosting calendars, processing submissions, sending notifications).</li>
            <li>Send email notifications related to your account or event submissions (confirmation emails, moderation notices, team invitations).</li>
            <li>Process payments and manage subscriptions through Stripe.</li>
            <li>Provide analytics to Tenant Admins about their calendar's activity (aggregate page views, submission counts, category breakdowns).</li>
            <li>Improve the Service (fixing bugs, improving performance, developing new features).</li>
            <li>Respond to support requests.</li>
            <li>Enforce our Terms of Service and protect the security of the Service.</li>
          </ul>
          <p>
            We do not use your information for advertising. We do not send marketing emails unless you explicitly opt in to receive them.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>4. How We Share Your Information</h2>
          <p>We share information only in the following limited circumstances:</p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1.5rem" }}>
            <li><strong>With Tenant Admins:</strong> When a submitter submits an event, their name and email address are visible to the Tenant Admin for moderation and communication purposes.</li>
            <li><strong>With service providers:</strong> We use the following third-party services to operate the platform:</li>
          </ul>

          {/* Service providers table */}
          <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", border: "1px solid #ddd" }}>
              <thead>
                <tr style={{ background: "#f5f0e8" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #1a1410", fontWeight: 600 }}>Service</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #1a1410", fontWeight: 600 }}>Purpose</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #1a1410", fontWeight: 600 }}>What they receive</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Vercel</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Website hosting</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Server logs, IP addresses</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Neon (PostgreSQL)</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Database hosting</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>All stored data (encrypted at rest)</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Stripe</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Payment processing</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Tenant Admin email, payment details</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Resend</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Transactional email</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Recipient email addresses, email content</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Cloudflare R2 / AWS S3</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Image storage</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #ddd" }}>Uploaded event images</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.75rem" }}>Anthropic (Claude)</td>
                  <td style={{ padding: "0.75rem" }}>AI flyer scanning</td>
                  <td style={{ padding: "0.75rem" }}>Uploaded flyer images (processed in real-time, not stored by Anthropic for training)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            These providers process data on our behalf and are contractually obligated to protect it.
          </p>

          <ul style={{ marginLeft: "1.5rem", marginBottom: "1.5rem" }}>
            <li><strong>When required by law:</strong> We may disclose information if required by law, legal process, or government request.</li>
            <li><strong>Business transfers:</strong> If Eventful is acquired or merged with another company, your information may be transferred as part of that transaction. We will notify you before your information becomes subject to a different privacy policy.</li>
          </ul>

          <p>
            We do not sell personal information to third parties.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>5. AI Features and Image Processing</h2>
          <p>
            When a Pro plan user uploads an event flyer, the image may be sent to an AI service (Anthropic's Claude) to extract event details such as title, date, time, and location. The image is processed in real-time and is not retained by the AI provider for model training or any other purpose beyond fulfilling the request.
          </p>
          <p>
            The extracted information is presented to the user for review before being saved. We do not use AI to make automated decisions about event approval or moderation.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>6. Data Retention</h2>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem" }}>
            <li><strong>Account data:</strong> We retain your account information for as long as your account is active. If you close your account, we will delete your data within 90 days, except where we are required to retain it for legal or compliance reasons.</li>
            <li><strong>Event data:</strong> Event submissions and associated data are retained for as long as the Tenant's account is active. Tenant Admins can delete individual events at any time.</li>
            <li><strong>Server logs:</strong> Basic server logs are retained for up to 90 days for security and debugging purposes.</li>
            <li><strong>Payment records:</strong> Transaction records are retained as required by tax and financial regulations.</li>
          </ul>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>7. Data Security</h2>
          <p>We take reasonable measures to protect your information, including:</p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem" }}>
            <li>Encryption of data in transit (HTTPS/TLS).</li>
            <li>Encryption of data at rest in our database.</li>
            <li>Access controls limiting who can access personal data.</li>
            <li>Secure authentication for admin accounts.</li>
          </ul>
          <p>
            No system is completely secure, and we cannot guarantee absolute security. If we become aware of a data breach that affects your personal information, we will notify affected users and relevant authorities as required by law.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>8. Your Rights</h2>
          <p>Depending on your location, you may have the following rights regarding your personal information:</p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem" }}>
            <li><strong>Access</strong> — request a copy of the personal information we hold about you.</li>
            <li><strong>Correction</strong> — request that we correct inaccurate information.</li>
            <li><strong>Deletion</strong> — request that we delete your personal information.</li>
            <li><strong>Data portability</strong> — request your data in a commonly used, machine-readable format.</li>
            <li><strong>Objection</strong> — object to certain types of processing.</li>
          </ul>
          <p>
            To exercise any of these rights, email us at <a href="mailto:privacy@useventful.com" style={{ color: "#E8450A", textDecoration: "none" }}>privacy@useventful.com</a>. We will respond within 30 days.
          </p>
          <p>
            <strong>For Event Submitters:</strong> Your name, email, and event details are stored by the Tenant that operates the calendar you submitted to. To request deletion of a specific submission, contact the Tenant Admin directly or email us and we will facilitate the request.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>9. California Residents</h2>
          <p>
            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem" }}>
            <li>The right to know what personal information we collect, use, and disclose.</li>
            <li>The right to request deletion of your personal information.</li>
            <li>The right to opt out of the sale of personal information — we do not sell personal information.</li>
            <li>The right to non-discrimination for exercising your privacy rights.</li>
          </ul>
          <p>
            To make a request, email <a href="mailto:privacy@useventful.com" style={{ color: "#E8450A", textDecoration: "none" }}>privacy@useventful.com</a>.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>10. Children's Privacy</h2>
          <p>
            The Service is not directed at children under 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected information from a child under 13, we will delete it promptly. If you believe a child under 13 has submitted information through the Service, please contact us at <a href="mailto:privacy@useventful.com" style={{ color: "#E8450A", textDecoration: "none" }}>privacy@useventful.com</a>.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>11. International Users</h2>
          <p>
            The Service is hosted in the United States. If you access the Service from outside the United States, your information will be transferred to and processed in the United States. By using the Service, you consent to this transfer.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>12. Tenant Responsibilities</h2>
          <p>
            Tenant Admins are responsible for how they use the information collected through their calendars. If you operate in a jurisdiction that requires specific privacy disclosures (such as GDPR in Europe), you are responsible for maintaining your own compliance, including providing notice to event submitters about how their data will be used.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>13. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or by posting a notice in the Service at least 30 days before the changes take effect. The "Last Updated" date at the top reflects the most recent revision.
          </p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", fontFamily: "'Georgia', 'Times New Roman', serif" }}>14. Contact</h2>
          <p>
            If you have questions about this Privacy Policy or want to exercise your privacy rights, contact us at:
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Eventful</strong><br />
            Email: <a href="mailto:privacy@useventful.com" style={{ color: "#E8450A", textDecoration: "none" }}>privacy@useventful.com</a><br />
            Website: <a href="https://useventful.com" style={{ color: "#E8450A", textDecoration: "none" }}>useventful.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
