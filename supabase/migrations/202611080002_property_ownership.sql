-- Property CRUD ownership support. Apply after 202611080001_marketplace.sql.
alter table public.listings add column if not exists owner_id uuid references auth.users(id) on delete set null;
create index if not exists listings_owner_id_idx on public.listings(owner_id) where owner_id is not null;

-- Keep public visibility limited to published/active properties.
drop policy if exists "Public can view active listings" on public.listings;
create policy "Public can view active listings" on public.listings
  for select to anon, authenticated using (is_active = true);

-- No direct client insert/update/delete policies are intentionally added. The API uses the
-- service-role key only after verifying a Supabase JWT and its trusted app_metadata.role.
-- Owners can manage rows where owner_id equals their authenticated user ID; admins can manage all.
-- Existing rows with NULL owner_id remain manageable by admins and can be assigned by an admin.
