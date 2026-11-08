# OpenDoor Living

React + Vite rental marketplace and Node.js API backed by Supabase. Included homes and rents are sample listings, not verified vacancies.

## Local setup

- Node.js 20.19+ or 22.12+, npm, and a Supabase project.
- Run `npm install`.
- Run `supabase/migrations/202611080001_marketplace.sql`, then `supabase/migrations/202611080002_property_ownership.sql` in the Supabase SQL Editor.
- Configure `.env` from `.env.example`. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are browser-visible public config. `SUPABASE_SERVICE_ROLE_KEY` must remain a server-only secret and must never use a `VITE_` prefix.
- Seed the `listings` table with your actual properties. The JSON in `server/data/listings.json` contains illustrative examples.
- Create staff accounts using Supabase Auth. Grant trusted users an app metadata role from a secure admin environment (never user-editable metadata):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"owner"}'::jsonb
where email = 'owner@example.com';
```

Start `npm run server` and `npm run dev` in separate terminals. Public site: `http://localhost:3000`; owner/admin portal: `http://localhost:3000/owner` or `/admin`. The API listens on port 3001 and Vite proxies `/api` to it.

## Owner and admin features

- Owners can create, update, publish/unpublish, and archive their own property listings. New owner listings are assigned to their authenticated user ID by the API; updates and archives verify ownership server-side.
- Admins can manage all properties, including legacy rows without an owner, and review/update inquiry status.
- Archived properties are hidden from public browse/search; archive is a soft delete, preserving inquiry history.
- Property fields include title, type, city/neighborhood, rent, beds/baths, area, images, features, description, availability, and publish status.

## API

- `GET /api/health`
- `GET /api/listings` and `GET /api/listings/:id` (active/public listings)
- `POST /api/inquiries`
- `GET /api/admin/inquiries` and `PATCH /api/admin/inquiries/:uuid` (admin role required)
- `GET /api/owner/listings`, `POST /api/owner/listings`, `PATCH /api/owner/listings/:id`, `DELETE /api/owner/listings/:id` (owner/admin role required; owners are scoped to their records)

## Production notes

The API verifies Supabase Auth tokens and trusted `app_metadata.role` claims. RLS is enabled, and no direct browser write policies are created. The service-role key bypasses RLS, so protect it with a deployment secrets manager. Before accepting real renter data, configure HTTPS, MFA for staff, secure backups, retention/deletion procedures, monitoring, and distributed rate limiting/bot protection. Verify all real listing details and pricing. This application does not take payments, approve leases, or guarantee availability.
