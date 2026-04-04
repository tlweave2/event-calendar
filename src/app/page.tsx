import Link from "next/link";
import { getTenantBySlug } from "@/lib/tenant";
import { getApprovedEvents } from "@/lib/prisma-tenant";
import { format } from "date-fns";

const TENANT_SLUG = "test";

export default async function Home() {
  const tenant = await getTenantBySlug(TENANT_SLUG);
  const events = tenant ? await getApprovedEvents(tenant.id) : [];
  const upcoming = events.slice(0, 3);

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
        .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1px; background: #e8e6e0; border: 1px solid #e8e6e0; border-radius: 16px; overflow: hidden; }
        .event-card { background: #FAFAF8; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; transition: background 0.15s; }
        .event-card:hover { background: #f5f3ef; }
        .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        @media (max-width: 640px) {
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
          {tenant?.name ?? "Community Calendar"}
        </span>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link href={`/embed/${TENANT_SLUG}/calendar`} style={{ fontSize: "0.875rem", color: "#5a5a55" }}>
            Browse events
          </Link>
          <Link href={`/embed/${TENANT_SLUG}/submit`} style={{ fontSize: "0.875rem", color: "#5a5a55" }}>
            Submit event
          </Link>
          <Link href="/admin" className="btn-primary">
            Admin
          </Link>
        </div>
      </nav>

      <div className="hero" style={{ padding: "5rem 2.5rem 4rem", maxWidth: "900px", margin: "0 auto" }}>
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
          Community Calendar
        </div>
        <h1 className="serif" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "1.25rem" }}>
          Your community,
          <br />
          <span style={{ fontStyle: "italic", color: "#3d9a6e" }}>all in one place.</span>
        </h1>
        <p style={{ fontSize: "1.0625rem", color: "#5a5a55", lineHeight: 1.65, maxWidth: "520px", marginBottom: "2rem", fontWeight: 300 }}>
          Discover local events, submit your own, and stay connected with what&apos;s happening around you.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href={`/embed/${TENANT_SLUG}/calendar`} className="btn-primary">
            Browse events
          </Link>
          <Link href={`/embed/${TENANT_SLUG}/submit`} className="btn-outline">
            Submit an event
          </Link>
        </div>
      </div>

      <div style={{ height: "1px", background: "#e8e6e0", margin: "0 2.5rem" }} />

      <div className="section" style={{ padding: "4rem 2.5rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9a9890", fontWeight: 500, marginBottom: "2rem" }}>
          Upcoming events
        </p>

        {upcoming.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", border: "1px dashed #e8e6e0", borderRadius: "16px" }}>
            <p style={{ color: "#9a9890", fontSize: "0.9375rem" }}>No upcoming events yet.</p>
            <Link href={`/embed/${TENANT_SLUG}/submit`} className="btn-outline" style={{ display: "inline-block", marginTop: "1rem" }}>
              Submit the first one
            </Link>
          </div>
        ) : (
          <div className="events-grid">
            {upcoming.map((event) => (
              <div key={event.id} className="event-card">
                <div>
                  <div style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#3d9a6e", fontWeight: 500 }}>
                    {format(new Date(event.startAt), "MMM")}
                  </div>
                  <div className="serif" style={{ fontSize: "2rem", lineHeight: 1 }}>
                    {format(new Date(event.startAt), "d")}
                  </div>
                </div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 500, lineHeight: 1.35 }}>{event.title}</div>
                <div style={{ fontSize: "0.8125rem", color: "#9a9890", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span>
                    {format(new Date(event.startAt), "h:mm a")}
                    {event.locationName ? ` · ${event.locationName}` : ""}
                  </span>
                  {event.cost && <span>{event.cost}</span>}
                </div>
                {event.category && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "100px",
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginTop: "auto",
                      background: `${event.category.color}22`,
                      color: event.category.color ?? "#5a5a55",
                    }}
                  >
                    {event.category.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "1.25rem" }}>
          <Link href={`/embed/${TENANT_SLUG}/calendar`} className="btn-outline">
            View all events →
          </Link>
        </div>
      </div>

      <div style={{ height: "1px", background: "#e8e6e0", margin: "0 2.5rem" }} />

      <div className="section" style={{ padding: "4rem 2.5rem", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9a9890", fontWeight: 500, marginBottom: "2rem" }}>
          How it works
        </p>
        <div className="how-grid">
          {[
            {
              n: "01",
              title: "Submit your event",
              desc: "Fill out a simple form with your event details — title, date, location, and a short description.",
            },
            {
              n: "02",
              title: "We review it",
              desc: "Our team reviews submissions to keep the calendar relevant and spam-free. You'll hear back by email.",
            },
            {
              n: "03",
              title: "Go live",
              desc: "Once approved, your event appears on the calendar and is visible to the whole community.",
            },
          ].map((step) => (
            <div key={step.n}>
              <div className="serif" style={{ fontSize: "2.5rem", color: "#e8e6e0", lineHeight: 1, marginBottom: "0.75rem" }}>
                {step.n}
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 500, marginBottom: "0.375rem" }}>{step.title}</div>
              <div style={{ fontSize: "0.875rem", color: "#5a5a55", lineHeight: 1.6, fontWeight: 300 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ borderTop: "1px solid #e8e6e0", padding: "2rem 2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8125rem", color: "#9a9890", flexWrap: "wrap", gap: "1rem" }}>
        <span>© {new Date().getFullYear()} {tenant?.name ?? "Community Calendar"}</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link href={`/embed/${TENANT_SLUG}/calendar`} style={{ color: "#9a9890" }}>
            Calendar
          </Link>
          <Link href={`/embed/${TENANT_SLUG}/submit`} style={{ color: "#9a9890" }}>
            Submit event
          </Link>
          <Link href="/admin" style={{ color: "#9a9890" }}>
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}