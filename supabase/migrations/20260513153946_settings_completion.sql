alter table public.organisations
add column if not exists default_currency char(3) not null default 'GBP',
add column if not exists timezone text not null default 'Europe/London',
add column if not exists seat_limit integer not null default 10,
add constraint organisations_default_currency_uppercase check (default_currency = upper(default_currency)),
add constraint organisations_seat_limit_positive check (seat_limit > 0);

create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type public.settings_access_request_status as enum ('pending', 'approved', 'rejected');
create type public.billing_subscription_status as enum ('not_configured', 'trialing', 'active', 'past_due', 'cancelled');

create table public.organisation_invitations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  email text not null,
  role public.organisation_member_role not null default 'viewer',
  message text,
  status public.invitation_status not null default 'pending',
  invited_by uuid references public.profiles (id) on delete set null,
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organisation_invitations_email_not_blank check (length(trim(email)) > 3),
  constraint organisation_invitations_pending_email_unique unique (organisation_id, email, status)
);

create table public.settings_access_requests (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  requested_role public.organisation_member_role not null default 'editor',
  status public.settings_access_request_status not null default 'pending',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_access_requests_pending_unique unique (organisation_id, requester_id, status)
);

create table public.organisation_notification_settings (
  organisation_id uuid primary key references public.organisations (id) on delete cascade,
  enabled_types text[] not null default array[
    'submission_deadline',
    'clarification_deadline',
    'internal_review_deadline',
    'renewal_window',
    'contract_expiry',
    'tender_assignment',
    'status_change'
  ],
  reminder_days integer[] not null default array[14, 7, 2, 0],
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.member_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  email_enabled boolean not null default true,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create table public.organisation_billing_profiles (
  organisation_id uuid primary key references public.organisations (id) on delete cascade,
  plan_name text not null default 'MVP / Team',
  billing_email text,
  billing_admin_id uuid references public.profiles (id) on delete set null,
  provider_customer_id text,
  provider_subscription_id text,
  subscription_status public.billing_subscription_status not null default 'not_configured',
  seat_allowance integer not null default 10,
  portal_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organisation_billing_profiles_seat_allowance_positive check (seat_allowance > 0)
);

create index organisation_invitations_org_status_idx
on public.organisation_invitations (organisation_id, status);

create index settings_access_requests_org_status_idx
on public.settings_access_requests (organisation_id, status);

create trigger organisation_invitations_set_updated_at
before update on public.organisation_invitations
for each row execute function public.set_updated_at();

create trigger settings_access_requests_set_updated_at
before update on public.settings_access_requests
for each row execute function public.set_updated_at();

create trigger organisation_notification_settings_set_updated_at
before update on public.organisation_notification_settings
for each row execute function public.set_updated_at();

create trigger member_notification_preferences_set_updated_at
before update on public.member_notification_preferences
for each row execute function public.set_updated_at();

create trigger organisation_billing_profiles_set_updated_at
before update on public.organisation_billing_profiles
for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.organisation_invitations to authenticated;
grant select, insert, update, delete on public.settings_access_requests to authenticated;
grant select, insert, update, delete on public.organisation_notification_settings to authenticated;
grant select, insert, update, delete on public.member_notification_preferences to authenticated;
grant select, insert, update, delete on public.organisation_billing_profiles to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.organisation_invitations enable row level security;
alter table public.settings_access_requests enable row level security;
alter table public.organisation_notification_settings enable row level security;
alter table public.member_notification_preferences enable row level security;
alter table public.organisation_billing_profiles enable row level security;

create policy "Members can read invitations"
on public.organisation_invitations for select
to authenticated
using (public.is_org_member(organisation_id));

create policy "Admins can create invitations"
on public.organisation_invitations for insert
to authenticated
with check (
  public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[])
  and invited_by = auth.uid()
);

create policy "Admins can update invitations"
on public.organisation_invitations for update
to authenticated
using (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]))
with check (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]));

create policy "Admins and requesters can read settings access requests"
on public.settings_access_requests for select
to authenticated
using (
  requester_id = auth.uid()
  or public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[])
);

create policy "Members can create their settings access requests"
on public.settings_access_requests for insert
to authenticated
with check (
  public.is_org_member(organisation_id)
  and requester_id = auth.uid()
);

create policy "Admins can resolve settings access requests"
on public.settings_access_requests for update
to authenticated
using (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]))
with check (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]));

create policy "Members can read organisation notification settings"
on public.organisation_notification_settings for select
to authenticated
using (public.is_org_member(organisation_id));

create policy "Admins can upsert organisation notification settings"
on public.organisation_notification_settings for all
to authenticated
using (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]))
with check (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]));

create policy "Members can read notification preferences"
on public.member_notification_preferences for select
to authenticated
using (public.is_org_member(organisation_id));

create policy "Users can create their notification preference"
on public.member_notification_preferences for insert
to authenticated
with check (
  public.is_org_member(organisation_id)
  and user_id = auth.uid()
);

create policy "Users and admins can update notification preferences"
on public.member_notification_preferences for update
to authenticated
using (
  (user_id = auth.uid() and public.is_org_member(organisation_id))
  or public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[])
)
with check (
  (user_id = auth.uid() and public.is_org_member(organisation_id))
  or public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[])
);

create policy "Members can read billing profiles"
on public.organisation_billing_profiles for select
to authenticated
using (public.is_org_member(organisation_id));

create policy "Admins can manage billing profiles"
on public.organisation_billing_profiles for all
to authenticated
using (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]))
with check (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]));

insert into public.organisation_notification_settings (organisation_id)
select id from public.organisations
on conflict (organisation_id) do nothing;

insert into public.organisation_billing_profiles (
  organisation_id,
  billing_admin_id,
  seat_allowance
)
select id, created_by, seat_limit
from public.organisations
on conflict (organisation_id) do nothing;
