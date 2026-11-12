create table if not exists public.request_email_alerts (
  id uuid primary key default gen_random_uuid(),
  request_kind text not null check (request_kind in ('recommendation', 'verification')),
  request_id text not null,
  requester_id uuid not null references auth.users(id) on delete cascade,
  lecturer_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  status text not null check (status in ('sending', 'sent', 'failed')),
  attempts integer not null default 1,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (request_kind, request_id)
);

alter table public.request_email_alerts enable row level security;
revoke all on public.request_email_alerts from public, anon, authenticated;
grant all on public.request_email_alerts to service_role;

create or replace function public.claim_request_email_alert(
  p_request_kind text,
  p_request_id text,
  p_requester_id uuid,
  p_lecturer_id uuid,
  p_recipient_email text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  claimed_id uuid;
begin
  insert into public.request_email_alerts (
    request_kind,
    request_id,
    requester_id,
    lecturer_id,
    recipient_email,
    status
  )
  values (
    p_request_kind,
    p_request_id,
    p_requester_id,
    p_lecturer_id,
    p_recipient_email,
    'sending'
  )
  on conflict (request_kind, request_id) do update
  set status = 'sending',
      attempts = public.request_email_alerts.attempts + 1,
      error_message = null,
      updated_at = now()
  where public.request_email_alerts.status = 'failed'
  returning id into claimed_id;

  return claimed_id;
end;
$$;

revoke all on function public.claim_request_email_alert(text, text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_request_email_alert(text, text, uuid, uuid, text) to service_role;
