import Link from "next/link";

import { FLYER_SCANS_PER_MONTH } from "@/lib/plans";

const sampleListing = [
  { day: "Fri", date: "12", month: "Jun", time: "6:00 pm", title: "Downtown Farmers Market", venue: "Library Park", tag: "Market" },
  { day: "Sat", date: "13", month: "Jun", time: "8:00 am", title: "Riverside 5K Fun Run", venue: "Woodward Park trailhead", tag: "Sports" },
  { day: "Sat", date: "13", month: "Jun", time: "7:30 pm", title: "Summer Concert: The Tin Cans", venue: "Bandshell, Central Park", tag: "Music" },
  { day: "Sun", date: "14", month: "Jun", time: "11:00 am", title: "Classic Car Show & Swap Meet", venue: "Fairgrounds Lot B", tag: "Community" },
  { day: "Wed", date: "17", month: "Jun", time: "6:30 pm", title: "Open Mic at the Grange", venue: "Grange Hall, 2nd St", tag: "Arts" },
];

const features = [
  ["Submission form", "A public form anyone can fill out. No account needed. Submitters get an email when you've received it."],
  ["Review queue", "New submissions wait for you. Approve or reject them one at a time or in bulk, and edit anything before it goes live."],
  ["Embed on your site", "Paste one snippet into your website. Choose a month grid, a list, or a flyer wall, and match your colors and font."],
  ["Filtered views", "Publish separate calendars by category, such as a music-only page for the bandshell or a kids' page for the library."],
  ["Recurring events", "Weekly, every other week, or monthly. Edit or cancel one date or the whole series."],
  ["Google Calendar", "Already keep a Google Calendar? Paste its link and those events show up alongside the submitted ones."],
  ["Subscribe and export", "Every calendar has a feed people can add to their phone. Download everything as a spreadsheet whenever you need it."],
  ["Fill in from a flyer", "Upload a photo of a flyer and the title, date, time and place are filled in for you to check."],
  ["Your team", "Invite up to 25 people as admins or editors to share the reviewing."],
  ["Webhooks", "Send new and approved events to your newsletter tool, Zapier, or anything else that accepts a webhook."],
];

const faqs = [
  ["Do people need an account to submit an event?", "No. They fill out the form and give an email address so you can reach them. Only the people who manage the calendar sign in."],
  ["Will it work with my website?", "If your site lets you paste HTML (WordPress, Squarespace, Wix, and most others do), yes. You can also just link to your calendar's own page."],
  ["Is it really free?", `Yes. Every calendar gets everything: unlimited events, your whole team, no Eventful branding. The only limit is ${FLYER_SCANS_PER_MONTH} flyer scans per calendar a month, because each one costs us to run.`],
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;

  return (
    <div className="app-ui min-h-screen">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--app-serif)" }}>
            Eventful
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <a href="#price" className="hidden text-gray-600 hover:text-gray-900 sm:inline">Price</a>
            <Link href="/api/demo" className="hidden text-gray-600 hover:text-gray-900 sm:inline">Demo</Link>
            <Link href="/admin/login" className="text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link href="/signup" className="rounded bg-gray-900 px-3.5 py-2 font-medium text-white hover:bg-gray-700">
              Start a calendar
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {demo === "busy" && (
          <div role="status" className="border-b border-gray-200 bg-white">
            <p className="mx-auto max-w-6xl px-5 py-3 text-sm text-gray-700 sm:px-8">
              Too many demos have been started from your connection recently. Try again in an hour, or{" "}
              <Link href="/signup" className="font-medium text-gray-900 underline">start a free calendar</Link>.
            </p>
          </div>
        )}
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <h1 className="text-4xl font-semibold leading-[1.1] sm:text-5xl">
              One calendar for everything happening in town.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-700">
              People send you their events. You approve the ones that belong.
              Eventful puts them on your website, in a feed people can add to
              their phones, and on a page you can link from anywhere.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="rounded bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-700">
                Start a calendar
              </Link>
              <Link href="/api/demo" className="rounded border border-gray-300 bg-white px-5 py-3 font-medium hover:border-gray-900">
                Open the demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">Free, with everything included.</p>
          </div>

          <figure aria-label="Example calendar listing" className="border border-gray-900 bg-white">
            <div className="flex items-baseline justify-between border-b border-gray-900 px-5 py-3">
              <span className="font-semibold" style={{ fontFamily: "var(--app-serif)" }}>This week in Riverside</span>
              <span className="text-xs text-gray-500">June 12–17</span>
            </div>
            <ol>
              {sampleListing.map((ev) => (
                <li key={ev.title} className="grid grid-cols-[3.5rem_1fr] gap-4 border-b border-gray-200 px-5 py-3 last:border-b-0">
                  <div className="text-center leading-none">
                    <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-gray-500">{ev.day}</div>
                    <div className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--app-serif)" }}>{ev.date}</div>
                    <div className="mt-1 text-[0.65rem] uppercase tracking-wider text-gray-500">{ev.month}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{ev.title}</div>
                    <div className="mt-0.5 truncate text-sm text-gray-600">{ev.time} · {ev.venue}</div>
                    <div className="mt-1 text-xs font-medium uppercase tracking-wider text-blue-700">{ev.tag}</div>
                  </div>
                </li>
              ))}
            </ol>
            <figcaption className="flex items-center justify-between border-t border-gray-900 bg-gray-50 px-5 py-2.5 text-sm">
              <span className="text-gray-600">3 submissions waiting for review</span>
              <span className="font-medium text-blue-700">Review</span>
            </figcaption>
          </figure>
        </section>

        <section className="border-y border-gray-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_2fr]">
            <h2 className="text-3xl font-semibold leading-tight">What happens when someone submits an event</h2>
            <ol className="space-y-6 text-gray-700">
              <li>
                <p className="font-medium text-gray-900">They fill out your form.</p>
                <p className="mt-1">Title, date, place, a flyer if they have one. It lives at your own address and can sit inside your website.</p>
              </li>
              <li>
                <p className="font-medium text-gray-900">It lands in your queue, and you get an email.</p>
                <p className="mt-1">Nothing is public yet. Fix a typo, pick a category, or turn it down.</p>
              </li>
              <li>
                <p className="font-medium text-gray-900">You approve it, and it’s everywhere at once.</p>
                <p className="mt-1">Your embedded calendar, your subscribe feed, and any webhook you’ve connected all update. The submitter doesn’t have to do anything else.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <h2 className="text-3xl font-semibold">What’s included</h2>
          <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {features.map(([term, desc]) => (
              <div key={term} className="border-t border-gray-300 pt-4">
                <dt className="font-semibold">{term}</dt>
                <dd className="mt-1.5 leading-relaxed text-gray-700">{desc}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="price" className="border-t border-gray-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-3xl font-semibold">Price</h2>
              <p className="mt-3 text-5xl font-semibold" style={{ fontFamily: "var(--app-serif)" }}>
                $0
              </p>
            </div>
            <div className="text-gray-700">
              <p className="max-w-xl text-lg leading-relaxed">
                Eventful is free. Every calendar gets every feature, with no event limit and no
                “Powered by Eventful” line on your calendar.
              </p>
              <ul className="mt-6 space-y-2 border-t border-gray-200 pt-6">
                <li>Unlimited events and submissions</li>
                <li>Up to 25 people on the account</li>
                <li>{FLYER_SCANS_PER_MONTH} flyer scans per calendar each month</li>
                <li>Embeds, filtered views, Google Calendar, subscribe feeds, webhooks and export</li>
              </ul>
              <Link href="/signup" className="mt-8 inline-block rounded bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-700">
                Start a calendar
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <h2 className="text-3xl font-semibold">Questions</h2>
          <div className="mt-8 divide-y divide-gray-200 border-y border-gray-200">
            {faqs.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {q}
                  <span aria-hidden className="text-gray-500 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-2 leading-relaxed text-gray-700">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm text-gray-600 sm:px-8">
          <span>© {new Date().getFullYear()} Eventful</span>
          <nav className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
            <a href="mailto:support@useventful.com" className="hover:text-gray-900">support@useventful.com</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
