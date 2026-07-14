# Kokoro

![Kokoro landing page](public/hero.png)

A quiet, AI-native journal interface built with Next.js, TypeScript, Tailwind CSS, Auth.js, shadcn-style primitives, and Framer Motion.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

`npm run dev` automatically applies pending migrations and seeds missing sample data before starting Next.js.

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

While the development server is running, check database availability at `http://localhost:3000/api/health/db`. The schema lives in `db/schema.ts`.

SQLite is intended for local development and small self-hosted deployments; use Turso/libSQL or Neon Postgres before relying on durable data on a stateless platform such as Vercel.

## Deploy on Vercel

Production: [https://kokoro-lilac.vercel.app](https://kokoro-lilac.vercel.app)

This repo is linked to the Vercel project `kokoro` and connected to GitHub (`faizm10/kokoro`). Pushes to `main` create production deployments; other branches get preview deployments.

```bash
npm i -g vercel          # if needed
vercel link --yes        # already done locally → writes .vercel/
vercel env ls            # AUTH_*, AUTH_TRUST_HOST, DATABASE_URL
vercel deploy --prod     # manual production deploy from CLI
```

Required production/preview environment variables:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_TRUST_HOST=true`
- `AUTH_URL=https://kokoro-lilac.vercel.app`
- `DATABASE_URL` (currently `/tmp/kokoro.db` for ephemeral serverless SQLite)

After the first deploy URL is live, add that origin to your Google OAuth authorized redirect URIs:

```text
https://kokoro-lilac.vercel.app/api/auth/callback/google
```

Local SQLite data does not persist across Vercel serverless invocations. For durable hosted data, switch to Turso/libSQL or Neon Postgres.
