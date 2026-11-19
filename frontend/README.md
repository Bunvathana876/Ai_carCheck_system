# Frontend

All website UI code lives here: React components, CSS, images, public assets,
HTML entry point, API client, hooks, and Vite configuration. The browser talks
to the backend through `/api`; it never imports backend source code or seed data.

## Development

From the repository root:

```sh
npm ci
npm run dev:frontend
```

Start the backend in another terminal with `npm run dev:backend`, or use the
root `npm run dev` command to start both together. Open http://127.0.0.1:3000.
After building the shared package at the root, `npm run dev` also works directly
inside `frontend/`.

## Configuration

Defaults work without an environment file. Copy `frontend/.env.example` to
`frontend/.env` when needed:

- `API_PROXY_TARGET=http://127.0.0.1:3001`: development/preview API destination.
- `DISABLE_HMR=true`: optional setting to disable frontend live reload.

Backend ports, database paths, and private keys belong in `backend/.env`.
Do not put secrets in `VITE_*` variables; those are public browser code.

To change the UI port, run `npm run dev --workspace frontend -- --port 3002`
from the root after building shared, and add its origin to the backend's
`ALLOWED_ORIGINS` setting.

## Build and checks

From the root, `npm run build:frontend` builds shared code and the frontend.
The output is `frontend/dist/`. Images keep their existing `/src/assets/...`
URLs, so the build copies them into `frontend/dist/src/assets/` as well.
Preserve the complete build directory when hosting at the URL root.

Root `npm run preview` previews the frontend build with the API proxy; the
backend must be running. Add the preview origin to backend `ALLOWED_ORIGINS`
for writes. Root `npm run build && npm start` serves the full production app.

Use root `npm run check` for all type checks, backend tests, frontend-to-backend
integration tests, and builds. The integration test lives in `tests/integration/`
because it exercises both services. DOM tests do not verify visual layout.

## Files

```text
src/App.tsx             Dashboard composition and actions
src/components/         UI panels and controls
src/hooks/              Data loading and request state
src/lib/api.ts          Typed HTTP client
src/data/vehicleVisuals.ts  Illustration hotspots
src/assets/images/      Dashboard images
src/index.css           Styles
src/main.tsx            React entry point
public/                 Public assets
index.html              HTML entry point
vite.config.ts          Vite plugins and API proxy
```

Module settings, service events, notification read states, and the latest sample
scan report are saved by the backend. Tabs, filters, illustration views, calendar
navigation, and module expansion are local UI controls. The app opens Bay 03 on
reload. Google Fonts is optional; system fonts are used if it is unreachable.
