-- Browser admin, same idea as the Real Estate project:
-- username resolves to an email, then Supabase Auth signs in.
-- Public blog reading stays limited to published posts.
-- Contact emails still go through the send-contact-email function.

create or replace function public.resolve_login_email(identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved text;
begin
  if identifier is null or length(trim(identifier)) = 0 then
    return null;
  end if;

  if position('@' in identifier) > 0 then
    return lower(trim(identifier));
  end if;

  select lower(email) into resolved
  from public.users
  where lower(username) = lower(trim(identifier))
  limit 1;

  return resolved;
end;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

drop policy if exists "Staff read all blogs" on blog_posts;
create policy "Staff read all blogs"
  on blog_posts for select
  to authenticated
  using (true);

drop policy if exists "Staff insert blogs" on blog_posts;
create policy "Staff insert blogs"
  on blog_posts for insert
  to authenticated
  with check (true);

drop policy if exists "Staff update blogs" on blog_posts;
create policy "Staff update blogs"
  on blog_posts for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Staff delete blogs" on blog_posts;
create policy "Staff delete blogs"
  on blog_posts for delete
  to authenticated
  using (true);

drop policy if exists "Authenticated can read contacts" on contacts;
create policy "Authenticated can read contacts"
  on contacts for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can read users" on users;
create policy "Authenticated can read users"
  on users for select
  to authenticated
  using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Staff upload blog images" on storage.objects;
create policy "Staff upload blog images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'blog-images'
    and name like 'covers/%'
  );
