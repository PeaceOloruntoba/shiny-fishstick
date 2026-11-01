-- Minimal public landing-page lead capture. The product data model will follow
-- in separate migrations as launch policies and packages are confirmed.
create table if not exists public.early_access_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  constraint early_access_email_length check (char_length(email) between 3 and 254)
);

alter table public.early_access_signups enable row level security;

-- Anonymous visitors may submit an email but cannot read, update, or delete signups.
revoke all on public.early_access_signups from anon, authenticated;
grant insert (email) on public.early_access_signups to anon;
grant insert (email) on public.early_access_signups to authenticated;

drop policy if exists "Allow early access signup inserts" on public.early_access_signups;
create policy "Allow early access signup inserts"
  on public.early_access_signups
  for insert
  to anon, authenticated
  with check (
    char_length(email) between 3 and 254
    and email = lower(btrim(email))
  );
