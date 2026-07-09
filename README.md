# Kokoro

A quiet, AI-native journal interface built with Next.js, TypeScript, Tailwind CSS, Auth.js, shadcn-style primitives, and Framer Motion.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Create a Google OAuth application and set the callback URL to:

```text
http://localhost:3000/api/auth/callback/google
```

The dashboard is available at `/dashboard`.
