# PLAN.md — Migrate UI to React (SPA) + RUM→APM E2E

## Goal

Replace EJS pages with a client-side React app (Vite) that calls the existing Express API from the
**browser** so the Datadog RUM SDK can patch `fetch`/XHR, inject trace headers to `/api/**`, and
link RUM resources to APM backend traces. Keep `docker-compose` as the main way to run (app,
MongoDB, Datadog Agent). ([GitHub][1], [Datadog][2])

---

## High-level design

- New SPA in `/client` (React + Vite + JavaScript).
- RUM is initialized **client-side** before any app data fetching. Set `allowedTracingUrls` to our
  first-party API URLs so trace headers propagate. ([Datadog][2])
- Browser makes all data calls with `fetch` to `/api/**` (keeps CSRF flow). ([GitHub][1])
- Dockerfile builds both server and SPA; Express serves `/client/dist` statically and falls back to
  `index.html`.
- `docker-compose up -d` continues to start **app (port 3000)**, **Mongo (27017)**, **Agent
  (8126/8125)**. ([GitHub][1])

---

## Tasks (for the agent)

### 1) Scaffold the SPA

- Create React + Vite app:

  ```bash
  npm create vite@latest client -- --template react
  cd client && npm i @datadog/browser-rum
  ```

- Add basic routes/pages to replace existing EJS views (`Home`, `Pages list`, `Page detail`,
  `Login/Register`).

### 2) Initialize Datadog RUM (client-side)

- Create `client/src/rum.js`:

  ```js
  import { datadogRum } from '@datadog/browser-rum';

  datadogRum.init({
    applicationId: import.meta.env.VITE_DD_RUM_APP_ID,
    clientToken: import.meta.env.VITE_DD_RUM_CLIENT_TOKEN,
    site: import.meta.env.VITE_DD_SITE || 'datadoghq.com',
    service: 'datablog-web',
    env: import.meta.env.MODE,
    version: '1.0.0',
    trackResources: true,
    trackLongTasks: true,
    trackUserInteractions: true,
    // Propagate trace headers so RUM resources link to backend traces
    // (match your API base; same-origin here)
    allowedTracingUrls: [
      { match: /^\/api\//, propagatorTypes: ['tracecontext'] }, // Node tracer also supports Datadog headers by default
    ],
    traceSampleRate: 100,
  });
  ```

  Then import it first in `client/src/main.jsx`:

  ```js
  import './rum';
  // ... bootstrap React app
  ```

  (RUM→APM correlation + allowedTracingUrls guidance) ([Datadog][2])

- Add a `.env` template for the SPA:

  ```
  # client/.env.example
  VITE_DD_RUM_APP_ID=
  VITE_DD_RUM_CLIENT_TOKEN=
  VITE_DD_SITE=datadoghq.com
  ```

### 3) Use browser `fetch` for all data (keeps CSRF)

- Add a small API helper that follows your existing CSRF flow:

  ```js
  // client/src/api.js
  export async function withCsrf(fn) {
    const res = await fetch('/api/auth/csrf');
    const { csrfToken } = await res.json();
    return fn(csrfToken);
  }

  export async function register(email, password) {
    return withCsrf(async csrf =>
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'csrf-token': csrf },
        body: JSON.stringify({ email, password }),
      })
    );
  }
  ```

  (API lives under `/api/auth`, CSRF header required.) ([GitHub][1])

### 4) Serve SPA from Express (same origin)

- Update `app.js` (or the main Express bootstrap) to serve the built SPA and add an SPA fallback.
  Keep `/api/**` mounted as-is.

  ```js
  // After API routes are mounted:
  const path = require('path');
  const dist = path.join(__dirname, 'client', 'dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  ```

  (RUM captures browser resources and timings; initial HTML won’t link E2E, subsequent browser
  fetches will.) ([Datadog][3])

### 5) Dockerfile: build server + SPA

- Convert to a multi-stage build (leave existing APM bits intact). Example:

  ```dockerfile
  # ---- client build ----
  FROM node:22-alpine AS client
  WORKDIR /app/client
  COPY client/package*.json ./
  RUN npm ci
  COPY client ./
  RUN npm run build  # outputs to /app/client/dist

  # ---- server build ----
  FROM node:22-alpine AS server
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . ./
  # bring in built SPA
  COPY --from=client /app/client/dist ./client/dist

  ENV NODE_ENV=production
  EXPOSE 3000
  CMD ["node", "app.js"]
  ```

### 6) docker-compose: keep single app service; ensure Agent + Mongo

- Ensure the compose file sets:
  - `app` depends_on `mongo` and `datadog-agent`
  - Env includes `DD_AGENT_HOST=datadog-agent`, `DD_TRACE_AGENT_PORT=8126`,
    `DD_SERVICE=datablog-api`, `DD_ENV=dev`
  - `DD_API_KEY`, `DD_SITE` for the agent
  - Ports: `3000` for the app, `8126/8125` for the agent, Mongo `27017` (unchanged). ([GitHub][1])

  Example diff (minimal):

  ```yaml
  services:
    app:
      build: .
      environment:
        - NODE_ENV=production
        - DD_SERVICE=datablog-api
        - DD_ENV=dev
        - DD_AGENT_HOST=datadog-agent
        - DD_TRACE_AGENT_PORT=8126
      depends_on:
        - mongo
        - datadog-agent
      ports: ['3000:3000']

    mongo:
      image: mongo:7
      ports: ['27017:27017']
      volumes: ['mongo-data:/data/db']

    datadog-agent:
      image: gcr.io/datadoghq/agent:latest
      environment:
        - DD_API_KEY=${DD_API_KEY}
        - DD_SITE=${DD_SITE:-datadoghq.com}
        - DD_APM_ENABLED=true
        - DD_LOGS_ENABLED=true
      ports: ['8126:8126', '8125:8125/udp']

  volumes:
    mongo-data: {}
  ```

### 7) Replace EJS routes with SPA routes

- Keep API routes under `/api/**`.
- Remove (or no-op) server-rendered EJS pages and redirect `/` (and other page routes) to the SPA
  (handled by step 4 fallback).
- Keep any server endpoints used by E2E tests.

### 8) Local dev (optional)

- Add `client` dev script: `npm run dev --prefix client`
- For cross-origin dev (if ever needed), configure Express CORS to allow `x-datadog-*` and W3C
  headers—but prefer same-origin to keep things simple. ([Datadog][2])

### 9) Tests & screenshots

- Update Playwright flows to drive the SPA (selectors, routes).
- Keep existing API tests as-is.
- Update any screenshot routines to hit `/` (SPA).

---

## Verification

1. **Run with compose**

   ```bash
   cp .env.example .env   # fill DD_API_KEY, RUM IDs
   docker-compose build && docker-compose up -d
   # Open http://localhost:3000
   ```

   (Compose remains the main workflow; expect app, mongo, datadog-agent running.) ([GitHub][1])

2. **RUM events & resources**
   - In RUM Explorer, confirm page views and **Resource** events for `/api/**`.
   - Resource events should display the “Trace” tab and jump into an APM trace (linked via injected
     headers once `allowedTracingUrls` matches). ([Datadog][2])

3. **APM spans**
   - In APM, filter by `service:datablog-api`.
   - Click spans initiated from the browser and confirm RUM session linkage. ([Datadog][2])

4. **CSRF paths**
   - Register/login via SPA using the `/api/auth/**` flow (CSRF token first, header on writes).
     ([GitHub][1])

---

## Acceptance criteria

- `docker-compose up -d` builds the SPA and serves it from Express at `http://localhost:3000`.
  ([GitHub][1])
- Browser navigation is fully client-side; hard refresh on any route serves `index.html`.
- All data is fetched **in the browser** using `fetch` to `/api/**`.
- RUM shows **Resource** events for `/api/**` and each has a linked **APM trace**. ([Datadog][2])
- No CORS required (same origin).
- Existing API tests still pass; updated E2E tests pass.

---

## Rollback plan

- Revert `app.js` static/fallback changes and restore EJS routes.
- Remove `/client` and Dockerfile/compose changes that copy the SPA.
- Confirm app still runs with `docker-compose` and EJS.

---

## Notes / References

- RUM↔APM correlation & header propagation (`allowedTracingUrls`, W3C tracecontext): Datadog docs.
  ([Datadog][2])
- RUM Resource monitoring & browser patching (`fetch`/XHR, PerformanceResourceTiming): Datadog docs.
  ([Datadog][3])
- Next.js client-init pattern (if you ever move there): Datadog guide. ([Datadog][4])
- Current repo run & ports (compose, 3000/27017/8126/8125) and CSRF endpoints under `/api/auth/**`:
  repo README. ([GitHub][1])

---

### Implementation hint

If you want this fully automated, instruct the agent to **create the `/client` app, wire RUM, update
`app.js`, and convert the Dockerfile/compose as above**, then run
`docker-compose build && docker-compose up -d` and verify RUM resources link to APM traces for
`/api/**` calls made from the SPA.

[1]:
  https://github.com/petems/datadog-rum-apm-e2e-example
  'GitHub - petems/datadog-rum-apm-e2e-example'
[2]:
  https://docs.datadoghq.com/real_user_monitoring/correlate_with_other_telemetry/apm/?tab=browserrum&utm_source=chatgpt.com
  'Connect RUM and Traces - docs.datadoghq.com'
[3]:
  https://docs.datadoghq.com/real_user_monitoring/browser/monitoring_resource_performance/?utm_source=chatgpt.com
  'Monitoring Resource Performance - Datadog Infrastructure and ...'
[4]:
  https://docs.datadoghq.com/real_user_monitoring/guide/monitor-your-nextjs-app-with-rum/?tab=npm&utm_source=chatgpt.com
  'Monitor Your Next.js App With RUM - Datadog Infrastructure and ...'
