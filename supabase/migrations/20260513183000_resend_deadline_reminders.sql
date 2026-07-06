create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create unique index if not exists tender_deadlines_open_submission_unique
on public.tender_deadlines (tender_id, organisation_id)
where deadline_type = 'submission' and completed_at is null;

create or replace function public.sync_tender_submission_deadline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_deadline_id uuid;
begin
  select id
  into existing_deadline_id
  from public.tender_deadlines
  where tender_id = new.id
    and organisation_id = new.organisation_id
    and deadline_type = 'submission'
    and completed_at is null
  order by created_at asc
  limit 1;

  if new.submission_deadline is null then
    if existing_deadline_id is not null then
      update public.tender_deadlines
      set completed_at = now()
      where id = existing_deadline_id;
    end if;

    return new;
  end if;

  if existing_deadline_id is not null then
    update public.tender_deadlines
    set
      title = new.title || ' submission',
      due_at = new.submission_deadline,
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
      new.id,
      new.organisation_id,
      new.title || ' submission',
      'submission',
      new.submission_deadline,
      new.created_by
    )
    on conflict (tender_id, organisation_id)
    where deadline_type = 'submission' and completed_at is null
    do update set
      title = excluded.title,
      due_at = excluded.due_at,
      completed_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists tenders_sync_submission_deadline on public.tenders;
create trigger tenders_sync_submission_deadline
after insert or update of title, submission_deadline
on public.tenders
for each row
execute function public.sync_tender_submission_deadline();

insert into public.tender_deadlines (
  tender_id,
  organisation_id,
  title,
  deadline_type,
  due_at,
  created_by
)
select
  tender.id,
  tender.organisation_id,
  tender.title || ' submission',
  'submission',
  tender.submission_deadline,
  tender.created_by
from public.tenders tender
where tender.submission_deadline is not null
  and not exists (
    select 1
    from public.tender_deadlines deadline
    where deadline.tender_id = tender.id
      and deadline.organisation_id = tender.organisation_id
      and deadline.deadline_type = 'submission'
      and deadline.completed_at is null
  );

do $$
begin
  perform cron.unschedule('send-deadline-reminders-hourly');
exception
  when others then
    null;
end $$;

select cron.schedule(
  'send-deadline-reminders-hourly',
  '0 * * * *',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'tender_flow_functions_url') || '/send-deadline-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'tender_flow_function_api_key'),
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'tender_flow_cron_secret')
      ),
      body := jsonb_build_object('source', 'supabase_cron', 'scheduled_at', now())
    ) as request_id;
  $$
);
