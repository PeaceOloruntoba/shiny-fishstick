# HomeOps

HomeOps is a single Next.js application for the public site, client experience, worker portal, and operations console.

## Local development

Use npm for dependency management and scripts:

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set the Supabase project URL and anon key to enable early-access signup storage. Apply the SQL files in `supabase/migrations/` to that Supabase project. Until then, the landing page remains available and the signup form reports that signups are not open.

Available scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```
