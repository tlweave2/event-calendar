import Link from "next/link";

export default function HomePage() {
  return (
    <div
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        background: "#0a0a0a",
        color: "#f5f0e8",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }
        em { font-style: italic; }
        @media (max-width: 700px) {
          nav { padding: 1rem 1.25rem !important; }
          section { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
          footer { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
        }
      `}</style>

      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.5rem 2.5rem",
          borderBottom: "1px solid #222",
        }}
      >
        <span style={{ fontSize: "1.375rem", letterSpacing: "-0.02em", fontWeight: 400 }}>
          Eventful
        </span>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <Link
            href="/admin/login"
            style={{
              color: "#888",
              fontSize: "0.875rem",
              textDecoration: "none",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            style={{
              background: "#f5f0e8",
              color: "#0a0a0a",
              padding: "0.5rem 1.25rem",
              borderRadius: "2rem",
              fontSize: "0.875rem",
              textDecoration: "none",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            Get started free
          </Link>
        </div>
      </nav>

      <section
        style={{
          padding: "7rem 2.5rem 5rem",
          maxWidth: "960px",
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(255,200,100,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "inline-block",
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "2rem",
            padding: "0.375rem 1rem",
            fontSize: "0.75rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#888",
            marginBottom: "2.5rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Community event calendars, simplified
        </div>

        <h1
          style={{
            fontSize: "clamp(2.75rem, 7vw, 5.5rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            fontWeight: 400,
            margin: "0 0 2rem",
            color: "#f5f0e8",
          }}
        >
          Your community&rsquo;s events, {" "}
          <em style={{ color: "#c8a96e", fontStyle: "italic" }}>beautifully organized</em>
        </h1>

        <p
          style={{
            fontSize: "1.125rem",
            color: "#888",
            maxWidth: "520px",
            margin: "0 auto 3rem",
            lineHeight: 1.7,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 300,
          }}
        >
          Give your community a shared calendar. Anyone can submit events. You stay in control. Embed it anywhere in minutes.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/signup"
            style={{
              background: "#c8a96e",
              color: "#0a0a0a",
              padding: "0.875rem 2.25rem",
              borderRadius: "2rem",
              fontSize: "1rem",
              textDecoration: "none",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            Create your calendar →
          </Link>
          <Link
            href="/embed/test/calendar"
            style={{
              background: "transparent",
              color: "#f5f0e8",
              padding: "0.875rem 2.25rem",
              borderRadius: "2rem",
              fontSize: "1rem",
              textDecoration: "none",
              fontFamily: "system-ui, sans-serif",
              border: "1px solid #333",
            }}
          >
            See a live demo
          </Link>
        </div>

        <p style={{ marginTop: "1.25rem", fontSize: "0.8125rem", color: "#555", fontFamily: "system-ui, sans-serif" }}>
          Free to start · No credit card required
        </p>
      </section>

      <div
        style={{
          borderTop: "1px solid #1a1a1a",
          borderBottom: "1px solid #1a1a1a",
          padding: "1.25rem 2.5rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "0.8125rem",
            color: "#555",
            fontFamily: "system-ui, sans-serif",
            margin: 0,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Built for neighborhood associations · school groups · maker spaces · local arts orgs · faith communities · sports leagues
        </p>
      </div>

      <section style={{ padding: "6rem 2.5rem", maxWidth: "1100px", margin: "0 auto" }}>
        <p
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#555",
            fontFamily: "system-ui, sans-serif",
            marginBottom: "1rem",
          }}
        >
          Everything you need
        </p>
        <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", letterSpacing: "-0.03em", fontWeight: 400, marginBottom: "3.5rem", lineHeight: 1.1 }}>
          Run your calendar like a pro
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1px", background: "#1a1a1a", border: "1px solid #1a1a1a", borderRadius: "1rem", overflow: "hidden" }}>
          {[
            {
              title: "Public submissions",
              desc: "Anyone in your community can submit an event. You review and approve every one before it goes live.",
              accent: "#c8a96e",
            },
            {
              title: "Embed anywhere",
              desc: "Drop your calendar onto any website with a single <iframe> tag. It just works.",
              accent: "#7eb8c8",
            },
            {
              title: "Moderation queue",
              desc: "Approve, reject, or bulk-action submissions from a clean dashboard. Stay in full control.",
              accent: "#a8c87e",
            },
            {
              title: "Recurring events",
              desc: "Set up weekly, monthly, or custom repeat schedules once. The series fills in automatically.",
              accent: "#c87ea8",
            },
            {
              title: "Team management",
              desc: "Invite editors and admins to help you moderate. Role-based access, no chaos.",
              accent: "#c8a96e",
            },
            {
              title: "Auto email notifications",
              desc: "Submitters get a confirmation email, then a notification when you approve or reject.",
              accent: "#7eb8c8",
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: "#111",
                padding: "2rem",
              }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: f.accent, marginBottom: "1.25rem" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 400, marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#666", lineHeight: 1.65, fontFamily: "system-ui, sans-serif", fontWeight: 300, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 2.5rem 7rem", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "5rem" }}>
          <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", fontFamily: "system-ui, sans-serif", marginBottom: "1rem" }}>
            How it works
          </p>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", letterSpacing: "-0.03em", fontWeight: 400, marginBottom: "3.5rem", lineHeight: 1.1 }}>
            Up and running in minutes
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "3rem" }}>
            {[
              {
                n: "1",
                title: "Sign up",
                desc: "Create your account and configure your calendar — slug, colors, event categories.",
              },
              {
                n: "2",
                title: "Share the link",
                desc: "Embed it on your site with an iframe, or share the hosted URL in your newsletter.",
              },
              {
                n: "3",
                title: "Moderate submissions",
                desc: "Events from the community come in. You approve what goes live. Simple.",
              },
            ].map((step) => (
              <div key={step.n}>
                <div style={{ fontSize: "3rem", color: "#222", lineHeight: 1, marginBottom: "1rem", fontWeight: 400 }}>
                  {step.n.padStart(2, "0")}
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 400, marginBottom: "0.4rem" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#666", lineHeight: 1.65, fontFamily: "system-ui, sans-serif", fontWeight: 300, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 2.5rem 7rem", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "5rem" }}>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", letterSpacing: "-0.04em", fontWeight: 400, marginBottom: "1.5rem", lineHeight: 1.05 }}>
            Your community deserves a{" "}
            <em style={{ color: "#c8a96e" }}>real</em> calendar.
          </h2>
          <p style={{ fontSize: "1rem", color: "#666", marginBottom: "2.5rem", fontFamily: "system-ui, sans-serif", fontWeight: 300 }}>
            Stop burying events in Facebook posts and email threads. Give people one place to look.
          </p>
          <Link
            href="/signup"
            style={{
              background: "#c8a96e",
              color: "#0a0a0a",
              padding: "1rem 2.75rem",
              borderRadius: "2rem",
              fontSize: "1.0625rem",
              textDecoration: "none",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              display: "inline-block",
            }}
          >
            Create your calendar — it&rsquo;s free →
          </Link>
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid #1a1a1a",
          padding: "2rem 2.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "1.125rem", letterSpacing: "-0.02em" }}>Eventful</span>
        <div style={{ display: "flex", gap: "2rem", fontSize: "0.8125rem", color: "#555", fontFamily: "system-ui, sans-serif" }}>
          <Link href="/signup" style={{ color: "#555", textDecoration: "none" }}>Get started</Link>
          <Link href="/admin/login" style={{ color: "#555", textDecoration: "none" }}>Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
