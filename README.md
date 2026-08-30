# Courier Flow

A production-minded, multilingual application foundation for a courier-management platform. Courier Flow is built with Next.js, React, TypeScript, PostgreSQL, and Prisma, with a strong focus on secure account flows, maintainable UI architecture, and automated delivery checks.

[**Open the live application**](https://www.courierflow.eu) · [View the source code](https://github.com/kanderyabl/courier-flow)

[![CI](https://github.com/kanderyabl/courier-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/kanderyabl/courier-flow/actions/workflows/ci.yml)

[![Courier Flow sign-in screen](./docs/images/sign-in.png)](https://www.courierflow.eu/en/sign-in)

> [!NOTE]
> **Project status:** MVP in active development. The current release focuses on authentication, account security, localization, reusable UI, and delivery-domain primitives. Order management, courier assignment, and live delivery workflows are on the roadmap.

## Current features

### Account lifecycle

- Client registration, sign-in, sign-out, and current-session lookup.
- Email verification, verification-email resend, and email change for unverified accounts.
- Password recovery and single-use password-reset links.
- Server-side protected routes with email-verification gating.
- Localized transactional emails delivered through Resend.

### Security controls

- Argon2id password hashing and dummy verification for unknown accounts.
- Cryptographically random 256-bit session and challenge tokens; only their SHA-256 hashes are stored.
- Revocable PostgreSQL-backed sessions in `HttpOnly`, `SameSite=Lax`, and production-only `Secure` cookies.
- Expiring, single-use auth challenges protected by transactions and row locks.
- Database-backed rate limiting by IP, account, token, and combined IP/email keys.
- HMAC-SHA256 pseudonymization of rate-limit keys.
- Same-origin validation, JSON-only auth endpoints, request-body limits, and non-cacheable auth responses.
- Generic password-recovery responses to reduce account enumeration.

### Application foundation

- Six locales: English, Ukrainian, Spanish, French, Chinese, and Hindi.
- Feature-oriented, layered source structure with Server Components, Route Handlers, and client-side forms.
- Reusable component library documented and browser-tested through Storybook.
- React Hook Form and Zod validation with localized form and server errors.
- Installable PWA shell with a web manifest, regular and maskable icons, and service-worker registration.
- PostgreSQL migrations, schema-drift detection, and an integration smoke test against a real database.

The service worker currently handles its lifecycle only; offline caching, background sync, and push notifications are not implemented yet.

## Technology stack

| Area | Technologies |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript 5, React Compiler |
| UI and forms | CSS Modules, Sass, React Hook Form, Zod, Storybook 10 |
| Data | PostgreSQL 17, Prisma 7, `@prisma/adapter-pg` |
| Authentication | Argon2id, server-side sessions, hashed one-time tokens |
| Localization and email | next-intl, Resend |
| Testing | Vitest 4, Playwright Chromium, Storybook browser tests |
| Delivery | GitHub Actions, Vercel, Prisma migration workflow |

## Architecture

Courier Flow uses a pragmatic, feature-oriented layered structure:

```text
src/
├── app/          # App Router pages, layouts, and API Route Handlers
├── widgets/      # Composed page-level UI
├── features/     # User-facing use cases, currently focused on auth
├── entities/     # Delivery-domain types and presentation primitives
├── components/   # Reusable UI components
├── shared/       # Server libraries, infrastructure, and configuration
└── i18n/         # Locale routing and request configuration
```

Useful entry points:

- [`src/features/auth`](./src/features/auth) — account forms and use cases.
- [`src/app/api/auth`](./src/app/api/auth) — authentication Route Handlers.
- [`src/components`](./src/components) — reusable UI library.
- [`src/entities/order`](./src/entities/order) — current delivery-domain primitives.
- [`prisma/schema.prisma`](./prisma/schema.prisma) — database models.
- [`messages`](./messages) — locale catalogs.
- [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) — quality pipeline.

## Getting started

### Prerequisites

- Node.js 24 (see [`.nvmrc`](./.nvmrc)).
- npm.
- PostgreSQL; version 17 is recommended because it matches CI.
- A Resend account only if you want to exercise email verification or password recovery locally.

### 1. Install the project

```bash
git clone https://github.com/kanderyabl/courier-flow.git
cd courier-flow
npm ci
```

The `postinstall` script generates the Prisma client.

### 2. Configure the environment

Copy [`.env.example`](./.env.example) to `.env`:

```bash
cp .env.example .env
```

PowerShell equivalent:

```powershell
Copy-Item .env.example .env
```

Create a local PostgreSQL database named `courier_flow_dev`, then configure at least:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/courier_flow_dev"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/courier_flow_dev"
APP_URL="http://localhost:3000"
AUTH_RATE_LIMIT_SECRET="local-only-secret-with-at-least-32-characters"
TRUSTED_PROXY_HEADER=
```

`DATABASE_URL` is used by the application, while `DIRECT_URL` is used by Prisma CLI and migrations. They may be identical locally but must point to the same logical database.

For real email delivery, also set `RESEND_API_KEY` and `EMAIL_FROM`. Keep `TRUSTED_PROXY_HEADER` empty in local development and on Vercel.

### 3. Apply the committed migrations

```bash
npm run db:validate
npm run db:migrate:deploy
npm run db:migrate:status
```

### 4. Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

Install Chromium once before running Storybook browser tests:

```bash
npx playwright install chromium
```

Then run the same core checks used in CI:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:storybook
npm run build-storybook
npm run build
```

`npm test` runs the unit and Storybook projects. The PostgreSQL integration test is intentionally separate.

### PostgreSQL integration test

The integration smoke test exercises a real sign-in path without mocking Prisma: password verification, the auth Route Handler, the response cookie, and the persisted session.

It must run against a disposable local database named exactly `courier_flow_ci`. The test rejects remote database hosts and other database names before writing any data.

1. Create `courier_flow_ci` on `127.0.0.1`.
2. Point both `DATABASE_URL` and `DIRECT_URL` to it.
3. Set `RUN_DATABASE_INTEGRATION_TESTS=1`, `APP_URL=http://localhost:3000`, `TRUSTED_PROXY_HEADER=x-forwarded-for`, and an `AUTH_RATE_LIMIT_SECRET` of at least 32 characters.
4. Run:

```bash
npm run db:migrate:deploy
npm run test:integration
```

Do not point this test at a development, shared, or production database.

## Continuous integration and migrations

Every pull request to `main` and every push to `main` runs a GitHub Actions pipeline that:

1. Starts a disposable PostgreSQL 17 service.
2. Validates and applies the complete Prisma migration history.
3. Checks migration status and schema drift.
4. Runs the real PostgreSQL sign-in integration test.
5. Runs ESLint, TypeScript, unit tests, and Storybook browser tests.
6. Builds Storybook and the Next.js application.

Production migrations use a separate [database migration workflow](./.github/workflows/database-migrations.yml). It runs when committed migrations reach `main` or when triggered manually, and uses the protected GitHub `Production` environment.

<details>
<summary>Creating a schema migration</summary>

Use migration development commands only with a disposable local development database.

```bash
npm run db:validate
npm run db:migrate:dev -- --name <descriptive_name> --create-only
```

Review the generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql`, then apply and verify it:

```bash
npm run db:migrate:dev
npm run db:migrate:status
npm run db:migrate:check-drift
```

Commit the schema change and migration directory together. Once a migration has been shared or applied outside a disposable local database, treat it as immutable and fix later issues with a forward migration.

</details>

## Production configuration

The deployed application requires:

- `DATABASE_URL` for runtime database traffic.
- `DIRECT_URL` for Prisma migrations.
- `APP_URL` for trusted origins and email links.
- `RESEND_API_KEY` and `EMAIL_FROM` for transactional email.
- A random `AUTH_RATE_LIMIT_SECRET` containing at least 32 characters.

The Terms and Privacy pages are working templates, not a legal-compliance claim. Before a real production launch, complete all `LEGAL_*` values and obtain qualified review before setting `LEGAL_DOCUMENTS_REVIEWED=true`.

## Roadmap

- PostgreSQL order and delivery lifecycle models.
- Order creation and status history.
- Courier assignment and role-specific dashboards.
- Delivery tracking and proof-of-delivery flows.
- End-to-end tests for core business journeys.
- An explicit offline and notification strategy for the PWA.
