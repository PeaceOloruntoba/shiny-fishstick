# Supabase setup

## Apply migrations manually

Migrations are applied only when you choose to run the Supabase CLI. Nothing in GitHub applies them automatically.

Link the local project once (use the project reference from Supabase):

```bash
npx supabase@latest login
npx supabase@latest link --project-ref <your-project-ref>
```

For every feature that changes the schema, create a new timestamped migration, put that feature's SQL in the new file, inspect it, and apply pending migrations:

```bash
npx supabase@latest migration new <feature_name>
npx supabase@latest db push --linked
```

The CLI records applied migration versions in Supabase's migration history and skips versions already recorded. Keep one migration file per feature; never reuse a version or edit a migration after it has been applied. Make follow-up changes in another new migration. Commit migration files to the repository so its history remains the source of truth. Avoid direct schema edits in the SQL Editor; the owner grant below is account-specific setup, not a schema migration.

The existing `0001` and `0002` files are legacy migrations and remain in place. They are safe to replay to bootstrap/register if they were previously run manually in SQL Editor. Apply the current admin schema migration using the same `db push --linked` command.

## One-time first owner grant

After migration `20261102115238_admin_portal.sql` succeeds, create a HomeOps account for the owner using the normal sign-up page. Then run this once in that project's Supabase SQL Editor, replacing the email with the exact account email:

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
