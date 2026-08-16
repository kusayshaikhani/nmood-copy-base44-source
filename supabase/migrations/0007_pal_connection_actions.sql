-- Connection actions are server-side only. Browser clients may read their
-- scoped requests/connections, but cannot forge another member's action.
create or replace function public.send_pal_request(p_receiver_id uuid, p_message text default '')
returns public.pal_requests
language plpgsql security definer set search_path = public as $$
declare request_row public.pal_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_receiver_id = auth.uid() then raise exception 'You cannot connect with yourself'; end if;
  if not exists (select 1 from public.members where id = auth.uid() and onboarding_completed and eligibility_status = 'verified')
    or not exists (select 1 from public.members where id = p_receiver_id and onboarding_completed and eligibility_status = 'verified') then
    raise exception 'Both members must have eligible completed profiles';
  end if;
  if exists (select 1 from public.pal_connections where member_id = auth.uid() and pal_id = p_receiver_id) then
    raise exception 'You are already connected';
  end if;
  if exists (select 1 from public.pal_requests where status = 'pending' and sender_id = auth.uid() and receiver_id = p_receiver_id) then
    raise exception 'A connection request is already pending';
  end if;
  insert into public.pal_requests(sender_id, receiver_id, message)
    values(auth.uid(), p_receiver_id, left(coalesce(p_message, ''), 500))
    returning * into request_row;
  return request_row;
end; $$;

create or replace function public.respond_to_pal_request(p_request_id uuid, p_accept boolean)
returns public.pal_requests
language plpgsql security definer set search_path = public as $$
declare request_row public.pal_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select * into request_row from public.pal_requests where id = p_request_id for update;
  if request_row.id is null or request_row.receiver_id <> auth.uid() then raise exception 'Request not found'; end if;
  if request_row.status <> 'pending' then raise exception 'This request has already been handled'; end if;
  update public.pal_requests set status = case when p_accept then 'accepted' else 'declined' end, updated_at = now()
    where id = p_request_id returning * into request_row;
  if p_accept then
    insert into public.pal_connections(member_id, pal_id) values (request_row.sender_id, request_row.receiver_id) on conflict do nothing;
    insert into public.pal_connections(member_id, pal_id) values (request_row.receiver_id, request_row.sender_id) on conflict do nothing;
  end if;
  return request_row;
end; $$;

create or replace function public.cancel_my_pal_request(p_request_id uuid)
returns public.pal_requests
language plpgsql security definer set search_path = public as $$
declare request_row public.pal_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  update public.pal_requests set status = 'cancelled', updated_at = now()
    where id = p_request_id and sender_id = auth.uid() and status = 'pending'
    returning * into request_row;
  if request_row.id is null then raise exception 'Pending request not found'; end if;
  return request_row;
end; $$;

create or replace function public.remove_my_pal_connection(p_pal_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  delete from public.pal_connections where (member_id = auth.uid() and pal_id = p_pal_id) or (member_id = p_pal_id and pal_id = auth.uid());
end; $$;

grant execute on function public.send_pal_request(uuid, text) to authenticated;
grant execute on function public.respond_to_pal_request(uuid, boolean) to authenticated;
grant execute on function public.cancel_my_pal_request(uuid) to authenticated;
grant execute on function public.remove_my_pal_connection(uuid) to authenticated;
