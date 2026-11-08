# OpenDoor Living

React + Vite rental marketplace and Node.js API backed by Supabase. The included homes and rent amounts are sample listings, not verified vacancies.

## Requirements and local setup

- Node.js 20.19+ or 22.12+
- npm
- A Supabase project

1. Install dependencies: `npm install`.
2. In Supabase SQL Editor, run `supabase/migrations/202611080001_marketplace.sql`.
3. Add sample properties to `public.listings` (the illustrative seed data is in `server/data/listings.json`; insert it through the Supabase table editor or SQL editor).
4. Copy `.env.example` to `.env` and set the project URL, frontend publishable/anon key, and server-only service role key. Never expose or commit `SUPABASE_SERVICE_ROLE_KEY`.
5. Create an admin user in Supabase Authentication. In SQL Editor, grant only trusted staff the admin app metadata claim:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';
```

The API verifies every admin bearer token with Supabase Auth and checks the signed `app_metadata.role` claim. Never use user-editable `user_metadata` as an authorization source.

Start the API (`npm run server`) and frontend (`npm run dev`) in separate terminals. Open `http://localhost:3000`; admin dashboard: `http://localhost:3000/admin`. Vite proxies `/api` to port 3001. Set `PORT` and adjust the Vite proxy together if changing the API port.

## Supabase environment variables

- `VITE_SUPABASE_URL`: project URL used by the browser for Supabase Auth.
- `VITE_SUPABASE_ANON_KEY`: publishable/anon key; safe to expose when RLS is correctly configured.
- `SUPABASE_URL`: project URL used by the API.
- `SUPABASE_SERVICE_ROLE_KEY`: secret server-side key, bypasses RLS; only configure in server environment/secrets manager.
- `PORT`: optional API port (default 3001).

## API routes

- `GET /api/health` — health check.
- `GET /api/listings` and `GET /api/listings/:id` — active homes.
- `POST /api/inquiries` — validates and saves tour/application inquiries; rate-limited per process/IP.
- `GET /api/admin/inquiries` — admin-only inquiry list.
- `PATCH /api/admin/inquiries/:uuid` — admin-only status update (`new`, `contacted`, `tour_scheduled`, `approved`, `rejected`, `closed`).

## Security and production notes

The SQL migration enables RLS and allows public reads only for active listings. Public inquiry submission goes through the API, which validates input and uses the server-only Supabase service key. Admin APIs verify Supabase Auth tokens and require `app_metadata.role = admin`. The service-role key must never be placed in frontend `VITE_` variables.

Before accepting real renter data, configure HTTPS, Supabase Auth email/password policies and MFA for staff, backups, retention/deletion processes, monitoring, and robust distributed rate limiting/bot protection. The included listing data is illustrative. The backend does not charge rent, approve leases, or guarantee availability. No live Supabase project has been provisioned by this code change; you must supply project credentials and run the migration.

## Build

`npm run build` creates the static frontend in `dist/`. Deploy the API separately as a Node service with its secrets configured, then set the production API base/proxy and frontend Supabase URL/key in deployment configuration.
