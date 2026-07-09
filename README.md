# Kokoro

A quiet, AI-native journal interface built with Next.js, TypeScript, Tailwind CSS, Auth.js, shadcn-style primitives, and Framer Motion.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run db:setup
npm run dev
```

Create a Google OAuth application and set the callback URL to:

```text
http://localhost:3000/api/auth/callback/google
```

The dashboard is available at `/dashboard`.

## Database

Kokoro uses SQLite with Drizzle ORM for a zero-service local database. The database file is created at `data/kokoro.db` and is ignored by Git.

```bash
npm run db:generate # generate a migration after schema changes
npm run db:migrate  # apply pending migrations
npm run db:seed     # add local sample data
npm run db:studio   # inspect and edit data in Drizzle Studio
```

The schema lives in `db/schema.ts`. SQLite is intended for local development and small self-hosted deployments; use Turso/libSQL or Neon Postgres before deploying to a stateless platform such as Vercel.
