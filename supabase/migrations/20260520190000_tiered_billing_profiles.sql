alter table public.organisation_billing_profiles
add column if not exists plan_key text not null default 'team',
add column if not exists active_tender_limit integer not null default 35,
add constraint organisation_billing_profiles_plan_key_check
  check (plan_key in ('starter', 'team', 'business')),
add constraint organisation_billing_profiles_active_tender_limit_positive
  check (active_tender_limit > 0);

update public.organisation_billing_profiles
set
  plan_key = case
    when seat_quantity <= 3 then 'starter'
    when seat_quantity <= 8 then 'team'
    else 'business'
  end,
  plan_name = case
    when seat_quantity <= 3 then 'Starter'
    when seat_quantity <= 8 then 'Team'
    else 'Business'
  end,
  seat_quantity = case
    when seat_quantity <= 3 then 3
    when seat_quantity <= 8 then 8
    else 15
  end,
  seat_allowance = case
    when seat_quantity <= 3 then 3
    when seat_quantity <= 8 then 8
    else 15
  end,
  active_tender_limit = case
    when seat_quantity <= 3 then 10
    when seat_quantity <= 8 then 35
    else 100
  end;
