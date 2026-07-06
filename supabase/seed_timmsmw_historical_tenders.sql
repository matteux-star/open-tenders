-- Historical tender data suite for timmsmw@gmail.com.
-- Current date context: 2026-05-24, so the previous two calendar years are
-- 2024-01-01 through 2025-12-31.
--
-- This script is idempotent. It removes the previous generated suite for the
-- selected organisation, then recreates 96 tenders with related deadlines,
-- activity, stage history, and won-contract records.

do $$
<<seed_suite>>
declare
  target_email constant text := 'timmsmw@gmail.com';
  seed_key constant text := 'timmsmw_historical_suite_2024_2025';
  target_user_id uuid;
  target_org_id uuid;
  member_ids uuid[];
  owner_user_id uuid;
  tender_id uuid;
  hash text;
  tender_year integer;
  year_index integer;
  created_value timestamptz;
  published_value timestamptz;
  deadline_value timestamptz;
  closed_value timestamptz;
  estimated_value numeric(14, 2);
  stage_value public.tender_stage;
  status_value public.tender_status;
  sector_value text;
  region_value text;
  buyer_value text;
  service_value text;
  title_value text;
  is_terminal boolean;
  i integer;
  sectors text[] := array[
    'Education',
    'Healthcare',
    'Local authority',
    'Housing',
    'Transport',
    'Central government',
    'Utilities',
    'Emergency services',
    'Further education',
    'Leisure'
  ];
  regions text[] := array[
    'North East',
    'North West',
    'Yorkshire and the Humber',
    'East Midlands',
    'West Midlands',
    'East of England',
    'London',
    'South East',
    'South West',
    'Scotland',
    'Wales'
  ];
  buyer_prefixes text[] := array[
    'Northbridge',
    'Elm County',
    'Harbour',
    'Kingswell',
    'Riverton',
    'Meadowfield',
    'Ashbourne',
    'Oakmere',
    'Westport',
    'Lakeside',
    'Stonehaven',
    'Clearwater'
  ];
  buyer_suffixes text[] := array[
    'Council',
    'NHS Trust',
    'University',
    'Housing Partnership',
    'Combined Authority',
    'Academy Trust',
    'Fire and Rescue Service',
    'Leisure Trust'
  ];
  services text[] := array[
    'Cleaning Services',
    'Facilities Management',
    'Catering Services',
    'Grounds Maintenance',
    'Security Services',
    'Waste Management',
    'Planned Maintenance',
    'Energy Efficiency Works',
    'Responsive Repairs',
    'Building Compliance',
    'Hard FM Support',
    'Soft Services Framework'
  ];
  routes text[] := array[
    'Framework',
    'DPS',
    'Term Contract',
    'Call-Off',
    'Managed Service',
    'Lot Package'
  ];
begin
  select u.id
  into target_user_id
  from auth.users u
  where lower(u.email) = lower(target_email)
  limit 1;

  if target_user_id is null then
    raise exception 'No Supabase auth user found for %', target_email;
  end if;

  insert into public.profiles (id, email)
  values (target_user_id, target_email)
  on conflict (id) do update
  set email = excluded.email;

  select om.organisation_id
  into target_org_id
  from public.organisation_members om
  where om.user_id = target_user_id
  order by
    case om.role
      when 'admin' then 0
      when 'editor' then 1
      else 2
    end,
    om.created_at
  limit 1;

  if target_org_id is null then
    raise exception 'User % has no organisation membership', target_email;
  end if;

  select array_agg(om.user_id order by
    case om.role
      when 'admin' then 0
      when 'editor' then 1
      else 2
    end,
    om.created_at
  )
  into member_ids
  from public.organisation_members om
  where om.organisation_id = target_org_id;

  for i in 1..96 loop
    hash := md5(seed_key || ':tender:' || i::text);
    tender_id := (
      substr(hash, 1, 8) || '-' ||
      substr(hash, 9, 4) || '-' ||
      substr(hash, 13, 4) || '-' ||
      substr(hash, 17, 4) || '-' ||
      substr(hash, 21, 12)
    )::uuid;

    delete from public.contracts c
    where c.organisation_id = target_org_id
      and c.tender_id = seed_suite.tender_id;

    delete from public.tenders t
    where t.organisation_id = target_org_id
      and t.id = seed_suite.tender_id;
  end loop;

  delete from public.tender_activity
  where organisation_id = target_org_id
    and metadata ->> 'seed' = seed_key;

  for i in 1..96 loop
    hash := md5(seed_key || ':tender:' || i::text);
    tender_id := (
      substr(hash, 1, 8) || '-' ||
      substr(hash, 9, 4) || '-' ||
      substr(hash, 13, 4) || '-' ||
      substr(hash, 17, 4) || '-' ||
      substr(hash, 21, 12)
    )::uuid;

    tender_year := case when i <= 48 then 2024 else 2025 end;
    year_index := (i - 1) % 48;
    created_value :=
      make_timestamptz(tender_year, 1, 2, 9, 0, 0, 'UTC') +
      (year_index * interval '7 days') +
      ((i % 5) * interval '2 hours');
    published_value := created_value - ((3 + (i % 9)) * interval '1 day');
    deadline_value := created_value + ((10 + (i % 19)) * interval '1 day');
    estimated_value := case
      when i = 1 then 45000
      when i = 96 then 600000
      else 45000 + (((i * 97) % 1111) * 500)
    end;

    case i % 12
      when 0 then
        stage_value := 'won';
        status_value := 'closed';
      when 1 then
        stage_value := 'lost';
        status_value := 'closed';
      when 2 then
        stage_value := 'submitted';
        status_value := 'submitted';
      when 3 then
        stage_value := 'award';
        status_value := 'awaiting_result';
      when 4 then
        stage_value := 'presentation';
        status_value := 'at_risk';
      when 5 then
        stage_value := 'itt';
        status_value := 'on_track';
      when 6 then
        stage_value := 'psq';
        status_value := 'blocked';
      when 7 then
        stage_value := 'standstill';
        status_value := 'awaiting_result';
      when 8 then
        stage_value := 'won';
        status_value := 'closed';
      when 9 then
        stage_value := 'lost';
        status_value := 'closed';
      when 10 then
        stage_value := 'no_bid';
        status_value := 'closed';
      else
        stage_value := 'withdrawn';
        status_value := 'closed';
    end case;

    is_terminal := stage_value in ('won', 'lost', 'withdrawn', 'no_bid');
    closed_value := case
      when is_terminal then deadline_value + ((5 + (i % 17)) * interval '1 day')
      else null
    end;

    sector_value := sectors[((i - 1) % array_length(sectors, 1)) + 1];
    region_value := regions[((i + 2) % array_length(regions, 1)) + 1];
    buyer_value :=
      buyer_prefixes[((i - 1) % array_length(buyer_prefixes, 1)) + 1] ||
      ' ' ||
      buyer_suffixes[((i + 3) % array_length(buyer_suffixes, 1)) + 1];
    service_value := services[((i + 4) % array_length(services, 1)) + 1];
    title_value :=
      buyer_prefixes[((i - 1) % array_length(buyer_prefixes, 1)) + 1] ||
      ' ' ||
      service_value ||
      ' ' ||
      routes[((i + 1) % array_length(routes, 1)) + 1];
    owner_user_id := member_ids[((i - 1) % array_length(member_ids, 1)) + 1];

    insert into public.tenders (
      id,
      organisation_id,
      title,
      buyer_name,
      sector,
      region,
      estimated_value,
      currency,
      owner_id,
      stage,
      status,
      submission_deadline,
      published_at,
      source_url,
      notes,
      closed_at,
      created_by,
      created_at,
      updated_at
    )
    values (
      tender_id,
      target_org_id,
      title_value,
      buyer_value,
      sector_value,
      region_value,
      estimated_value,
      'GBP',
      owner_user_id,
      stage_value,
      status_value,
      deadline_value,
      published_value,
      'https://example.com/generated-tenders/' || seed_key || '/' || i::text,
      'Generated test data suite for UI insights. Seed: ' || seed_key,
      closed_value,
      target_user_id,
      created_value,
      coalesce(closed_value, deadline_value)
    );

    insert into public.tender_stage_history (
      tender_id,
      organisation_id,
      from_stage,
      to_stage,
      changed_by,
      changed_at,
      notes
    )
    values (
      tender_id,
      target_org_id,
      null,
      stage_value,
      target_user_id,
      created_value,
      'Generated initial historical stage for ' || seed_key
    );

    insert into public.tender_deadlines (
      tender_id,
      organisation_id,
      title,
      deadline_type,
      due_at,
      completed_at,
      created_by,
      created_at,
      updated_at
    )
    values
      (
        tender_id,
        target_org_id,
        title_value || ' submission',
        'submission',
        deadline_value,
        case when status_value in ('submitted', 'awaiting_result', 'closed') or is_terminal
          then deadline_value - interval '2 hours'
          else null
        end,
        target_user_id,
        created_value,
        deadline_value
      ),
      (
        tender_id,
        target_org_id,
        title_value || ' clarification deadline',
        'clarification',
        published_value + interval '7 days',
        published_value + interval '7 days 3 hours',
        target_user_id,
        published_value,
        published_value + interval '7 days 3 hours'
      ),
      (
        tender_id,
        target_org_id,
        title_value || ' internal review',
        'internal_review',
        deadline_value - interval '3 days',
        case when i % 6 = 0 and not is_terminal
          then null
          else deadline_value - interval '3 days 2 hours'
        end,
        target_user_id,
        created_value,
        deadline_value - interval '3 days 2 hours'
      );

    if stage_value in ('presentation', 'award', 'standstill', 'won', 'lost') then
      insert into public.tender_deadlines (
        tender_id,
        organisation_id,
        title,
        deadline_type,
        due_at,
        completed_at,
        created_by,
        created_at,
        updated_at
      )
      values (
        tender_id,
        target_org_id,
        title_value || ' presentation slot',
        'presentation',
        deadline_value + interval '9 days',
        case when stage_value in ('award', 'standstill', 'won', 'lost')
          then deadline_value + interval '9 days 4 hours'
          else null
        end,
        target_user_id,
        created_value,
        deadline_value + interval '9 days'
      );
    end if;

    insert into public.tender_activity (
      tender_id,
      organisation_id,
      actor_id,
      event_type,
      message,
      metadata,
      created_at
    )
    values
      (
        tender_id,
        target_org_id,
        target_user_id,
        'test_data.created',
        'Historical tender generated',
        jsonb_build_object(
          'seed', seed_key,
          'title', title_value,
          'year', tender_year,
          'value', estimated_value
        ),
        created_value
      ),
      (
        tender_id,
        target_org_id,
        target_user_id,
        'test_data.stage_snapshot',
        'Historical stage snapshot set',
        jsonb_build_object(
          'seed', seed_key,
          'stage', stage_value,
          'status', status_value,
          'detail', title_value
        ),
        coalesce(closed_value, deadline_value)
      );

    if stage_value = 'won' then
      insert into public.contracts (
        organisation_id,
        tender_id,
        client_name,
        contract_name,
        value,
        currency,
        start_date,
        end_date,
        renewal_window_start,
        status,
        owner_id,
        notes,
        created_at,
        updated_at
      )
      values (
        target_org_id,
        tender_id,
        buyer_value,
        title_value || ' Contract',
        estimated_value,
        'GBP',
        (closed_value + interval '30 days')::date,
        (closed_value + interval '30 days' + ((365 + ((i % 3) * 365)) * interval '1 day'))::date,
        (closed_value + interval '30 days' + ((305 + ((i % 3) * 365)) * interval '1 day'))::date,
        (case
          when i % 4 = 0 then 'renewal_watch'
          when i % 5 = 0 then 'ended'
          else 'active'
        end)::public.contract_status,
        owner_user_id,
        'Generated test data suite for UI insights. Seed: ' || seed_key,
        closed_value,
        closed_value
      );
    end if;
  end loop;
end $$;

select
  'timmsmw historical tender suite applied' as result,
  count(*) as generated_tenders,
  min(created_at)::date as first_created_at,
  max(created_at)::date as last_created_at,
  min(estimated_value) as min_value_gbp,
  max(estimated_value) as max_value_gbp
from public.tenders
where notes like '%Seed: timmsmw_historical_suite_2024_2025%';
