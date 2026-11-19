# Backend

Express API, SQLite persistence, database seed records, and backend tests live here.
The backend imports contracts and pure calculations from `@voltguard/shared`;
it does not import frontend source code.

## Development

From the repository root:

```sh
npm ci
npm run dev:backend
```

Or, after `npm run build:shared` at the root, run `npm run dev` inside `backend/`.
The API listens at http://127.0.0.1:3001 by default. Run the frontend separately
with `npm run dev:frontend`, or use the root `npm run dev` command for both.

## Configuration and data

Copy `backend/.env.example` to `backend/.env` to customize these defaults:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | API port |
| `HOST` | `127.0.0.1` | Bind address |
| `DATABASE_PATH` | `./data/voltguard.sqlite` | Database path, relative to `backend/` |
| `ALLOWED_ORIGINS` | `http://127.0.0.1:3000,http://localhost:3000` | Allowed browser origins |
| `FRONTEND_DIST` | `../frontend/dist` | Production frontend build, relative to `backend/` |

When changing `PORT`, also change `API_PROXY_TARGET` in `frontend/.env`.
Restart the services after changing environment settings.

The database is created and seeded once; saved records survive restarts.
The existing database was moved from the old root `data/` directory to
`backend/data/` during the folder reorganization. The schema is unchanged.

Stop the backend cleanly before copying the SQLite file for a backup. To start a
fresh demo without losing saved records, set `DATABASE_PATH` to a new filename.
`npm run clean` removes build output only and never removes `data/`.
SQLite schema version 1 is recorded with `user_version`; unknown versions fail
explicitly instead of resetting data.

## Build and tests

From the repository root:

```sh
npm run build:backend
npm test --workspace backend
```

`backend/dist/` contains compiled backend JavaScript only. To serve the complete
production application, run root `npm run build` followed by `npm start` and open
http://127.0.0.1:3001. Production serves static files from `frontend/dist/` and
API routes from Express. `npm start` inside `backend/` works after the same build.

For production packaging, retain the workspace layout, all workspace manifests,
the root manifest and lockfile, `shared/dist/`, `backend/dist/`, and `frontend/dist/`.
After building, install runtime dependencies with `npm ci --omit=dev` in the
packaged repository. Source TypeScript and development dependencies are not
required at runtime. Keep the SQLite database on persistent storage.

This is a local, unauthenticated sample-data app. Public deployment needs
HTTPS and authentication. Multiple instances should use a shared database
service instead of separate SQLite files. No real vehicle hardware or AI service
is connected. Scans save sample-data snapshots and keep the latest report;
notifications retain the latest 50 items.

## API

All responses are JSON. Mutation requests require `Content-Type: application/json`.
Vehicle IDs are `bay-03`, `bay-01`, and `dyno-02`. Errors use `{ "error": "message" }`.

| Method | Route | Body / result |
| --- | --- | --- |
| GET | `/api/health` | Server and database availability |
| GET | `/api/vehicles` | Vehicle profiles |
| GET | `/api/vehicles/:id/dashboard` | Full vehicle state and computed summaries |
| PATCH | `/api/vehicles/:id/modules/:moduleId` | `{ "enabled": false }` |
| POST | `/api/vehicles/:id/notifications/read-all` | `{}` |
| POST | `/api/vehicles/:id/service-events` | `{ "date": "2026-12-01", "timeSlot": "09:00" }` |
| DELETE | `/api/vehicles/:id/service-events/:eventId` | `{}` |
| POST | `/api/vehicles/:id/scans` | `{}` |

Successful mutation responses return the updated dashboard. Dates must be real
calendar dates from 2000–2099. Booking slots run from 07:00 through 11:00 on the
hour. Unknown vehicles, modules, events, and routes return 404. Invalid payloads
return 400, disallowed origins 403, oversized bodies 413, and incorrect request
content types 415.

```sh
curl http://127.0.0.1:3001/api/health
curl http://127.0.0.1:3001/api/vehicles/bay-03/dashboard
```

## Files

```text
src/index.ts       Startup, environment, and graceful shutdown
src/app.ts         Routes, request validation, and errors
src/store.ts       SQLite schema, seeding, and transactions
src/data/seed.ts   Sample database records
src/errors.ts      HTTP error class
test/             API, persistence, and calculation tests
data/             Local database (ignored by Git)
dist/             Compiled output (ignored by Git)
```
