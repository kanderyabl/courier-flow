This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database

### Connection URLs

Copy `.env.example` to `.env`, then configure both database connection URLs.
`DATABASE_URL` is used by the application at runtime, while `DIRECT_URL` is
used by Prisma CLI commands and database migrations. Both URLs must target the
same logical PostgreSQL database.

For a local PostgreSQL instance, both URLs can be identical:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/courier_flow_dev"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/courier_flow_dev"
```

In hosted production environments, use the provider's pooled URL for
`DATABASE_URL` when available and its direct, non-pooled URL for `DIRECT_URL`.
Keep `.env` local and never commit real database credentials.

### Local migration workflow

Run `migrate dev` only against a disposable local development database. Never
use it with production credentials.

1. Update `prisma/schema.prisma`.
2. Validate the schema:

   ```bash
   npm run db:validate
   ```

3. Create a descriptively named migration without applying it yet:

   ```bash
   npm run db:migrate:dev -- --name <descriptive_name> --create-only
   ```

4. Review the generated
   `prisma/migrations/<timestamp>_<name>/migration.sql`, including destructive
   statements and data backfills.
5. Apply the reviewed migration to the local database:

   ```bash
   npm run db:migrate:dev
   ```

6. Confirm that the migration history and resulting database schema are
   synchronized:

   ```bash
   npm run db:migrate:status
   npm run db:migrate:check-drift
   ```

7. Commit the `schema.prisma` change and the new migration directory together.

### Migration safety and recovery

Treat a migration as immutable after it has been merged or applied to a shared
database. Do not rename, delete, or edit an existing applied migration. Create
a new forward migration for every subsequent schema correction.

If a new migration fails locally or in the clean CI database before it has been
shared, fix or recreate that migration and rerun the complete verification
flow. `prisma migrate reset` may be used only for a disposable local database;
it deletes all data and reapplies the migration history.

If a migration fails after reaching a shared or production database:

1. Stop further migration attempts and inspect `npm run db:migrate:status` and
   the database state.
2. Never reset the shared database or rewrite the applied migration file.
3. Verify that a current backup or provider restore point is available.
4. Prefer a new forward corrective migration. Use `prisma migrate resolve` only
   after manually reconciling the database state and following a reviewed
   recovery plan.

Production migrations run through the dedicated GitHub Actions workflow with
the `Production` environment and its `DIRECT_URL` secret. Configure required
reviewers and deployment branch restrictions for that environment in the
repository settings; declaring the environment in YAML does not enable those
protection rules by itself.

### CI and production migrations

| Environment | `DATABASE_URL`                           | `DIRECT_URL`                |
| ----------- | ---------------------------------------- | --------------------------- |
| Local       | Local PostgreSQL connection              | The same local database     |
| CI          | Ephemeral PostgreSQL service             | The same ephemeral database |
| Production  | Pooled runtime connection when available | Direct migration connection |

The [CI workflow](.github/workflows/ci.yml) runs for every pull request targeting
`main` and every push to `main`. It starts a clean PostgreSQL 17 service, applies
the complete migration history, checks migration status, and compares the
resulting database with `schema.prisma`. The service and its test credentials
are discarded when the job ends. Keep the CI PostgreSQL major version aligned
with production.

After the drift check, CI runs a real sign-in integration smoke test against
the same temporary database. The test invokes the auth route without mocking
Prisma, verifies the real password and session flow, and matches the response
cookie to the persisted `sessions` row.

`npm run test:integration` is intentionally separate from the unit test suite.
Run it only against the disposable local `courier_flow_ci` database with
`RUN_DATABASE_INTEGRATION_TESTS=1`; the test rejects remote hosts and other
database names before initializing Prisma.

The CI workflow never deploys migrations to production. Production changes use
the separate
[database migration workflow](.github/workflows/database-migrations.yml), which
runs after a push to `main` that changes `prisma/migrations/**`, or through a
manual `workflow_dispatch`. A change only to `schema.prisma` or
`prisma.config.ts` does not trigger the production workflow; the pull request CI
must reject schema changes that are missing a migration.

Before approving a production migration, confirm that the clean-database CI
checks passed, review the SQL for destructive operations and long-running
locks, and verify the provider's backup or restore point. Use forward-compatible
expand-and-contract migrations when an application rollout cannot update code
and the database atomically.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
