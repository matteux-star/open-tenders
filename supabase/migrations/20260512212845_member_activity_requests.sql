create policy "Members can create request activity"
on public.tender_activity for insert
to authenticated
with check (
  public.is_org_member(organisation_id)
  and actor_id = auth.uid()
  and tender_id is null
  and event_type in ('settings.access_requested', 'user.invite_requested')
);
