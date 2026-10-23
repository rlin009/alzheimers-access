-- Run once in Supabase SQL Editor. No existing profile/trial tables are changed.
begin;
create table public.trial_monitor_runs (
  id uuid primary key, checked_at timestamptz not null, completed_at timestamptz,
  record_count integer not null check (record_count >= 0)
);
create table public.trial_monitor_records (
  run_id uuid references public.trial_monitor_runs(id) on delete cascade,
  nct_id text not null check (nct_id ~ '^NCT[0-9]{8}$'), payload jsonb not null,
  primary key (run_id, nct_id)
);
create table public.trial_monitor_head (
  singleton boolean primary key default true check (singleton),
  run_id uuid references public.trial_monitor_runs(id)
);
insert into public.trial_monitor_head(singleton) values (true);
create table public.trial_alert_subscriptions (
  id uuid primary key default gen_random_uuid(), email text not null,
  product text not null check (product in ('alz','burp')), preferences jsonb not null,
  follows jsonb not null default '{}', preferences_at timestamptz not null default now(),
  created_at timestamptz not null default now(), unique(email, product)
);
create table public.trial_alert_requests (
  id uuid primary key, email text not null, product text not null,
  token_hash text not null, preferences jsonb not null, follows jsonb not null default '{}',
  expires_at timestamptz not null default now() + interval '24 hours'
);
create table public.trial_alert_limits (
  key text primary key, hits integer not null, expires_at timestamptz not null
);
create table public.trial_alert_outbox (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.trial_alert_subscriptions(id) on delete cascade,
  run_id uuid not null references public.trial_monitor_runs(id), notices jsonb not null,
  state text not null default 'queued' check (state in ('queued','sending','sent','uncertain','cancelled')),
  first_attempt_at timestamptz, lease_until timestamptz, sent_at timestamptz,
  provider_id text, created_at timestamptz not null default now(), unique (subscriber_id, run_id)
);

-- All tables are private. Only the site's server/service role may access them.
alter table public.trial_monitor_runs enable row level security;
alter table public.trial_monitor_records enable row level security;
alter table public.trial_monitor_head enable row level security;
alter table public.trial_alert_subscriptions enable row level security;
alter table public.trial_alert_requests enable row level security;
alter table public.trial_alert_limits enable row level security;
alter table public.trial_alert_outbox enable row level security;
revoke all on public.trial_monitor_runs, public.trial_monitor_records, public.trial_monitor_head,
  public.trial_alert_subscriptions, public.trial_alert_requests, public.trial_alert_limits,
  public.trial_alert_outbox from anon, authenticated;
grant all on public.trial_monitor_runs, public.trial_monitor_records, public.trial_monitor_head,
  public.trial_alert_subscriptions, public.trial_alert_requests, public.trial_alert_limits,
  public.trial_alert_outbox to service_role;

create function public.trial_alert_rate_limit(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql set search_path = public as $$
declare n integer;
begin
  insert into trial_alert_limits as l(key,hits,expires_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
  on conflict(key) do update set hits = case when l.expires_at < now() then 1 else l.hits+1 end,
    expires_at = case when l.expires_at < now() then now()+make_interval(secs=>p_seconds) else l.expires_at end
  returning hits into n;
  return n <= p_limit;
end $$;

create function public.confirm_trial_alert(p_id uuid, p_hash text)
returns uuid language plpgsql set search_path = public as $$
declare r trial_alert_requests; s uuid; fresh_follows jsonb;
begin
  select * into r from trial_alert_requests where id=p_id and token_hash=p_hash and expires_at>now() for update;
  if not found then return null; end if;
  select coalesce(jsonb_object_agg(k,now()),'{}'::jsonb) into fresh_follows from jsonb_object_keys(r.follows) k;
  -- Existing subscribers keep their preferences. Reverification may add a follow.
  insert into trial_alert_subscriptions as a(email,product,preferences,follows)
    values(r.email,r.product,r.preferences,fresh_follows)
    on conflict(email,product) do update set follows = fresh_follows || a.follows
    returning id into s;
  if (select count(*) from jsonb_object_keys((select follows from trial_alert_subscriptions where id=s))) > 50 then
    raise exception 'Follow limit reached';
  end if;
  delete from trial_alert_requests where id=p_id;
  return s;
end $$;

create function public.publish_trial_monitor(p_run uuid, p_previous uuid, p_notices jsonb)
returns void language plpgsql set search_path = public as $$
declare current_run uuid; expected_count integer;
begin
  select run_id into current_run from trial_monitor_head where singleton for update;
  if current_run is distinct from p_previous then raise exception 'Snapshot changed during refresh'; end if;
  select record_count into expected_count from trial_monitor_runs where id=p_run and completed_at is null;
  if expected_count is null or expected_count <> (select count(*) from trial_monitor_records where run_id=p_run) then
    raise exception 'Incomplete snapshot';
  end if;
  insert into trial_alert_outbox(subscriber_id,run_id,notices)
    select (n->>'subscriber_id')::uuid, p_run, n->'notices' from jsonb_array_elements(p_notices) n
    where exists(select 1 from trial_alert_subscriptions where id=(n->>'subscriber_id')::uuid
      and preferences_at <= (select checked_at from trial_monitor_runs where id=p_run))
    on conflict(subscriber_id,run_id) do nothing;
  update trial_monitor_runs set completed_at=now() where id=p_run;
  update trial_monitor_head set run_id=p_run where singleton;
end $$;

create function public.claim_trial_alert(p_id uuid)
returns boolean language plpgsql set search_path = public as $$
begin
  update trial_alert_outbox set state='uncertain', lease_until=null
    where id=p_id and state='sending' and first_attempt_at < now()-interval '22 hours';
  update trial_alert_outbox set state='sending', first_attempt_at=coalesce(first_attempt_at,now()), lease_until=now()+interval '10 minutes'
    where id=p_id and (state='queued' or (state='sending' and lease_until<now() and first_attempt_at>now()-interval '22 hours'));
  return found;
end $$;

revoke all on function public.trial_alert_rate_limit(text,integer,integer), public.confirm_trial_alert(uuid,text),
  public.publish_trial_monitor(uuid,uuid,jsonb), public.claim_trial_alert(uuid) from public, anon, authenticated;
grant execute on function public.trial_alert_rate_limit(text,integer,integer), public.confirm_trial_alert(uuid,text),
  public.publish_trial_monitor(uuid,uuid,jsonb), public.claim_trial_alert(uuid) to service_role;
create function public.unfollow_trial_alert(p_subscriber uuid, p_trial text)
returns void language plpgsql set search_path = public as $$
begin
  update trial_alert_subscriptions set follows=follows-p_trial,preferences_at=now() where id=p_subscriber;
  update trial_alert_outbox set state='cancelled',lease_until=null where subscriber_id=p_subscriber
    and state in ('queued','sending') and notices @> jsonb_build_array(jsonb_build_object('id',p_trial));
end
$$;
revoke all on function public.unfollow_trial_alert(uuid,text) from public, anon, authenticated;
grant execute on function public.unfollow_trial_alert(uuid,text) to service_role;
create function public.follow_trial_alert(p_subscriber uuid, p_trial text)
returns jsonb language plpgsql set search_path = public as $$
declare f jsonb;
begin
  select follows into f from trial_alert_subscriptions where id=p_subscriber for update;
  if not found then raise exception 'Subscription missing'; end if;
  if f ? p_trial then return f; end if;
  if (select count(*) from jsonb_object_keys(f)) >= 50 then raise exception 'Follow limit reached'; end if;
  f = f || jsonb_build_object(p_trial,now());
  update trial_alert_subscriptions set follows=f where id=p_subscriber;
  return f;
end $$;
revoke all on function public.follow_trial_alert(uuid,text) from public, anon, authenticated;
grant execute on function public.follow_trial_alert(uuid,text) to service_role;
create function public.delete_trial_alert(p_subscriber uuid)
returns void language plpgsql set search_path = public as $$
declare s trial_alert_subscriptions;
begin
  select * into s from trial_alert_subscriptions where id=p_subscriber for update;
  if not found then return; end if;
  delete from trial_alert_requests where email=s.email and product=s.product;
  delete from trial_alert_subscriptions where id=p_subscriber;
end $$;
revoke all on function public.delete_trial_alert(uuid) from public, anon, authenticated;
grant execute on function public.delete_trial_alert(uuid) to service_role;
create function public.save_trial_alert_preferences(p_subscriber uuid, p_preferences jsonb)
returns void language plpgsql set search_path = public as $$
begin
  update trial_alert_subscriptions set preferences=p_preferences,preferences_at=now() where id=p_subscriber;
  update trial_alert_outbox set state='cancelled',lease_until=null where subscriber_id=p_subscriber and state in ('queued','sending');
end $$;
revoke all on function public.save_trial_alert_preferences(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.save_trial_alert_preferences(uuid,jsonb) to service_role;
commit;
