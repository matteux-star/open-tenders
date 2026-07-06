insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  reauthentication_token,
  phone_change,
  phone_change_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'maya@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Maya Patel"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'james@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"James Wright"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'sam@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sam Green"}',
    now(),
    now()
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'maya@example.com',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"maya@example.com","email_verified":true,"phone_verified":false}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    'james@example.com',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"james@example.com","email_verified":true,"phone_verified":false}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    'sam@example.com',
    '{"sub":"33333333-3333-3333-3333-333333333333","email":"sam@example.com","email_verified":true,"phone_verified":false}',
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider_id, provider) do nothing;

insert into public.organisations (id, name, slug, created_by)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Procurement Team',
  'procurement-team',
  '11111111-1111-1111-1111-111111111111'
)
on conflict (id) do nothing;

insert into public.organisation_members (organisation_id, user_id, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'editor'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'viewer')
on conflict (organisation_id, user_id) do nothing;

insert into public.tenders (
  id,
  organisation_id,
  title,
  buyer_name,
  sector,
  region,
  estimated_value,
  owner_id,
  stage,
  status,
  submission_deadline,
  published_at,
  source_url,
  notes,
  created_by
)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Northbridge MAT Cleaning Framework',
    'Northbridge Multi Academy Trust',
    'Education',
    'North West',
    420000,
    '11111111-1111-1111-1111-111111111111',
    'itt',
    'urgent',
    '2026-05-15 12:00:00+00',
    '2026-04-21 09:00:00+00',
    'https://example.com/tenders/northbridge-mat-cleaning',
    'High-priority cleaning framework with short clarification window.',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Elm County FM Services',
    'Elm County Council',
    'Local authority',
    'South East',
    680000,
    '22222222-2222-2222-2222-222222222222',
    'psq',
    'at_risk',
    '2026-05-18 15:00:00+00',
    '2026-04-29 09:00:00+00',
    'https://example.com/tenders/elm-county-fm',
    'Clarification responses need review before submission.',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb003',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Harbour Trust Cleaning DPS',
    'Harbour NHS Trust',
    'Healthcare',
    'South West',
    920000,
    '11111111-1111-1111-1111-111111111111',
    'award',
    'awaiting_result',
    null,
    '2026-03-10 09:00:00+00',
    'https://example.com/tenders/harbour-cleaning-dps',
    'Submitted and awaiting award notice.',
    '11111111-1111-1111-1111-111111111111'
  )
on conflict (id) do nothing;

insert into public.tender_deadlines (
  tender_id,
  organisation_id,
  title,
  deadline_type,
  due_at,
  created_by
)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Northbridge MAT submission',
    'submission',
    '2026-05-15 12:00:00+00',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Elm County clarification questions',
    'clarification',
    '2026-05-13 10:00:00+00',
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Northbridge internal review',
    'internal_review',
    '2026-05-14 16:30:00+00',
    '11111111-1111-1111-1111-111111111111'
  );

insert into public.tender_activity (tender_id, organisation_id, actor_id, event_type, message, metadata, created_at)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'tender.created',
    'New tender added',
    '{"title":"Northbridge MAT Cleaning Framework"}',
    now() - interval '2 hours'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'deadline.updated',
    'Deadline updated',
    '{"detail":"Elm County clarification moved to tomorrow"}',
    now() - interval '1 hour'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb003',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'tender.submitted',
    'Submission complete',
    '{"title":"Harbour Trust Cleaning DPS"}',
    now() - interval '1 day'
  );

insert into public.contracts (
  organisation_id,
  tender_id,
  client_name,
  contract_name,
  value,
  start_date,
  end_date,
  renewal_window_start,
  status,
  owner_id,
  notes
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    null,
    'St. Cuthbert School',
    'St. Cuthbert Catering Rebid',
    155000,
    '2024-07-01',
    '2026-06-30',
    '2026-05-30',
    'renewal_watch',
    '22222222-2222-2222-2222-222222222222',
    'Prepare renewal pack and pricing model.'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    null,
    'Greenhill Academy',
    'Greenhill Academy Cleaning',
    320000,
    '2024-08-01',
    '2026-07-31',
    '2026-06-15',
    'renewal_watch',
    '11111111-1111-1111-1111-111111111111',
    'Monitor rebid notice.'
  );
