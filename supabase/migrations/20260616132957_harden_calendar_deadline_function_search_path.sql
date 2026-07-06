create or replace function public.sync_tender_calendar_deadline(
  tender_row public.tenders,
  target_deadline_type public.tender_deadline_type,
  target_due_at timestamptz,
  target_title text
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  existing_deadline_id uuid;
begin
  select id
  into existing_deadline_id
  from public.tender_deadlines
  where tender_id = tender_row.id
    and organisation_id = tender_row.organisation_id
    and deadline_type = target_deadline_type
    and completed_at is null
  order by created_at asc
  limit 1;

  if target_due_at is null then
    if existing_deadline_id is not null then
      update public.tender_deadlines
      set completed_at = now()
      where id = existing_deadline_id;
    end if;

    return;
  end if;

  if existing_deadline_id is not null then
    update public.tender_deadlines
    set
      title = target_title,
      due_at = target_due_at,
      completed_at = null
    where id = existing_deadline_id;
  else
    insert into public.tender_deadlines (
      tender_id,
      organisation_id,
      title,
      deadline_type,
      due_at,
      created_by
    )
    values (
      tender_row.id,
      tender_row.organisation_id,
      target_title,
      target_deadline_type,
      target_due_at,
      tender_row.created_by
    );
  end if;
end;
$$;

create or replace function public.sync_tender_submission_deadline()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  perform public.sync_tender_calendar_deadline(
    new,
    'internal_review',
    new.psq_due_at,
    new.title || ' PSQ due'
  );

  perform public.sync_tender_calendar_deadline(
    new,
    'submission',
    new.submission_deadline,
    new.title || ' submission'
  );

  perform public.sync_tender_calendar_deadline(
    new,
    'clarification',
    new.final_clarification_deadline,
    new.title || ' final clarification'
  );

  return new;
end;
$$;
