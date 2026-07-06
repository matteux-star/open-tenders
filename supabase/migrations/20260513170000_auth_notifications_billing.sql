alter type public.billing_subscription_status add value if not exists 'incomplete';
alter type public.billing_subscription_status add value if not exists 'incomplete_expired';
alter type public.billing_subscription_status add value if not exists 'unpaid';
alter type public.billing_subscription_status add value if not exists 'paused';

alter table public.organisation_invitations
add column if not exists token text not null default encode(gen_random_bytes(32), 'hex'),
add column if not exists sent_at timestamptz,
add column if not exists last_sent_error text,
add constraint organisation_invitations_token_unique unique (token);

alter table public.organisation_billing_profiles
add column if not exists provider_subscription_item_id text,
add column if not exists provider_price_id text,
add column if not exists provider_status text,
add column if not exists current_period_end timestamptz,
add column if not exists cancel_at_period_end boolean not null default false,
add column if not exists seat_quantity integer not null default 10,
add column if not exists checkout_completed_at timestamptz,
add constraint organisation_billing_profiles_seat_quantity_positive check (seat_quantity > 0);

create type public.email_delivery_status as enum ('pending', 'sent', 'failed', 'skipped');

create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  recipient_user_id uuid references public.profiles (id) on delete set null,
  recipient_email text not null,
  event_type text not null,
  event_key text not null,
  provider text not null default 'resend',
  provider_message_id text,
  status public.email_delivery_status not null default 'pending',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_deliveries_event_recipient_unique unique (event_key, recipient_email)
);

create index if not exists organisation_invitations_token_idx
on public.organisation_invitations (token);

create index if not exists email_deliveries_org_created_idx
on public.email_deliveries (organisation_id, created_at desc);

create index if not exists email_deliveries_event_key_idx
on public.email_deliveries (event_key);

create trigger email_deliveries_set_updated_at
before update on public.email_deliveries
for each row execute function public.set_updated_at();

grant select, insert, update on public.email_deliveries to authenticated;

alter table public.email_deliveries enable row level security;

create policy "Admins can read email deliveries"
on public.email_deliveries for select
to authenticated
using (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]));

create policy "Admins can create email delivery audit rows"
on public.email_deliveries for insert
to authenticated
with check (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]));

create or replace function public.billable_seat_count(target_organisation_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select
    (
      select count(*)::integer
      from public.organisation_members
      where organisation_id = target_organisation_id
    )
    +
    (
      select count(*)::integer
      from public.organisation_invitations
      where organisation_id = target_organisation_id
        and status = 'pending'
        and expires_at > now()
    );
$$;

create or replace function public.can_add_organisation_seat(target_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.billable_seat_count(target_organisation_id) < coalesce(
    (
      select seat_quantity
      from public.organisation_billing_profiles
      where organisation_id = target_organisation_id
    ),
    (
      select seat_limit
      from public.organisations
      where id = target_organisation_id
    ),
    1
  );
$$;

grant execute on function public.billable_seat_count(uuid) to authenticated;
grant execute on function public.can_add_organisation_seat(uuid) to authenticated;

drop policy if exists "Admins can create invitations" on public.organisation_invitations;

create policy "Admins can create invitations"
on public.organisation_invitations for insert
to authenticated
with check (
  public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[])
  and invited_by = auth.uid()
  and public.can_add_organisation_seat(organisation_id)
);

update public.organisation_billing_profiles
set seat_quantity = seat_allowance
where seat_quantity is distinct from seat_allowance;
