insert into public.profiles (id, email, full_name)
values (
  '5cd7a919-fb6e-40ab-8c2d-89eea1c9d7a7',
  null,
  'Developer'
)
on conflict (id) do nothing;

insert into public.organisations (id, name, slug, created_by)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Procurement Team',
  'procurement-team',
  '5cd7a919-fb6e-40ab-8c2d-89eea1c9d7a7'
)
on conflict (id) do nothing;

insert into public.organisation_members (organisation_id, user_id, role)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '5cd7a919-fb6e-40ab-8c2d-89eea1c9d7a7',
  'admin'
)
on conflict (organisation_id, user_id)
do update set
  role = excluded.role,
  updated_at = now();

insert into public.organisation_billing_profiles (
  organisation_id,
  billing_admin_id,
  seat_allowance,
  seat_quantity,
  subscription_status
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '5cd7a919-fb6e-40ab-8c2d-89eea1c9d7a7',
  10,
  10,
  'not_configured'
)
on conflict (organisation_id) do update set
  billing_admin_id = excluded.billing_admin_id,
  updated_at = now();
