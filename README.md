# Eventful — embeddable community event calendars

Multi-tenant SaaS for community event calendars. Each tenant gets a hosted
calendar they can embed on their own site, a public submission form with a
moderation queue, branding controls, recurring events, Google Calendar (ICS)
import, outbound webhooks, and Stripe billing.

Built on Next.js 16 (App Router), Prisma 7 + Postgres, NextAuth v5, and
Tailwind 4.

## Getting started

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL and AUTH_SECRET at minimum
npm run db:migrate          # apply migrations
npx prisma db seed          # optional: demo tenant + admin account
npm run dev
```

The app runs at http://localhost:3000.

- Marketing site: `/`
- Dashboard: `/admin`
- A tenant's public calendar: `/embed/<slug>/calendar`

The seed creates `admin@test.com` with the password from
`SEED_ADMIN_PASSWORD` (default `changeme123`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Generate the Prisma client, apply migrations on production deploys, build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (vitest) |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:reset` | Drop and recreate the database, then reseed |

## Configuration

Every environment variable is documented in `.env.example`. Only
`DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_URL` are required; email,
billing, uploads, and AI flyer scanning each degrade to a clear error when
their variables are absent.

Two are worth calling out:

- **`RESEND_API_KEY`** — without it, invitation and password-reset links are
  only written to the server log. A production deployment needs it, or an
  invited teammate has no way to finish signing up and a locked-out customer
  has no way back in.
- **`REQUIRE_EMAIL_VERIFICATION`** — leave this off until email delivery is
  confirmed working. Turning it on without a working mail provider locks out
  every new account.

## Deployment

Migrations run during `npm run build`, but only when `VERCEL_ENV=production`
(see `scripts/migrate-on-deploy.mjs`). Preview deployments and local builds
skip them, so opening a pull request no longer migrates the production
database ahead of the code that ships with it. Set `RUN_MIGRATIONS=1` to force
migrations in another environment, or run `npm run db:migrate` yourself.

`vercel.json` schedules two cron jobs, both authenticated with `CRON_SECRET`:
`/api/demo/cleanup` deletes expired demo sandboxes, and
`/api/cron/retry-webhooks` retries webhook deliveries that are due. On Vercel's
Hobby plan only daily crons are allowed — change both schedules if you are on
it.

`GET /api/health` reports database reachability and which integrations are
configured. It returns 503 when the database is unreachable.

## Upgrading an existing deployment

This release removes the `ADMIN_LOGIN_EMAIL` / `ADMIN_LOGIN_PASSWORD` login
fallback. Any account whose `password` column is null could previously sign in
through that fallback and now cannot. Check for affected accounts before
deploying:

```sql
SELECT u.email, t.slug, u.role
FROM users u JOIN tenants t ON t.id = u."tenantId"
WHERE u.password IS NULL;
```

Each of those users can recover through **Forgot password** at
`/admin/forgot-password`, which also serves as "claim your account" for
accounts that never had a password. That needs `RESEND_API_KEY` configured. If
email is not set up yet, set a password directly:

```bash
npm run set-password -- you@example.org 'a-strong-password'
```

The migration also renames three `webhook_configs` columns to match the Prisma
schema. The table's queries were failing before this, so no working data
depends on the old names.

## Operator console

`/superadmin` is the cross-tenant view: ARR, paying vs free counts, signups and
event volume over 30 days, free tenants sitting at their cap (upgrade
conversations), tenants with no activity in 30 days (churn risk), and a table
of every tenant with usage, seats, moderation backlog, and last activity.

Sign in at `/superadmin/login` with `SUPERADMIN_SECRET`, which is exchanged for
an 8-hour signed cookie. It is entirely separate from customer sign-in and
cannot be reached by escalating a tenant account. Login attempts are rate
limited to 5 per 15 minutes per IP.

Plan changes made here bypass Stripe, so they suit comped accounts and support
fixes. A tenant with a live subscription will be moved back by its next
subscription webhook — cancel in Stripe first if the change should stick. Every
change writes an audit log entry.

`POST /api/superadmin/set-plan` remains for scripting the same operation.

## Email

All outbound mail goes through one `send` helper in `src/lib/email.ts`, which
retries three times and reports a final failure through `captureError` rather
than swallowing it. The Resend SDK returns errors on the result object instead
of throwing, so the helper checks for that — otherwise a rejected address looks
like a successful send.

| Email | Trigger |
| --- | --- |
| Welcome | Signup |
| Confirm your email | Signup |
| Reset your password | Forgot password |
| You're invited | Team invitation |
| Event received / approved / rejected | Public submission and moderation |
| New event submission | Sent to admins on a pending submission |
| Payment received | `invoice.payment_succeeded` |
| **Payment failed** | `invoice.payment_failed` — includes the grace deadline |
| Subscription ended | Subscription canceled or unpaid |
| Near monthly limit | A Free tenant passes 80% of its cap, once per month |

Billing mail goes to the tenant's owners, falling back to admins so a
workspace whose owner has left is still reachable
(`src/lib/billing-contacts.ts`).

## Observability

`src/lib/observability.ts` provides `captureError`, `captureWarning`,
`logInfo`, and `withRetry`. Everything is emitted as structured JSON, and also
sent to Sentry when `SENTRY_DSN` is set — the SDK is imported lazily, so a
deployment without a DSN pays nothing for it.

Webhook delivery is durable. Each event is written to `webhook_deliveries`
before the attempt, retried with backoff (1m, 5m, 30m, 2h) up to five times,
and parked as `FAILED` with the last error if it never succeeds. Exhausted
deliveries are reported and surfaced in the operator console — previously a
customer endpoint that was down for a minute lost the event entirely, with no
retry and no record.

## Deleting a workspace

Owners can delete a workspace from **Settings → Danger zone**. It requires
typing the workspace slug, cancels any live Stripe subscription first (so a
deleted workspace cannot keep billing), and then cascades to every event,
category, view, member, and audit record.

There is no operator-side delete in the console yet; use the customer flow or
delete the tenant row directly.

## Authentication and authorization

Sign-in is email plus password (bcrypt). There is no environment-variable
login fallback — every account that can sign in has a real password hash.

Accounts get a password in one of three ways: signing up, redeeming an
invitation at `/accept-invite`, or completing a reset at `/reset-password`.
An invited user with no password cannot sign in until they redeem the
invitation.

Roles are hierarchical, and the minimum role for each permission lives in
`src/lib/permissions.ts`:

| Permission | Minimum role |
| --- | --- |
| `events:write`, `events:moderate` | EDITOR |
| `events:delete`, `events:export`, `settings:write` | ADMIN |
| `billing:manage`, `users:manage` | OWNER |

`src/lib/authz.ts` is the data access layer. Server Actions and Route Handlers
call `authorize(permission)`; Server Components call `requirePermission(...)`.
Both re-read the role from the database rather than trusting the JWT, so a
demotion takes effect immediately instead of at the user's next sign-in.

Treat every exported function in a `"use server"` file as a public HTTP
endpoint — that is what it is. Helpers that take a `tenantId` and perform no
authorization of their own (`src/lib/event-series.ts`) deliberately live
outside `src/lib/actions/`.

**Known limitation:** sessions are JWTs, so a password reset revokes
database-backed sessions but cannot invalidate a JWT that has already been
issued. Someone holding a stolen session token keeps it until it expires.
Moving to database sessions would close this.

## Plans and limits

Two tiers are sold, matching the pricing page. Plan configuration is in
`src/lib/stripe.ts`, and it is the single source of truth — the landing page
and billing UI are written to match it, so change it here first.

| | Free | Pro ($99/yr) |
| --- | --- | --- |
| Events per month | 5 | Unlimited |
| Seats | 1 | Unlimited |
| AI flyer scanning | — | ✓ |
| Analytics dashboard | — | ✓ |
| Remove "Powered by" badge | — | ✓ |

Seat usage counts current members plus unexpired invitations. Free at 1 seat
means the owner alone, which is what makes team management a Pro feature —
there is no separate check for it. Event limits count every occurrence of a
recurring series, not the series as one event.

Recurring events and CSV export are available on both tiers.

`ENTERPRISE` remains in the `Plan` enum as a manual override for one-off
custom deals, granted through the superadmin endpoint. It is not sold
self-serve — no price, no pricing card, no checkout path — and it resolves to
Pro's limits. It must never fall through to Free.

Stripe webhooks are idempotent (`processed_webhook_events`). A failed payment
starts a grace period rather than cutting access off immediately; the
downgrade happens when Stripe reports the subscription as canceled or unpaid.

## Rate limiting

`src/lib/rate-limit.ts` implements fixed-window limits in Postgres rather than
in process memory, because serverless instances do not share memory — each
cold instance would otherwise get a full quota. Limits cover sign-in, signup,
public event submission, uploads, AI extraction, demo sandbox creation, token
redemption, and the superadmin endpoint. If the limiter's own query fails it
allows the request and logs loudly.

## Outbound requests

Customer-supplied URLs (ICS feeds, webhook endpoints) go through
`src/lib/safe-fetch.ts`, which rejects non-HTTP schemes, private, loopback and
link-local addresses (including cloud metadata endpoints), validates every
redirect hop, and applies a timeout and a response size cap. Without this,
"paste your calendar URL" is a server-side request forgery primitive.

## Testing

```bash
npm test
```

Unit tests cover the pure logic where a regression is silent and expensive:
role permissions, plan configuration, token hashing and identifier parsing,
and the SSRF address classifier. CI (`.github/workflows/ci.yml`) runs
typecheck, lint, and tests on every push and pull request.

## Project layout

```
src/app/admin/         Dashboard (queue, events, branding, embed, settings)
src/app/embed/[slug]/  Public per-tenant calendar, submission form, ICS feeds
src/app/api/           Route handlers (upload, webhooks, health, export)
src/lib/authz.ts       Session + permission checks (the data access layer)
src/lib/permissions.ts Pure role logic, safe to import from client components
src/lib/actions/       Server Actions — treat each export as a public endpoint
prisma/schema.prisma   Data model
```
