"use client";

export default function Home() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #FAFAF8;
          color: #1a1a18;
          min-height: 100vh;
        }

        nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 2.5rem;
          border-bottom: 1px solid #e8e6e0;
          background: #FAFAF8;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .nav-logo {
          font-family: 'DM Serif Display', serif;
          font-size: 1.25rem;
          color: #1a1a18;
          letter-spacing: -0.01em;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-links a {
          font-size: 0.875rem;
          color: #5a5a55;
          text-decoration: none;
          font-weight: 400;
        }

        .nav-links a:hover { color: #1a1a18; }

        .btn-primary {
          background: #1a1a18;
          color: #FAFAF8;
          padding: 0.5rem 1.25rem;
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .btn-primary:hover { opacity: 0.85; }

        .btn-outline {
          background: transparent;
          color: #1a1a18;
          padding: 0.5rem 1.25rem;
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 400;
          text-decoration: none;
          border: 1px solid #c8c6be;
          cursor: pointer;
          transition: border-color 0.15s;
        }

        .btn-outline:hover { border-color: #1a1a18; }

        .hero {
          padding: 5rem 2.5rem 4rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eeecea;
          border-radius: 100px;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          color: #5a5a55;
          font-weight: 500;
          margin-bottom: 1.5rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .hero-tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3d9a6e;
        }

        h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2.5rem, 6vw, 4rem);
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #1a1a18;
          margin-bottom: 1.25rem;
        }

        h1 em {
          font-style: italic;
          color: #3d9a6e;
        }

        .hero-sub {
          font-size: 1.0625rem;
          color: #5a5a55;
          line-height: 1.65;
          max-width: 520px;
          margin-bottom: 2rem;
          font-weight: 300;
        }

        .hero-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .divider {
          height: 1px;
          background: #e8e6e0;
          margin: 0 2.5rem;
        }

        .section {
          padding: 4rem 2.5rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .section-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #9a9890;
          font-weight: 500;
          margin-bottom: 2rem;
        }

        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1px;
          background: #e8e6e0;
          border: 1px solid #e8e6e0;
          border-radius: 16px;
          overflow: hidden;
        }

        .event-card {
          background: #FAFAF8;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: background 0.15s;
          cursor: default;
        }

        .event-card:hover { background: #f5f3ef; }

        .event-date {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .event-date .month {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #3d9a6e;
          font-weight: 500;
        }

        .event-date .day {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem;
          line-height: 1;
          color: #1a1a18;
        }

        .event-title {
          font-size: 0.9375rem;
          font-weight: 500;
          color: #1a1a18;
          line-height: 1.35;
        }

        .event-meta {
          font-size: 0.8125rem;
          color: #9a9890;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .event-tag {
          display: inline-block;
          padding: 0.2rem 0.6rem;
          border-radius: 100px;
          font-size: 0.6875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: auto;
        }

        .tag-music { background: #ede9fe; color: #5b21b6; }
        .tag-arts { background: #fce7f3; color: #9d174d; }
        .tag-community { background: #d1fae5; color: #065f46; }

        .how-it-works {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        @media (max-width: 600px) {
          .how-it-works { grid-template-columns: 1fr; }
          nav { padding: 1rem 1.25rem; }
          .hero { padding: 3rem 1.25rem 2.5rem; }
          .section { padding: 2.5rem 1.25rem; }
          .divider { margin: 0 1.25rem; }
        }

        .step-num {
          font-family: 'DM Serif Display', serif;
          font-size: 2.5rem;
          color: #e8e6e0;
          line-height: 1;
          margin-bottom: 0.75rem;
        }

        .step-title {
          font-size: 0.9375rem;
          font-weight: 500;
          color: #1a1a18;
          margin-bottom: 0.375rem;
        }

        .step-desc {
          font-size: 0.875rem;
          color: #5a5a55;
          line-height: 1.6;
          font-weight: 300;
        }

        footer {
          border-top: 1px solid #e8e6e0;
          padding: 2rem 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8125rem;
          color: #9a9890;
          flex-wrap: wrap;
          gap: 1rem;
        }

        footer a { color: #9a9890; text-decoration: none; }
        footer a:hover { color: #1a1a18; }
      `}</style>

      <nav>
        <span className="nav-logo">Eventful</span>
        <div className="nav-links">
          <a href="/embed/test/calendar">Browse events</a>
          <a href="/embed/test/submit">Submit event</a>
          <a href="/admin" className="btn-primary">
            Admin
          </a>
        </div>
      </nav>

      <div className="hero">
        <div className="hero-tag">
          <div className="hero-tag-dot"></div>
          Community Calendar
        </div>
        <h1>
          Your community,
          <br />
          <em>all in one place.</em>
        </h1>
        <p className="hero-sub">
          Discover local events, submit your own, and stay connected with what's happening around you.
        </p>
        <div className="hero-actions">
          <a href="/embed/test/calendar" className="btn-primary">
            Browse events
          </a>
          <a href="/embed/test/submit" className="btn-outline">
            Submit an event
          </a>
        </div>
      </div>

      <div className="divider"></div>

      <div className="section">
        <p className="section-label">Upcoming events</p>
        <div className="events-grid">
          <div className="event-card">
            <div className="event-date">
              <span className="month">Jul</span>
              <span className="day">12</span>
            </div>
            <div className="event-title">Summer Jazz in the Park</div>
            <div className="event-meta">
              <span>7:00 PM · Riverside Park</span>
              <span>Free admission</span>
            </div>
            <span className="event-tag tag-music">Music</span>
          </div>
          <div className="event-card">
            <div className="event-date">
              <span className="month">Jul</span>
              <span className="day">18</span>
            </div>
            <div className="event-title">Downtown Art Walk</div>
            <div className="event-meta">
              <span>6:00 PM · Gallery Row</span>
              <span>20+ venues</span>
            </div>
            <span className="event-tag tag-arts">Arts</span>
          </div>
          <div className="event-card">
            <div className="event-date">
              <span className="month">Jul</span>
              <span className="day">24</span>
            </div>
            <div className="event-title">Farmers Market &amp; Community Fair</div>
            <div className="event-meta">
              <span>9:00 AM · Town Square</span>
              <span>All ages welcome</span>
            </div>
            <span className="event-tag tag-community">Community</span>
          </div>
        </div>
        <div style={{ marginTop: "1.25rem" }}>
          <a href="/embed/test/calendar" className="btn-outline">
            View all events →
          </a>
        </div>
      </div>

      <div className="divider"></div>

      <div className="section">
        <p className="section-label">How it works</p>
        <div className="how-it-works">
          <div>
            <div className="step-num">01</div>
            <div className="step-title">Submit your event</div>
            <div className="step-desc">
              Fill out a simple form with your event details — title, date, location, and a short description.
            </div>
          </div>
          <div>
            <div className="step-num">02</div>
            <div className="step-title">We review it</div>
            <div className="step-desc">
              Our team reviews submissions to keep the calendar relevant and spam-free. You'll hear back by email.
            </div>
          </div>
          <div>
            <div className="step-num">03</div>
            <div className="step-title">Go live</div>
            <div className="step-desc">
              Once approved, your event appears on the calendar and is visible to the whole community.
            </div>
          </div>
        </div>
      </div>

      <footer>
        <span>© 2026 Eventful</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <a href="/embed/test/calendar">Calendar</a>
          <a href="/embed/test/submit">Submit event</a>
          <a href="/admin">Admin</a>
        </div>
      </footer>
    </>
  );
}
