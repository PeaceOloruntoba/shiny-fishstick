-- Admin foundation: staff roles, audited controls, and versioned catalogue management.
alter table public.client_profiles add column if not exists email text not null default '';
update public.client_profiles p set email = u.email from auth.users u where u.id = p.user_id and (p.email = '' or p.email is null);
create unique index if not exists client_profiles_email_lower_idx on public.client_profiles (lower(email)) where email <> '';

create or replace function public.handle_new_client_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.client_profiles(user_id, full_name, email)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100), coalesce(new.email, ''))
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_homeops on auth.users;
create trigger on_auth_user_created_homeops after insert on auth.users
for each row execute function public.handle_new_client_profile();

create or replace function public.sync_client_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.client_profiles set email = coalesce(new.email, '') where user_id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated_homeops on auth.users;
create trigger on_auth_user_email_updated_homeops after update of email on auth.users
for each row when (old.email is distinct from new.email)
execute function public.sync_client_profile_email();

create table if not exists public.app_staff_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('OWNER','ADMIN','OPERATIONS','SUPPORT','FINANCE')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_events_created_idx on public.admin_audit_events(created_at desc);
create index if not exists admin_audit_events_entity_idx on public.admin_audit_events(entity_type, entity_id, created_at desc);

alter table public.service_package_versions add column if not exists display_name text not null default '';
alter table public.service_package_versions add column if not exists description text not null default '';
update public.service_package_versions v set display_name = p.name, description = p.description
  from public.service_packages p where p.id = v.package_id and v.display_name = '';

alter table public.app_staff_roles enable row level security;
alter table public.admin_audit_events enable row level security;

create or replace function public.has_staff_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_staff_roles r
    where r.user_id = (select auth.uid()) and r.role = any(p_roles)
  );
$$;
revoke all on function public.has_staff_role(text[]) from public, anon;
grant execute on function public.has_staff_role(text[]) to authenticated;

drop policy if exists "Users read own staff roles" on public.app_staff_roles;
create policy "Users read own staff roles" on public.app_staff_roles
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Owners and admins read staff roles" on public.app_staff_roles;
create policy "Owners and admins read staff roles" on public.app_staff_roles
  for select to authenticated using (public.has_staff_role(array['OWNER','ADMIN']));
grant select on public.app_staff_roles to authenticated;

drop policy if exists "Staff read audit events" on public.admin_audit_events;
create policy "Staff read audit events" on public.admin_audit_events
  for select to authenticated using (public.has_staff_role(array['OWNER','ADMIN','OPERATIONS','SUPPORT','FINANCE']));
grant select on public.admin_audit_events to authenticated;
revoke insert, update, delete on public.admin_audit_events from anon, authenticated;

drop policy if exists "Staff read client profiles" on public.client_profiles;
create policy "Staff read client profiles" on public.client_profiles for select to authenticated
  using (public.has_staff_role(array['OWNER','ADMIN','OPERATIONS','SUPPORT']));
drop policy if exists "Staff update client profiles" on public.client_profiles;
create policy "Staff update client profiles" on public.client_profiles for update to authenticated
  using (public.has_staff_role(array['OWNER','ADMIN','SUPPORT']))
  with check (public.has_staff_role(array['OWNER','ADMIN','SUPPORT']));
revoke update on public.client_profiles from authenticated;
grant update(full_name, phone, updated_at) on public.client_profiles to authenticated;
grant select on public.client_profiles to authenticated;
revoke insert on public.client_profiles from authenticated;

drop policy if exists "Staff read all bookings" on public.bookings;
create policy "Staff read all bookings" on public.bookings for select to authenticated
  using (public.has_staff_role(array['OWNER','ADMIN','OPERATIONS','SUPPORT','FINANCE']));
drop policy if exists "Operations read service addresses" on public.service_addresses;
create policy "Operations read service addresses" on public.service_addresses for select to authenticated
  using (public.has_staff_role(array['OWNER','ADMIN','OPERATIONS','SUPPORT']));

drop policy if exists "Staff read all service zones" on public.service_zones;
create policy "Staff read all service zones" on public.service_zones for select to authenticated
  using (public.has_staff_role(array['OWNER','ADMIN','OPERATIONS']));
drop policy if exists "Staff read all service packages" on public.service_packages;
create policy "Staff read all service packages" on public.service_packages for select to authenticated
  using (public.has_staff_role(array['OWNER','ADMIN','OPERATIONS']));
drop policy if exists "Staff read all package versions" on public.service_package_versions;
create policy "Staff read all package versions" on public.service_package_versions for select to authenticated
  using (public.has_staff_role(array['OWNER','ADMIN','OPERATIONS']));
drop policy if exists "Staff read all package zones" on public.package_zones;
create policy "Staff read all package zones" on public.package_zones for select to authenticated
  using (public.has_staff_role(array['OWNER','ADMIN','OPERATIONS']));

create or replace function public.admin_update_client_profile(p_user_id uuid, p_full_name text, p_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_staff_role(array['OWNER','ADMIN','SUPPORT']) then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_full_name is null or char_length(btrim(p_full_name)) not between 2 and 100 then raise exception 'Name must be 2 to 100 characters' using errcode = '22023'; end if;
  if p_phone is not null and char_length(btrim(p_phone)) > 25 then raise exception 'Phone must be at most 25 characters' using errcode = '22023'; end if;
  update public.client_profiles set full_name = btrim(p_full_name), phone = nullif(btrim(coalesce(p_phone, '')), ''), updated_at = now() where user_id = p_user_id;
  if not found then raise exception 'Client profile not found' using errcode = 'P0002'; end if;
  insert into public.admin_audit_events(actor_id, action, entity_type, entity_id, details)
  values ((select auth.uid()), 'CLIENT_PROFILE_UPDATED', 'CLIENT_PROFILE', p_user_id, jsonb_build_object('fields', array['full_name','phone']));
end;
$$;
revoke all on function public.admin_update_client_profile(uuid,text,text) from public, anon;
grant execute on function public.admin_update_client_profile(uuid,text,text) to authenticated;

create or replace function public.admin_cancel_unpaid_booking(p_booking_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_status text;
begin
  if not public.has_staff_role(array['OWNER','ADMIN','OPERATIONS']) then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then raise exception 'Provide a reason between 3 and 500 characters' using errcode = '22023'; end if;
  select status into v_status from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found' using errcode = 'P0002'; end if;
  if v_status <> 'PENDING_PAYMENT' then raise exception 'Only unpaid booking requests can be cancelled here' using errcode = '22023'; end if;
  update public.bookings set status = 'CANCELLED', updated_at = now() where id = p_booking_id;
  insert into public.admin_audit_events(actor_id, action, entity_type, entity_id, details)
  values ((select auth.uid()), 'UNPAID_BOOKING_CANCELLED', 'BOOKING', p_booking_id, jsonb_build_object('reason', btrim(p_reason)));
end;
$$;
revoke all on function public.admin_cancel_unpaid_booking(uuid,text) from public, anon;
grant execute on function public.admin_cancel_unpaid_booking(uuid,text) to authenticated;

create or replace function public.admin_save_service_zone(p_name text, p_slug text, p_is_active boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if not public.has_staff_role(array['OWNER','ADMIN']) then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 100 then raise exception 'Zone name must be 2 to 100 characters' using errcode = '22023'; end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Use a lowercase slug with letters, numbers, and hyphens' using errcode = '22023'; end if;
  insert into public.service_zones(name, slug, is_active) values (btrim(p_name), p_slug, coalesce(p_is_active,false))
  on conflict (slug) do update set name = excluded.name, is_active = excluded.is_active
  returning id into v_id;
  insert into public.admin_audit_events(actor_id, action, entity_type, entity_id, details)
  values ((select auth.uid()), 'SERVICE_ZONE_SAVED', 'SERVICE_ZONE', v_id, jsonb_build_object('slug',p_slug,'is_active',p_is_active));
  return v_id;
end;
$$;
revoke all on function public.admin_save_service_zone(text,text,boolean) from public, anon;
grant execute on function public.admin_save_service_zone(text,text,boolean) to authenticated;

create or replace function public.admin_save_service_package(
  p_slug text, p_name text, p_description text, p_price_kobo bigint, p_duration_minutes integer,
  p_inclusions text[], p_exclusions text[], p_zone_ids uuid[], p_publish boolean
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_package_id uuid;
  v_version_id uuid;
  v_version integer;
  v_zone_count integer;
begin
  if not public.has_staff_role(array['OWNER','ADMIN']) then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Use a lowercase slug with letters, numbers, and hyphens' using errcode = '22023'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 100 then raise exception 'Package name must be 2 to 100 characters' using errcode = '22023'; end if;
  if char_length(coalesce(p_description,'')) > 1000 then raise exception 'Description is too long' using errcode = '22023'; end if;
  if p_price_kobo is null or p_price_kobo not between 1 and 9007199254740991 then raise exception 'Enter a valid price in kobo' using errcode = '22023'; end if;
  if p_duration_minutes is null or p_duration_minutes not between 30 and 1440 then raise exception 'Duration must be between 30 and 1440 minutes' using errcode = '22023'; end if;
  if coalesce(cardinality(p_zone_ids),0) = 0 or cardinality(p_zone_ids) <> (select count(distinct zone_id) from unnest(p_zone_ids) as input_zone(zone_id)) then raise exception 'Select one or more unique service zones' using errcode = '22023'; end if;
  if cardinality(coalesce(p_inclusions,array[]::text[])) > 30 or cardinality(coalesce(p_exclusions,array[]::text[])) > 30
    or exists (select 1 from unnest(coalesce(p_inclusions,array[]::text[]) || coalesce(p_exclusions,array[]::text[])) as item(value) where char_length(value) > 200) then
    raise exception 'Use up to 30 inclusion and exclusion items, each 200 characters or fewer' using errcode = '22023';
  end if;
  select count(*) into v_zone_count from public.service_zones z where z.id = any(p_zone_ids);
  if v_zone_count <> cardinality(p_zone_ids) then raise exception 'One or more service zones do not exist' using errcode = '22023'; end if;
  if coalesce(p_publish,false) and (select count(*) from public.service_zones where id = any(p_zone_ids) and is_active) <> cardinality(p_zone_ids) then
    raise exception 'Activate every selected zone before publishing this package' using errcode = '22023';
  end if;

  insert into public.service_packages(slug,name,description,is_active)
  values (p_slug,btrim(p_name),coalesce(btrim(p_description),''),coalesce(p_publish,false))
  on conflict (slug) do update set name = excluded.name, description = excluded.description, is_active = public.service_packages.is_active or excluded.is_active
  returning id into v_package_id;

  select coalesce(max(version),0) + 1 into v_version from public.service_package_versions where package_id = v_package_id;
  if coalesce(p_publish,false) then
    update public.service_package_versions set is_active = false where package_id = v_package_id and is_active;
    update public.service_packages set is_active = true where id = v_package_id;
  end if;
  insert into public.service_package_versions(package_id,version,price_kobo,duration_minutes,inclusions,exclusions,is_active,display_name,description)
  values (v_package_id,v_version,p_price_kobo,p_duration_minutes,to_jsonb(coalesce(p_inclusions,array[]::text[])),to_jsonb(coalesce(p_exclusions,array[]::text[])),coalesce(p_publish,false),btrim(p_name),coalesce(btrim(p_description),''))
  returning id into v_version_id;
  insert into public.package_zones(package_version_id,zone_id) select v_version_id,zone_id from unnest(p_zone_ids) as input_zone(zone_id);
  insert into public.admin_audit_events(actor_id,action,entity_type,entity_id,details)
  values ((select auth.uid()),case when coalesce(p_publish,false) then 'SERVICE_PACKAGE_PUBLISHED' else 'SERVICE_PACKAGE_DRAFTED' end,'SERVICE_PACKAGE',v_package_id,jsonb_build_object('version',v_version,'price_kobo',p_price_kobo,'duration_minutes',p_duration_minutes,'zones',p_zone_ids));
  return v_version_id;
end;
$$;
revoke all on function public.admin_save_service_package(text,text,text,bigint,integer,text[],text[],uuid[],boolean) from public, anon;
grant execute on function public.admin_save_service_package(text,text,text,bigint,integer,text[],text[],uuid[],boolean) to authenticated;

create or replace function public.admin_set_service_package_active(p_package_id uuid, p_is_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_latest_version uuid;
begin
  if not public.has_staff_role(array['OWNER','ADMIN']) then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_is_active then
    select id into v_latest_version from public.service_package_versions where package_id = p_package_id order by version desc limit 1;
    if v_latest_version is null then raise exception 'Create a package version first' using errcode = '22023'; end if;
    if not exists (select 1 from public.package_zones pz join public.service_zones z on z.id = pz.zone_id where pz.package_version_id = v_latest_version and z.is_active) then
      raise exception 'Activate at least one linked service zone before publishing' using errcode = '22023';
    end if;
    update public.service_package_versions set is_active = false where package_id = p_package_id;
    update public.service_package_versions set is_active = true where id = v_latest_version;
  else
    update public.service_package_versions set is_active = false where package_id = p_package_id;
  end if;
  update public.service_packages set is_active = coalesce(p_is_active,false) where id = p_package_id;
  if not found then raise exception 'Package not found' using errcode = 'P0002'; end if;
  insert into public.admin_audit_events(actor_id,action,entity_type,entity_id,details)
  values ((select auth.uid()),case when coalesce(p_is_active,false) then 'SERVICE_PACKAGE_ACTIVATED' else 'SERVICE_PACKAGE_DEACTIVATED' end,'SERVICE_PACKAGE',p_package_id,jsonb_build_object('active',p_is_active));
end;
$$;
revoke all on function public.admin_set_service_package_active(uuid,boolean) from public, anon;
grant execute on function public.admin_set_service_package_active(uuid,boolean) to authenticated;

create or replace function public.admin_set_staff_role(p_email text, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_target uuid; v_actor_owner boolean;
begin
  v_actor_owner := public.has_staff_role(array['OWNER']);
  if not v_actor_owner and not public.has_staff_role(array['ADMIN']) then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_role not in ('OWNER','ADMIN','OPERATIONS','SUPPORT','FINANCE') then raise exception 'Choose a valid staff role' using errcode = '22023'; end if;
  if p_role in ('OWNER','ADMIN') and not v_actor_owner then raise exception 'Only an owner can grant owner or admin access' using errcode = '42501'; end if;
  select id into v_target from auth.users where lower(email) = lower(btrim(p_email));
  if v_target is null then raise exception 'Create the user's HomeOps account before granting staff access' using errcode = 'P0002'; end if;
  insert into public.app_staff_roles(user_id,role,granted_by) values(v_target,p_role,(select auth.uid())) on conflict(user_id,role) do nothing;
  insert into public.admin_audit_events(actor_id,action,entity_type,entity_id,details)
  values ((select auth.uid()),'STAFF_ROLE_GRANTED','STAFF_ROLE',v_target,jsonb_build_object('role',p_role));
end;
$$;
revoke all on function public.admin_set_staff_role(text,text) from public, anon;
grant execute on function public.admin_set_staff_role(text,text) to authenticated;

create or replace function public.admin_remove_staff_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_staff_role(array['OWNER']) and not public.has_staff_role(array['ADMIN']) then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_role not in ('OWNER','ADMIN','OPERATIONS','SUPPORT','FINANCE') then raise exception 'Choose a valid staff role' using errcode = '22023'; end if;
  if p_role in ('OWNER','ADMIN') and not public.has_staff_role(array['OWNER']) then raise exception 'Only an owner can remove owner or admin access' using errcode = '42501'; end if;
  if p_role = 'OWNER' and (select count(*) from public.app_staff_roles where role = 'OWNER') <= 1 then raise exception 'At least one owner must remain' using errcode = '22023'; end if;
  delete from public.app_staff_roles where user_id = p_user_id and role = p_role;
  insert into public.admin_audit_events(actor_id,action,entity_type,entity_id,details)
  values ((select auth.uid()),'STAFF_ROLE_REMOVED','STAFF_ROLE',p_user_id,jsonb_build_object('role',p_role));
end;
$$;
revoke all on function public.admin_remove_staff_role(uuid,text) from public, anon;
grant execute on function public.admin_remove_staff_role(uuid,text) to authenticated;
