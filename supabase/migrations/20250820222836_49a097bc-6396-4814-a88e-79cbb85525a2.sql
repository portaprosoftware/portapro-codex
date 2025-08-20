
-- 1) Create public bucket for product images (id=name='product-images')
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 2) Storage policies for the product-images bucket
-- Public read
create policy "Public read access for product-images"
on storage.objects
for select
using (bucket_id = 'product-images');

-- Authenticated users can upload
create policy "Authenticated users can upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images');

-- Authenticated users can update
create policy "Authenticated users can update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images');

-- Authenticated users can delete
create policy "Authenticated users can delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images');
