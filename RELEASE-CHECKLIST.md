# Release checklist — Presently

- [ ] Copy `.env.example` to `.env` and configure fresh credentials.
- [ ] Rotate all credentials previously present in the uploaded source archive.
- [ ] `npm ci` completes successfully.
- [ ] `npx prisma generate` completes successfully.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run lint` passes or all remaining warnings/errors are reviewed.
- [ ] `npm run build` passes.
- [ ] Admin registration and each of the three login routes work.
- [ ] Two separate colleges are created in a non-production test database.
- [ ] Cross-college read/update/delete attempts are rejected for all roles.
- [ ] Teachers can only access assigned classes/subjects.
- [ ] Students can only access their own profile, subjects, and attendance.
- [ ] Attendance create/read/update/duplicate behavior is verified.
- [ ] Admin reports, notifications, and settings are verified against live data.
- [ ] Netlify environment variables are configured and deployment logs are clean.
- [ ] Production database backup and rollback plan are ready.

Do not deploy to production until the critical checks above pass.
