-- Fix sync_clerk_profile to use Clerk ID as primary key (text) and upsert reliably
-- No RLS, no auth.uid() usage per project rules

create or replace function public.sync_clerk_profile(
  clerk_user_id_param text,
  email_param text,
  first_name_param text,
  last_name_param text,
  image_url_param text
)
returns text
language plpgsql
as $$
declare
  v_existing_id text;
begin
  -- Try to find existing profile by clerk_user_id OR id (for older data)
  select id into v_existing_id
  from public.profiles
  where clerk_user_id = clerk_user_id_param
     or id = clerk_user_id_param
  limit 1;

  if v_existing_id is null then
    -- Insert new profile using Clerk user ID as the primary key (text)
    insert into public.profiles (id, clerk_user_id, email, first_name, last_name, image_url)
    values (
      clerk_user_id_param,
      clerk_user_id_param,
      nullif(trim(email_param), ''),
      nullif(trim(first_name_param), ''),
      nullif(trim(last_name_param), ''),
      nullif(trim(image_url_param), '')
    )
    on conflict (id) do update set
      email = excluded.email,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      image_url = excluded.image_url;

    return clerk_user_id_param;
  else
    -- Update the existing profile with any new values provided
    update public.profiles
    set 
      email = coalesce(nullif(trim(email_param), ''), email),
      first_name = coalesce(nullif(trim(first_name_param), ''), first_name),
      last_name = coalesce(nullif(trim(last_name_param), ''), last_name),
      image_url = coalesce(nullif(trim(image_url_param), ''), image_url)
    where id = v_existing_id;

    return v_existing_id;
  end if;
end;
$$;