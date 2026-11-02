create extension if not exists pgcrypto;

create table if not exists public.client_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_client_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.client_profiles(user_id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_homeops on auth.users;
create trigger on_auth_user_created_homeops
  after insert on auth.users
  for each row execute function public.handle_new_client_profile();

create table if not exists public.service_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.service_packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.service_package_versions (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.service_packages(id),
  version integer not null check (version > 0),
  price_kobo bigint not null check (price_kobo > 0 and price_kobo <= 9007199254740991),
  duration_minutes integer not null check (duration_minutes > 0),
  inclusions jsonb not null default '[]'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique(package_id, version),
  unique(id, package_id)
);

create table if not exists public.package_zones (
  package_version_id uuid not null references public.service_package_versions(id) on delete cascade,
  zone_id uuid not null references public.service_zones(id),
  primary key(package_version_id, zone_id)
);

create table if not exists public.service_addresses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  address_text text not null,
  locality text not null,
  zone_id uuid not null references public.service_zones(id),
  instructions text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint address_label_length check (char_length(label) between 1 and 60),
  constraint address_text_length check (char_length(address_text) between 5 and 500),
  constraint address_locality_length check (char_length(locality) between 2 and 100),
  constraint address_instructions_length check (char_length(instructions) <= 500)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id),
  package_version_id uuid not null references public.service_package_versions(id),
  address_id uuid not null references public.service_addresses(id),
  scheduled_for timestamptz not null,
  customer_notes text not null default '',
  quoted_total_kobo bigint not null check (quoted_total_kobo > 0),
  price_snapshot jsonb not null,
  status text not null default 'PENDING_PAYMENT' check (status in ('PENDING_PAYMENT','CONFIRMED','DISPATCHING','ASSIGNED','EN_ROUTE','IN_PROGRESS','SUBMITTED_FOR_REVIEW','COMPLETED','CANCELLED','DISPUTED','REFUNDED','PARTIALLY_REFUNDED')),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, idempotency_key)
);

create index if not exists bookings_client_created_idx on public.bookings(client_id, created_at desc);
create index if not exists bookings_status_schedule_idx on public.bookings(status, scheduled_for);

alter table public.client_profiles enable row level security;
alter table public.service_zones enable row level security;
alter table public.service_packages enable row level security;
alter table public.service_package_versions enable row level security;
alter table public.package_zones enable row level security;
alter table public.service_addresses enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Clients read own profile" on public.client_profiles;
create policy "Clients read own profile" on public.client_profiles for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Clients create own profile" on public.client_profiles;
create policy "Clients create own profile" on public.client_profiles for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Clients update own profile" on public.client_profiles;
create policy "Clients update own profile" on public.client_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Read active service zones" on public.service_zones;
create policy "Read active service zones" on public.service_zones for select to anon, authenticated using (is_active);
drop policy if exists "Read active packages" on public.service_packages;
create policy "Read active packages" on public.service_packages for select to anon, authenticated using (is_active);
drop policy if exists "Read active package versions" on public.service_package_versions;
create policy "Read active package versions" on public.service_package_versions for select to anon, authenticated using (is_active);
drop policy if exists "Read package zone links" on public.package_zones;
create policy "Read package zone links" on public.package_zones for select to anon, authenticated using (
  exists (select 1 from public.service_package_versions v join public.service_packages p on p.id = v.package_id where v.id = package_version_id and v.is_active and p.is_active)
);

drop policy if exists "Clients read own addresses" on public.service_addresses;
create policy "Clients read own addresses" on public.service_addresses for select to authenticated using (client_id = (select auth.uid()));
drop policy if exists "Clients update own addresses" on public.service_addresses;
create policy "Clients update own addresses" on public.service_addresses for update to authenticated using (client_id = (select auth.uid())) with check (client_id = (select auth.uid()));
drop policy if exists "Clients delete own addresses" on public.service_addresses;
create policy "Clients delete own addresses" on public.service_addresses for delete to authenticated using (client_id = (select auth.uid()));
drop policy if exists "Clients read own bookings" on public.bookings;
create policy "Clients read own bookings" on public.bookings for select to authenticated using (client_id = (select auth.uid()));

revoke all on public.client_profiles, public.service_zones, public.service_packages, public.service_package_versions, public.package_zones, public.service_addresses, public.bookings from anon, authenticated;
grant select, insert, update on public.client_profiles to authenticated;
grant select on public.service_zones, public.service_packages, public.service_package_versions, public.package_zones to anon, authenticated;
grant select, update, delete on public.service_addresses to authenticated;
grant select on public.bookings to authenticated;

create or replace function public.create_client_booking(
  p_package_version_id uuid,
  p_zone_id uuid,
  p_scheduled_for timestamptz,
  p_address_label text,
  p_address_text text,
  p_locality text,
  p_instructions text,
  p_customer_notes text,
  p_idempotency_key uuid
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_price bigint;
  v_duration integer;
  v_package_name text;
  v_version integer;
  v_address_id uuid;
  v_booking_id uuid;
  v_conflict boolean;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_idempotency_key is null then raise exception 'Request key required' using errcode = '22023'; end if;
  if p_scheduled_for is null then raise exception 'Choose a date and time' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_address_label, ''))) not between 1 and 60
    or char_length(btrim(coalesce(p_address_text, ''))) not between 5 and 500
    or char_length(btrim(coalesce(p_locality, ''))) not between 2 and 100
    or char_length(coalesce(p_instructions, '')) > 500
    or char_length(coalesce(p_customer_notes, '')) > 500 then
    raise exception 'Check the address and note lengths' using errcode = '22023';
  end if;
  if p_scheduled_for < now() + interval '2 hours' then raise exception 'Choose a time at least two hours from now' using errcode = '22023'; end if;

  select v.price_kobo, v.duration_minutes, v.display_name, v.version
    into v_price, v_duration, v_package_name, v_version
    from public.service_package_versions v
    join public.service_packages p on p.id = v.package_id
    join public.package_zones pz on pz.package_version_id = v.id
    join public.service_zones z on z.id = pz.zone_id
   where v.id = p_package_version_id and pz.zone_id = p_zone_id
     and v.is_active and p.is_active and z.is_active;
  if not found then raise exception 'This service is not available in that area' using errcode = '22023'; end if;

  select b.id into v_booking_id
    from public.bookings b
    join public.service_addresses a on a.id = b.address_id
   where b.client_id = v_user_id and b.idempotency_key = p_idempotency_key
     and b.package_version_id = p_package_version_id
     and b.scheduled_for = p_scheduled_for
     and b.customer_notes = btrim(coalesce(p_customer_notes, ''))
     and a.zone_id = p_zone_id
     and a.label = btrim(p_address_label)
     and a.address_text = btrim(p_address_text)
     and a.locality = btrim(p_locality)
     and a.instructions = btrim(coalesce(p_instructions, ''));
  if v_booking_id is not null then return v_booking_id; end if;

  select exists (select 1 from public.bookings where client_id = v_user_id and idempotency_key = p_idempotency_key) into v_conflict;
  if v_conflict then raise exception 'Request key was already used for different booking details' using errcode = '22023'; end if;

  insert into public.service_addresses(client_id, label, address_text, locality, zone_id, instructions)
  values (v_user_id, btrim(p_address_label), btrim(p_address_text), btrim(p_locality), p_zone_id, btrim(coalesce(p_instructions, '')))
  returning id into v_address_id;

  insert into public.bookings(client_id, package_version_id, address_id, scheduled_for, customer_notes, quoted_total_kobo, price_snapshot, idempotency_key)
  values (
    v_user_id, p_package_version_id, v_address_id, p_scheduled_for, btrim(coalesce(p_customer_notes, '')), v_price,
    jsonb_build_object('package_name', v_package_name, 'package_version', v_version, 'price_kobo', v_price, 'duration_minutes', v_duration, 'zone_id', p_zone_id),
    p_idempotency_key
  )
  returning id into v_booking_id;
  return v_booking_id;
end;
$$;

revoke all on function public.create_client_booking(uuid, uuid, timestamptz, text, text, text, text, text, uuid) from public, anon;
grant execute on function public.create_client_booking(uuid, uuid, timestamptz, text, text, text, text, text, uuid) to authenticated;
