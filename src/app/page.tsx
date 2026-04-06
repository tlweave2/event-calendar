import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#FAFAF8",
        minHeight: "100vh",
        color: "#1a1a18",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .serif { font-family: 'DM Serif Display', serif; }
        a { text-decoration: none; color: inherit; }
        .btn-primary { background: #1a1a18; color: #FAFAF8; padding: 0.5rem 1.25rem; border-radius: 100px; font-size: 0.875rem; font-weight: 500; display: inline-block; transition: opacity 0.15s; }
        .btn-primary:hover { opacity: 0.8; }
        .btn-outline { background: transparent; color: #1a1a18; padding: 0.5rem 1.25rem; border-radius: 100px; font-size: 0.875rem; border: 1px solid #c8c6be; display: inline-block; transition: border-color 0.15s; }
        .btn-outline:hover { border-color: #1a1a18; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        @media (max-width: 640px) {
          .features-grid { grid-template-columns: 1fr; }
          .how-grid { grid-template-columns: 1fr; }
          nav { padding: 1rem 1.25rem !important; }
          .hero { padding: 3rem 1.25rem 2.5rem !important; }
          .section { padding: 2.5rem 1.25rem !important; }
        }
      `}</style>

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 2.5rem",
          borderBottom: "1px solid #e8e6e0",
          background: "#FAFAF8",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <span className="serif" style={{ fontSize: "1.25rem", letterSpacing: "-0.01em" }}>
          Eventful
        </span>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/admin/login" style={{ fontSize: "0.875rem", color: "#5a5a55" }}>
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
        </div>
      </nav>

      <div
        className="hero"
        style={{ padding: "5rem 2.5rem 4rem", maxWidth: "900px", margin: "0 auto" }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#eeecea",
            borderRadius: "100px",
            padding: "0.25rem 0.75rem",
            fontSize: "0.75rem",
            color: "#5a5a55",
            fontWeight: 500,
            marginBottom: "1.5rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3d9a6e" }} />
          Community Calendar Platform
        </div>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "1.25rem",
          }}
        >
          Your community calendar,
          <br />
          <span style={{ fontStyle: "italic", color: "#3d9a6e" }}>up and running in minutes.</span>
        </h1>
        <p
          style={{
            fontSize: "1.0625rem",
            color: "#5a5a55",
            lineHeight: 1.65,
            maxWidth: "520px",
            marginBottom: "2rem",
            fontWeight: 300,
          }}
        >
          Give your community a place to discover local events, submit their own,
          and stay connected with what&apos;s happening - embeddable anywhere.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/signup" className="btn-primary">
            Create your calendar -&gt;
          </Link>
          <Link href="/admin/login" className="btn-outline">
            Sign in
          </Link>
        </div>
      </div>

      <div style={{ height: "1px", background: "#e8e6e0", margin: "0 2.5rem" }} />

      <div className="section" style={{ padding: "4rem 2.5rem", maxWidth: "900px", margin: "0 auto" }}>
        <p
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#9a9890",
            fontWeight: 500,
            marginBottom: "2rem",
          }}
        >
          Everything you need
        </p>
        <div className="features-grid">
          {[
            {
              icon: "📅",
              title: "Public calendar",
              desc: "A clean, embeddable calendar your community can browse. Drop it on any website with a single iframe.",
            },
            {
              icon: "📝",
              title: "Event submissions",
              desc: "Anyone can submit an event. You review and approve before it goes live - keeping quality high.",
            },
            {
              icon: "🔁",
              title: "Recurring events",
              desc: "Weekly markets, monthly meetups, annual festivals. Set it once and the series fills in automatically.",
            },
            {
              icon: "📧",
              title: "Automatic emails",
              desc: "Submitters get a confirmation when they submit and a notification when their event is approved or rejected.",
            },
            {
              icon: "📊",
              title: "Analytics",
              desc: "See how many people are viewing your calendar and which events are getting the most attention.",
            },
            {
              icon: "👥",
              title: "Team access",
              desc: "Invite editors and admins to help manage submissions. Role-based permissions keep things organised.",
            },
          ].map((f) => (
            <div key={f.title}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>{f.icon}</div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 500, marginBottom: "0.375rem" }}>
                {f.title}
              </div>
              <div style={{ fontSize: "0.875rem", color: "#5a5a55", lineHeight: 1.6, fontWeight: 300 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: "1px", background: "#e8e6e0", margin: "0 2.5rem" }} />

      <div className="section" style={{ padding: "4rem 2.5rem", maxWidth: "900px", margin: "0 auto" }}>
        <p
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#9a9890",
            fontWeight: 500,
            marginBottom: "2rem",
          }}
        >
          How it works
        </p>
        <div className="how-grid">
          {[
            {
              n: "01",
              title: "Sign up",
              desc: "Create your account and set up your calendar in minutes. Choose your slug, colours, and categories.",
            },
            {
              n: "02",
              title: "Share the link",
              desc: "Embed the calendar on your website or share the hosted URL directly in newsletters and social media.",
            },
            {
              n: "03",
              title: "Manage submissions",
              desc: "Review incoming events from your admin dashboard. Approve, reject, or edit before they go live.",
            },
          ].map((step) => (
            <div key={step.n}>
              <div
                className="serif"
                style={{ fontSize: "2.5rem", color: "#e8e6e0", lineHeight: 1, marginBottom: "0.75rem" }}
              >
                {step.n}
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 500, marginBottom: "0.375rem" }}>
                {step.title}
              </div>
              <div style={{ fontSize: "0.875rem", color: "#5a5a55", lineHeight: 1.6, fontWeight: 300 }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: "1px", background: "#e8e6e0", margin: "0 2.5rem" }} />

      <div
        className="section"
        style={{
          padding: "5rem 2.5rem",
          maxWidth: "900px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          className="serif"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", letterSpacing: "-0.02em", marginBottom: "1rem" }}
        >
          Ready to launch your calendar?
        </h2>
        <p style={{ fontSize: "1rem", color: "#5a5a55", marginBottom: "2rem", fontWeight: 300 }}>
          Free to start. No credit card required.
        </p>
        <Link href="/signup" className="btn-primary" style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}>
          Create your calendar -&gt;
        </Link>
      </div>

      <footer
        style={{
          borderTop: "1px solid #e8e6e0",
          padding: "2rem 2.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.8125rem",
          color: "#9a9890",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <span className="serif" style={{ fontSize: "1rem" }}>
          Eventful
        </span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link href="/signup" style={{ color: "#9a9890" }}>
            Get started
          </Link>
          <Link href="/admin/login" style={{ color: "#9a9890" }}>
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
