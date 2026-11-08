# OpenDoor Living

A React + Vite rental marketplace demo with a small Node.js API. The included rental listings and prices are sample data and are not verified real vacancies.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

Install packages once:

```bash
npm install
```

Start the API in one terminal:

```bash
npm run server
```

Start the frontend in another terminal:

```bash
npm run dev
```

Open http://localhost:3000. Vite proxies `/api` requests to the API on port 3001. To change the API port, set `PORT` and update the proxy target in `vite.config.js` to match.

## API

- `GET /api/health` — health check.
- `GET /api/listings` — list properties. Optional filters: `q`, `location`, `maxPrice`, and `bedrooms` (use `studio` for studios).
- `GET /api/listings/:id` — one property by ID.
- `POST /api/inquiries` — validate and save a tour, application inquiry, or question.
- `GET /api/inquiries` — private inquiry listing; requires `Authorization: Bearer <ADMIN_API_TOKEN>`.

Example inquiry request:

```bash
curl -X POST http://localhost:3001/api/inquiries \\
  -H 'Content-Type: application/json' \\
  -d '{"listingId":1,"name":"Alex R","email":"alex@example.com","requestType":"Tour request","offer":1050}'
```

Set an admin token before starting the API if you need to review inquiries:

```bash
ADMIN_API_TOKEN='use-a-long-random-secret' npm run server
```

On Windows PowerShell, use `$env:ADMIN_API_TOKEN="use-a-long-random-secret"; npm run server`.

Inquiry submissions are written to `server/data/inquiries.json`, which is intentionally git-ignored because it contains personal information. Back up this file securely; the JSON file store is suitable for local development and a single-instance demo, not a multi-instance production deployment. Use a managed database, TLS, stronger abuse controls, retention/access policies, and a secure secrets manager before accepting real tenant inquiries. The API does not process payments or make bookings.

## Build

```bash
npm run build
```

The Vite production build outputs `dist/`. Deploying the static frontend does not deploy the API; host both and configure the frontend API proxy/base URL for your chosen platform.
