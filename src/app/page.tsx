import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eventful — one calendar for your whole community",
  description:
    "Let anyone submit an event, approve what goes live, and publish it to your website, your newsletter, and everyone's phone calendar. Free to start.",
};

const cat = {
  purple: "bg-violet-100 text-violet-800",
  teal: "bg-emerald-100 text-emerald-800",
  pink: "bg-pink-100 text-pink-800",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-800",
} as const;

type CatKey = keyof typeof cat;

const days: { n: number; dim?: boolean; today?: boolean; ev?: [string, CatKey][] }[] = [
  { n: 29, dim: true }, { n: 30, dim: true }, { n: 1 }, { n: 2 }, { n: 3 },
  { n: 4, ev: [["Fireworks", "teal"]] },
  { n: 5, ev: [["Farmers Mkt", "amber"]] },
  { n: 6 }, { n: 7 },
  { n: 8, ev: [["Park Run", "blue"]] },
  { n: 9 }, { n: 10 },
  { n: 11, ev: [["Jazz Night", "purple"]] },
  { n: 12, ev: [["Farmers Mkt", "amber"]] },
  { n: 13 },
  { n: 14, ev: [["Art Walk", "pink"]] },
  { n: 15, ev: [["Park Run", "blue"]] },
  { n: 16 }, { n: 17 },
  { n: 18, ev: [["Block Party", "teal"], ["Open Mic", "purple"]] },
  { n: 19, ev: [["Farmers Mkt", "amber"]] },
  { n: 20 }, { n: 21 },
  { n: 22, today: true, ev: [["Park Run", "blue"]] },
  { n: 23, ev: [["Gallery Show", "pink"]] },
  { n: 24 },
  { n: 25, ev: [["Movie Night", "teal"]] },
  { n: 26, ev: [["Farmers Mkt", "amber"]] },
  { n: 27 },
  { n: 28, ev: [["Concert", "purple"]] },
  { n: 29, ev: [["Park Run", "blue"]] },
  { n: 30 }, { n: 31 },
  { n: 1, dim: true }, { n: 2, dim: true },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] font-serif text-[#1a1410]">
      <nav className="flex items-center justify-between border-b-2 border-[#1a1410] px-5 py-4 sm:px-9">
        <span className="text-xl tracking-tight sm:text-[1.375rem]">
          Event<span className="text-[#E8450A]">ful</span>
        </span>
        <div className="flex items-center gap-5 font-sans text-sm sm:gap-7">
          <Link href="/admin/login" className="text-[#6b5c4e] hover:text-[#1a1410]">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-[#1a1410] px-4 py-2 font-semibold text-[#FFFBF5] hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:px-9 lg:grid-cols-2 lg:py-16">
          <div>
            <h1 className="text-[2rem] leading-[1.05] tracking-[-0.04em] sm:text-5xl">
              Every event in town.
              <br />
              <em className="italic text-[#E8450A]">One</em> calendar.
            </h1>

            <p className="mt-5 max-w-md font-sans text-[0.9375rem] leading-relaxed text-[#6b5c4e]">
              Right now your events are scattered across Facebook posts, group chats, and
              three different newsletters. Eventful gives your community one place to look —
              and one place to post.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-md bg-[#E8450A] px-7 py-3 text-center font-sans text-sm font-bold text-white hover:opacity-90"
              >
                Start your calendar
              </Link>
              <Link
                href="/api/demo"
                className="rounded-md border-[1.5px] border-[#1a1410] bg-white px-7 py-3 text-center font-sans text-sm hover:bg-[#f7f2ea]"
              >
                Poke around a demo
              </Link>
            </div>

            <p className="mt-4 font-sans text-xs text-[#a89684]">
              Free for up to 5 events a month. No card, no trial clock.
            </p>
          </div>

          {/* Calendar mockup */}
          <div className="overflow-hidden rounded-xl border-2 border-[#1a1410] bg-white font-sans">
            <div className="flex items-center justify-between bg-[#1a1410] px-4 py-2.5">
              <span className="text-[0.8125rem] font-semibold text-[#FFFBF5]">
                Riverside Community
              </span>
              <span className="text-[0.7rem] text-[#aaa]">July 2026</span>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-[#f0ebe3] bg-[#FFFBF5] px-3 py-2">
              {(["Music:purple", "Community:teal", "Arts:pink", "Markets:amber", "Sports:blue"] as const).map(
                (entry) => {
                  const [label, key] = entry.split(":") as [string, CatKey];
                  return (
                    <span
                      key={label}
                      className={`rounded px-2 py-0.5 text-[0.62rem] font-semibold ${cat[key]}`}
                    >
                      {label}
                    </span>
                  );
                }
              )}
            </div>

            <div className="grid grid-cols-7 border-b border-[#f0ebe3] bg-[#f7f2ea]">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div
                  key={i}
                  className="py-1.5 text-center text-[0.58rem] font-semibold uppercase tracking-wider text-[#999]"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((d, i) => (
                <div
                  key={i}
                  className={`min-h-[46px] border-b border-[#f0ebe3] p-[3px] sm:min-h-[52px] ${
                    (i + 1) % 7 === 0 ? "" : "border-r"
                  }`}
                >
                  {d.today ? (
                    <div className="mb-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#E8450A] text-[0.6rem] font-bold text-white">
                      {d.n}
                    </div>
                  ) : (
                    <div
                      className={`mb-0.5 text-[0.6rem] font-medium ${
                        d.dim ? "text-[#d8d0c4]" : "text-[#888]"
                      }`}
                    >
                      {d.n}
                    </div>
                  )}
                  {d.ev?.slice(0, 2).map(([label, key]) => (
                    // Too narrow for legible labels on phones — show a colour bar instead.
                    <div
                      key={label}
                      className={`mb-0.5 h-1.5 truncate rounded-[3px] text-[0.58rem] font-medium leading-tight sm:h-auto sm:px-1 sm:py-px ${cat[key]}`}
                    >
                      <span className="hidden sm:inline">{label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-[#f0ebe3] bg-[#FFFBF5] px-4 py-2.5">
              <span className="text-[0.65rem] text-[#a89684]">23 events this month</span>
              <span className="rounded-full bg-[#E8450A] px-3 py-1 text-[0.7rem] font-bold text-white">
                + Submit an event
              </span>
            </div>
          </div>
        </section>

        {/* The loop */}
        <section className="mx-auto max-w-6xl px-5 sm:px-9">
          <div className="border-t-2 border-[#f0ebe3] py-12 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
              <div>
                <h2 className="text-3xl leading-tight tracking-[-0.03em] sm:text-4xl">
                  You stay in charge of<br />what goes up.
                </h2>
                <p className="mt-5 max-w-lg font-sans text-[0.9375rem] leading-relaxed text-[#6b5c4e]">
                  Anyone can submit — the theater down the street, the person running the
                  bake sale, someone who just found your calendar. Nothing appears publicly
                  until you say so.
                </p>
                <p className="mt-4 max-w-lg font-sans text-[0.9375rem] leading-relaxed text-[#6b5c4e]">
                  Submissions land in a queue and you get an email. Approve or reject in one
                  click; either way the person who submitted it hears back automatically. No
                  chasing, no &quot;did you see my email?&quot;
                </p>
              </div>

              <div className="font-sans">
                <p className="mb-4 text-xs uppercase tracking-[0.1em] text-[#a89684]">
                  Then it goes everywhere
                </p>
                <ul className="space-y-4 text-sm text-[#6b5c4e]">
                  <li className="border-l-2 border-[#E8450A] pl-4">
                    <strong className="font-semibold text-[#1a1410]">Your website.</strong>{" "}
                    Paste one line of HTML. Restyle it to match your site — fonts, colors,
                    dark mode, which bits to hide.
                  </li>
                  <li className="border-l-2 border-[#f0ebe3] pl-4">
                    <strong className="font-semibold text-[#1a1410]">Their phones.</strong>{" "}
                    Every event has an &quot;add to calendar&quot; button, and the whole
                    calendar has a subscribe feed that keeps updating.
                  </li>
                  <li className="border-l-2 border-[#f0ebe3] pl-4">
                    <strong className="font-semibold text-[#1a1410]">Their inbox.</strong>{" "}
                    People can subscribe for a short Monday email of what&apos;s coming up
                    that week.
                  </li>
                  <li className="border-l-2 border-[#f0ebe3] pl-4">
                    <strong className="font-semibold text-[#1a1410]">Social.</strong> Share
                    buttons on every event, and links unfurl properly with the flyer image
                    attached.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="mx-auto max-w-6xl px-5 sm:px-9">
          <div className="border-t-2 border-[#f0ebe3] py-12 lg:py-16">
            <h2 className="text-3xl leading-tight tracking-[-0.03em] sm:text-4xl">
              The unglamorous parts,<br />already handled
            </h2>

            <dl className="mt-9 grid gap-x-12 gap-y-7 font-sans sm:grid-cols-2 lg:grid-cols-3">
              {[
                [
                  "Already keep a Google Calendar?",
                  "Connect it and those events show up here too. Turn on push and anything you approve gets written back into it.",
                ],
                [
                  "Recurring events",
                  "Weekly, biweekly, or monthly. Set it once and the whole run gets created — up to 52 dates.",
                ],
                [
                  "Categories that are yours",
                  "Name them and color them however your community actually talks. Filter the public calendar by any of them.",
                ],
                [
                  "Spam doesn't get through",
                  "A hidden trap field catches bots, and there are per-person and per-network submission caps.",
                ],
                [
                  "More than one organizer",
                  "Invite people as admins or editors so moderating isn't one person's whole week.",
                ],
                [
                  "Numbers, if you want them",
                  "Views, submissions, approval rate, and which events people actually clicked. Export the lot as CSV.",
                ],
              ].map(([term, desc]) => (
                <div key={term}>
                  <dt className="text-sm font-semibold text-[#1a1410]">{term}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-[#6b5c4e]">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-6xl px-5 sm:px-9">
          <div className="border-t-2 border-[#f0ebe3] py-12 lg:py-16">
            <h2 className="text-3xl leading-tight tracking-[-0.03em] sm:text-4xl">Pricing</h2>
            <p className="mt-3 max-w-lg font-sans text-[0.9375rem] leading-relaxed text-[#6b5c4e]">
              Everything described above is on the free plan. Paying removes the event cap
              and the badge, and turns on the flyer scanner.
            </p>

            <div className="mt-9 grid max-w-3xl gap-6 sm:grid-cols-2">
              <div className="rounded-xl border-2 border-[#1a1410] bg-white p-7 font-sans">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6b5c4e]">
                  Free
                </p>
                <div className="mt-3 font-serif text-4xl tracking-tight">$0</div>
                <p className="mt-1 text-sm text-[#a89684]">Not a trial</p>
                <ul className="mt-6 space-y-2.5 text-sm text-[#6b5c4e]">
                  <li>5 events per month</li>
                  <li>Public submissions &amp; moderation</li>
                  <li>Embed, .ics feed, weekly digest</li>
                  <li>Google Calendar sync</li>
                  <li>Analytics &amp; CSV export</li>
                  <li>Small &quot;Powered by Eventful&quot; badge</li>
                </ul>
                <Link
                  href="/signup"
                  className="mt-7 block rounded-md border-2 border-[#1a1410] py-2.5 text-center text-sm font-semibold hover:bg-[#f7f2ea]"
                >
                  Start free
                </Link>
              </div>

              <div className="relative rounded-xl border-2 border-[#E8450A] bg-white p-7 font-sans">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#E8450A]">
                  Pro
                </p>
                <div className="mt-3 font-serif text-4xl tracking-tight">
                  $99<span className="text-xl text-[#a89684]">/yr</span>
                </div>
                <p className="mt-1 text-sm text-[#a89684]">About $8 a month</p>
                <ul className="mt-6 space-y-2.5 text-sm text-[#6b5c4e]">
                  <li className="font-medium text-[#1a1410]">Everything in Free, plus:</li>
                  <li>Unlimited events</li>
                  <li>
                    Flyer scanning — photograph a poster, the details fill themselves in
                  </li>
                  <li>Badge removed</li>
                </ul>
                <Link
                  href="/signup"
                  className="mt-7 block rounded-md bg-[#E8450A] py-2.5 text-center text-sm font-bold text-white hover:opacity-90"
                >
                  Start free, upgrade later
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-5 sm:px-9">
        <div className="flex flex-col gap-5 border-t-2 border-[#1a1410] py-7 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-lg tracking-tight">
            Event<span className="text-[#E8450A]">ful</span>
          </span>
          <div className="flex flex-wrap gap-x-7 gap-y-2 font-sans text-[0.8125rem] text-[#6b5c4e]">
            <Link href="/signup" className="hover:text-[#1a1410]">Get started</Link>
            <Link href="/admin/login" className="hover:text-[#1a1410]">Sign in</Link>
            <Link href="/privacy" className="hover:text-[#1a1410]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#1a1410]">Terms</Link>
          </div>
        </div>
        <p className="pb-7 font-sans text-xs text-[#a89684]">
          © 2026 Eventful
        </p>
      </footer>
    </div>
  );
}
