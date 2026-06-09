-- LIVN FORGE — fire the send-push Edge Function on circle activity (pg_net).
-- Runs after INSERT on circle_messages, prayer_requests, prayer_circle_members.
-- The Edge Function authorizes via the x-webhook-secret header (matches WEBHOOK_SECRET).
-- Run this in Supabase Dashboard -> SQL Editor.

create extension if not exists pg_net;

create or replace function public.notify_push()
returns trigger
language plpgsql
security definer
set search_path = public, net, extensions
as $$
begin
  perform net.http_post(
    url := 'https://ihhctwmgfleihlnfnfsv.supabase.co/functions/v1/send-push',
    body := jsonb_build_object('table', TG_TABLE_NAME, 'type', 'INSERT', 'record', to_jsonb(NEW)),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '__WEBHOOK_SECRET__'  -- replace with the real WEBHOOK_SECRET before running
    )
  );
  return NEW;
end;
$$;

drop trigger if exists push_on_message on public.circle_messages;
create trigger push_on_message after insert on public.circle_messages
  for each row execute function public.notify_push();

drop trigger if exists push_on_prayer on public.prayer_requests;
create trigger push_on_prayer after insert on public.prayer_requests
  for each row execute function public.notify_push();

drop trigger if exists push_on_join on public.prayer_circle_members;
create trigger push_on_join after insert on public.prayer_circle_members
  for each row execute function public.notify_push();
