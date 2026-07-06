alter table public.tenders
add column if not exists psq_due_at timestamptz,
add column if not exists itt_due_at timestamptz,
add column if not exists final_clarification_deadline timestamptz;

update public.tenders
set psq_due_at = submission_deadline
where psq_due_at is null
  and submission_deadline is not null
  and stage = 'psq';

update public.tenders
set itt_due_at = submission_deadline
where itt_due_at is null
  and submission_deadline is not null
  and stage = 'itt';

with latest_open_clarification as (
  select
    deadline.tender_id,
    deadline.organisation_id,
    max(deadline.due_at) as due_at
  from public.tender_deadlines deadline
  where deadline.deadline_type = 'clarification'
    and deadline.completed_at is null
  group by deadline.tender_id, deadline.organisation_id
)
update public.tenders tender
set final_clarification_deadline = latest_open_clarification.due_at
from latest_open_clarification
where tender.id = latest_open_clarification.tender_id
  and tender.organisation_id = latest_open_clarification.organisation_id
  and tender.final_clarification_deadline is null;
