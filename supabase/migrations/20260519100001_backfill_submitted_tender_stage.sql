update public.tenders
set
  stage = 'submitted'::public.tender_stage,
  updated_at = now()
where status = 'submitted'::public.tender_status
  and stage not in (
    'submitted'::public.tender_stage,
    'won'::public.tender_stage,
    'lost'::public.tender_stage,
    'withdrawn'::public.tender_stage,
    'no_bid'::public.tender_stage
  );
