create extension if not exists pgcrypto;

create type public.organisation_member_role as enum ('admin', 'editor', 'viewer');
create type public.tender_stage as enum (
  'identified',
  'psq',
  'itt',
  'presentation',
  'award',
  'standstill',
  'won',
  'lost',
  'withdrawn',
  'no_bid'
);
create type public.tender_status as enum (
  'on_track',
  'at_risk',
  'blocked',
  'urgent',
  'submitted',
  'awaiting_result',
  'closed'
);
create type public.tender_deadline_type as enum (
  'submission',
  'clarification',
  'internal_review',
  'site_visit',
  'presentation',
  'standstill',
  'award',
  'renewal'
);
create type public.contract_status as enum ('active', 'renewal_watch', 'rebid', 'ended');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisation_members (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.organisation_member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create table public.tenders (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  title text not null,
  buyer_name text not null,
  sector text,
  region text,
  estimated_value numeric(14, 2),
  currency char(3) not null default 'GBP',
  owner_id uuid references public.profiles (id) on delete set null,
  stage public.tender_stage not null default 'identified',
  status public.tender_status not null default 'on_track',
  submission_deadline timestamptz,
  published_at timestamptz,
  source_url text,
  notes text,
  closed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organisation_id),
  constraint tenders_currency_uppercase check (currency = upper(currency)),
  constraint tenders_estimated_value_positive check (estimated_value is null or estimated_value >= 0)
);

create table public.tender_stage_history (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  from_stage public.tender_stage,
  to_stage public.tender_stage not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now(),
  notes text,
  constraint tender_stage_history_tender_org_fkey
    foreign key (tender_id, organisation_id)
    references public.tenders (id, organisation_id)
    on delete cascade
);

create table public.tender_deadlines (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  title text not null,
  deadline_type public.tender_deadline_type not null,
  due_at timestamptz not null,
  completed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tender_deadlines_tender_org_fkey
    foreign key (tender_id, organisation_id)
    references public.tenders (id, organisation_id)
    on delete cascade
);

create table public.tender_activity (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint tender_activity_tender_org_fkey
    foreign key (tender_id, organisation_id)
    references public.tenders (id, organisation_id)
    on delete cascade
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  tender_id uuid,
  client_name text not null,
  contract_name text not null,
  value numeric(14, 2),
  currency char(3) not null default 'GBP',
  start_date date,
  end_date date,
  renewal_window_start date,
  status public.contract_status not null default 'active',
  owner_id uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_tender_org_fkey
    foreign key (tender_id, organisation_id)
    references public.tenders (id, organisation_id),
  constraint contracts_currency_uppercase check (currency = upper(currency)),
  constraint contracts_value_positive check (value is null or value >= 0)
);

create index organisation_members_user_id_idx on public.organisation_members (user_id);
create index tenders_organisation_stage_idx on public.tenders (organisation_id, stage);
create index tenders_organisation_status_idx on public.tenders (organisation_id, status);
create index tenders_owner_id_idx on public.tenders (owner_id);
create index tenders_submission_deadline_idx on public.tenders (submission_deadline);
create index tender_stage_history_tender_id_idx on public.tender_stage_history (tender_id);
create index tender_deadlines_tender_due_idx on public.tender_deadlines (tender_id, due_at);
create index tender_activity_organisation_created_idx on public.tender_activity (organisation_id, created_at desc);
create index contracts_organisation_end_date_idx on public.contracts (organisation_id, end_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger organisations_set_updated_at
before update on public.organisations
for each row execute function public.set_updated_at();

create trigger organisation_members_set_updated_at
before update on public.organisation_members
for each row execute function public.set_updated_at();

create trigger tenders_set_updated_at
before update on public.tenders
for each row execute function public.set_updated_at();

create trigger tender_deadlines_set_updated_at
before update on public.tender_deadlines
for each row execute function public.set_updated_at();

create trigger contracts_set_updated_at
before update on public.contracts
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_org_member(target_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_members
    where organisation_id = target_organisation_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(
  target_organisation_id uuid,
  allowed_roles public.organisation_member_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_members
    where organisation_id = target_organisation_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.create_organisation(organisation_name text, organisation_slug text)
returns public.organisations
language plpgsql
security definer
set search_path = public
as $$
declare
  created_organisation public.organisations;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to create an organisation.';
  end if;

  insert into public.organisations (name, slug, created_by)
  values (organisation_name, organisation_slug, auth.uid())
  returning * into created_organisation;

  insert into public.organisation_members (organisation_id, user_id, role)
  values (created_organisation.id, auth.uid(), 'admin');

  return created_organisation;
end;
$$;

create or replace function public.log_tender_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.tender_activity (tender_id, organisation_id, actor_id, event_type, message, metadata)
    values (new.id, new.organisation_id, auth.uid(), 'tender.created', 'Tender created', jsonb_build_object('title', new.title));
  elsif new.stage is distinct from old.stage then
    insert into public.tender_stage_history (tender_id, organisation_id, from_stage, to_stage, changed_by)
    values (new.id, new.organisation_id, old.stage, new.stage, auth.uid());

    insert into public.tender_activity (tender_id, organisation_id, actor_id, event_type, message, metadata)
    values (
      new.id,
      new.organisation_id,
      auth.uid(),
      'tender.stage_changed',
      'Tender stage changed',
      jsonb_build_object('from_stage', old.stage, 'to_stage', new.stage)
    );
  elsif new.status is distinct from old.status then
    insert into public.tender_activity (tender_id, organisation_id, actor_id, event_type, message, metadata)
    values (
      new.id,
      new.organisation_id,
      auth.uid(),
      'tender.status_changed',
      'Tender status changed',
      jsonb_build_object('from_status', old.status, 'to_status', new.status)
    );
  elsif new.owner_id is distinct from old.owner_id then
    insert into public.tender_activity (tender_id, organisation_id, actor_id, event_type, message, metadata)
    values (
      new.id,
      new.organisation_id,
      auth.uid(),
      'tender.owner_changed',
      'Tender owner changed',
      jsonb_build_object('from_owner_id', old.owner_id, 'to_owner_id', new.owner_id)
    );
  end if;

  return new;
end;
$$;

create trigger tenders_log_insert
after insert on public.tenders
for each row execute function public.log_tender_change();

create trigger tenders_log_update
after update of stage, status, owner_id on public.tenders
for each row execute function public.log_tender_change();

alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.organisation_members enable row level security;
alter table public.tenders enable row level security;
alter table public.tender_stage_history enable row level security;
alter table public.tender_deadlines enable row level security;
alter table public.tender_activity enable row level security;
alter table public.contracts enable row level security;

create policy "Users can read their profile"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.organisation_members own_membership
    join public.organisation_members other_membership
      on other_membership.organisation_id = own_membership.organisation_id
    where own_membership.user_id = auth.uid()
      and other_membership.user_id = profiles.id
  )
);

create policy "Users can update their profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Members can read organisations"
on public.organisations for select
to authenticated
using (public.is_org_member(id));

create policy "Authenticated users can create organisations"
on public.organisations for insert
to authenticated
with check (created_by = auth.uid());

create policy "Admins can update organisations"
on public.organisations for update
to authenticated
using (public.has_org_role(id, array['admin']::public.organisation_member_role[]))
with check (public.has_org_role(id, array['admin']::public.organisation_member_role[]));

create policy "Members can read memberships"
on public.organisation_members for select
to authenticated
using (public.is_org_member(organisation_id));

create policy "Admins can create memberships"
on public.organisation_members for insert
to authenticated
with check (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]));

create policy "Admins can update memberships"
on public.organisation_members for update
to authenticated
using (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]))
with check (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]));

create policy "Admins can delete memberships"
on public.organisation_members for delete
to authenticated
using (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]));

create policy "Members can read tenders"
on public.tenders for select
to authenticated
using (public.is_org_member(organisation_id));

create policy "Editors can create tenders"
on public.tenders for insert
to authenticated
with check (public.has_org_role(organisation_id, array['admin', 'editor']::public.organisation_member_role[]));

create policy "Editors can update tenders"
on public.tenders for update
to authenticated
using (public.has_org_role(organisation_id, array['admin', 'editor']::public.organisation_member_role[]))
with check (public.has_org_role(organisation_id, array['admin', 'editor']::public.organisation_member_role[]));

create policy "Admins can delete tenders"
on public.tenders for delete
to authenticated
using (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]));

create policy "Members can read stage history"
on public.tender_stage_history for select
to authenticated
using (public.is_org_member(organisation_id));

create policy "Editors can create stage history"
on public.tender_stage_history for insert
to authenticated
with check (public.has_org_role(organisation_id, array['admin', 'editor']::public.organisation_member_role[]));

create policy "Members can read deadlines"
on public.tender_deadlines for select
to authenticated
using (public.is_org_member(organisation_id));

create policy "Editors can create deadlines"
on public.tender_deadlines for insert
to authenticated
with check (public.has_org_role(organisation_id, array['admin', 'editor']::public.organisation_member_role[]));

create policy "Editors can update deadlines"
on public.tender_deadlines for update
to authenticated
using (public.has_org_role(organisation_id, array['admin', 'editor']::public.organisation_member_role[]))
with check (public.has_org_role(organisation_id, array['admin', 'editor']::public.organisation_member_role[]));

create policy "Editors can delete deadlines"
on public.tender_deadlines for delete
to authenticated
using (public.has_org_role(organisation_id, array['admin', 'editor']::public.organisation_member_role[]));

create policy "Members can read activity"
on public.tender_activity for select
to authenticated
using (public.is_org_member(organisation_id));

create policy "Editors can create activity"
on public.tender_activity for insert
to authenticated
with check (public.has_org_role(organisation_id, array['admin', 'editor']::public.organisation_member_role[]));

create policy "Members can read contracts"
on public.contracts for select
to authenticated
using (public.is_org_member(organisation_id));

create policy "Editors can create contracts"
on public.contracts for insert
to authenticated
with check (public.has_org_role(organisation_id, array['admin', 'editor']::public.organisation_member_role[]));

create policy "Editors can update contracts"
on public.contracts for update
to authenticated
using (public.has_org_role(organisation_id, array['admin', 'editor']::public.organisation_member_role[]))
with check (public.has_org_role(organisation_id, array['admin', 'editor']::public.organisation_member_role[]));

create policy "Admins can delete contracts"
on public.contracts for delete
to authenticated
using (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]));
