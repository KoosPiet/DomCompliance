# LabourMate

**Everything you need to legally employ your domestic worker.**

LabourMate is a South African domestic-worker compliance platform that helps
everyday homeowners comply with labour legislation (BCEA, UIF Act, Sectoral
Determination 7) — generating contracts, payslips, leave records and UIF
guidance, as easily as online banking.

> **Status.** This repository is a production-grade foundation. The landing
> page, the **FREE Compliance Check** lead funnel, authentication, onboarding
> and the dashboard shell are fully implemented end-to-end. Employees,
> contracts, payslips, WhatsApp delivery, billing and the admin panel have
> their data model, domain logic and architecture in place and are built out
> in subsequent milestones (see [Roadmap](#roadmap)).

---

## Tech stack

| Layer         | Choice                                                       |
| ------------- | ------------------------------------------------------------ |
| Framework     | Next.js 16 (App Router, RSC) · React 19 · TypeScript         |
| Styling       | Tailwind CSS v4 · shadcn/ui (Radix) · Framer Motion          |
| Data          | PostgreSQL (Supabase) · Prisma 6                             |
| Auth          | Auth.js v5 (NextAuth) — credentials + JWT sessions           |
| Forms         | React Hook Form · Zod                                       |
| Data fetching | TanStack Query                                              |
| Email         | Resend                                                      |
| Payments      | Netcash Pay Now                                             |
| Messaging     | Meta WhatsApp Cloud API                                     |
| PDF           | pdf-lib                                                     |
| Deployment    | Vercel · Docker                                            |

---

## Getting started

### 1. Prerequisites

- Node.js 20+ (22 recommended)
- A PostgreSQL database — [Supabase](https://supabase.com) is the reference
  provider

### 2. Install

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Generate secrets (run twice — once for `AUTH_SECRET`, once for
`ENCRYPTION_KEY`):

```bash
openssl rand -base64 32
```

At minimum set `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` and
`ENCRYPTION_KEY`. See the [environment reference](#environment-variables).

### 4. Set up the database

```bash
npm run db:generate     # generate the Prisma client
npm run db:deploy       # apply migrations
npm run db:seed         # optional: demo admin + employer + employee
```

For iterative local schema work you can use `npm run db:push` instead of
migrations.

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

**Seeded demo accounts** (after `db:seed`):

| Role     | Email                    | Password    |
| -------- | ------------------------ | ----------- |
| Employer | `demo@labourmate.co.za`  | `Demo1234`  |
| Admin    | `admin@labourmate.co.za` | `Admin1234` |

---

## Scripts

| Script                | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `npm run dev`         | Start the dev server                          |
| `npm run build`       | `prisma generate` + production build          |
| `npm run start`       | Start the production server                   |
| `npm run lint`        | ESLint                                        |
| `npm run typecheck`   | `tsc --noEmit`                                |
| `npm run db:generate` | Generate the Prisma client                    |
| `npm run db:migrate`  | Create + apply a dev migration                |
| `npm run db:deploy`   | Apply migrations (production)                 |
| `npm run db:push`     | Push schema without a migration (prototyping) |
| `npm run db:seed`     | Seed demo data                                |
| `npm run db:studio`   | Open Prisma Studio                            |

---

## Environment variables

| Variable                        | Required | Description                                           |
| ------------------------------- | :------: | ----------------------------------------------------- |
| `DATABASE_URL`                  |    ✅    | Pooled Postgres connection (Supabase pgBouncer :6543) |
| `DIRECT_URL`                    |          | Direct connection for migrations (:5432)              |
| `AUTH_SECRET`                   |    ✅    | Auth.js signing secret (32+ chars)                    |
| `ENCRYPTION_KEY`                |    ✅    | 32-byte key for PII encryption (base64/hex)           |
| `NEXT_PUBLIC_APP_URL`           |    ✅    | Public base URL                                       |
| `RESEND_API_KEY`                |          | Email delivery (dev logs to console if unset)         |
| `EMAIL_FROM`                    |          | From address for transactional email                 |
| `NEXT_PUBLIC_SUPABASE_URL`      |          | Supabase project URL (storage/client)                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` |          | Supabase anon key                                     |
| `SUPABASE_SERVICE_ROLE_KEY`     |          | Supabase service role (server-only, storage)          |
| `WHATSAPP_ACCESS_TOKEN` …       |          | Meta WhatsApp Cloud API credentials                   |
| `NETCASH_PAYNOW_SERVICE_KEY` …  |          | Netcash Pay Now credentials                           |
| `CRON_SECRET`                   |          | Protects scheduled `/api/v1/cron/*` endpoints         |

Environment variables are validated at boot by [`src/env.ts`](src/env.ts) with
Zod — a misconfigured deployment fails fast with a clear message. Set
`SKIP_ENV_VALIDATION=1` for Docker/CI builds without secrets.

---

## Architecture

Clean, layered architecture — the domain layer has **no framework
dependencies** and is unit-testable in isolation. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full breakdown.

```
src/
├─ app/                    # Next.js App Router
│  ├─ (marketing)/         # landing, pricing, faq, uif, legal, blog
│  ├─ (auth)/              # login, register, forgot/reset, verify-email
│  ├─ (app)/               # authenticated shell: dashboard, onboarding
│  ├─ compliance-check/    # the FREE Compliance Check funnel
│  └─ api/v1/              # versioned REST API
├─ components/             # UI (ui/ = shadcn) + feature components
├─ domain/                 # pure business logic (SA labour law)
│  ├─ compliance/          # scoring engine (marquee)
│  ├─ payroll/             # UIF, PAYE, payslip calculation
│  └─ leave/               # BCEA leave accrual
├─ lib/                    # cross-cutting infra (prisma, auth, crypto, email…)
├─ server/                 # server-only services + actions
├─ config/                 # site + pricing config
└─ env.ts                  # validated environment
```

---

## Security

- **PII encryption** — ID numbers and bank details are encrypted at rest with
  AES-256-GCM ([`src/lib/crypto/pii.ts`](src/lib/crypto/pii.ts)).
- **Password hashing** — bcrypt (cost 12).
- **Tokens** — email-verification and password-reset tokens are stored hashed;
  the raw token is only ever emailed.
- **Headers** — CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy` and `Permissions-Policy` in
  [`next.config.ts`](next.config.ts).
- **Rate limiting** — public endpoints are rate-limited
  ([`src/lib/rate-limit.ts`](src/lib/rate-limit.ts); swap the store for Redis in
  multi-instance production).
- **Audit log** — sensitive mutations are recorded in the `audit_logs` table.
- **Auth** — route protection via the edge proxy + `authorized` callback;
  user-enumeration-safe password reset.

---

## Deployment

### Vercel (recommended)

1. Push to GitHub and import the repo into Vercel.
2. Add the environment variables from `.env.example`.
3. Vercel runs `npm install` (→ `prisma generate` via `postinstall`) and
   `npm run build`.
4. Apply migrations against your production database:
   ```bash
   DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
   ```

### Docker

```bash
# Full local stack: Postgres + migrations + seed + app on :3000
docker compose up --build
```

The [`Dockerfile`](Dockerfile) produces a lean standalone image; the
[`docker-compose.yml`](docker-compose.yml) bundles Postgres, runs
`prisma migrate deploy` + seed, then starts the app.

---

## Roadmap

**Implemented**

- Landing page + marketing (pricing, FAQ, UIF guide, legal, guides)
- FREE Compliance Check funnel (scoring engine, share/virality, trial capture)
- Authentication (register, login, forgot/reset, email verification, sessions)
- Onboarding + dashboard shell
- Complete Prisma schema, domain logic (UIF/PAYE/leave), API/security scaffolding
- PWA, SEO, dynamic OG images, CI, Docker

**Next milestones**

- Employees CRUD · Contract generation + digital signatures + PDF
- Payslip generation + PDF + WhatsApp delivery
- Leave management UI · Reminders engine · Document vault
- Netcash subscription billing + invoices
- Admin panel (users, revenue, tickets, analytics, audit)
- AI assistant (labour-law Q&A, contract review, warning letters)

---

## Disclaimer

LabourMate provides tools and guidance based on South African labour
legislation. It is **not a law firm** and does not provide legal advice. For
complex disputes, consult a qualified labour-law professional.
