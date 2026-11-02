# HomeOps

HomeOps is a single Next.js application for the public site, client experience, worker portal, and operations console.

The current implemented product slice includes the marketing landing page, public service catalogue, email/password client accounts, and booking requests with server/database price validation. Booking requests remain pending payment; live checkout, worker dispatch, and staff operations are not connected yet.

## Local development

Use npm for dependency management and scripts:

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set the Supabase project URL, publishable key (or legacy anon key), and public site URL. In Supabase Auth, allow the exact `${NEXT_PUBLIC_SITE_URL}/auth/callback` URL for email confirmation. Apply database migrations manually with `npx supabase@latest db push --linked`; see [Supabase admin setup](supabase/ADMIN_SETUP.md) for linking the project, the one-feature-per-migration workflow, and first-owner bootstrap. The catalogue is intentionally empty until approved package prices and launch zones are entered; no sample price is treated as live pricing.

Available scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```
