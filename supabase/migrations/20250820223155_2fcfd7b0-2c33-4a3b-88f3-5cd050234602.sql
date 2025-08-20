
-- Allow anonymous (public) writes to the 'product-images' bucket only,
-- since we don't use Supabase Auth and permissioning is handled in the app via Clerk.

-- Public INSERT (upload)
create policy "Anon can upload product images"
on storage.objects
for insert
to anon
with check (bucket_id = 'product-images');

-- Public UPDATE (needed for upsert/replace)
create policy "Anon can update product images"
on storage.objects
for update
to anon
using (bucket_id = 'product-images');

-- Public DELETE (optional but needed to let users remove/replace images)
create policy "Anon can delete product images"
on storage.objects
for delete
to anon
using (bucket_id = 'product-images');
