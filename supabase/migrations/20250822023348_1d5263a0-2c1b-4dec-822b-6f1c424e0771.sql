
-- 1) Make invites robust: ensure a safe default for expires_at (prevents 500s)
alter table public.user_invitations
  alter column expires_at set default (now() + interval '14 days');

-- 2) Replace the sync_clerk_profile RPC with a version that:
--    - uses correct types for your profiles table (id is text)
--    - is callable by anon/authenticated
--    - returns jsonb (avoids 404 routing oddities)
--    - runs as SECURITY DEFINER to bypass RLS safely for this upsert
drop function if exists public.sync_clerk_profile(text, text, text, text, text);

create or replace function public.sync_clerk_profile(
  clerk_user_id_param text,
  email_param text,
  first_name_param text,
  last_name_param text,
  image_url_param text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id text;
  updated_count int := 0;
begin
  select id into existing_id
  from public.profiles
  where clerk_user_id = clerk_user_id_param
  limit 1;

  if existing_id is null then
    insert into public.profiles (
      id,
      clerk_user_id,
      email,
      first_name,
      last_name,
      image_url,
      created_at,
      updated_at,
      is_active
    ) values (
      gen_random_uuid()::text,
      clerk_user_id_param,
      email_param,
      first_name_param,
      last_name_param,
      nullif(image_url_param, ''),
      now(),
      now(),
      true
    );
    return jsonb_build_object('status', 'inserted');
  else
    update public.profiles
    set
      email = email_param,
      first_name = first_name_param,
      last_name = last_name_param,
      image_url = nullif(image_url_param, ''),
      updated_at = now()
    where id = existing_id;

    get diagnostics updated_count = row_count;
    return jsonb_build_object('status', 'updated', 'updated_count', updated_count);
  end if;
end;
$$;

-- 3) Allow anon/authenticated to call the RPC via PostgREST
grant execute on function public.sync_clerk_profile(text, text, text, text, text) to anon, authenticated;

-- 4) Helpful index for lookups by Clerk ID (idempotent)
create index if not exists idx_profiles_clerk_user_id on public.profiles (clerk_user_id);
