# Architecture

LabourMate follows a layered, clean architecture. The guiding rule: **business
rules do not depend on frameworks**. The SA-labour-law logic lives in a pure
`domain/` layer that imports nothing from Next.js, Prisma, or React, so it is
trivially testable and reusable (including by future AI features).

## Layers

```
┌──────────────────────────────────────────────────────────────┐
│  Presentation        app/ (pages, layouts)  ·  components/     │
│  — React Server & Client Components, forms, animations         │
├──────────────────────────────────────────────────────────────┤
│  Application         server/actions/  ·  app/api/v1/           │
│  — server actions & REST handlers; validation; orchestration   │
├──────────────────────────────────────────────────────────────┤
│  Services            server/services/  ·  server/audit         │
│  — use-cases that touch persistence (accounts, billing, …)     │
├──────────────────────────────────────────────────────────────┤
│  Domain              domain/                                   │
│  — pure business logic: compliance, payroll, leave (NO deps)   │
├──────────────────────────────────────────────────────────────┤
│  Infrastructure      lib/ (prisma, auth, crypto, email, http)  │
│  — cross-cutting adapters to the outside world                 │
└──────────────────────────────────────────────────────────────┘
```

### Dependency direction

Presentation → Application → Services → Domain, with Infrastructure injected
where needed. The **domain never imports upward**. Domain enums (e.g.
`domain/leave/types.ts`) mirror Prisma enums by value so they map 1:1 at the
persistence boundary without coupling the domain to Prisma.

## Key modules

| Module                        | Responsibility                                          |
| ----------------------------- | ------------------------------------------------------- |
| `domain/constants.ts`         | Versioned SA statutory figures (UIF, tax, leave, NMW)   |
| `domain/compliance/`          | The compliance questionnaire + scoring engine           |
| `domain/payroll/`             | UIF, PAYE (SARS annualisation) and payslip derivation   |
| `domain/leave/`               | BCEA leave entitlement & accrual                        |
| `lib/crypto/pii.ts`           | AES-256-GCM field encryption + blind index              |
| `lib/http.ts`                 | REST envelope, Zod parsing, typed error responses       |
| `lib/rate-limit.ts`           | Pluggable rate limiter (in-memory → Redis)              |
| `auth.config.ts` / `auth.ts`  | Edge-safe vs full Auth.js config split                  |
| `server/services/account.ts`  | Registration, trial provisioning, password reset        |
| `server/audit.ts`             | Append-only audit log helper                            |

## Data model

The Prisma schema (`prisma/schema.prisma`) is enterprise-grade:

- **UUID** primary keys (native `uuid`) everywhere.
- **Soft deletes** (`deletedAt`) on user-owned domain tables.
- **Audit columns** (`createdAt`/`updatedAt`) throughout, plus a dedicated
  `audit_logs` table capturing actor + before/after.
- **Money** as `Decimal(12,2)` in ZAR — never floats.
- **Indexes** on foreign keys, status columns and soft-delete flags.
- **Idempotent webhooks** via `webhook_events` (unique `provider`+`eventId`).

## Request lifecycle (example: the compliance check)

1. `compliance-check/page.tsx` renders the client `ComplianceWizard`.
2. On completion it `POST`s to `/api/v1/compliance/assess`.
3. The route rate-limits by IP, validates with Zod (`lib/validations`), calls
   the pure `evaluateCompliance()` domain function, and best-effort persists a
   `ComplianceAssessment` (scoring succeeds even if the DB is down).
4. The result renders; the trial-capture form calls the `registerAction`
   server action, which provisions the account + free trial and links the
   assessment for attribution.

## Security model

See the [Security](../README.md#security) section. In short: encrypted PII,
hashed passwords and tokens, security headers + CSP, rate limiting, audit
logging, and route protection via the edge proxy.

## Designed for future AI

The architecture deliberately makes AI features additive rather than invasive:

- **Pure, documented domain functions** (`evaluateCompliance`,
  `calculatePayslip`, `calculateUif`, leave accruals) are directly callable as
  tools by an LLM agent — grounding answers in the real rules the app enforces.
- **Structured, versioned statutory constants** give an assistant an accurate,
  citable knowledge base for UIF/leave/wage questions.
- **Contract term snapshots** are stored as JSON on `EmploymentContract.terms`,
  so an AI contract-review feature has structured input.
- A future `domain/ai/` module can host prompt construction and tool schemas,
  and `server/services/ai.ts` can orchestrate calls — without touching the
  existing domain or persistence layers.

Planned AI capabilities: labour-law Q&A, contract review, warning-letter and
disciplinary-notice generation, UIF/leave explanations, and guided dismissals.

## Testing strategy

The domain layer is the primary unit-test target (pure functions, no mocks
required). Application/service layers are integration-tested against a test
database. A Vitest setup is the intended next addition.
