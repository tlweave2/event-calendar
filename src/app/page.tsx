import Link from "next/link";

const C = {
  bg: "#FFFBF5",
  ink: "#1a1410",
  red: "#E8450A",
  muted: "#6b5c4e",
  border: "#1a1410",
  faint: "#f0ebe3",
  surface: "#fff",
  purple: { bg: "#EDE9FE", text: "#5B21B6" },
  teal: { bg: "#D1FAE5", text: "#065F46" },
  pink: { bg: "#FCE7F3", text: "#9D174D" },
  amber: { bg: "#FEF3C7", text: "#92400E" },
  blue: { bg: "#DBEAFE", text: "#1E40AF" },
};

type EvStyle = { bg: string; text: string };
const evStyles: Record<string, EvStyle> = {
  purple: C.purple,
  teal: C.teal,
  pink: C.pink,
  amber: C.amber,
  blue: C.blue,
};

const calDays: { num: number; other?: boolean; today?: boolean; events: { label: string; style: string }[] }[] = [
  { num: 29, other: true, events: [] }, { num: 30, other: true, events: [] },
  { num: 1, events: [] }, { num: 2, events: [] }, { num: 3, events: [] },
  { num: 4, events: [{ label: "Fireworks Night", style: "teal" }] },
  { num: 5, events: [{ label: "Farmers Mkt", style: "amber" }] },
  { num: 6, events: [] }, { num: 7, events: [] },
  { num: 8, events: [{ label: "Park Run", style: "blue" }] },
  { num: 9, events: [] }, { num: 10, events: [] },
  { num: 11, events: [{ label: "Jazz Night", style: "purple" }] },
  { num: 12, events: [{ label: "Farmers Mkt", style: "amber" }] },
  { num: 13, events: [] },
  { num: 14, events: [{ label: "Art Walk", style: "pink" }] },
  { num: 15, events: [{ label: "Park Run", style: "blue" }] },
  { num: 16, events: [] }, { num: 17, events: [] },
  { num: 18, events: [{ label: "Block Party", style: "teal" }, { label: "Open Mic", style: "purple" }] },
  { num: 19, events: [{ label: "Farmers Mkt", style: "amber" }] },
  { num: 20, events: [] }, { num: 21, events: [] },
  { num: 22, today: true, events: [{ label: "Park Run", style: "blue" }] },
  { num: 23, events: [{ label: "Gallery Show", style: "pink" }] },
  { num: 24, events: [] },
  { num: 25, events: [{ label: "Movie Night", style: "teal" }] },
  { num: 26, events: [{ label: "Farmers Mkt", style: "amber" }] },
  { num: 27, events: [] },
  { num: 28, events: [{ label: "Concert", style: "purple" }] },
  { num: 29, events: [{ label: "Park Run", style: "blue" }] },
  { num: 30, events: [] }, { num: 31, events: [] },
  { num: 1, other: true, events: [] }, { num: 2, other: true, events: [] },
];

export default function HomePage() {
  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", background: C.bg, color: C.ink, minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── Nav ── */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.1rem 2.5rem", borderBottom: `2px solid ${C.border}`, background: C.bg }}>
        <span style={{ fontSize: "1.375rem", letterSpacing: "-0.03em", fontWeight: 400 }}>
          Event<span style={{ color: C.red }}>ful</span>
        </span>
        <div style={{ display: "flex", gap: "1.75rem", alignItems: "center" }}>
          <Link href="/admin/login" style={{ color: C.muted, fontSize: "0.875rem", textDecoration: "none", fontFamily: "system-ui, sans-serif" }}>
            Sign in
          </Link>
          <Link
            href="/signup"
            style={{
              background: C.ink,
              color: C.bg,
              padding: "0.5rem 1.25rem",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              textDecoration: "none",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
            }}
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── Hero (split-screen) ── */}
      <section style={{ padding: "4rem 2.5rem 3.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>

          {/* Left: copy */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              background: C.amber.bg, border: "1.5px solid #F59E0B",
              borderRadius: "0.375rem", padding: "0.3rem 0.75rem",
              fontSize: "0.68rem", letterSpacing: "0.06em", textTransform: "uppercase",
              color: C.amber.text, marginBottom: "1.75rem",
              fontFamily: "system-ui, sans-serif", fontWeight: 600,
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
              Community event calendars
            </div>

            <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", lineHeight: 1.05, letterSpacing: "-0.04em", fontWeight: 400, margin: "0 0 1.25rem", color: C.ink }}>
              The calendar your<br />
              community <em style={{ color: C.red, fontStyle: "italic" }}>actually uses</em>
            </h1>

            <p style={{ fontSize: "0.9375rem", color: C.muted, maxWidth: "380px", margin: "0 0 2rem", lineHeight: 1.7, fontFamily: "system-ui, sans-serif" }}>
              Anyone can submit events. You approve what goes live. Embed it on your website in minutes — no dev needed.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <Link href="/signup" style={{ background: C.red, color: "#fff", padding: "0.7rem 1.75rem", borderRadius: "0.4rem", fontSize: "0.9rem", textDecoration: "none", fontFamily: "system-ui, sans-serif", fontWeight: 700 }}>
                Create your calendar →
              </Link>
              <Link href="/embed/test/calendar" style={{ background: C.surface, color: C.ink, padding: "0.7rem 1.75rem", borderRadius: "0.4rem", fontSize: "0.9rem", textDecoration: "none", fontFamily: "system-ui, sans-serif", border: `1.5px solid ${C.border}`, fontWeight: 500 }}>
                See a live demo
              </Link>
            </div>

            <p style={{ fontSize: "0.75rem", color: "#bbb", fontFamily: "system-ui, sans-serif" }}>
              Free to start · No credit card required
            </p>
          </div>

          {/* Right: calendar mockup */}
          <div style={{ border: `2px solid ${C.border}`, borderRadius: "12px", overflow: "hidden", fontFamily: "system-ui, sans-serif", background: C.surface }}>

            {/* Cal header */}
            <div style={{ background: C.ink, padding: "0.7rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: C.bg, letterSpacing: "-0.01em" }}>Riverside Community</span>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <span style={{ background: "#2d2520", color: "#ccc", width: "22px", height: "22px", borderRadius: "4px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>‹</span>
                <span style={{ fontSize: "0.7rem", color: "#aaa" }}>July 2026</span>
                <span style={{ background: "#2d2520", color: "#ccc", width: "22px", height: "22px", borderRadius: "4px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>›</span>
              </div>
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", gap: "0.35rem", padding: "0.55rem 0.875rem", borderBottom: `1.5px solid ${C.faint}`, flexWrap: "wrap", background: C.bg }}>
              {(["Music:purple", "Community:teal", "Arts:pink", "Markets:amber", "Sports:blue"]).map((entry) => {
                const [label, s] = entry.split(":");
                return <span key={label} style={{ fontSize: "0.62rem", padding: "0.2rem 0.55rem", borderRadius: "0.25rem", fontWeight: 600, background: evStyles[s].bg, color: evStyles[s].text }}>{label}</span>;
              })}
            </div>

            {/* DOW row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f7f2ea", borderBottom: `1.5px solid ${C.faint}` }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} style={{ fontSize: "0.58rem", color: "#999", textAlign: "center", padding: "0.35rem 0", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {calDays.map((d, i) => (
                <div key={i} style={{ minHeight: "52px", borderRight: (i + 1) % 7 === 0 ? "none" : `1px solid ${C.faint}`, borderBottom: `1px solid ${C.faint}`, padding: "3px" }}>
                  {d.today ? (
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: C.red, color: "#fff", fontSize: "0.6rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2px" }}>{d.num}</div>
                  ) : (
                    <div style={{ fontSize: "0.6rem", color: d.other ? "#ccc" : "#888", marginBottom: "2px", fontWeight: 500 }}>{d.num}</div>
                  )}
                  {d.events.slice(0, 2).map((e, j) => (
                    <div key={j} style={{ fontSize: "0.58rem", padding: "2px 4px", borderRadius: "3px", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.35, fontWeight: 500, background: evStyles[e.style].bg, color: evStyles[e.style].text }}>{e.label}</div>
                  ))}
                </div>
              ))}
            </div>

            {/* Cal footer */}
            <div style={{ padding: "0.6rem 1rem", borderTop: `1.5px solid ${C.faint}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg }}>
              <span style={{ fontSize: "0.65rem", color: "#aaa" }}>23 events this month</span>
              <span style={{ fontSize: "0.7rem", background: C.red, color: "#fff", padding: "0.3rem 0.875rem", borderRadius: "2rem", fontWeight: 700 }}>+ Submit an event</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Audience strip ── */}
      <div style={{ borderTop: `2px solid ${C.border}`, borderBottom: `2px solid ${C.border}`, padding: "1rem 2.5rem", background: C.ink, textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", color: "#888", fontFamily: "system-ui, sans-serif", margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Built for neighborhood associations · school groups · maker spaces · arts orgs · faith communities · sports leagues
        </p>
      </div>

      {/* ── Features ── */}
      <section style={{ padding: "5rem 2.5rem", maxWidth: "1100px", margin: "0 auto" }}>
        <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#bbb", fontFamily: "system-ui, sans-serif", marginBottom: "0.75rem" }}>Everything you need</p>
        <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", letterSpacing: "-0.03em", fontWeight: 400, marginBottom: "3rem", lineHeight: 1.1, color: C.ink }}>
          Run your calendar like a pro
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1px", background: C.border, border: `2px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
          {[
            { title: "Public submissions", desc: "Anyone in your community can submit an event. You review and approve every one before it goes live.", bar: C.red },
            { title: "Embed anywhere", desc: "Drop your calendar onto any website with a single iframe tag. It just works — no dev skills needed.", bar: "#2563EB" },
            { title: "Moderation queue", desc: "Approve, reject, or bulk-action submissions from a clean dashboard. Stay in full control.", bar: "#059669" },
            { title: "Recurring events", desc: "Set up weekly, monthly, or custom repeat schedules once. The series fills in automatically.", bar: "#7C3AED" },
            { title: "Team management", desc: "Invite editors and admins to help you moderate. Role-based access, no chaos.", bar: "#D97706" },
            { title: "Email notifications", desc: "Submitters get a confirmation, then a notification when you approve or reject their event.", bar: "#DB2777" },
          ].map((f) => (
            <div key={f.title} style={{ background: C.surface, padding: "2rem" }}>
              <div style={{ width: "32px", height: "4px", borderRadius: "2px", background: f.bar, marginBottom: "1.25rem" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", fontFamily: "system-ui, sans-serif", color: C.ink }}>{f.title}</h3>
              <p style={{ fontSize: "0.875rem", color: C.muted, lineHeight: 1.65, fontFamily: "system-ui, sans-serif", margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: "0 2.5rem 5rem", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ borderTop: `2px solid ${C.faint}`, paddingTop: "4.5rem" }}>
          <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#bbb", fontFamily: "system-ui, sans-serif", marginBottom: "0.75rem" }}>How it works</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", letterSpacing: "-0.03em", fontWeight: 400, marginBottom: "3rem", lineHeight: 1.1, color: C.ink }}>
            Up and running in minutes
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2.5rem" }}>
            {[
              { n: "01", title: "Sign up", desc: "Create your account and set up your calendar — pick your slug, colors, and event categories.", color: C.red },
              { n: "02", title: "Share the link", desc: "Embed it on your website with an iframe, or share the hosted URL in your newsletter or social.", color: "#2563EB" },
              { n: "03", title: "Moderate & publish", desc: "Events from the community come in. You approve what goes live. Everyone stays informed.", color: "#059669" },
            ].map((step) => (
              <div key={step.n}>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, color: step.color, lineHeight: 1, marginBottom: "1rem", fontFamily: "system-ui, sans-serif", opacity: 0.25 }}>{step.n}</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.4rem", fontFamily: "system-ui, sans-serif", color: C.ink }}>{step.title}</h3>
                <p style={{ fontSize: "0.875rem", color: C.muted, lineHeight: 1.65, fontFamily: "system-ui, sans-serif", margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ padding: "0 2.5rem 5rem", maxWidth: "860px", margin: "0 auto" }}>
        <div style={{ borderTop: `2px solid ${C.faint}`, paddingTop: "4.5rem" }}>
          <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#bbb", fontFamily: "system-ui, sans-serif", marginBottom: "0.75rem" }}>Pricing</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", letterSpacing: "-0.03em", fontWeight: 400, marginBottom: "3rem", lineHeight: 1.1, color: C.ink }}>
            Simple, honest pricing
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>

            <div style={{ border: `2px solid ${C.border}`, borderRadius: "12px", padding: "2.25rem", background: C.surface }}>
              <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, fontFamily: "system-ui, sans-serif", margin: "0 0 1rem", fontWeight: 600 }}>Free</p>
              <div style={{ fontSize: "2.5rem", fontWeight: 400, letterSpacing: "-0.03em", marginBottom: "0.2rem", color: C.ink }}>$0</div>
              <p style={{ fontSize: "0.875rem", color: "#bbb", fontFamily: "system-ui, sans-serif", marginBottom: "1.75rem" }}>Forever free</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", fontSize: "0.875rem", color: C.muted, fontFamily: "system-ui, sans-serif", lineHeight: 2 }}>
                <li>✓ &nbsp;1 calendar</li>
                <li>✓ &nbsp;Up to 50 events/month</li>
                <li>✓ &nbsp;Public submissions</li>
                <li>✓ &nbsp;Email notifications</li>
              </ul>
              <Link href="/signup" style={{ display: "block", textAlign: "center", border: `2px solid ${C.border}`, color: C.ink, padding: "0.7rem", borderRadius: "0.4rem", textDecoration: "none", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600 }}>
                Get started
              </Link>
            </div>

            <div style={{ border: `2px solid ${C.red}`, borderRadius: "12px", padding: "2.25rem", background: C.surface, position: "relative" }}>
              <div style={{ position: "absolute", top: "-0.75rem", left: "1.5rem", background: C.red, color: "#fff", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.25rem 0.75rem", borderRadius: "2rem", fontFamily: "system-ui, sans-serif", fontWeight: 700 }}>
                Most popular
              </div>
              <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.red, fontFamily: "system-ui, sans-serif", margin: "0 0 1rem", fontWeight: 600 }}>Pro</p>
              <div style={{ fontSize: "2.5rem", fontWeight: 400, letterSpacing: "-0.03em", marginBottom: "0.2rem", color: C.ink }}>$12</div>
              <p style={{ fontSize: "0.875rem", color: "#bbb", fontFamily: "system-ui, sans-serif", marginBottom: "1.75rem" }}>per month</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", fontSize: "0.875rem", color: C.muted, fontFamily: "system-ui, sans-serif", lineHeight: 2 }}>
                <li>✓ &nbsp;Unlimited events</li>
                <li>✓ &nbsp;Multiple team members</li>
                <li>✓ &nbsp;Analytics dashboard</li>
                <li>✓ &nbsp;CSV export</li>
                <li>✓ &nbsp;Recurring event series</li>
                <li>✓ &nbsp;Custom branding</li>
              </ul>
              <Link href="/signup" style={{ display: "block", textAlign: "center", background: C.red, color: "#fff", padding: "0.7rem", borderRadius: "0.4rem", textDecoration: "none", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 700 }}>
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section style={{ margin: "0 2.5rem 5rem", borderRadius: "16px", background: C.ink, padding: "4rem 3rem", textAlign: "center", border: `2px solid ${C.border}` }}>
        <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", letterSpacing: "-0.04em", fontWeight: 400, marginBottom: "1.25rem", lineHeight: 1.05, color: C.bg }}>
          Your community deserves a{" "}
          <em style={{ color: C.red, fontStyle: "italic" }}>real</em> calendar.
        </h2>
        <p style={{ fontSize: "1rem", color: "#888", marginBottom: "2.25rem", fontFamily: "system-ui, sans-serif", maxWidth: "480px", margin: "0 auto 2.25rem", lineHeight: 1.6 }}>
          Stop burying events in Facebook posts and email threads. Give people one place to look.
        </p>
        <Link href="/signup" style={{ background: C.red, color: "#fff", padding: "0.875rem 2.5rem", borderRadius: "0.4rem", fontSize: "1rem", textDecoration: "none", fontFamily: "system-ui, sans-serif", fontWeight: 700, display: "inline-block" }}>
          Create your calendar — it&rsquo;s free →
        </Link>
        <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#555", fontFamily: "system-ui, sans-serif" }}>No credit card required</p>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `2px solid ${C.border}`, padding: "1.75rem 2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ fontSize: "1.125rem", letterSpacing: "-0.03em" }}>
          Event<span style={{ color: C.red }}>ful</span>
        </span>
        <div style={{ display: "flex", gap: "2rem", fontSize: "0.8125rem", color: C.muted, fontFamily: "system-ui, sans-serif" }}>
          <Link href="/signup" style={{ color: C.muted, textDecoration: "none" }}>Get started</Link>
          <Link href="/admin/login" style={{ color: C.muted, textDecoration: "none" }}>Sign in</Link>
        </div>
      </footer>

    </div>
  );
}
