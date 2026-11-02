# Presently dependency correction

- Removed unused `@prisma/adapter-better-sqlite3` and `better-sqlite3`. The app runtime uses `@prisma/adapter-libsql` with Turso; no application source imports the better-sqlite3 adapter.
- Removed the optional Prisma skills-sync postinstall hook to keep installation deterministic.
- Pinned the supported Node major range in package metadata: >=20.9.0 <25.
- Prisma, Prisma Client, and libSQL adapter remain on 7.10.1 in the lockfile.

This corrects the native `node-gyp`/Python installation failure shown in the provided npm log. It does not claim that the complete app build or production behavior has passed.
