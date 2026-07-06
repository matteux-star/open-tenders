do $$
begin
  create type public.notification_delivery_channel as enum ('email', 'telegram');
exception
  when duplicate_object then null;
end $$;

alter table public.member_notification_preferences
add column if not exists telegram_enabled boolean not null default false;

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  channel public.notification_delivery_channel not null,
  recipient_user_id uuid references public.profiles (id) on delete set null,
  recipient_address text not null,
  event_type text not null,
  event_key text not null,
  provider text not null,
  provider_message_id text,
  status public.email_delivery_status not null default 'pending',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_deliveries_event_recipient_unique unique (channel, event_key, recipient_address)
);

create table if not exists public.telegram_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  telegram_user_id text not null,
  telegram_chat_id text not null,
  telegram_username text,
  first_name text,
  last_name text,
  linked_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_links_user_unique unique (user_id)
);

create table if not exists public.telegram_link_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_deliveries_org_created_idx
on public.notification_deliveries (organisation_id, created_at desc);

create index if not exists notification_deliveries_event_key_idx
on public.notification_deliveries (event_key);

create index if not exists telegram_links_user_active_idx
on public.telegram_links (user_id)
where revoked_at is null;

create index if not exists telegram_link_tokens_hash_active_idx
on public.telegram_link_tokens (token_hash)
where consumed_at is null;

drop trigger if exists notification_deliveries_set_updated_at on public.notification_deliveries;
create trigger notification_deliveries_set_updated_at
before update on public.notification_deliveries
for each row execute function public.set_updated_at();

drop trigger if exists telegram_links_set_updated_at on public.telegram_links;
create trigger telegram_links_set_updated_at
before update on public.telegram_links
for each row execute function public.set_updated_at();

grant select on public.notification_deliveries to authenticated;
grant select, update on public.telegram_links to authenticated;

alter table public.notification_deliveries enable row level security;
alter table public.telegram_links enable row level security;
alter table public.telegram_link_tokens enable row level security;

create policy "Admins can read notification deliveries"
on public.notification_deliveries for select
to authenticated
using (public.has_org_role(organisation_id, array['admin']::public.organisation_member_role[]));

create policy "Users can read their Telegram link"
on public.telegram_links for select
to authenticated
using (user_id = auth.uid());

create policy "Users can revoke their Telegram link"
on public.telegram_links for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
