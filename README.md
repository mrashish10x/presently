# Presently — Attendance Management SaaS

This is the consolidated Presently source snapshot. It contains the Admin, Teacher, and Student areas, role-specific login routes, Prisma schema/migrations, and the current API integrations.

## Before running

1. Keep a backup of your existing project and database.
2. Copy `.env.example` to `.env` and fill in your own credentials. Do not commit `.env`.
3. Rotate credentials that were included in the previously uploaded archive: Turso auth token, NextAuth secret, Google OAuth secret, and Resend API key.
4. Use Node.js 22 or a compatible version for the Next.js version in `package.json`.

## Install and run

```bash
npm ci
npx prisma generate
npm run dev
```

Open `http://localhost:3000`.

## Login routes

- Admin: `/login/admin` (admin registration is linked from this page)
- Teacher: `/login/teacher`
- Student: `/login/student`
- `/login` redirects to `/login/admin`

## Checks before deployment

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Also run live integration tests against a non-production database with at least two colleges and all three roles. In particular, test cross-college IDs against every read, create, update, and delete endpoint, disabled accounts, teacher assignment boundaries, and the complete attendance workflow.

## Important release status

This archive is a consolidated development snapshot, **not a production-certified release**. The previous audit recorded a passing TypeScript check, but lint still had issues; Next build and Prisma validation were blocked by unavailable network downloads; live Turso and browser end-to-end tests were not run. Re-run all checks in your environment before deployment.

No new database migration is included in this snapshot. Do not run database migrations against production without reviewing the SQL and taking a database backup first.
