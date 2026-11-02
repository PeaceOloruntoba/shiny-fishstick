# Supabase and admin bootstrap

## One-time GitHub Actions setup

The workflow at `.github/workflows/supabase-migrations.yml` applies pending SQL migrations when migration files are merged or pushed to `master` or `main`. Add these in the GitHub repository under **Settings → Secrets and variables → Actions**:

- **Secret** `SUPABASE_ACCESS_TOKEN`: create a personal access token from the Supabase account that can administer this project.
- **Secret** `SUPABASE_DB_PASSWORD`: the project's database password. Reset it in Supabase if it is unavailable; do not use a service-role/secret API key here.
- **Variable** `SUPABASE_PROJECT_ID`: the project reference shown in the Supabase dashboard URL or Project Settings → General.

The workflow checks that all three are present, serializes migration runs, links the Supabase CLI to the project, and runs `supabase db push`. It does not run on feature branches; merge the migration to `master` or `main` to deploy it. The CLI migration history makes repeat workflow runs apply only pending migrations.

If migrations `0001` or `0002` were previously run manually in the SQL Editor, the migration workflow can replay them safely and register them in Supabase migration history. After this bootstrap, make schema changes only in a new, sequentially named SQL migration. Do not edit an already deployed migration.

## One-time first owner grant

After migration `0003_admin_portal.sql` succeeds, create a HomeOps account for the owner using the normal sign-up page. Then run this once in that project's Supabase SQL Editor, replacing the email with the exact account email:

```sql
insert into public.app_staff_roles (user_id, role)
select id, 'OWNER'
from auth.users
where lower(email) = lower('owner@example.com')
on conflict (user_id, role) do nothing;
```

The query inserts no role if the email does not match an existing auth account. After that, the owner can grant staff roles from `/admin/team`. Keep role grants limited to staff who need portal access.

## Current admin capabilities

The portal includes booking oversight, cancellation of unpaid requests, client profile maintenance, versioned service-package and zone management, staff-role management, and an audit log. Payment reconciliation, worker verification, dispatch, safety cases, and payouts still need their own approved workflows and database modules.
